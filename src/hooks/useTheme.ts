import { useColorScheme } from 'react-native';
import { useThemeStore, type ThemeMode, type TextSize } from '@/stores/themeStore';
import { colors, typography, motion, spacing } from '@/constants/theme';

export function useTheme() {
  const colorScheme = useColorScheme();
  const { mode, textSize, setMode, setTextSize } = useThemeStore();

  const resolvedMode: 'light' | 'dark' =
    mode === 'system' ? (colorScheme ?? 'light') : mode;

  return {
    mode,
    resolvedMode,
    textSize,
    colors: colors[resolvedMode],
    typography,
    motion,
    spacing,
    setMode,
    setTextSize,
    isDark: resolvedMode === 'dark',
  };
}

export type { ThemeMode, TextSize };
