import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { PrimaryButton } from './PrimaryButton';

interface PaywallProps {
  feature: string;
  onSubscribe: () => void;
  onDismiss: () => void;
}

export function Paywall({ feature, onSubscribe, onDismiss }: PaywallProps): React.ReactElement {
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
      <Text style={{ fontSize: 48, marginBottom: 16 }}>🛡</Text>
      <Text
        style={{
          fontFamily: 'Inter, system-ui, sans-serif',
          fontSize: 20,
          fontWeight: '600',
          color: '#3C3C3C',
          textAlign: 'center',
          marginBottom: 8,
        }}
      >
        This is a Premium feature
      </Text>
      <Text
        style={{
          fontFamily: 'Inter, system-ui, sans-serif',
          fontSize: 15,
          color: '#9B9B9B',
          textAlign: 'center',
          lineHeight: 22,
          marginBottom: 24,
        }}
      >
        {feature} is available with a Premium subscription. Your support helps keep the app free for those who need it most.
      </Text>
      <PrimaryButton title="Subscribe" onPress={onSubscribe} />
      <TouchableOpacity onPress={onDismiss} style={{ marginTop: 16 }}>
        <Text
          style={{
            fontFamily: 'Inter, system-ui, sans-serif',
            fontSize: 14,
            color: '#6F6F6F',
          }}
        >
          Not now
        </Text>
      </TouchableOpacity>
    </View>
  );
}
