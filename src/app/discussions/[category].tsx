import React from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import {
  useDiscussionThreads,
  CATEGORIES,
} from '@/hooks/useDiscussions';
import { PrimaryButton } from '@/components/PrimaryButton';
import { EmptyState } from '@/components/EmptyState';
import { UIFontFamily } from '@/constants/theme';
import type { DiscussionThreadWithMeta } from '@/hooks/useDiscussions';

function formatRelativeDate(dateStr: string): string {
  const now = Date.now();
  const date = new Date(dateStr).getTime();
  const diffMs = now - date;
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 7) return `${diffDay}d ago`;
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

function ThreadCard({
  thread,
  onPress,
  palette,
}: {
  thread: DiscussionThreadWithMeta;
  onPress: () => void;
  palette: ReturnType<typeof useTheme>['palette'];
}): React.ReactElement {
  return (
    <TouchableOpacity
      onPress={onPress}
      accessibilityLabel={`Thread: ${thread.title}`}
      accessibilityRole="button"
      style={{
        backgroundColor: palette.surface,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: palette.line,
        padding: 16,
        marginHorizontal: 16,
        marginBottom: 10,
      }}
    >
      <Text
        style={{
          fontFamily: UIFontFamily,
          fontSize: 16,
          fontWeight: '600',
          color: palette.ink,
          marginBottom: 4,
        }}
        numberOfLines={1}
      >
        {thread.title}
      </Text>
      <Text
        style={{
          fontFamily: UIFontFamily,
          fontSize: 14,
          color: palette.muted,
          lineHeight: 20,
          marginBottom: 8,
        }}
        numberOfLines={2}
      >
        {thread.body}
      </Text>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text
            style={{
              fontFamily: UIFontFamily,
              fontSize: 12,
              color: palette.inkDim,
            }}
          >
            {thread.is_anonymous
              ? 'Anonymous'
              : thread.display_name ?? 'Member'}
          </Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <Text
            style={{
              fontFamily: UIFontFamily,
              fontSize: 12,
              color: palette.inkDim,
            }}
          >
            {thread.reply_count}{' '}
            {thread.reply_count === 1 ? 'reply' : 'replies'}
          </Text>
          <Text
            style={{
              fontFamily: UIFontFamily,
              fontSize: 12,
              color: palette.inkDim,
            }}
          >
            {formatRelativeDate(thread.created_at)}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function CategoryThreadsScreen(): React.ReactElement {
  const { category } = useLocalSearchParams<{ category: string }>();
  const { palette } = useTheme();
  const router = useRouter();
  const { threads, isLoading, refresh } = useDiscussionThreads(
    category ?? '',
  );

  const categoryInfo = CATEGORIES.find((c) => c.category === category);
  const categoryLabel = categoryInfo?.label ?? category ?? 'Discussions';

  return (
    <View style={{ flex: 1, backgroundColor: palette.bg }}>
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingHorizontal: 16,
          paddingTop: 8,
          paddingBottom: 12,
          borderBottomWidth: 1,
          borderBottomColor: palette.line,
        }}
      >
        <Text
          style={{
            fontFamily: UIFontFamily,
            fontSize: 20,
            fontWeight: '700',
            color: palette.ink,
          }}
        >
          {categoryLabel}
        </Text>
        <PrimaryButton
          title="New Thread"
          onPress={() =>
            router.push(`/discussions/${category}/new`)
          }
          accessibilityLabel="Create a new discussion thread"
        />
      </View>

      <FlatList
        data={threads}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ThreadCard
            thread={item}
            onPress={() =>
              router.push(`/discussions/thread/${item.id}`)
            }
            palette={palette}
          />
        )}
        contentContainerStyle={{ paddingTop: 12, paddingBottom: 24 }}
        ListEmptyComponent={
          <EmptyState
            icon="💬"
            title="No threads yet"
            subtitle="Start the first conversation in this category."
            action={
              <PrimaryButton
                title="Start a Thread"
                onPress={() =>
                  router.push(`/discussions/${category}/new`)
                }
                accessibilityLabel="Create a new thread"
              />
            }
          />
        }
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={refresh}
            tintColor={palette.clay}
          />
        }
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}
