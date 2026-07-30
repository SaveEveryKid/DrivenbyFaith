import { create } from 'zustand';
import { textSizeMap, type TextSizeLevel } from '@/constants/theme';

export type ThemeMode = 'light' | 'dark' | 'system';
/** @deprecated Use ThemeMode */
export type TextSize = TextSizeLevel;

interface ThemeState {
  explicitTheme: ThemeMode;
  textSize: TextSizeLevel;
  reducedMotion: boolean;
  setExplicitTheme: (theme: ThemeMode) => void;
  setTextSize: (size: TextSizeLevel) => void;
  setReducedMotion: (reduced: boolean) => void;
  /** Resolved font size for body text based on current textSize */
  fontSize: number;
  /** Resolved line height for body text based on current textSize */
  lineHeight: number;
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  explicitTheme: 'system' as ThemeMode,
  textSize: 'base' as TextSizeLevel,
  reducedMotion: false,

  setExplicitTheme: (explicitTheme) => set({ explicitTheme }),

  setTextSize: (textSize) => set({ textSize }),

  setReducedMotion: (reducedMotion) => set({ reducedMotion }),

  get fontSize(): number {
    return textSizeMap[get().textSize].fontSize;
  },

  get lineHeight(): number {
    return textSizeMap[get().textSize].lineHeight;
  },
}));
