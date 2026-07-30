import * as SecureStore from 'expo-secure-store';
import type { SupabaseClientOptions } from '@supabase/supabase-js';

// Adapter that matches the storage interface expected by Supabase auth
export const secureStoreAdapter = {
  getItem: async (key: string): Promise<string | null> => {
    try {
      return await SecureStore.getItemAsync(key);
    } catch {
      return null;
    }
  },
  setItem: async (key: string, value: string): Promise<void> => {
    try {
      await SecureStore.setItemAsync(key, value);
    } catch {
      // Fail silently — session won't persist if SecureStore is unavailable
    }
  },
  removeItem: async (key: string): Promise<void> => {
    try {
      await SecureStore.deleteItemAsync(key);
    } catch {
      // Fail silently
    }
  },
};
