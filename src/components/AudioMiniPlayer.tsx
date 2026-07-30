import React from 'react';
import { View, Text } from 'react-native';

export function AudioMiniPlayer(): React.ReactElement {
  return (
    <View
      style={{
        backgroundColor: '#FFFFFF',
        borderTopWidth: 1,
        borderTopColor: '#E0D1B8',
        paddingHorizontal: 16,
        paddingVertical: 10,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      <View style={{ flex: 1 }}>
        <Text
          style={{
            fontFamily: 'Inter, system-ui, sans-serif',
            fontSize: 13,
            fontWeight: '600',
            color: '#3C3C3C',
          }}
          numberOfLines={1}
        >
          Audio player placeholder
        </Text>
        <Text
          style={{
            fontFamily: 'Inter, system-ui, sans-serif',
            fontSize: 11,
            color: '#9B9B9B',
          }}
        >
          Tap to expand
        </Text>
      </View>
    </View>
  );
}
