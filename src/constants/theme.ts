// ─── Font Families ──────────────────────────────────────────────────────────

export const UIFontFamily = 'Inter, system-ui, sans-serif' as const;
export const ScriptureFontFamily = 'Georgia, serif' as const;

// ─── Palette ────────────────────────────────────────────────────────────────

export const lightPalette = {
  bg: '#FDFBF7',
  surface: '#FFFFFF',
  ink: '#3C3C3C',
  muted: '#6F6F6F',
  clay: '#9B7343',
  sage: '#5F6E48',
  brass: '#B08C57',
  line: '#E0D1B8',
  inkDim: '#9B9B9B',
  scripture: '#3C3C3C',
} as const;

export const darkPalette = {
  bg: '#1C1B1A',
  surface: '#353330',
  ink: '#E8E4DF',
  muted: '#B5B0A8',
  clay: '#C2A87D',
  sage: '#93A478',
  brass: '#D2BF9F',
  line: '#4A4640',
  inkDim: '#7A756E',
  scripture: '#E8E4DF',
} as const;

export type Palette = typeof lightPalette;

// ─── Legacy colors (backward compat) ────────────────────────────────────────

export const colors = {
  light: {
    background: '#FDFBF7',
    surface: '#F5F0E8',
    surfaceElevated: '#FFFFFF',
    text: '#3C3C3C',
    textSecondary: '#6F6F6F',
    textMuted: '#9B9B9B',
    accent: '#9B7343',
    accentLight: '#C2A87D',
    success: '#5F6E48',
    warning: '#B08C57',
    error: '#C44E4E',
    border: '#E0D1B8',
    scripture: '#3C3C3C',
  },
  dark: {
    background: '#1C1B1A',
    surface: '#2A2825',
    surfaceElevated: '#353330',
    text: '#E8E4DF',
    textSecondary: '#B5B0A8',
    textMuted: '#7A756E',
    accent: '#C2A87D',
    accentLight: '#9B7343',
    success: '#93A478',
    warning: '#D2BF9F',
    error: '#D47272',
    border: '#4A4640',
    scripture: '#E8E4DF',
  },
} as const;

// ─── Typography ─────────────────────────────────────────────────────────────

export const typography = {
  scripture: {
    fontFamily: ScriptureFontFamily,
    sizes: {
      small: 16,
      base: 18,
      large: 22,
      xlarge: 26,
    } as const,
    lineHeight: 1.6,
  },
  ui: {
    fontFamily: UIFontFamily,
    sizes: {
      xs: 12,
      sm: 14,
      base: 16,
      lg: 18,
      xl: 20,
      '2xl': 24,
      '3xl': 32,
    } as const,
  },
} as const;

// ─── Text size to font-size / line-height mapping ───────────────────────────

export const textSizeMap = {
  small: { fontSize: 14, lineHeight: 20 },
  base: { fontSize: 16, lineHeight: 24 },
  large: { fontSize: 18, lineHeight: 28 },
  xlarge: { fontSize: 22, lineHeight: 34 },
} as const;

export type TextSizeLevel = keyof typeof textSizeMap;

// ─── Motion ─────────────────────────────────────────────────────────────────

export const motion = {
  duration: {
    fast: 150,
    normal: 250,
    slow: 350,
  },
  easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
} as const;

// ─── Spacing ────────────────────────────────────────────────────────────────

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  '2xl': 48,
  '3xl': 64,
} as const;
