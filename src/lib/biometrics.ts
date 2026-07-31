// =============================================================================
// Biometric service — device-level authentication via expo-local-authentication
// =============================================================================

import * as SecureStore from 'expo-secure-store';

let LocalAuthentication: typeof import('expo-local-authentication') | null = null;

async function getLocalAuth(): Promise<typeof import('expo-local-authentication') | null> {
  if (LocalAuthentication) return LocalAuthentication;
  try {
    LocalAuthentication = await import('expo-local-authentication');
    return LocalAuthentication;
  } catch {
    console.warn('[Biometrics] expo-local-authentication not available');
    return null;
  }
}

const BIOMETRIC_LOCK_KEY = 'driven-by-faith:biometric_lock_enabled';

// ─── Check device support ────────────────────────────────────────────────────

export async function isBiometricAvailable(): Promise<boolean> {
  const LocalAuth = await getLocalAuth();
  if (!LocalAuth) return false;

  try {
    const compatible = await LocalAuth.hasHardwareAsync();
    if (!compatible) return false;

    const enrolled = await LocalAuth.isEnrolledAsync();
    return enrolled;
  } catch {
    return false;
  }
}

// ─── Authenticate ────────────────────────────────────────────────────────────

export async function authenticate(): Promise<boolean> {
  const LocalAuth = await getLocalAuth();
  if (!LocalAuth) return false;

  try {
    const result = await LocalAuth.authenticateAsync({
      promptMessage: 'Unlock Driven by Faith',
      fallbackLabel: 'Use passcode',
      cancelLabel: 'Cancel',
    });

    return result.success;
  } catch {
    return false;
  }
}

// ─── Enable / disable biometric lock ─────────────────────────────────────────

export async function enableBiometricLock(enabled: boolean): Promise<void> {
  try {
    await SecureStore.setItemAsync(BIOMETRIC_LOCK_KEY, String(enabled));
  } catch {
    console.warn('[Biometrics] Failed to save lock preference');
  }
}

// ─── Check if biometric lock is enabled ──────────────────────────────────────

export async function isBiometricLockEnabled(): Promise<boolean> {
  try {
    const value = await SecureStore.getItemAsync(BIOMETRIC_LOCK_KEY);
    return value === 'true';
  } catch {
    return false;
  }
}
