import React from 'react';
import { View, Text } from 'react-native';

interface ScriptureBlockProps {
  reference: string;
  text: string;
  translation?: string;
}

export function ScriptureBlock({ reference, text, translation = 'ESV' }: ScriptureBlockProps) {
  return (
    <View style={{ paddingVertical: 16, paddingHorizontal: 8 }}>
      <Text
        style={{
          fontFamily: 'Georgia, serif',
          fontSize: 18,
          lineHeight: 28,
          color: '#3C3C3C',
          marginBottom: 12,
        }}
      >
        {text}
      </Text>
      <Text
        style={{
          fontFamily: 'Inter, system-ui, sans-serif',
          fontSize: 13,
          color: '#9B9B9B',
          textTransform: 'uppercase',
          letterSpacing: 1,
        }}
      >
        {reference} ({translation})
      </Text>
    </View>
  );
}
