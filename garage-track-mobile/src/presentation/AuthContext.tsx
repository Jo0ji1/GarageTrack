import * as Crypto from 'expo-crypto';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { AppState, type AppStateStatus } from 'react-native';

// ---------------------------------------------------------------------------
// Modelo de ameaças (resumido)
// ---------------------------------------------------------------------------
// • Atacante: usuário não autorizado com acesso físico ao dispositivo.
// • Alvo: banco SQLite local com histórico de manutenções, fotos, áudio e
//   localização. Pode revelar rotina, endereço e padrão de uso do dono.
// • Mitigações implementadas:
//   - Gate biométrico/PIN no boot e ao voltar do background após inatividade.
//   - PIN armazenado como hash SHA-256 (salt) em SecureStore (Keystore/iOS
//     Keychain). Texto puro nunca é persistido.
//   - Lock-out exponencial: a partir da 5ª tentativa errada, atrasos
//     progressivos (15s, 30s, 60s, 120s, 300s).
//   - Botão "Esquecer PIN" exige confirmação explícita e apaga TUDO.
// • Limitações conhecidas:
//   - SQLite NÃO é cifrado (limitação do expo-sqlite gratuito). Atacante com
//     root/jailbreak ainda consegue ler. Aceitável para projeto acadêmico.
//   - Backup exportado é cifrado com a senha do usuário (ver SettingsScreen).
// ---------------------------------------------------------------------------

const PIN_HASH_KEY = 'gt_pin_hash_v1';
const PIN_SALT_KEY = 'gt_pin_salt_v1';
const FAILED_ATTEMPTS_KEY = 'gt_failed_attempts_v1';
const LOCKED_UNTIL_KEY = 'gt_locked_until_v1';
const BIOMETRIC_ENABLED_KEY = 'gt_biometric_enabled_v1';
const USER_NAME_KEY = 'gt_user_name_v1';

const AUTO_LOCK_TIMEOUT_MS = 60_000; // bloqueia se ficou >60s em background

// Lock-out progressivo (em segundos) a partir da N-ésima tentativa.
const LOCKOUT_LADDER_SECONDS = [0, 0, 0, 0, 15, 30, 60, 120, 300];

export interface BiometricSupport {
  available: boolean;
  enrolled: boolean;
  types: LocalAuthentication.AuthenticationType[];
}

interface AuthContextValue {
  /** true se já existe um PIN configurado neste device. */
  hasPin: boolean;
  /** true se a sessão atual está autenticada (passou pelo gate). */
  unlocked: boolean;
  /** Nome do dono do dispositivo (mostrado no greeting). */
  userName: string;
  /** Suporte/cadastro de biometria no device. */
  biometric: BiometricSupport;
  /** Habilitar uso de biometria como alternativa ao PIN. */
  biometricEnabled: boolean;

  setupPin: (pin: string, userName?: string) => Promise<void>;
  verifyPin: (pin: string) => Promise<{ ok: boolean; lockedUntil?: number; attemptsLeft?: number }>;
  authenticateWithBiometrics: () => Promise<boolean>;
  setBiometricEnabled: (enabled: boolean) => Promise<void>;
  setUserName: (name: string) => Promise<void>;
  lock: () => void;
  /** Apaga PIN + estado de auth (exige confirmação no chamador). */
  resetAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

async function digestPin(pin: string, salt: string): Promise<string> {
  return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, `${salt}:${pin}`);
}

function generateSalt(): string {
  const bytes = Crypto.getRandomBytes(16);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

async function readNumber(key: string): Promise<number> {
  const raw = await SecureStore.getItemAsync(key);
  const parsed = raw ? Number(raw) : 0;
  return Number.isFinite(parsed) ? parsed : 0;
}

export function AuthProvider({ children }: Readonly<{ children: ReactNode }>) {
  const [hasPin, setHasPin] = useState(false);
  const [unlocked, setUnlocked] = useState(false);
  const [userName, setUserNameState] = useState('Motorista');
  const [biometricEnabled, setBiometricEnabledState] = useState(false);
  const [biometric, setBiometric] = useState<BiometricSupport>({
    available: false,
    enrolled: false,
    types: [],
  });
  const [ready, setReady] = useState(false);
  const backgroundedAtRef = useRef<number | null>(null);

  useEffect(() => {
    (async () => {
      const [pinHash, biometricFlag, name, available, enrolled, types] = await Promise.all([
        SecureStore.getItemAsync(PIN_HASH_KEY),
        SecureStore.getItemAsync(BIOMETRIC_ENABLED_KEY),
        SecureStore.getItemAsync(USER_NAME_KEY),
        LocalAuthentication.hasHardwareAsync(),
        LocalAuthentication.isEnrolledAsync(),
        LocalAuthentication.supportedAuthenticationTypesAsync(),
      ]);
      setHasPin(Boolean(pinHash));
      setBiometricEnabledState(biometricFlag === '1');
      if (name) setUserNameState(name);
      setBiometric({ available, enrolled, types });
      setReady(true);
    })().catch(() => setReady(true));
  }, []);

  // Auto-lock ao voltar do background após período de inatividade.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state: AppStateStatus) => {
      if (state === 'background' || state === 'inactive') {
        backgroundedAtRef.current = Date.now();
      } else if (state === 'active') {
        const since = backgroundedAtRef.current;
        if (since && Date.now() - since > AUTO_LOCK_TIMEOUT_MS && hasPin) {
          setUnlocked(false);
        }
        backgroundedAtRef.current = null;
      }
    });
    return () => sub.remove();
  }, [hasPin]);

  const setupPin = useCallback(async (pin: string, name?: string) => {
    if (!/^\d{4,8}$/.test(pin)) {
      throw new Error('PIN deve ter de 4 a 8 dígitos numéricos.');
    }
    const salt = generateSalt();
    const hash = await digestPin(pin, salt);
    await Promise.all([
      SecureStore.setItemAsync(PIN_SALT_KEY, salt),
      SecureStore.setItemAsync(PIN_HASH_KEY, hash),
      SecureStore.setItemAsync(FAILED_ATTEMPTS_KEY, '0'),
      SecureStore.setItemAsync(LOCKED_UNTIL_KEY, '0'),
      name ? SecureStore.setItemAsync(USER_NAME_KEY, name) : Promise.resolve(),
    ]);
    if (name) setUserNameState(name);
    setHasPin(true);
    setUnlocked(true);
  }, []);

  const verifyPin = useCallback(
    async (pin: string): Promise<{ ok: boolean; lockedUntil?: number; attemptsLeft?: number }> => {
      const [salt, expected, attempts, lockedUntil] = await Promise.all([
        SecureStore.getItemAsync(PIN_SALT_KEY),
        SecureStore.getItemAsync(PIN_HASH_KEY),
        readNumber(FAILED_ATTEMPTS_KEY),
        readNumber(LOCKED_UNTIL_KEY),
      ]);
      const now = Date.now();
      if (lockedUntil > now) {
        return { ok: false, lockedUntil };
      }
      if (!salt || !expected) {
        return { ok: false };
      }
      const candidate = await digestPin(pin, salt);
      if (candidate === expected) {
        await Promise.all([
          SecureStore.setItemAsync(FAILED_ATTEMPTS_KEY, '0'),
          SecureStore.setItemAsync(LOCKED_UNTIL_KEY, '0'),
        ]);
        setUnlocked(true);
        return { ok: true };
      }
      const nextAttempts = attempts + 1;
      const cooldownSeconds =
        LOCKOUT_LADDER_SECONDS[Math.min(nextAttempts, LOCKOUT_LADDER_SECONDS.length - 1)] ?? 300;
      const nextLockedUntil = cooldownSeconds > 0 ? now + cooldownSeconds * 1000 : 0;
      await Promise.all([
        SecureStore.setItemAsync(FAILED_ATTEMPTS_KEY, String(nextAttempts)),
        SecureStore.setItemAsync(LOCKED_UNTIL_KEY, String(nextLockedUntil)),
      ]);
      return {
        ok: false,
        lockedUntil: nextLockedUntil > 0 ? nextLockedUntil : undefined,
        attemptsLeft: Math.max(0, 5 - nextAttempts),
      };
    },
    [],
  );

  const authenticateWithBiometrics = useCallback(async (): Promise<boolean> => {
    if (!biometric.available || !biometric.enrolled || !biometricEnabled) return false;
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Desbloquear GarageTrack',
      fallbackLabel: 'Usar PIN',
      cancelLabel: 'Cancelar',
      disableDeviceFallback: false,
    });
    if (result.success) {
      setUnlocked(true);
      return true;
    }
    return false;
  }, [biometric, biometricEnabled]);

  const setBiometricEnabled = useCallback(async (enabled: boolean) => {
    setBiometricEnabledState(enabled);
    await SecureStore.setItemAsync(BIOMETRIC_ENABLED_KEY, enabled ? '1' : '0');
  }, []);

  const setUserName = useCallback(async (name: string) => {
    const trimmed = name.trim().slice(0, 60) || 'Motorista';
    setUserNameState(trimmed);
    await SecureStore.setItemAsync(USER_NAME_KEY, trimmed);
  }, []);

  const lock = useCallback(() => setUnlocked(false), []);

  const resetAuth = useCallback(async () => {
    await Promise.all([
      SecureStore.deleteItemAsync(PIN_HASH_KEY),
      SecureStore.deleteItemAsync(PIN_SALT_KEY),
      SecureStore.deleteItemAsync(FAILED_ATTEMPTS_KEY),
      SecureStore.deleteItemAsync(LOCKED_UNTIL_KEY),
      SecureStore.deleteItemAsync(BIOMETRIC_ENABLED_KEY),
    ]);
    setHasPin(false);
    setUnlocked(false);
    setBiometricEnabledState(false);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      hasPin,
      unlocked,
      userName,
      biometric,
      biometricEnabled,
      setupPin,
      verifyPin,
      authenticateWithBiometrics,
      setBiometricEnabled,
      setUserName,
      lock,
      resetAuth,
    }),
    [
      hasPin,
      unlocked,
      userName,
      biometric,
      biometricEnabled,
      setupPin,
      verifyPin,
      authenticateWithBiometrics,
      setBiometricEnabled,
      setUserName,
      lock,
      resetAuth,
    ],
  );

  if (!ready) return null;
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth deve ser usado dentro de <AuthProvider>');
  }
  return ctx;
}
