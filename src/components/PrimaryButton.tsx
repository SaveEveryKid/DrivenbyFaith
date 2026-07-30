import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, type TouchableOpacityProps } from 'react-native';

interface PrimaryButtonProps extends TouchableOpacityProps {
  title: string;
  loading?: boolean;
  variant?: 'solid' | 'outline';
}

export function PrimaryButton({
  title,
  loading = false,
  variant = 'solid',
  disabled,
  style,
  ...props
}: PrimaryButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      disabled={isDisabled}
      style={[
        {
          backgroundColor: variant === 'solid' ? '#9B7343' : 'transparent',
          borderWidth: variant === 'outline' ? 1.5 : 0,
          borderColor: '#9B7343',
          paddingVertical: 14,
          paddingHorizontal: 24,
          borderRadius: 10,
          alignItems: 'center',
          justifyContent: 'center',
          opacity: isDisabled ? 0.5 : 1,
          minHeight: 48,
        },
        style,
      ]}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'solid' ? '#FFFFFF' : '#9B7343'} />
      ) : (
        <Text
          style={{
            fontFamily: 'Inter, system-ui, sans-serif',
            fontSize: 16,
            fontWeight: '600',
            color: variant === 'solid' ? '#FFFFFF' : '#9B7343',
          }}
        >
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
}
