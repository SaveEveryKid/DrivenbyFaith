import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

interface SectionHeaderProps {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function SectionHeader({ title, actionLabel, onAction }: SectionHeaderProps) {
  return (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
      }}
    >
      <Text
        style={{
          fontFamily: 'Inter, system-ui, sans-serif',
          fontSize: 14,
          fontWeight: '600',
          color: '#6F6F6F',
          textTransform: 'uppercase',
          letterSpacing: 0.5,
        }}
      >
        {title}
      </Text>
      {actionLabel && onAction && (
        <TouchableOpacity onPress={onAction}>
          <Text
            style={{
              fontFamily: 'Inter, system-ui, sans-serif',
              fontSize: 14,
              color: '#9B7343',
            }}
          >
            {actionLabel}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
