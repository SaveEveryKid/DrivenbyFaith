import React from 'react';
import { View } from 'react-native';
import { EmptyState } from '@/components/EmptyState';

export default function PrayerScreen(): React.ReactElement {
  return (
    <View style={{ flex: 1, backgroundColor: '#FDFBF7' }}>
      <EmptyState
        icon="🙏"
        title="Prayer Community"
        subtitle="Share prayer requests and pray for others. Coming soon."
      />
    </View>
  );
}
