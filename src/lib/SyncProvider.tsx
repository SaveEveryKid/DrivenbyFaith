// =============================================================================
// SyncProvider — initializes the offline database on mount and wires up
// automatic sync when the device reconnects to the network.
// =============================================================================

import React, {
  useEffect,
  useMemo,
  type ReactNode,
} from 'react';
import { supabase } from './supabase';
import { initOfflineDb } from './offlineDb';
import { createSyncEngine, type SyncEngine } from './syncEngine';
import { useSyncOnReconnect } from '@/hooks/useNetwork';

// ─── Provider ──────────────────────────────────────────────────────────────────

interface SyncProviderProps {
  children: ReactNode;
}

export function SyncProvider({ children }: SyncProviderProps): React.ReactElement {
  // ── Initialize offline database on mount ────────────────────────────────────

  useEffect(() => {
    void initOfflineDb();
  }, []);

  // ── Create sync engine (stable reference) ───────────────────────────────────

  const syncEngine: SyncEngine = useMemo(() => createSyncEngine(supabase), []);

  // ── Auto-sync on reconnect ──────────────────────────────────────────────────

  useSyncOnReconnect(async () => {
    try {
      await syncEngine.fullSync();
    } catch (err) {
      console.warn('[SyncProvider] Auto-sync on reconnect failed:', err);
    }
  });

  return <>{children}</>;
}
