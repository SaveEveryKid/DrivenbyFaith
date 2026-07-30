import React, { useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { useRouter } from 'expo-router';
import { EmptyState } from '@/components/EmptyState';
import { Paywall } from '@/components/Paywall';
import { useTheme } from '@/hooks/useTheme';
import {
  useSituations,
  ALL_CATEGORIES,
  CATEGORY_LABELS,
} from '@/hooks/useSituations';
import type { SituationCategory } from '@/hooks/useSituations';
import { UIFontFamily } from '@/constants/theme';

// ─── Stub: useEntitlement ─────────────────────────────────────────────────────

function useEntitlement(): { isPremium: boolean } {
  // Stub until RevenueCat is wired. Returns free by default.
  return { isPremium: false };
}

export default function SituationIndexScreen(): React.ReactElement {
  const { palette, typography } = useTheme();
  const router = useRouter();
  const {
    situations,
    savedIds,
    isLoading,
    isError,
    searchQuery,
    setSearchQuery,
    activeCategory,
    setActiveCategory,
    toggleSave,
  } = useSituations();
  const { isPremium } = useEntitlement();

  const renderItem = useCallback(
    ({ item }: { item: (typeof situations)[number] }) => {
      const isSaved = savedIds.has(item.id);
      const isLocked = item.is_premium && !isPremium;

      return (
        <TouchableOpacity
          onPress={() => {
            if (isLocked) return; // Paywall blocks navigation
            router.push({
              pathname: '/situation/[slug]',
              params: { slug: item.slug },
            });
          }}
          accessibilityLabel={`${item.title}${isSaved ? ', saved' : ''}${isLocked ? ', premium' : ''}`}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: palette.surface,
            borderRadius: 8,
            padding: 14,
            marginBottom: 8,
            opacity: isLocked ? 0.6 : 1,
          }}
        >
          {/* Category badge */}
          <View
            style={{
              backgroundColor: palette.clay + '20',
              borderRadius: 4,
              paddingHorizontal: 8,
              paddingVertical: 3,
              marginRight: 12,
              minWidth: 70,
              alignItems: 'center',
            }}
          >
            <Text
              style={{
                fontFamily: UIFontFamily,
                fontSize: 10,
                fontWeight: '600',
                color: palette.clay,
                textTransform: 'uppercase',
                letterSpacing: 0.5,
              }}
            >
              {CATEGORY_LABELS[item.category as SituationCategory]}
            </Text>
          </View>

          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontFamily: UIFontFamily,
                fontSize: typography.ui.sizes.sm,
                fontWeight: '600',
                color: palette.ink,
                marginBottom: 2,
              }}
              numberOfLines={2}
            >
              {item.title}
            </Text>
            {isLocked && (
              <Text
                style={{
                  fontFamily: UIFontFamily,
                  fontSize: typography.ui.sizes.xs,
                  color: palette.muted,
                }}
              >
                Premium
              </Text>
            )}
          </View>

          {/* Save icon */}
          <TouchableOpacity
            onPress={(e) => {
              e.stopPropagation();
              toggleSave(item.id);
            }}
            accessibilityLabel={isSaved ? 'Unsave' : 'Save'}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={{ padding: 4, marginLeft: 8 }}
          >
            <Text style={{ fontSize: 20 }}>{isSaved ? '♥' : '♡'}</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      );
    },
    [savedIds, isPremium, palette, typography, router, toggleSave],
  );

  return (
    <View style={{ flex: 1, backgroundColor: palette.bg }}>
      {/* Header */}
      <View style={{ paddingHorizontal: 24, paddingTop: 16, paddingBottom: 8 }}>
        <Text
          style={{
            fontFamily: typography.scripture.fontFamily,
            fontSize: typography.ui.sizes['2xl'],
            fontWeight: '600',
            color: palette.ink,
            marginBottom: 12,
          }}
        >
          Situation Library
        </Text>

        {/* Search */}
        <TextInput
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search situations..."
          placeholderTextColor={palette.inkDim}
          accessibilityLabel="Search situations"
          style={{
            fontFamily: UIFontFamily,
            fontSize: typography.ui.sizes.sm,
            color: palette.ink,
            backgroundColor: palette.surface,
            borderRadius: 8,
            padding: 12,
            borderWidth: 1,
            borderColor: palette.line,
            marginBottom: 12,
          }}
        />

        {/* Category filter chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8, paddingBottom: 8 }}
        >
          <TouchableOpacity
            onPress={() => setActiveCategory(null)}
            accessibilityLabel="All categories"
            accessibilityState={{ selected: activeCategory === null }}
            style={{
              paddingHorizontal: 14,
              paddingVertical: 6,
              borderRadius: 16,
              backgroundColor: activeCategory === null ? palette.clay : palette.surface,
              borderWidth: 1,
              borderColor: activeCategory === null ? palette.clay : palette.line,
            }}
          >
            <Text
              style={{
                fontFamily: UIFontFamily,
                fontSize: 13,
                fontWeight: '600',
                color: activeCategory === null ? '#FFFFFF' : palette.muted,
              }}
            >
              All
            </Text>
          </TouchableOpacity>

          {ALL_CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat}
              onPress={() => setActiveCategory(cat)}
              accessibilityLabel={CATEGORY_LABELS[cat]}
              accessibilityState={{ selected: activeCategory === cat }}
              style={{
                paddingHorizontal: 14,
                paddingVertical: 6,
                borderRadius: 16,
                backgroundColor: activeCategory === cat ? palette.clay : palette.surface,
                borderWidth: 1,
                borderColor: activeCategory === cat ? palette.clay : palette.line,
              }}
            >
              <Text
                style={{
                  fontFamily: UIFontFamily,
                  fontSize: 13,
                  fontWeight: '600',
                  color: activeCategory === cat ? '#FFFFFF' : palette.muted,
                }}
              >
                {CATEGORY_LABELS[cat]}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Content */}
      {isLoading && (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={palette.clay} size="small" />
        </View>
      )}

      {isError && (
        <EmptyState
          icon="⚠"
          title="Could not load situations"
          subtitle="Check your connection and try again."
        />
      )}

      {!isLoading && !isError && situations.length === 0 && (
        <EmptyState
          icon="📖"
          title={searchQuery.trim() ? 'No results' : 'No situations found'}
          subtitle={
            searchQuery.trim()
              ? 'Try a different search term.'
              : 'The situation library is being prepared.'
          }
        />
      )}

      {!isLoading && !isError && situations.length > 0 && (
        <FlatList
          data={situations}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 100 }}
        />
      )}
    </View>
  );
}
