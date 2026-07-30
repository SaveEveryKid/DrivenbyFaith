import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useThemeStore } from '@/stores/themeStore';
import type { ThemeMode, TextSize } from '@/stores/themeStore';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/useTheme';

const MODE_OPTIONS: { label: string; value: ThemeMode }[] = [
  { label: 'Light', value: 'light' },
  { label: 'Dark', value: 'dark' },
  { label: 'System', value: 'system' },
];

const SIZE_OPTIONS: { label: string; value: TextSize }[] = [
  { label: 'Small', value: 'small' },
  { label: 'Default', value: 'base' },
  { label: 'Large', value: 'large' },
];

export default function SettingsScreen(): React.ReactElement {
  const { mode, textSize, setMode, setTextSize } = useThemeStore();
  const { signOut, deleteAccount, profile } = useAuth();
  const { colors } = useTheme();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleSignOut = (): void => {
    Alert.alert('Sign out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign out',
        style: 'destructive',
        onPress: async () => {
          setIsSigningOut(true);
          await signOut();
        },
      },
    ]);
  };

  const handleDeleteAccount = (): void => {
    Alert.alert(
      'Delete account',
      'This will permanently delete your account and all your data. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setIsDeleting(true);
            await deleteAccount();
          },
        },
      ],
    );
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ padding: 24, paddingBottom: 48 }}
    >
      {/* Profile info */}
      {profile && (
        <View style={{ marginBottom: 24, alignItems: 'center' }}>
          <View
            style={{
              width: 64,
              height: 64,
              borderRadius: 32,
              backgroundColor: colors.accent,
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 12,
            }}
          >
            <Text
              style={{
                fontFamily: 'Inter, system-ui, sans-serif',
                fontSize: 24,
                fontWeight: '700',
                color: '#FFFFFF',
              }}
            >
              {(profile.display_name ?? 'U').charAt(0).toUpperCase()}
            </Text>
          </View>
          <Text
            style={{
              fontFamily: 'Inter, system-ui, sans-serif',
              fontSize: 18,
              fontWeight: '600',
              color: colors.text,
              marginBottom: 4,
            }}
          >
            {profile.display_name ?? 'User'}
          </Text>
          <Text
            style={{
              fontFamily: 'Inter, system-ui, sans-serif',
              fontSize: 14,
              color: colors.textSecondary,
            }}
          >
            {profile.dealership && profile.brand
              ? `${profile.dealership} · ${profile.brand}`
              : profile.dealership || profile.brand || ''}
          </Text>
        </View>
      )}

      {/* Appearance section */}
      <Text
        style={{
          fontFamily: 'Inter, system-ui, sans-serif',
          fontSize: 14,
          fontWeight: '600',
          color: colors.textSecondary,
          textTransform: 'uppercase',
          letterSpacing: 0.5,
          marginBottom: 12,
        }}
      >
        Appearance
      </Text>

      <View
        style={{
          backgroundColor: colors.surfaceElevated,
          borderRadius: 10,
          overflow: 'hidden',
          marginBottom: 24,
        }}
      >
        {MODE_OPTIONS.map((opt, i) => (
          <TouchableOpacity
            key={opt.value}
            onPress={() => setMode(opt.value)}
            accessibilityLabel={opt.label}
            accessibilityState={{ selected: mode === opt.value }}
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingHorizontal: 16,
              paddingVertical: 14,
              borderBottomWidth: i < MODE_OPTIONS.length - 1 ? 1 : 0,
              borderBottomColor: colors.border,
            }}
          >
            <Text
              style={{
                fontFamily: 'Inter, system-ui, sans-serif',
                fontSize: 16,
                color: colors.text,
              }}
            >
              {opt.label}
            </Text>
            {mode === opt.value && (
              <Text style={{ color: colors.accent, fontSize: 18 }}>✓</Text>
            )}
          </TouchableOpacity>
        ))}
      </View>

      {/* Text size section */}
      <Text
        style={{
          fontFamily: 'Inter, system-ui, sans-serif',
          fontSize: 14,
          fontWeight: '600',
          color: colors.textSecondary,
          textTransform: 'uppercase',
          letterSpacing: 0.5,
          marginBottom: 12,
        }}
      >
        Text Size
      </Text>

      <View
        style={{
          backgroundColor: colors.surfaceElevated,
          borderRadius: 10,
          overflow: 'hidden',
          marginBottom: 24,
        }}
      >
        {SIZE_OPTIONS.map((opt, i) => (
          <TouchableOpacity
            key={opt.value}
            onPress={() => setTextSize(opt.value)}
            accessibilityLabel={opt.label}
            accessibilityState={{ selected: textSize === opt.value }}
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingHorizontal: 16,
              paddingVertical: 14,
              borderBottomWidth: i < SIZE_OPTIONS.length - 1 ? 1 : 0,
              borderBottomColor: colors.border,
            }}
          >
            <Text
              style={{
                fontFamily: 'Inter, system-ui, sans-serif',
                fontSize: 16,
                color: colors.text,
              }}
            >
              {opt.label}
            </Text>
            {textSize === opt.value && (
              <Text style={{ color: colors.accent, fontSize: 18 }}>✓</Text>
            )}
          </TouchableOpacity>
        ))}
      </View>

      {/* Account section */}
      <Text
        style={{
          fontFamily: 'Inter, system-ui, sans-serif',
          fontSize: 14,
          fontWeight: '600',
          color: colors.textSecondary,
          textTransform: 'uppercase',
          letterSpacing: 0.5,
          marginBottom: 12,
        }}
      >
        Account
      </Text>

      <View
        style={{
          backgroundColor: colors.surfaceElevated,
          borderRadius: 10,
          overflow: 'hidden',
          marginBottom: 24,
        }}
      >
        <TouchableOpacity
          onPress={handleSignOut}
          disabled={isSigningOut}
          accessibilityLabel="Sign out"
          style={{
            paddingHorizontal: 16,
            paddingVertical: 14,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
          }}
        >
          <Text
            style={{
              fontFamily: 'Inter, system-ui, sans-serif',
              fontSize: 16,
              color: colors.text,
            }}
          >
            {isSigningOut ? 'Signing out...' : 'Sign Out'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleDeleteAccount}
          disabled={isDeleting}
          accessibilityLabel="Delete account"
          style={{
            paddingHorizontal: 16,
            paddingVertical: 14,
          }}
        >
          <Text
            style={{
              fontFamily: 'Inter, system-ui, sans-serif',
              fontSize: 16,
              color: colors.error,
            }}
          >
            {isDeleting ? 'Deleting...' : 'Delete Account'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* App info */}
      <Text
        style={{
          fontFamily: 'Inter, system-ui, sans-serif',
          fontSize: 13,
          color: colors.textMuted,
          textAlign: 'center',
          marginTop: 16,
        }}
      >
        Driven by Faith v1.0.0
      </Text>
    </ScrollView>
  );
}
