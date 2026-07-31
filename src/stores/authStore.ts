import { create } from 'zustand';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import type { Profile } from '@/types/database';

interface AuthState {
  session: Session | null;
  profile: Profile | null;
  isInitializing: boolean;
  isProfileLoading: boolean;
  initialize: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
}

let initialized = false;

export const useAuthStore = create<AuthState>((set, get) => ({
  session: null,
  profile: null,
  isInitializing: true,
  isProfileLoading: false,

  initialize: async () => {
    if (initialized) return;
    initialized = true;

    const {
      data: { session },
    } = await supabase.auth.getSession();
    set({ session });
    if (session) {
      await get().refreshProfile();
    }
    set({ isInitializing: false });

    supabase.auth.onAuthStateChange((_event, newSession) => {
      set({ session: newSession });
      if (newSession) {
        get().refreshProfile();
      } else {
        set({ profile: null });
      }
    });
  },

  refreshProfile: async () => {
    const userId = get().session?.user.id;
    if (!userId) {
      set({ profile: null, isProfileLoading: false });
      return;
    }
    set({ isProfileLoading: true });
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).single();
    set({ profile: data ?? null, isProfileLoading: false });
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({ session: null, profile: null });
  },
}));
