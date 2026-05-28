import { Platform, type TextStyle } from 'react-native';

/**
 * Tokens de design unificados.
 *
 * Suporta dois temas: light (cream/pine, original) e dark (estilo Figma —
 * superfícies escuras com CTA laranja). Use `useTheme()` para obter
 * `colors`/`palette` reativos; os tokens exportados aqui são o tema **light**
 * (fallback estático compatível com módulos antigos).
 */

export type ThemeMode = 'light' | 'dark';

export interface ThemePalette {
  ink: string;
  pine: string;
  pineDark: string;
  mint: string;
  cream: string;
  paper: string;
  amber: string;
  rust: string;
  sky: string;
  graphite: string;
  graphiteLight: string;
  border: string;
  borderSoft: string;
  danger: string;
  warning: string;
  success: string;
  surfaceAlt: string;
  overlay: string;
  /** Cor primária de ação (CTA principal). */
  accent: string;
  accentSoft: string;
  /** Fundo geral da app. */
  background: string;
}

export const lightPalette: ThemePalette = {
  ink: '#18221D',
  pine: '#1F6F4A',
  pineDark: '#164F35',
  mint: '#DDF4E7',
  cream: '#F8F3EA',
  paper: '#FFFDF8',
  amber: '#D9822B',
  rust: '#A9462D',
  sky: '#327A9B',
  graphite: '#53615A',
  graphiteLight: '#7A867F',
  border: '#E6DFD0',
  borderSoft: '#F1EADC',
  danger: '#B42318',
  warning: '#B86E00',
  success: '#23784D',
  surfaceAlt: '#FFFCF5',
  overlay: 'rgba(24, 34, 29, 0.55)',
  accent: '#E26A2C',
  accentSoft: '#FCE5D6',
  background: '#F8F3EA',
};

export const darkPalette: ThemePalette = {
  ink: '#F5EDE2',
  pine: '#3FA978',
  pineDark: '#5DC494',
  mint: '#1B3A2B',
  cream: '#10171F',
  paper: '#19222C',
  amber: '#F08A3F',
  rust: '#E26A2C',
  sky: '#5BB0D4',
  graphite: '#9AA5AD',
  graphiteLight: '#6E7882',
  border: '#2A3540',
  borderSoft: '#222C36',
  danger: '#FF6A5C',
  warning: '#F5A623',
  success: '#5DC494',
  surfaceAlt: '#1F2A36',
  overlay: 'rgba(0, 0, 0, 0.65)',
  accent: '#FF6F3C',
  accentSoft: '#3A2418',
  background: '#0F151D',
};

/** Tema light é o default exportado para compat retroativa. */
export const colors: ThemePalette = lightPalette;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};

export const radii = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  pill: 999,
};

export const shadow = {
  shadowColor: '#18221D',
  shadowOpacity: 0.08,
  shadowRadius: 16,
  shadowOffset: { width: 0, height: 8 },
  elevation: 2,
};

export const shadowSoft = {
  shadowColor: '#18221D',
  shadowOpacity: 0.05,
  shadowRadius: 8,
  shadowOffset: { width: 0, height: 4 },
  elevation: 1,
};

const baseFont = Platform.select({
  ios: 'Avenir Next',
  android: 'sans-serif-condensed',
  default: 'sans-serif',
});

export const typography = {
  hero: { fontSize: 30, fontWeight: '900', fontFamily: baseFont } as TextStyle,
  h1: { fontSize: 24, fontWeight: '900', fontFamily: baseFont } as TextStyle,
  h2: { fontSize: 20, fontWeight: '900', fontFamily: baseFont } as TextStyle,
  h3: { fontSize: 18, fontWeight: '900', fontFamily: baseFont } as TextStyle,
  subtitle: { fontSize: 16, fontWeight: '900' } as TextStyle,
  body: { fontSize: 14, lineHeight: 20 } as TextStyle,
  bodyStrong: { fontSize: 14, lineHeight: 20, fontWeight: '700' } as TextStyle,
  caption: { fontSize: 12, fontWeight: '700' } as TextStyle,
  eyebrow: {
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  } as TextStyle,
};

export const layout = {
  screenPadding: spacing.lg,
  cardPadding: spacing.lg,
  inputHeight: 50,
  buttonHeight: 52,
  buttonHeightSmall: 40,
};

export function getPalette(mode: ThemeMode): ThemePalette {
  return mode === 'dark' ? darkPalette : lightPalette;
}