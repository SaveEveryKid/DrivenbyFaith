import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { PrimaryButton } from './PrimaryButton';
import { UIFontFamily, ScriptureFontFamily } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';

interface PaywallProps {
  feature: string;
  onSubscribe?: () => void;
  onDismiss?: () => void;
}

export function Paywall({ feature, onSubscribe, onDismiss }: PaywallProps): React.ReactElement {
  const router = useRouter();
  const { palette } = useTheme();

  const handleSubscribe = (): void => {
    if (onSubscribe) {
      onSubscribe();
    } else {
      router.push('/paywall');
    }
  };

  const handleDismiss = (): void => {
    if (onDismiss) {
      onDismiss();
    } else if (router.canGoBack()) {
      router.back();
    }
  };

  return (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 32,
        backgroundColor: palette.bg,
      }}
    >
      <Text style={{ fontSize: 48, marginBottom: 16 }}>🛡</Text>
      <Text
        style={{
          fontFamily: UIFontFamily,
          fontSize: 20,
          fontWeight: '600',
          color: palette.ink,
          textAlign: 'center',
          marginBottom: 8,
        }}
      >
        This is a Premium feature
      </Text>
      <Text
        style={{
          fontFamily: UIFontFamily,
          fontSize: 15,
          color: palette.muted,
          textAlign: 'center',
          lineHeight: 22,
          marginBottom: 8,
        }}
      >
        {feature} is available with a Premium subscription.
      </Text>
      <Text
        style={{
          fontFamily: ScriptureFontFamily,
          fontSize: 14,
          color: palette.inkDim,
          textAlign: 'center',
          lineHeight: 20,
          marginBottom: 24,
          fontStyle: 'italic',
        }}
      >
        Feed the work that feeds your soul.
        Your support keeps the daily devotional free for those who need it most.
      </Text>
      <PrimaryButton
        title="See plans"
        onPress={handleSubscribe}
        accessibilityLabel="See premium subscription plans"
      />
      <TouchableOpacity
        onPress={handleDismiss}
        style={{ marginTop: 16 }}
        accessibilityLabel="Dismiss premium prompt"
      >
        <Text
          style={{
            fontFamily: UIFontFamily,
            fontSize: 14,
            color: palette.muted,
          }}
        >
          Not now
        </Text>
      </TouchableOpacity>
    </View>
  );
}
