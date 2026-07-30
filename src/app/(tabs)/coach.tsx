import React from 'react';
import { View } from 'react-native';
import { EmptyState } from '@/components/EmptyState';

export default function CoachScreen(): React.ReactElement {
  return (
    <View style={{ flex: 1, backgroundColor: '#FDFBF7' }}>
      <EmptyState
        icon="💬"
        title="AI Coach"
        subtitle="Ask questions about faith and work. Get biblical guidance. Coming soon."
      />
    </View>
  );
}
