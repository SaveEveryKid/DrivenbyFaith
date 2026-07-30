import React from 'react';
import { View, Text } from 'react-native';
import { PrimaryButton } from '@/components/PrimaryButton';
import { router } from 'expo-router';

export default function LoginScreen(): React.ReactElement {
  return (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 32,
        backgroundColor: '#FDFBF7',
      }}
    >
      <Text style={{ fontSize: 48, marginBottom: 16 }}>✝</Text>
      <Text
        style={{
          fontFamily: 'Inter, system-ui, sans-serif',
          fontSize: 24,
          fontWeight: '700',
          color: '#3C3C3C',
          textAlign: 'center',
          marginBottom: 8,
        }}
      >
        Driven by Faith
      </Text>
      <Text
        style={{
          fontFamily: 'Inter, system-ui, sans-serif',
          fontSize: 15,
          color: '#9B9B9B',
          textAlign: 'center',
          marginBottom: 32,
          lineHeight: 22,
        }}
      >
        Scripture for the showroom floor
      </Text>
      <PrimaryButton
        title="Sign in with Email"
        onPress={() => router.push('/signup')}
      />
      <View style={{ height: 12 }} />
      <PrimaryButton
        title="Continue with Apple"
        variant="outline"
        onPress={() => {}}
      />
    </View>
  );
}
