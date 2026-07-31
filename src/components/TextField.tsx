import React from 'react';
import { View, Text, TextInput, type TextInputProps } from 'react-native';

interface TextFieldProps extends TextInputProps {
  label?: string;
  error?: string;
}

export function TextField({ label, error, style, ...props }: TextFieldProps) {
  return (
    <View style={{ marginBottom: 16 }}>
      {label && (
        <Text
          style={{
            fontFamily: 'Inter, system-ui, sans-serif',
            fontSize: 13,
            fontWeight: '600',
            color: '#6F6F6F',
            marginBottom: 6,
          }}
        >
          {label}
        </Text>
      )}
      <TextInput
        placeholderTextColor="#9B9B9B"
        style={[
          {
            fontFamily: 'Inter, system-ui, sans-serif',
            fontSize: 16,
            color: '#3C3C3C',
            backgroundColor: '#FFFFFF',
            borderWidth: 1,
            borderColor: error ? '#C44E4E' : '#E0D1B8',
            borderRadius: 10,
            paddingHorizontal: 14,
            paddingVertical: 12,
            minHeight: 48,
          },
          style,
        ]}
        {...props}
      />
      {error && (
        <Text
          style={{
            fontFamily: 'Inter, system-ui, sans-serif',
            fontSize: 12,
            color: '#C44E4E',
            marginTop: 4,
          }}
        >
          {error}
        </Text>
      )}
    </View>
  );
}
