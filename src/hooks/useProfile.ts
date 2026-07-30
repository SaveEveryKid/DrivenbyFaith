import { useAuth } from './useAuth';
import type { ProfileRow } from '@/types/database';

interface UseProfileReturn {
  profile: ProfileRow | null;
  isLoading: boolean;
  isOnboarded: boolean;
  refreshProfile: () => Promise<void>;
}

export function useProfile(): UseProfileReturn {
  const { profile, isLoading, isOnboarded, refreshProfile } = useAuth();
  return { profile, isLoading, isOnboarded, refreshProfile };
}
