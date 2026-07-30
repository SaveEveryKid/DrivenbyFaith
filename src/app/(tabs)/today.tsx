import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { Card } from '@/components/Card';
import { ScriptureBlock } from '@/components/ScriptureBlock';
import { PrimaryButton } from '@/components/PrimaryButton';

export default function TodayScreen(): React.ReactElement {
  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: '#FDFBF7' }}
      contentContainerStyle={{ padding: 16 }}
    >
      <Text
        style={{
          fontFamily: 'Inter, system-ui, sans-serif',
          fontSize: 14,
          color: '#9B9B9B',
          marginBottom: 4,
        }}
      >
        Good morning
      </Text>
      <Text
        style={{
          fontFamily: 'Georgia, serif',
          fontSize: 24,
          fontWeight: '700',
          color: '#3C3C3C',
          marginBottom: 20,
        }}
      >
        Today's Devotional
      </Text>

      <Card variant="elevated">
        <Text
          style={{
            fontFamily: 'Georgia, serif',
            fontSize: 20,
            fontWeight: '600',
            color: '#3C3C3C',
            marginBottom: 12,
          }}
        >
          Placeholder Title
        </Text>
        <ScriptureBlock
          reference="John 15:4-5"
          text="Abide in me, and I in you..."
        />
        <Text
          style={{
            fontFamily: 'Inter, system-ui, sans-serif',
            fontSize: 15,
            color: '#6F6F6F',
            lineHeight: 22,
            marginBottom: 16,
          }}
        >
          Devotional content will load here after backend integration.
        </Text>
        <PrimaryButton title="Read Devotional" onPress={() => {}} />
      </Card>
    </ScrollView>
  );
}
