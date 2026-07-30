import React from 'react';
import { View } from 'react-native';
import { EmptyState } from '@/components/EmptyState';

export default function LibraryScreen(): React.ReactElement {
  return (
    <View style={{ flex: 1, backgroundColor: '#FDFBF7' }}>
      <EmptyState
        icon="📚"
        title="Devotional Library"
        subtitle="Browse past devotionals and reading plans. Coming soon."
      />
    </View>
  );
}
