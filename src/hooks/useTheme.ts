import { useColorScheme } from 'react-native';
import { useThemeStore, type ThemeMode } from '@/stores/themeStore';
import {
  lightPalette,
  darkPalette,
  colors as legacyColors,
  typography,
  motion,
  spacing,
  textSizeMap,
  type TextSizeLevel,
} from '@/constants/theme';
import type { Palette } from '@/constants/theme';

export function useTheme() {
  const colorScheme = useColorScheme();
  const { explicitTheme, textSize, fontSize, lineHeight, reducedMotion, setExplicitTheme, setTextSize } =
    useThemeStore();

  const resolvedMode: 'light' | 'dark' =
    explicitTheme === 'system' ? ((colorScheme as 'light' | 'dark' | null | undefined) ?? 'light') : explicitTheme;

  const palette: Palette = resolvedMode === 'dark' ? darkPalette : lightPalette;
  const colors = legacyColors[resolvedMode];

  return {
    /** New API: color palette with semantic keys (bg, surface, ink, muted, clay, sage, brass, line) */
    palette,
    /** @deprecated Use `palette` instead. Legacy color API for backward compat. */
    colors,
    /** Resolved color scheme: 'light' or 'dark' */
    colorScheme: resolvedMode,
    /** Explicit theme preference: 'light' | 'dark' | 'system' */
    explicitTheme,
    /** Resolved body font size based on text size setting */
    fontSize,
    /** Resolved body line height based on text size setting */
    lineHeight,
    /** Whether reduced motion is preferred */
    reducedMotion,
    /** Whether dark mode is active */
    isDark: resolvedMode === 'dark',
    /** Current text size level */
    textSize,
    /** Typography constants (scripture & ui families + sizes) */
    typography,
    /** Motion duration + easing tokens */
    motion,
    /** Spacing scale tokens */
    spacing,
    /** Set explicit theme preference */
    setExplicitTheme,
    /** Set text size */
    setTextSize,
  };
}

export type { ThemeMode, TextSizeLevel, Palette };
