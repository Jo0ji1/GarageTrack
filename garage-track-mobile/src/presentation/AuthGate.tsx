import { Fingerprint, Lock, ShieldCheck } from 'lucide-react-native';
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useAuth } from './AuthContext';
import { useTheme } from './ThemeContext';
import { radii, spacing, typography } from './theme';

interface Props {
  children: ReactNode;
}

/**
 * Componente porteiro: bloqueia a UI até o usuário se autenticar.
 * - Sem PIN cadastrado → tela de setup (cria PIN + nome).
 * - Com PIN, tela de unlock (PIN + biometria opcional).
 */
export function AuthGate({ children }: Readonly<Props>) {
  const { hasPin, unlocked } = useAuth();
  if (unlocked) return <>{children}</>;
  if (!hasPin) return <SetupScreen />;
  return <UnlockScreen />;
}

function SetupScreen() {
  const { setupPin } = useAuth();
  const { palette } = useTheme();
  const styles = useMemo(() => makeStyles(palette), [palette]);
  const [step, setStep] = useState<'name' | 'pin' | 'confirm'>('name');
  const [name, setName] = useState('');
  const [pin, setPin] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const handleSubmit = useCallback(async () => {
    setError(null);
    if (step === 'name') {
      if (name.trim().length < 2) {
        setError('Digite um nome com pelo menos 2 letras.');
        return;
      }
      setStep('pin');
      return;
    }
    if (step === 'pin') {
      if (!/^\d{4,8}$/.test(pin)) {
        setError('Use de 4 a 8 dígitos numéricos.');
        return;
      }
      setStep('confirm');
      return;
    }
    if (confirm !== pin) {
      setError('Os PINs não conferem. Tente novamente.');
      setConfirm('');
      return;
    }
    setBusy(true);
    try {
      await setupPin(pin, name.trim());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível salvar o PIN.');
    } finally {
      setBusy(false);
    }
  }, [step, name, pin, confirm, setupPin]);

  const title = step === 'name' ? 'Como devemos te chamar?' : step === 'pin' ? 'Crie seu PIN' : 'Confirme seu PIN';
  const subtitle =
    step === 'name'
      ? 'Esse nome aparece no seu painel — pode ser apelido.'
      : step === 'pin'
      ? 'Mínimo 4 dígitos. É solicitado ao abrir o app e ao voltar do background.'
      : 'Digite novamente o mesmo PIN para confirmar.';

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.container}>
      <View style={styles.header}>
        <View style={styles.iconBadge}>
          <ShieldCheck color={palette.accent} size={28} />
        </View>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>

      {step === 'name' ? (
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="Seu nome"
          placeholderTextColor={palette.graphite}
          style={styles.input}
          maxLength={60}
          autoFocus
        />
      ) : (
        <TextInput
          value={step === 'pin' ? pin : confirm}
          onChangeText={step === 'pin' ? setPin : setConfirm}
          placeholder="••••"
          placeholderTextColor={palette.graphite}
          style={[styles.input, styles.pinInput]}
          keyboardType="number-pad"
          secureTextEntry
          maxLength={8}
          autoFocus
        />
      )}

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Pressable style={[styles.primaryButton, busy && styles.primaryButtonDisabled]} disabled={busy} onPress={handleSubmit}>
        {busy ? <ActivityIndicator color={palette.paper} /> : <Text style={styles.primaryButtonText}>Continuar</Text>}
      </Pressable>
    </KeyboardAvoidingView>
  );
}

function UnlockScreen() {
  const { verifyPin, authenticateWithBiometrics, biometric, biometricEnabled, userName } = useAuth();
  const { palette } = useTheme();
  const styles = useMemo(() => makeStyles(palette), [palette]);
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [lockSecondsLeft, setLockSecondsLeft] = useState(0);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (biometricEnabled && biometric.available && biometric.enrolled) {
      authenticateWithBiometrics().catch(() => undefined);
    }
  }, [biometricEnabled, biometric, authenticateWithBiometrics]);

  useEffect(() => {
    if (lockSecondsLeft <= 0) return;
    const id = setInterval(() => setLockSecondsLeft((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(id);
  }, [lockSecondsLeft]);

  const submit = useCallback(async () => {
    if (lockSecondsLeft > 0) return;
    setBusy(true);
    setError(null);
    const result = await verifyPin(pin);
    setBusy(false);
    if (result.ok) {
      setPin('');
      return;
    }
    if (result.lockedUntil) {
      const seconds = Math.ceil((result.lockedUntil - Date.now()) / 1000);
      setLockSecondsLeft(seconds);
      setError(`Muitas tentativas. Aguarde ${seconds}s.`);
    } else if (result.attemptsLeft !== undefined) {
      setError(`PIN incorreto. ${result.attemptsLeft} tentativa(s) antes do bloqueio.`);
    } else {
      setError('PIN incorreto.');
    }
    setPin('');
  }, [pin, verifyPin, lockSecondsLeft]);

  const canBiometric = biometricEnabled && biometric.available && biometric.enrolled;

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.container}>
      <View style={styles.header}>
        <View style={styles.iconBadge}>
          <Lock color={palette.accent} size={28} />
        </View>
        <Text style={styles.title}>Olá de novo, {userName}</Text>
        <Text style={styles.subtitle}>Digite seu PIN para abrir o GarageTrack.</Text>
      </View>

      <TextInput
        value={pin}
        onChangeText={(v) => setPin(v.replace(/\D/g, '').slice(0, 8))}
        placeholder="••••"
        placeholderTextColor={palette.graphite}
        style={[styles.input, styles.pinInput]}
        keyboardType="number-pad"
        secureTextEntry
        autoFocus
        editable={lockSecondsLeft === 0}
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Pressable
        style={[styles.primaryButton, (busy || lockSecondsLeft > 0 || pin.length < 4) && styles.primaryButtonDisabled]}
        disabled={busy || lockSecondsLeft > 0 || pin.length < 4}
        onPress={submit}
      >
        {busy ? <ActivityIndicator color={palette.paper} /> : <Text style={styles.primaryButtonText}>Desbloquear</Text>}
      </Pressable>

      {canBiometric ? (
        <Pressable style={styles.secondaryButton} onPress={authenticateWithBiometrics}>
          <Fingerprint color={palette.accent} size={20} />
          <Text style={styles.secondaryButtonText}>Usar biometria</Text>
        </Pressable>
      ) : null}
    </KeyboardAvoidingView>
  );
}

function makeStyles(p: ReturnType<typeof useTheme>['palette']) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: p.background,
      padding: spacing.xl,
      justifyContent: 'center',
      gap: spacing.lg,
    },
    header: {
      gap: spacing.sm,
      marginBottom: spacing.lg,
    },
    iconBadge: {
      width: 56,
      height: 56,
      borderRadius: radii.lg,
      backgroundColor: p.accentSoft,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.sm,
    },
    title: { ...typography.h1, color: p.ink },
    subtitle: { ...typography.body, color: p.graphite },
    input: {
      minHeight: 56,
      borderRadius: radii.lg,
      borderWidth: 1,
      borderColor: p.border,
      backgroundColor: p.paper,
      paddingHorizontal: spacing.lg,
      color: p.ink,
      fontSize: 16,
    },
    pinInput: {
      textAlign: 'center',
      letterSpacing: 8,
      fontSize: 28,
      fontWeight: '900',
    },
    error: { ...typography.body, color: p.danger },
    primaryButton: {
      minHeight: 56,
      borderRadius: radii.lg,
      backgroundColor: p.accent,
      alignItems: 'center',
      justifyContent: 'center',
    },
    primaryButtonDisabled: { opacity: 0.55 },
    primaryButtonText: { ...typography.subtitle, color: '#FFFFFF', fontSize: 16 },
    secondaryButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.sm,
      paddingVertical: spacing.md,
    },
    secondaryButtonText: { ...typography.bodyStrong, color: p.accent },
  });
}
