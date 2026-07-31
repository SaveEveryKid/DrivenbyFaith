import React from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { useReadingPlan } from '@/hooks/useReadingPlans';
import { useAuth } from '@/hooks/useAuth';
import { EmptyState } from '@/components/EmptyState';
import { Paywall } from '@/components/Paywall';
import type { ReadingPlanDayRow } from '@/types/database';

export default function PlanDetailScreen(): React.ReactElement {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const router = useRouter();
  const { palette, typography } = useTheme();
  const { profile } = useAuth();
  const { plan, isLoading, isError, error } = useReadingPlan(slug);

  const isPremium = profile?.subscription_tier === 'premium';

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

  if (isError || !plan) {
    return (
      <EmptyState
        icon="⚠"
        title="Could not load plan"
        subtitle={error?.message ?? 'The reading plan could not be found.'}
      />
    );
  }

  // Premium paywall for free users
  if (plan.is_premium && !isPremium) {
    return (
      <Paywall
        feature={`"${plan.title}" is a Premium reading plan`}
        onSubscribe={() => {
          // Stub — navigates nowhere for now
        }}
        onDismiss={() => router.back()}
      />
    );
  }

  const daysCompleted: number[] = Array.isArray(plan.progress?.days_completed)
    ? (plan.progress.days_completed as number[])
    : [];

  const currentDay = plan.progress?.current_day ?? 1;

  const handleDayPress = (day: ReadingPlanDayRow): void => {
    router.push({
      pathname: '/plans/day/[id]',
      params: { id: day.id },
    });
  };

  const renderDayItem = ({
    item: day,
  }: {
    item: ReadingPlanDayRow;
  }): React.ReactElement => {
    const isCompleted = daysCompleted.includes(day.day_number);
    const isCurrent = day.day_number === currentDay;

    return (
      <TouchableOpacity
        onPress={() => handleDayPress(day)}
        accessibilityLabel={`Day ${day.day_number}: ${day.title}${isCompleted ? ', completed' : ''}${isCurrent ? ', current' : ''}`}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingVertical: 14,
          paddingHorizontal: 16,
          marginBottom: 4,
          backgroundColor:
            isCurrent
              ? palette.clay + '10'
              : isCompleted
                ? palette.surface
                : palette.surface,
          borderRadius: 10,
          borderWidth: isCurrent ? 1 : 0,
          borderColor: isCurrent ? palette.clay + '40' : 'transparent',
        }}
      >
        {/* Day number / checkmark */}
        <View
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: isCompleted
              ? palette.sage
              : isCurrent
                ? palette.clay
                : palette.line + '40',
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: 12,
          }}
        >
          {isCompleted ? (
            <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '700' }}>
              ✓
            </Text>
          ) : (
            <Text
              style={{
                fontFamily: typography.ui.fontFamily,
                fontSize: typography.ui.sizes.sm,
                fontWeight: '600',
                color: isCurrent ? '#FFFFFF' : palette.muted,
              }}
            >
              {day.day_number}
            </Text>
          )}
        </View>

        {/* Day info */}
        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontFamily: typography.ui.fontFamily,
              fontSize: typography.ui.sizes.sm,
              fontWeight: isCurrent ? '600' : '400',
              color: palette.ink,
              marginBottom: 2,
            }}
          >
            {day.title}
          </Text>
          <Text
            style={{
              fontFamily: typography.ui.fontFamily,
              fontSize: typography.ui.sizes.xs,
              color: palette.muted,
            }}
          >
            {day.scripture_reference}
          </Text>
        </View>

        {/* Arrow */}
        <Text
          style={{
            fontFamily: typography.ui.fontFamily,
            fontSize: typography.ui.sizes.lg,
            color: palette.line,
          }}
        >
          ›
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <FlatList
      style={{ flex: 1, backgroundColor: palette.bg }}
      contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
      data={plan.days}
      keyExtractor={(item) => item.id}
      renderItem={renderDayItem}
      ListHeaderComponent={
        <View style={{ marginBottom: 16 }}>
          <Text
            style={{
              fontFamily: typography.scripture.fontFamily,
              fontSize: typography.scripture.sizes.large,
              fontWeight: '600',
              color: palette.ink,
              marginBottom: 4,
            }}
          >
            {plan.title}
          </Text>
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
          {plan.description ? (
            <Text
              style={{
                fontFamily: typography.ui.fontFamily,
                fontSize: typography.ui.sizes.sm,
                color: palette.ink,
                lineHeight: 20,
                marginBottom: 8,
              }}
            >
              {plan.description}
            </Text>
          ) : null}
          <View
            style={{
              flexDirection: 'row',
              marginTop: 8,
            }}
          >
            <Text
              style={{
                fontFamily: typography.ui.fontFamily,
                fontSize: typography.ui.sizes.xs,
                color: palette.muted,
              }}
            >
              {plan.day_count} days
              {plan.progress
                ? ` · ${daysCompleted.length} completed`
                : ''}
            </Text>
          </View>
        </View>
      }
      ListEmptyComponent={
        <EmptyState
          icon="📖"
          title="No days in this plan"
          subtitle="The reading plan content is being prepared."
        />
      }
      accessibilityLabel={`Reading plan: ${plan.title}`}
    />
  );
}
