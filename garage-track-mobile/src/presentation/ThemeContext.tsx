import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useColorScheme } from 'react-native';
import { getPalette, type ThemeMode, type ThemePalette } from './theme';

const STORAGE_KEY = '@garagetrack/theme-preference';

export type ThemePreference = ThemeMode | 'system';

interface ThemeContextValue {
  mode: ThemeMode;
  preference: ThemePreference;
  palette: ThemePalette;
  setPreference: (preference: ThemePreference) => Promise<void>;
  toggle: () => Promise<void>;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

/**
 * Provedor de tema reativo. Persiste preferência local (light/dark/system).
 * Quando 'system', acompanha o sistema operacional via `useColorScheme`.
 */
export function ThemeProvider({ children }: Readonly<{ children: ReactNode }>) {
  const systemScheme = useColorScheme();
  const [preference, setPreferenceState] = useState<ThemePreference>('system');
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((value) => {
        if (value === 'light' || value === 'dark' || value === 'system') {
          setPreferenceState(value);
        }
      })
      .catch(() => undefined)
      .finally(() => setHydrated(true));
  }, []);

  const mode: ThemeMode = useMemo(() => {
    if (preference === 'system') {
      return systemScheme === 'dark' ? 'dark' : 'light';
    }
    return preference;
  }, [preference, systemScheme]);

  const palette = useMemo(() => getPalette(mode), [mode]);

  const setPreference = useCallback(async (next: ThemePreference) => {
    setPreferenceState(next);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Ignora falha de I/O — UI continua respondendo.
    }
  }, []);

  const toggle = useCallback(async () => {
    const next: ThemePreference = mode === 'dark' ? 'light' : 'dark';
    await setPreference(next);
  }, [mode, setPreference]);

  const value = useMemo<ThemeContextValue>(
    () => ({ mode, preference, palette, setPreference, toggle }),
    [mode, preference, palette, setPreference, toggle],
  );

  if (!hydrated) {
    return null;
  }

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme deve ser usado dentro de <ThemeProvider>');
  }
  return ctx;
}
