import React from 'react';
import { View, Text, type ViewProps } from 'react-native';

interface EmptyStateProps extends ViewProps {
  icon?: string;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon, title, subtitle, action, style, ...props }: EmptyStateProps) {
  return (
    <View
      style={[
        {
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: 32,
          paddingVertical: 48,
        },
        style,
      ]}
      {...props}
    >
      {icon && <Text style={{ fontSize: 48, marginBottom: 16 }}>{icon}</Text>}
      <Text
        style={{
          fontFamily: 'Inter, system-ui, sans-serif',
          fontSize: 18,
          fontWeight: '600',
          color: '#3C3C3C',
          textAlign: 'center',
          marginBottom: 8,
        }}
      >
        {title}
      </Text>
      {subtitle && (
        <Text
          style={{
            fontFamily: 'Inter, system-ui, sans-serif',
            fontSize: 14,
            color: '#9B9B9B',
            textAlign: 'center',
            lineHeight: 20,
            marginBottom: 24,
          }}
        >
          {subtitle}
        </Text>
      )}
      {action}
    </View>
  );
}
