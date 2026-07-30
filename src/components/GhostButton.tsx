import React from 'react';
import { TouchableOpacity, Text, type TouchableOpacityProps } from 'react-native';

interface GhostButtonProps extends TouchableOpacityProps {
  title: string;
}

export function GhostButton({ title, style, ...props }: GhostButtonProps) {
  return (
    <TouchableOpacity
      style={[
        {
          paddingVertical: 10,
          paddingHorizontal: 16,
          borderRadius: 8,
          borderWidth: 1,
          borderColor: 'transparent',
          alignItems: 'center',
          justifyContent: 'center',
        },
        style,
      ]}
      {...props}
    >
      <Text
        style={{
          fontFamily: 'Inter, system-ui, sans-serif',
          fontSize: 14,
          color: '#6F6F6F',
        }}
      >
        {title}
      </Text>
    </TouchableOpacity>
  );
}
