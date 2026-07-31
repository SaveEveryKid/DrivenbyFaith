// =============================================================================
// Security settings screen — biometric lock configuration
// =============================================================================

import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Switch, TouchableOpacity, Alert } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { UIFontFamily } from '@/constants/theme';
import {
  isBiometricAvailable,
  authenticate,
  enableBiometricLock,
  isBiometricLockEnabled,
} from '@/lib/biometrics';

export default function SecuritySettingsScreen(): React.ReactElement {
  const { palette } = useTheme();
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [lockEnabled, setLockEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isTesting, setIsTesting] = useState(false);

  // ── Check availability and current setting ────────────────────────────────

  useEffect(() => {
    const check = async (): Promise<void> => {
      try {
        const [available, enabled] = await Promise.all([
          isBiometricAvailable(),
          isBiometricLockEnabled(),
        ]);
        setBiometricAvailable(available);
        setLockEnabled(enabled);
      } catch {
        setBiometricAvailable(false);
      } finally {
        setIsLoading(false);
      }
    };
    void check();
  }, []);

  // ── Toggle biometric lock ─────────────────────────────────────────────────

  const handleToggle = async (enabled: boolean): Promise<void> => {
    if (enabled) {
      // Require successful authentication before enabling
      const success = await authenticate();
      if (!success) {
        Alert.alert(
          'Could not enable',
          'Authentication is required to enable the biometric lock.',
        );
        return;
      }
    }

    await enableBiometricLock(enabled);
    setLockEnabled(enabled);
  };

  // ── Test authentication ───────────────────────────────────────────────────

  const handleTest = async (): Promise<void> => {
    setIsTesting(true);
    const success = await authenticate();
    setIsTesting(false);

    if (success) {
      Alert.alert('Success', 'Biometric authentication works correctly.');
    } else {
      Alert.alert(
        'Authentication failed',
        'Could not verify your identity. Make sure biometric authentication is set up on your device.',
      );
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: palette.bg }}
      contentContainerStyle={{ padding: 24, paddingBottom: 48 }}
    >
      {/* Info text */}
      <View
        style={{
          backgroundColor: palette.surface,
          borderRadius: 10,
          padding: 16,
          marginBottom: 24,
          borderWidth: 1,
          borderColor: palette.line,
        }}
      >
        <Text
          style={{
            fontFamily: UIFontFamily,
            fontSize: 14,
            color: palette.muted,
            lineHeight: 20,
          }}
        >
          Biometric lock is device-level only — it is not synced to your account.
          If you switch devices, you will need to enable it again on the new device.
        </Text>
      </View>

      {/* Biometric lock toggle */}
      <Text
        style={{
          fontFamily: UIFontFamily,
          fontSize: 14,
          fontWeight: '600',
          color: palette.muted,
          textTransform: 'uppercase',
          letterSpacing: 0.5,
          marginBottom: 12,
        }}
      >
        App lock
      </Text>

      <View
        style={{
          backgroundColor: palette.surface,
          borderRadius: 10,
          overflow: 'hidden',
          marginBottom: 24,
        }}
      >
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingHorizontal: 16,
            paddingVertical: 14,
          }}
        >
          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontFamily: UIFontFamily,
                fontSize: 16,
                color: palette.ink,
              }}
            >
              Require biometric to open app
            </Text>
            <Text
              style={{
                fontFamily: UIFontFamily,
                fontSize: 13,
                color: palette.muted,
                marginTop: 2,
              }}
            >
              {biometricAvailable
                ? 'Use Face ID or fingerprint to unlock the app'
                : 'Not available on this device'}
            </Text>
          </View>
          <Switch
            value={lockEnabled}
            onValueChange={(val) => {
              void handleToggle(val);
            }}
            disabled={!biometricAvailable || isLoading}
            trackColor={{ false: palette.line, true: palette.sage }}
            thumbColor={lockEnabled ? '#FFFFFF' : '#FFFFFF'}
            accessibilityLabel="Require biometric to open app"
          />
        </View>
      </View>

      {/* Test button */}
      {biometricAvailable && lockEnabled && (
        <TouchableOpacity
          onPress={() => void handleTest()}
          disabled={isTesting}
          accessibilityLabel="Test biometric authentication"
          style={{
            backgroundColor: palette.surface,
            borderRadius: 10,
            padding: 16,
            alignItems: 'center',
            borderWidth: 1,
            borderColor: palette.line,
          }}
        >
          <Text
            style={{
              fontFamily: UIFontFamily,
              fontSize: 16,
              color: isTesting ? palette.inkDim : palette.clay,
              fontWeight: '500',
            }}
          >
            {isTesting ? 'Testing...' : 'Test biometric unlock'}
          </Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}
