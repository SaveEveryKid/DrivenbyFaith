import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ScriptureBlock } from '@/components/ScriptureBlock';
import { PrimaryButton } from '@/components/PrimaryButton';
import { EmptyState } from '@/components/EmptyState';
import { useTheme } from '@/hooks/useTheme';
import { useReadingPlanDay, useCompleteDay } from '@/hooks/useReadingPlans';
import type { ReadingPlanDayRow } from '@/types/database';

export default function PlanDayScreen(): React.ReactElement {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { palette, typography } = useTheme();
  const { day, plan, isCompleted, isLoading, isError, error } = useReadingPlanDay(id);
  const { completeDay, isCompleting } = useCompleteDay();

  const handleComplete = async (): Promise<void> => {
    if (!day || !plan) return;
    await completeDay(plan.id, day.day_number);
  };

  // ── Navigation: find previous/next day ────────────────────────────────────

  const allDays: ReadingPlanDayRow[] = plan
    ? [] // days are fetched via useReadingPlan separately; we don't have them here
    : [];

  // We'll use day.day_number to indicate position

  // ── Render ────────────────────────────────────────────────────────────────

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

  if (isError || !day) {
    return (
      <EmptyState
        icon="⚠"
        title="Could not load day"
        subtitle={error?.message ?? 'This reading plan day could not be found.'}
      />
    );
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: palette.bg }}
      contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
      accessibilityLabel={`Day ${day.day_number}: ${day.title}`}
    >
      {/* Day badge */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          marginBottom: 8,
        }}
      >
        <View
          style={{
            backgroundColor: palette.clay + '14',
            borderRadius: 8,
            paddingHorizontal: 10,
            paddingVertical: 4,
            marginRight: 8,
          }}
        >
          <Text
            style={{
              fontFamily: typography.ui.fontFamily,
              fontSize: typography.ui.sizes.xs,
              fontWeight: '600',
              color: palette.clay,
            }}
          >
            Day {day.day_number}
          </Text>
        </View>
        {isCompleted && (
          <View
            style={{
              backgroundColor: palette.sage + '14',
              borderRadius: 8,
              paddingHorizontal: 10,
              paddingVertical: 4,
            }}
          >
            <Text
              style={{
                fontFamily: typography.ui.fontFamily,
                fontSize: typography.ui.sizes.xs,
                fontWeight: '600',
                color: palette.sage,
              }}
            >
              ✓ Completed
            </Text>
          </View>
        )}
      </View>

      {/* Title */}
      <Text
        style={{
          fontFamily: typography.scripture.fontFamily,
          fontSize: typography.scripture.sizes.large,
          fontWeight: '600',
          color: palette.ink,
          marginBottom: 16,
        }}
      >
        {day.title}
      </Text>

      {/* Scripture */}
      <ScriptureBlock
        reference={day.scripture_reference}
        text={day.scripture_text}
      />

      {/* Body */}
      <Text
        style={{
          fontFamily: typography.ui.fontFamily,
          fontSize: typography.ui.sizes.base,
          color: palette.ink,
          lineHeight: typography.ui.sizes.base * 1.6,
          marginBottom: 24,
        }}
      >
        {day.body}
      </Text>

      {/* Application */}
      {day.application ? (
        <View
          style={{
            backgroundColor: palette.surface,
            borderRadius: 12,
            padding: 16,
            marginBottom: 24,
            borderLeftWidth: 3,
            borderLeftColor: palette.clay,
            borderWidth: 1,
            borderColor: palette.line,
          }}
        >
          <Text
            style={{
              fontFamily: typography.ui.fontFamily,
              fontSize: typography.ui.sizes.xs,
              fontWeight: '600',
              color: palette.clay,
              textTransform: 'uppercase',
              letterSpacing: 0.5,
              marginBottom: 8,
            }}
          >
            Apply
          </Text>
          <Text
            style={{
              fontFamily: typography.scripture.fontFamily,
              fontSize: typography.scripture.sizes.small,
              color: palette.ink,
              lineHeight: typography.scripture.sizes.small * typography.scripture.lineHeight,
              fontStyle: 'italic',
            }}
          >
            {day.application}
          </Text>
        </View>
      ) : null}

      {/* Complete / Completed button */}
      {isCompleted ? (
        <View
          style={{
            backgroundColor: palette.sage + '14',
            borderRadius: 10,
            paddingVertical: 14,
            alignItems: 'center',
            borderWidth: 1,
            borderColor: palette.sage + '30',
          }}
          accessibilityLabel="Day completed"
        >
          <Text
            style={{
              fontFamily: typography.ui.fontFamily,
              fontSize: typography.ui.sizes.base,
              fontWeight: '600',
              color: palette.sage,
            }}
          >
            Day completed
          </Text>
        </View>
      ) : (
        <PrimaryButton
          title="Mark Complete"
          onPress={handleComplete}
          loading={isCompleting}
          accessibilityLabel="Mark this day as complete"
        />
      )}

      {/* Navigation arrows */}
      {plan && (
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            marginTop: 24,
          }}
        >
          {day.day_number > 1 ? (
            <TouchableOpacity
              onPress={() => {
                // Navigate to previous day — needs day list from parent
                router.back();
              }}
              accessibilityLabel="Previous day"
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingVertical: 8,
                paddingHorizontal: 12,
              }}
            >
              <Text
                style={{
                  fontFamily: typography.ui.fontFamily,
                  fontSize: typography.ui.sizes.sm,
                  color: palette.clay,
                  fontWeight: '600',
                }}
              >
                ← Previous
              </Text>
            </TouchableOpacity>
          ) : (
            <View />
          )}
          <TouchableOpacity
            onPress={() => {
              router.back();
            }}
            accessibilityLabel="Back to plan"
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingVertical: 8,
              paddingHorizontal: 12,
            }}
          >
            <Text
              style={{
                fontFamily: typography.ui.fontFamily,
                fontSize: typography.ui.sizes.sm,
                color: palette.clay,
                fontWeight: '600',
              }}
            >
              Back to plan
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}
