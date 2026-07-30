import React from 'react';
import { View } from 'react-native';
import { EmptyState } from '@/components/EmptyState';

export default function ProgressScreen(): React.ReactElement {
  return (
    <View style={{ flex: 1, backgroundColor: '#FDFBF7' }}>
      <EmptyState
        icon="📊"
        title="Your Progress"
        subtitle="Track streaks, completions, and growth. Coming soon."
      />
    </View>
  );
}
