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
import { useReadingPlans } from '@/hooks/useReadingPlans';
import { EmptyState } from '@/components/EmptyState';
import { Paywall } from '@/components/Paywall';
import { useAuth } from '@/hooks/useAuth';
import type { ReadingPlanRow, ReadingPlanProgressRow } from '@/types/database';

export default function PlansListScreen(): React.ReactElement {
  const router = useRouter();
  const { palette, typography } = useTheme();
  const { profile } = useAuth();
  const { plans, progress, isLoading, isError, error } = useReadingPlans();

  const isPremium = profile?.subscription_tier === 'premium';

  const handlePlanPress = (plan: ReadingPlanRow): void => {
    router.push({ pathname: '/plans/[slug]', params: { slug: plan.slug } });
  };

  const renderPlanCard = ({
    item: plan,
  }: {
    item: ReadingPlanRow;
  }): React.ReactElement => {
    const planProgress: ReadingPlanProgressRow | null = progress[plan.id] ?? null;
    const completedCount: number = Array.isArray(planProgress?.days_completed)
      ? (planProgress.days_completed as number[]).length
      : 0;

    return (
      <TouchableOpacity
        onPress={() => handlePlanPress(plan)}
        accessibilityLabel={`${plan.title}, ${plan.day_count} days, ${plan.is_premium ? 'Premium' : 'Free'}`}
        style={{
          backgroundColor: palette.surface,
          borderRadius: 12,
          padding: 16,
          marginBottom: 12,
          borderWidth: 1,
          borderColor: palette.line,
        }}
      >
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: 6,
          }}
        >
          <Text
            style={{
              fontFamily: typography.scripture.fontFamily,
              fontSize: typography.ui.sizes.lg,
              fontWeight: '600',
              color: palette.ink,
              flex: 1,
              marginRight: 8,
            }}
          >
            {plan.title}
          </Text>
          <View
            style={{
              backgroundColor: plan.is_premium ? palette.sage : palette.line,
              borderRadius: 6,
              paddingHorizontal: 8,
              paddingVertical: 3,
            }}
          >
            <Text
              style={{
                fontFamily: typography.ui.fontFamily,
                fontSize: typography.ui.sizes.xs,
                fontWeight: '600',
                color: plan.is_premium ? '#FFFFFF' : palette.muted,
              }}
            >
              {plan.is_premium ? 'Premium' : 'Free'}
            </Text>
          </View>
        </View>
        {plan.subtitle ? (
          <Text
            style={{
              fontFamily: typography.ui.fontFamily,
              fontSize: typography.ui.sizes.sm,
              color: palette.muted,
              marginBottom: 8,
            }}
          >
            {plan.subtitle}
          </Text>
        ) : null}
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text
            style={{
              fontFamily: typography.ui.fontFamily,
              fontSize: typography.ui.sizes.xs,
              color: palette.muted,
            }}
          >
            {plan.day_count} days
          </Text>
          {planProgress && (
            <>
              <Text
                style={{
                  fontFamily: typography.ui.fontFamily,
                  fontSize: typography.ui.sizes.xs,
                  color: palette.line,
                  marginHorizontal: 8,
                }}
              >
                |
              </Text>
              <Text
                style={{
                  fontFamily: typography.ui.fontFamily,
                  fontSize: typography.ui.sizes.xs,
                  color: palette.sage,
                  fontWeight: '600',
                }}
              >
                {completedCount} of {plan.day_count} completed
              </Text>
            </>
          )}
        </View>
        {planProgress && planProgress.completed_at && (
          <View
            style={{
              marginTop: 8,
              paddingTop: 8,
              borderTopWidth: 1,
              borderTopColor: palette.line,
              flexDirection: 'row',
              alignItems: 'center',
            }}
          >
            <Text style={{ fontSize: 14, marginRight: 4, color: palette.sage }}>
              ✓
            </Text>
            <Text
              style={{
                fontFamily: typography.ui.fontFamily,
                fontSize: typography.ui.sizes.xs,
                color: palette.sage,
                fontWeight: '600',
              }}
            >
              Completed
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

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

  if (isError) {
    return (
      <EmptyState
        icon="⚠"
        title="Could not load reading plans"
        subtitle={error?.message ?? 'Please check your connection and try again.'}
      />
    );
  }

  // Filter premium plans for free users — show paywall on tap instead
  const visiblePlans = plans.filter(
    (p) => isPremium || !p.is_premium,
  );

  return (
    <FlatList
      style={{ flex: 1, backgroundColor: palette.bg }}
      contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
      data={visiblePlans}
      keyExtractor={(item) => item.id}
      renderItem={renderPlanCard}
      ListEmptyComponent={
        <EmptyState
          icon="📖"
          title="No reading plans available"
          subtitle="Check back soon for new plans."
        />
      }
      accessibilityLabel="Reading plans list"
    />
  );
}
