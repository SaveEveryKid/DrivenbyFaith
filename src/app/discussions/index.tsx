import React from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { useDiscussionCategories } from '@/hooks/useDiscussions';
import { UIFontFamily } from '@/constants/theme';
import type { CategoryInfo } from '@/hooks/useDiscussions';

const CATEGORY_ICONS: Record<string, string> = {
  floor_life: '🏢',
  integrity_questions: '⚖',
  family_schedule: '👨‍👩‍👧',
  leading_others: '💡',
  testimonies: '📖',
  prayer_for_industry: '🙏',
};

function CategoryCard({
  category,
  onPress,
  palette,
}: {
  category: CategoryInfo;
  onPress: () => void;
  palette: ReturnType<typeof useTheme>['palette'];
}): React.ReactElement {
  return (
    <TouchableOpacity
      onPress={onPress}
      accessibilityLabel={`${category.label} discussions`}
      accessibilityRole="button"
      style={{
        backgroundColor: palette.surface,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: palette.line,
        padding: 16,
        marginHorizontal: 16,
        marginBottom: 10,
        flexDirection: 'row',
        alignItems: 'center',
      }}
    >
      <Text style={{ fontSize: 32, marginRight: 14 }}>
        {CATEGORY_ICONS[category.category] ?? '💬'}
      </Text>
      <View style={{ flex: 1 }}>
        <Text
          style={{
            fontFamily: UIFontFamily,
            fontSize: 16,
            fontWeight: '600',
            color: palette.ink,
            marginBottom: 2,
          }}
        >
          {category.label}
        </Text>
        <Text
          style={{
            fontFamily: UIFontFamily,
            fontSize: 13,
            color: palette.muted,
            lineHeight: 18,
            marginBottom: 4,
          }}
          numberOfLines={2}
        >
          {category.description}
        </Text>
        <Text
          style={{
            fontFamily: UIFontFamily,
            fontSize: 12,
            color: palette.inkDim,
          }}
        >
          {category.thread_count}{' '}
          {category.thread_count === 1 ? 'thread' : 'threads'}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

export default function DiscussionsIndexScreen(): React.ReactElement {
  const { palette } = useTheme();
  const router = useRouter();
  const { categories, isLoading } = useDiscussionCategories();

  if (isLoading) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: palette.bg,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <ActivityIndicator color={palette.clay} size="small" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: palette.bg }}>
      <View style={{ paddingHorizontal: 16, paddingTop: 60, paddingBottom: 12 }}>
        <Text
          style={{
            fontFamily: UIFontFamily,
            fontSize: 28,
            fontWeight: '700',
            color: palette.ink,
            marginBottom: 4,
          }}
        >
          Discussions
        </Text>
        <Text
          style={{
            fontFamily: UIFontFamily,
            fontSize: 14,
            color: palette.muted,
            lineHeight: 20,
          }}
        >
          Honest conversation for men and women on the floor.
        </Text>
      </View>

      <FlatList
        data={categories}
        keyExtractor={(item) => item.category}
        renderItem={({ item }) => (
          <CategoryCard
            category={item}
            onPress={() =>
              router.push(`/discussions/${item.category}`)
            }
            palette={palette}
          />
        )}
        contentContainerStyle={{ paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}
