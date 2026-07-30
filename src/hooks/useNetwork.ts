// =============================================================================
// Network status hooks — wraps @react-native-community/netinfo with graceful
// degradation when the native module is unavailable.
// =============================================================================

import { useEffect, useRef, useCallback } from 'react';

// ─── Conditional import — gracefully degrades when native netinfo is absent ────

let NetInfo: {
  useNetInfo: () => {
    isConnected: boolean;
    isInternetReachable: boolean | null;
    type: string;
  };
} | null = null;

try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  NetInfo = require('@react-native-community/netinfo');
} catch {
  // Native module not available (e.g., in Expo Go without the native build,
  // or testing). Degrade gracefully with a default "online" assumption.
  NetInfo = null;
}

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface NetworkStatus {
  /** Whether the device has any network connection */
  isConnected: boolean;
  /** Whether the internet is reachable via the active connection */
  isInternetReachable: boolean | null;
  /** The connection type (wifi, cellular, ethernet, etc.) */
  type: string;
}

// ─── useNetworkStatus ──────────────────────────────────────────────────────────

const DEFAULT_ONLINE: NetworkStatus = {
  isConnected: true,
  isInternetReachable: true,
  type: 'unknown',
};

/**
 * Returns the current network status. Degrades to "always online" when the
 * native netinfo module is not available.
 */
export function useNetworkStatus(): NetworkStatus {
  if (!NetInfo) {
    return DEFAULT_ONLINE;
  }

  const netInfo = NetInfo.useNetInfo();

  return {
    isConnected: netInfo.isConnected ?? false,
    isInternetReachable: netInfo.isInternetReachable ?? null,
    type: netInfo.type,
  };
}

// ─── useSyncOnReconnect ────────────────────────────────────────────────────────

/**
 * Watches network status and calls the provided callback when the device
 * transitions from offline → online.
 *
 * @param callback - Async function to invoke when connectivity is restored.
 */
export function useSyncOnReconnect(callback: () => Promise<void>): void {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  const wasOfflineRef = useRef(false);

  const status = useNetworkStatus();

  const stableCallback = useCallback(async () => {
    await callbackRef.current();
  }, []);

  useEffect(() => {
    const isCurrentlyOffline = !status.isConnected;

    // Transition from offline → online
    if (wasOfflineRef.current && !isCurrentlyOffline) {
      void stableCallback();
    }

    wasOfflineRef.current = isCurrentlyOffline;
  }, [status.isConnected, stableCallback]);
}
