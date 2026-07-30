import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ScriptureBlock } from '@/components/ScriptureBlock';
import { PrimaryButton } from '@/components/PrimaryButton';
import { EmptyState } from '@/components/EmptyState';
import { Paywall } from '@/components/Paywall';
import { useTheme } from '@/hooks/useTheme';
import { useSituationDetail, CATEGORY_LABELS } from '@/hooks/useSituations';
import type { SituationCategory } from '@/hooks/useSituations';
import type { ScriptureRef } from '@/types/database';
import { UIFontFamily, ScriptureFontFamily } from '@/constants/theme';

// ─── Stub: useEntitlement ─────────────────────────────────────────────────────

function useEntitlement(): { isPremium: boolean } {
  return { isPremium: false };
}

export default function SituationDetailScreen(): React.ReactElement {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { palette, typography } = useTheme();
  const router = useRouter();
  const { situation, isLoading, isError, isSaved, toggleSave, isToggling } =
    useSituationDetail(slug ?? '');
  const { isPremium } = useEntitlement();

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: palette.bg, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={palette.clay} size="small" />
      </View>
    );
  }

  if (isError || !situation) {
    return (
      <View style={{ flex: 1, backgroundColor: palette.bg }}>
        <EmptyState
          icon="⚠"
          title="Situation not found"
          subtitle="This situation may have moved or there was a problem loading it."
          action={
            <PrimaryButton title="Go back" onPress={() => router.back()} />
          }
        />
      </View>
    );
  }

  // Premium gating: free users can only read 40 full situations,
  // but the locked logic only applies to is_premium=true items
  if (situation.is_premium && !isPremium) {
    return (
      <Paywall
        feature="This situation"
        onSubscribe={() => {
          Alert.alert('Subscribe', 'Subscription will be available when RevenueCat is configured.');
        }}
        onDismiss={() => router.back()}
      />
    );
  }

  const categoryLabel = CATEGORY_LABELS[situation.category as SituationCategory];

  const verseFontSize = typography.scripture.sizes.base;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: palette.bg }}
      contentContainerStyle={{ padding: 24, paddingBottom: 48 }}
    >
      {/* Header row */}
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: 16,
        }}
      >
        <View
          style={{
            backgroundColor: palette.clay + '20',
            borderRadius: 4,
            paddingHorizontal: 10,
            paddingVertical: 4,
          }}
        >
          <Text
            style={{
              fontFamily: UIFontFamily,
              fontSize: 11,
              fontWeight: '600',
              color: palette.clay,
              textTransform: 'uppercase',
              letterSpacing: 0.5,
            }}
          >
            {categoryLabel}
          </Text>
        </View>

        <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
          {/* Save toggle */}
          <TouchableOpacity
            onPress={() => toggleSave()}
            disabled={isToggling}
            accessibilityLabel={isSaved ? 'Unsave this situation' : 'Save this situation'}
          >
            <Text style={{ fontSize: 24, color: palette.clay }}>
              {isSaved ? '♥' : '♡'}
            </Text>
          </TouchableOpacity>

          {/* Ask Coach */}
          <TouchableOpacity
            onPress={() => {
              router.push({
                pathname: '/(tabs)/coach',
                params: { context: situation.slug },
              } as never);
            }}
            accessibilityLabel="Ask Coach about this situation"
          >
            <Text
              style={{
                fontFamily: UIFontFamily,
                fontSize: 13,
                fontWeight: '600',
                color: palette.sage,
              }}
            >
              Ask Coach
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Title */}
      <Text
        style={{
          fontFamily: typography.scripture.fontFamily,
          fontSize: typography.ui.sizes['2xl'],
          fontWeight: '600',
          color: palette.ink,
          marginBottom: 24,
          lineHeight: typography.ui.sizes['2xl'] * 1.3,
        }}
      >
        {situation.title}
      </Text>

      {/* Situation body */}
      <Text
        style={{
          fontFamily: UIFontFamily,
          fontSize: typography.ui.sizes.base,
          color: palette.ink,
          lineHeight: 22,
          marginBottom: 32,
        }}
      >
        {situation.situation_body}
      </Text>

      {/* Biblical principle */}
      <View
        style={{
          backgroundColor: palette.surface,
          borderRadius: 10,
          padding: 20,
          marginBottom: 24,
        }}
      >
        <Text
          style={{
            fontFamily: UIFontFamily,
            fontSize: typography.ui.sizes.sm,
            fontWeight: '600',
            color: palette.muted,
            textTransform: 'uppercase',
            letterSpacing: 0.5,
            marginBottom: 12,
          }}
        >
          Biblical Principle
        </Text>
        <Text
          style={{
            fontFamily: ScriptureFontFamily,
            fontSize: verseFontSize,
            color: palette.scripture,
            lineHeight: verseFontSize * typography.scripture.lineHeight,
          }}
        >
          {situation.biblical_principle}
        </Text>
      </View>

      {/* Scripture references */}
      {situation.scripture_refs && Array.isArray(situation.scripture_refs) && situation.scripture_refs.length > 0 && (
        <View style={{ marginBottom: 24 }}>
          {(situation.scripture_refs as unknown as ScriptureRef[]).map(
            (ref, idx) => (
              <ScriptureBlock
                key={idx}
                reference={ref.reference}
                text={ref.text}
              />
            ),
          )}
        </View>
      )}

      {/* Practical response */}
      <View
        style={{
          backgroundColor: palette.surface,
          borderRadius: 10,
          padding: 20,
          marginBottom: 24,
        }}
      >
        <Text
          style={{
            fontFamily: UIFontFamily,
            fontSize: typography.ui.sizes.sm,
            fontWeight: '600',
            color: palette.muted,
            textTransform: 'uppercase',
            letterSpacing: 0.5,
            marginBottom: 12,
          }}
        >
          What To Actually Do
        </Text>
        <Text
          style={{
            fontFamily: UIFontFamily,
            fontSize: typography.ui.sizes.base,
            color: palette.ink,
            lineHeight: 22,
          }}
        >
          {situation.practical_response}
        </Text>
      </View>

      {/* Prayer */}
      <View
        style={{
          backgroundColor: palette.surface,
          borderRadius: 10,
          padding: 20,
          marginBottom: 24,
        }}
      >
        <Text
          style={{
            fontFamily: UIFontFamily,
            fontSize: typography.ui.sizes.sm,
            fontWeight: '600',
            color: palette.muted,
            textTransform: 'uppercase',
            letterSpacing: 0.5,
            marginBottom: 12,
          }}
        >
          Prayer
        </Text>
        <Text
          style={{
            fontFamily: ScriptureFontFamily,
            fontSize: typography.scripture.sizes.small,
            color: palette.scripture,
            lineHeight:
              typography.scripture.sizes.small * typography.scripture.lineHeight,
            fontStyle: 'italic',
          }}
        >
          {situation.prayer}
        </Text>
      </View>

      {/* Reflection question */}
      <View
        style={{
          backgroundColor: palette.surface,
          borderRadius: 10,
          padding: 20,
          marginBottom: 32,
        }}
      >
        <Text
          style={{
            fontFamily: UIFontFamily,
            fontSize: typography.ui.sizes.sm,
            fontWeight: '600',
            color: palette.muted,
            textTransform: 'uppercase',
            letterSpacing: 0.5,
            marginBottom: 12,
          }}
        >
          Reflection
        </Text>
        <Text
          style={{
            fontFamily: UIFontFamily,
            fontSize: typography.ui.sizes.base,
            color: palette.ink,
            lineHeight: 22,
            fontStyle: 'italic',
          }}
        >
          {situation.reflection_question}
        </Text>
      </View>

      {/* Share stub */}
      <TouchableOpacity
        onPress={() => {
          Alert.alert('Share', 'Sharing will be available in a future update.');
        }}
        accessibilityLabel="Share this situation"
        style={{
          alignItems: 'center',
          paddingVertical: 12,
        }}
      >
        <Text
          style={{
            fontFamily: UIFontFamily,
            fontSize: 14,
            color: palette.muted,
          }}
        >
          Share
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
