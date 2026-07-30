import React from 'react';
import { View } from 'react-native';
import { EmptyState } from '@/components/EmptyState';
import { useTheme } from '@/hooks/useTheme';

export default function ProgressScreen(): React.ReactElement {
  const { palette } = useTheme();

  return (
    <View style={{ flex: 1, backgroundColor: palette.bg }}>
      <EmptyState
        icon="📊"
        title="Your Progress"
        subtitle="Track streaks, completions, and growth. Coming soon."
      />
    </View>
  );
}
