import React from 'react';
import { View } from 'react-native';
import { EmptyState } from '@/components/EmptyState';
import { useTheme } from '@/hooks/useTheme';

export default function PrayerScreen(): React.ReactElement {
  const { palette } = useTheme();

  return (
    <View style={{ flex: 1, backgroundColor: palette.bg }}>
      <EmptyState
        icon="🙏"
        title="Prayer Community"
        subtitle="Share prayer requests and pray for others. Coming soon."
      />
    </View>
  );
}
