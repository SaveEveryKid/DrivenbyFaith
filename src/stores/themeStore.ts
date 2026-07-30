import { create } from 'zustand';

export type ThemeMode = 'light' | 'dark' | 'system';
export type TextSize = 'small' | 'base' | 'large';

interface ThemeState {
  mode: ThemeMode;
  textSize: TextSize;
  setMode: (mode: ThemeMode) => void;
  setTextSize: (size: TextSize) => void;
}

export const useThemeStore = create<ThemeState>((set) => ({
  mode: 'system',
  textSize: 'base',
  setMode: (mode) => set({ mode }),
  setTextSize: (textSize) => set({ textSize }),
}));
