import React, { useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { EmptyState } from '@/components/EmptyState';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import type { DevotionalRow, DevotionalCompletionRow } from '@/types/database';

// ─── Helpers ─────────────────────────────────────────────────────────────────

interface DevotionalWithCompletion {
  devotional: DevotionalRow;
  completion: DevotionalCompletionRow | null;
}

async function fetchPastDevotionals(userId: string): Promise<DevotionalWithCompletion[]> {
  const today = new Date().toISOString().slice(0, 10);

  const { data: devotionals, error: devError } = await supabase
    .from('devotionals')
    .select('*')
    .lte('publish_date', today)
    .order('publish_date', { ascending: false })
    .limit(90);

  if (devError) throw devError;
  if (!devotionals || devotionals.length === 0) return [];

  const devotionalIds = devotionals.map((d) => d.id);

  const { data: completions, error: compError } = await supabase
    .from('devotional_completions')
    .select('*')
    .eq('user_id', userId)
    .in('devotional_id', devotionalIds);

  if (compError) throw compError;

  const completionMap = new Map<string, DevotionalCompletionRow>();
  (completions ?? []).forEach((c) => {
    completionMap.set(c.devotional_id, c);
  });

  return devotionals.map((d) => ({
    devotional: d,
    completion: completionMap.get(d.id) ?? null,
  }));
}

// ─── List Item ───────────────────────────────────────────────────────────────

function DevotionalListItem({
  item,
  onPress,
}: {
  item: DevotionalWithCompletion;
  onPress: () => void;
}): React.ReactElement {
  const { palette, typography } = useTheme();

  const publishDate = new Date(item.devotional.publish_date);
  const formattedDate = publishDate.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });

  const isCompleted = !!item.completion;

  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: palette.line,
        backgroundColor: palette.bg,
      }}
      accessibilityLabel={`${item.devotional.title}, ${formattedDate}${isCompleted ? ', completed' : ''}`}
    >
      {/* Date */}
      <View
        style={{
          width: 56,
          alignItems: 'flex-start',
        }}
      >
        <Text
          style={{
            fontFamily: typography.ui.fontFamily,
            fontSize: typography.ui.sizes.sm,
            color: palette.inkDim,
            textTransform: 'uppercase',
            letterSpacing: 0.3,
          }}
        >
          {formattedDate}
        </Text>
      </View>

      {/* Title */}
      <View style={{ flex: 1, marginRight: 12 }}>
        <Text
          style={{
            fontFamily: typography.scripture.fontFamily,
            fontSize: typography.ui.sizes.base,
            fontWeight: '500',
            color: palette.ink,
            lineHeight: 22,
          }}
          numberOfLines={2}
        >
          {item.devotional.title}
        </Text>
        <Text
          style={{
            fontFamily: typography.ui.fontFamily,
            fontSize: typography.ui.sizes.xs,
            color: palette.inkDim,
            marginTop: 2,
          }}
        >
          {item.devotional.scripture_reference}
        </Text>
      </View>

      {/* Completed indicator */}
      {isCompleted && (
        <View
          style={{
            width: 24,
            height: 24,
            borderRadius: 12,
            backgroundColor: palette.sage,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{ color: '#FFFFFF', fontSize: 12, fontWeight: '700' }}>
            ✓
          </Text>
        </View>
      )}
      {!isCompleted && (
        <View style={{ width: 24 }} />
      )}
    </TouchableOpacity>
  );
}

// ─── Main Screen ─────────────────────────────────────────────────────────────

export default function LibraryScreen(): React.ReactElement {
  const { palette, typography } = useTheme();
  const { user } = useAuth();
  const router = useRouter();

  const {
    data: items,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['devotional', 'library', user?.id],
    queryFn: () => fetchPastDevotionals(user!.id),
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });

  const handlePress = (id: string): void => {
    router.push({
      pathname: '/devotional/[id]',
      params: { id },
    } as never);
  };

  // ── Loading state ────────────────────────────────────────────────────────

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

  // ── Error state ──────────────────────────────────────────────────────────

  if (isError) {
    return (
      <View style={{ flex: 1, backgroundColor: palette.bg }}>
        <EmptyState
          icon="⚠"
          title="Could not load library"
          subtitle={error?.message ?? 'Please check your connection and try again.'}
          action={
            <TouchableOpacity
              onPress={() => refetch()}
              style={{
                backgroundColor: palette.clay,
                paddingVertical: 12,
                paddingHorizontal: 24,
                borderRadius: 10,
              }}
            >
              <Text
                style={{
                  fontFamily: typography.ui.fontFamily,
                  fontSize: typography.ui.sizes.base,
                  fontWeight: '600',
                  color: '#FFFFFF',
                }}
              >
                Retry
              </Text>
            </TouchableOpacity>
          }
        />
      </View>
    );
  }

  // ── Empty state ──────────────────────────────────────────────────────────

  if (!items || items.length === 0) {
    return (
      <View style={{ flex: 1, backgroundColor: palette.bg }}>
        <EmptyState
          icon="📚"
          title="Devotional Library"
          subtitle="No devotionals yet. Check back soon."
        />
      </View>
    );
  }

  // ── List ─────────────────────────────────────────────────────────────────

  return (
    <View style={{ flex: 1, backgroundColor: palette.bg }}>
      {/* Header */}
      <View
        style={{
          paddingHorizontal: 16,
          paddingTop: 60,
          paddingBottom: 12,
          backgroundColor: palette.bg,
        }}
      >
        <Text
          style={{
            fontFamily: typography.ui.fontFamily,
            fontSize: typography.ui.sizes.sm,
            color: palette.inkDim,
            textTransform: 'uppercase',
            letterSpacing: 0.5,
          }}
        >
          Devotional Library
        </Text>
      </View>

      {/* List */}
      <FlatList
        data={items}
        keyExtractor={(item) => item.devotional.id}
        renderItem={({ item }) => (
          <DevotionalListItem
            item={item}
            onPress={() => handlePress(item.devotional.id)}
          />
        )}
        contentContainerStyle={{ paddingBottom: 32 }}
        accessibilityLabel="Devotional library list"
      />
    </View>
  );
}
