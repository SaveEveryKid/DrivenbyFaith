import React from 'react';
import { View, Text } from 'react-native';
import { PrimaryButton } from '@/components/PrimaryButton';

export default function SignupScreen(): React.ReactElement {
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
      <Text
        style={{
          fontFamily: 'Inter, system-ui, sans-serif',
          fontSize: 20,
          fontWeight: '600',
          color: '#3C3C3C',
          textAlign: 'center',
          marginBottom: 24,
        }}
      >
        Sign Up placeholder
      </Text>
      <PrimaryButton title="Back to Login" onPress={() => {}} />
    </View>
  );
}
