import React from 'react';
import { View, Text } from 'react-native';

export function OfflineChip(): React.ReactElement {
  return (
    <View
      style={{
        backgroundColor: '#E6EBDF',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        alignSelf: 'flex-start',
      }}
    >
      <Text
        style={{
          fontFamily: 'Inter, system-ui, sans-serif',
          fontSize: 11,
          color: '#5F6E48',
        }}
      >
        Offline — saved on this device
      </Text>
    </View>
  );
}
