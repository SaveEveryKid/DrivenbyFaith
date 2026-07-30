import React from 'react';
import { View } from 'react-native';
import { EmptyState } from '@/components/EmptyState';
import { useTheme } from '@/hooks/useTheme';

export default function CoachScreen(): React.ReactElement {
  const { palette } = useTheme();

  return (
    <View style={{ flex: 1, backgroundColor: palette.bg }}>
      <EmptyState
        icon="💬"
        title="AI Coach"
        subtitle="Ask questions about faith and work. Get biblical guidance. Coming soon."
      />
    </View>
  );
}
