import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useThemeStore, type ThemeMode } from '@/stores/themeStore';
import type { TextSizeLevel } from '@/constants/theme';
import { UIFontFamily } from '@/constants/theme';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/useTheme';

const MODE_OPTIONS: { label: string; value: ThemeMode }[] = [
  { label: 'Light', value: 'light' },
  { label: 'Dark', value: 'dark' },
  { label: 'System', value: 'system' },
];

const SIZE_OPTIONS: { label: string; value: TextSizeLevel }[] = [
  { label: 'Small', value: 'small' },
  { label: 'Default', value: 'base' },
  { label: 'Large', value: 'large' },
  { label: 'Extra Large', value: 'xlarge' },
];

export default function SettingsScreen(): React.ReactElement {
  const { explicitTheme, textSize, setExplicitTheme, setTextSize } = useThemeStore();
  const { signOut, deleteAccount, profile } = useAuth();
  const { palette } = useTheme();
  const router = useRouter();
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
      style={{ flex: 1, backgroundColor: palette.bg }}
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
              backgroundColor: palette.clay,
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 12,
            }}
          >
            <Text
              style={{
                fontFamily: UIFontFamily,
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
              fontFamily: UIFontFamily,
              fontSize: 18,
              fontWeight: '600',
              color: palette.ink,
              marginBottom: 4,
            }}
          >
            {profile.display_name ?? 'User'}
          </Text>
          <Text
            style={{
              fontFamily: UIFontFamily,
              fontSize: 14,
              color: palette.muted,
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
          fontFamily: UIFontFamily,
          fontSize: 14,
          fontWeight: '600',
          color: palette.muted,
          textTransform: 'uppercase',
          letterSpacing: 0.5,
          marginBottom: 12,
        }}
      >
        Appearance
      </Text>

      <View
        style={{
          backgroundColor: palette.surface,
          borderRadius: 10,
          overflow: 'hidden',
          marginBottom: 24,
        }}
      >
        {MODE_OPTIONS.map((opt, i) => (
          <TouchableOpacity
            key={opt.value}
            onPress={() => setExplicitTheme(opt.value)}
            accessibilityLabel={opt.label}
            accessibilityState={{ selected: explicitTheme === opt.value }}
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingHorizontal: 16,
              paddingVertical: 14,
              borderBottomWidth: i < MODE_OPTIONS.length - 1 ? 1 : 0,
              borderBottomColor: palette.line,
            }}
          >
            <Text
              style={{
                fontFamily: UIFontFamily,
                fontSize: 16,
                color: palette.ink,
              }}
            >
              {opt.label}
            </Text>
            {explicitTheme === opt.value && (
              <Text style={{ color: palette.clay, fontSize: 18 }}>✓</Text>
            )}
          </TouchableOpacity>
        ))}
      </View>

      {/* Text size section */}
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
        Text Size
      </Text>

      <View
        style={{
          backgroundColor: palette.surface,
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
              borderBottomColor: palette.line,
            }}
          >
            <Text
              style={{
                fontFamily: UIFontFamily,
                fontSize: 16,
                color: palette.ink,
              }}
            >
              {opt.label}
            </Text>
            {textSize === opt.value && (
              <Text style={{ color: palette.clay, fontSize: 18 }}>✓</Text>
            )}
          </TouchableOpacity>
        ))}
      </View>

      {/* Preferences section */}
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
        Preferences
      </Text>

      <View
        style={{
          backgroundColor: palette.surface,
          borderRadius: 10,
          overflow: 'hidden',
          marginBottom: 24,
        }}
      >
        <TouchableOpacity
          onPress={() => router.push('/settings/notifications')}
          accessibilityLabel="Notification settings"
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingHorizontal: 16,
            paddingVertical: 14,
            borderBottomWidth: 1,
            borderBottomColor: palette.line,
          }}
        >
          <Text
            style={{
              fontFamily: UIFontFamily,
              fontSize: 16,
              color: palette.ink,
            }}
          >
            Notifications
          </Text>
          <Text style={{ color: palette.inkDim, fontSize: 18 }}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.push('/settings/security')}
          accessibilityLabel="Security settings"
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingHorizontal: 16,
            paddingVertical: 14,
          }}
        >
          <Text
            style={{
              fontFamily: UIFontFamily,
              fontSize: 16,
              color: palette.ink,
            }}
          >
            Security
          </Text>
          <Text style={{ color: palette.inkDim, fontSize: 18 }}>›</Text>
        </TouchableOpacity>
      </View>

      {/* Account section */}
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
        Account
      </Text>

      <View
        style={{
          backgroundColor: palette.surface,
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
            borderBottomColor: palette.line,
          }}
        >
          <Text
            style={{
              fontFamily: UIFontFamily,
              fontSize: 16,
              color: palette.ink,
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
              fontFamily: UIFontFamily,
              fontSize: 16,
              color: palette.clay,
            }}
          >
            {isDeleting ? 'Deleting...' : 'Delete Account'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* App info */}
      <Text
        style={{
          fontFamily: UIFontFamily,
          fontSize: 13,
          color: palette.inkDim,
          textAlign: 'center',
          marginTop: 16,
        }}
      >
        Driven by Faith v1.0.0
      </Text>
    </ScrollView>
  );
}
