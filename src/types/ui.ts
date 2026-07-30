import type { ThemeMode, TextSize } from '@/stores/themeStore';

export interface LoadingState {
  isLoading: true;
  error: null;
  data: null;
}

export interface ErrorState {
  isLoading: false;
  error: string;
  data: null;
}

export type EmptyStateType = 'devotional' | 'library' | 'coach' | 'prayer' | 'progress' | 'search';

export interface AppTheme {
  mode: ThemeMode;
  textSize: TextSize;
}
