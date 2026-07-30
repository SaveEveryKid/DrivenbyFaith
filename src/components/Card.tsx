import React from 'react';
import { View, Text, type ViewProps } from 'react-native';

interface CardProps extends ViewProps {
  variant?: 'default' | 'elevated' | 'pressable';
  children: React.ReactNode;
}

export function Card({ variant = 'default', children, style, ...props }: CardProps) {
  const shadowStyle =
    variant === 'elevated'
      ? {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.08,
          shadowRadius: 8,
          elevation: 3,
        }
      : {};

  return (
    <View
      style={[
        {
          backgroundColor: variant === 'elevated' ? '#FFFFFF' : '#F5F0E8',
          borderRadius: 12,
          padding: 16,
          borderWidth: variant === 'default' ? 1 : 0,
          borderColor: '#E0D1B8',
        },
        shadowStyle,
        style,
      ]}
      {...props}
    >
      {children}
    </View>
  );
}
