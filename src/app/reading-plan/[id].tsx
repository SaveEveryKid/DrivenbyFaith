import React, { useState } from 'react';
import { View, Text, ScrollView, ActivityIndicator } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card } from '@/components/Card';
import { ScriptureBlock } from '@/components/ScriptureBlock';
import { PrimaryButton } from '@/components/PrimaryButton';
import { Paywall } from '@/components/Paywall';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import type { ReadingPlan, ReadingPlanDay, ReadingPlanProgress } from '@/types/database';

export default function ReadingPlanDetailScreen(): React.ReactElement {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { session, profile } = useAuthStore();
  const userId = session?.user.id;
  const queryClient = useQueryClient();
  const [showPaywall, setShowPaywall] = useState(false);
  const [busy, setBusy] = useState(false);

  const planQuery = useQuery({
    queryKey: ['reading-plan', id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reading_plans')
        .select('*')
        .eq('id', id!)
        .single();
      if (error) throw error;
      return data as ReadingPlan;
    },
  });

  const daysQuery = useQuery({
    queryKey: ['reading-plan-days', id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reading_plan_days')
        .select('*')
        .eq('plan_id', id!)
        .order('day_number', { ascending: true });
      if (error) throw error;
      return (data ?? []) as ReadingPlanDay[];
    },
  });

  const progressQuery = useQuery({
    queryKey: ['reading-plan-progress', id, userId],
    enabled: !!id && !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reading_plan_progress')
        .select('*')
        .eq('plan_id', id!)
        .eq('user_id', userId!)
        .maybeSingle();
      if (error) throw error;
      return data as ReadingPlanProgress | null;
    },
  });

  const invalidateProgress = (): void => {
    queryClient.invalidateQueries({ queryKey: ['reading-plan-progress', id, userId] });
  };

  const handleStart = async (): Promise<void> => {
    if (!id || !userId) return;
    setBusy(true);
    await supabase.from('reading_plan_progress').insert({
      plan_id: id,
      user_id: userId,
      current_day: 1,
      days_completed: [],
    });
    setBusy(false);
    invalidateProgress();
  };

  const handleCompleteDay = async (dayNumber: number, totalDays: number): Promise<void> => {
    if (!id || !userId || !progressQuery.data) return;
    setBusy(true);
    const daysCompleted = Array.from(new Set([...progressQuery.data.days_completed, dayNumber]));
    const isFinished = daysCompleted.length >= totalDays;
    await supabase
      .from('reading_plan_progress')
      .update({
        days_completed: daysCompleted,
        current_day: Math.min(dayNumber + 1, totalDays),
        completed_at: isFinished ? new Date().toISOString() : null,
      })
      .eq('plan_id', id)
      .eq('user_id', userId);
    setBusy(false);
    invalidateProgress();
  };

  if (planQuery.isLoading || daysQuery.isLoading || !planQuery.data) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: '#FDFBF7',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <ActivityIndicator color="#9B7343" />
      </View>
    );
  }

  const plan = planQuery.data;
  const days = daysQuery.data ?? [];
  const progress = progressQuery.data;
  const isLocked = plan.is_premium && profile?.subscription_tier !== 'premium';

  if (isLocked && !showPaywall) {
    return (
      <ScrollView
        style={{ flex: 1, backgroundColor: '#FDFBF7' }}
        contentContainerStyle={{ padding: 16 }}
      >
        <Card variant="elevated">
          <Text
            style={{
              fontFamily: 'Georgia, serif',
              fontSize: 20,
              fontWeight: '600',
              color: '#3C3C3C',
              marginBottom: 12,
            }}
          >
            {plan.title}
          </Text>
          <Text
            style={{
              fontFamily: 'Inter, system-ui, sans-serif',
              fontSize: 13,
              color: '#B08C57',
              marginBottom: 16,
            }}
          >
            This reading plan is a Premium feature.
          </Text>
          <PrimaryButton title="Unlock with Premium" onPress={() => setShowPaywall(true)} />
        </Card>
      </ScrollView>
    );
  }

  if (isLocked && showPaywall) {
    return (
      <Paywall
        feature={plan.title}
        onSubscribe={() => setShowPaywall(false)}
        onDismiss={() => setShowPaywall(false)}
      />
    );
  }

  const currentDay = days.find((d) => d.day_number === (progress?.current_day ?? 1));

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: '#FDFBF7' }}
      contentContainerStyle={{ padding: 16 }}
    >
      <Text
        style={{
          fontFamily: 'Georgia, serif',
          fontSize: 22,
          fontWeight: '700',
          color: '#3C3C3C',
          marginBottom: 4,
        }}
      >
        {plan.title}
      </Text>
      {plan.subtitle && (
        <Text
          style={{
            fontFamily: 'Inter, system-ui, sans-serif',
            fontSize: 14,
            color: '#9B9B9B',
            marginBottom: 16,
          }}
        >
          {plan.subtitle}
        </Text>
      )}

      {!progress ? (
        <Card variant="elevated">
          {plan.description && (
            <Text
              style={{
                fontFamily: 'Inter, system-ui, sans-serif',
                fontSize: 15,
                color: '#6F6F6F',
                lineHeight: 22,
                marginBottom: 16,
              }}
            >
              {plan.description}
            </Text>
          )}
          <PrimaryButton
            title={`Start ${plan.day_count}-Day Plan`}
            onPress={handleStart}
            loading={busy}
          />
        </Card>
      ) : currentDay ? (
        <Card variant="elevated">
          <Text
            style={{
              fontFamily: 'Inter, system-ui, sans-serif',
              fontSize: 12,
              fontWeight: '600',
              color: '#B08C57',
              textTransform: 'uppercase',
              letterSpacing: 0.5,
              marginBottom: 8,
            }}
          >
            Day {currentDay.day_number} of {plan.day_count}
          </Text>
          <Text
            style={{
              fontFamily: 'Georgia, serif',
              fontSize: 19,
              fontWeight: '600',
              color: '#3C3C3C',
              marginBottom: 12,
            }}
          >
            {currentDay.title}
          </Text>
          <ScriptureBlock
            reference={currentDay.scripture_reference}
            text={currentDay.scripture_text}
          />
          <Text
            style={{
              fontFamily: 'Inter, system-ui, sans-serif',
              fontSize: 15,
              color: '#6F6F6F',
              lineHeight: 22,
              marginBottom: 12,
            }}
          >
            {currentDay.body}
          </Text>
          {currentDay.application && (
            <Text
              style={{
                fontFamily: 'Inter, system-ui, sans-serif',
                fontSize: 15,
                color: '#6F6F6F',
                lineHeight: 22,
                marginBottom: 16,
                fontStyle: 'italic',
              }}
            >
              {currentDay.application}
            </Text>
          )}
          {progress.days_completed.includes(currentDay.day_number) ? (
            <View
              style={{
                backgroundColor: '#F4F6F1',
                borderRadius: 10,
                paddingVertical: 12,
                alignItems: 'center',
              }}
            >
              <Text
                style={{
                  fontFamily: 'Inter, system-ui, sans-serif',
                  fontSize: 15,
                  fontWeight: '600',
                  color: '#5F6E48',
                }}
              >
                ✓ Day complete
              </Text>
            </View>
          ) : (
            <PrimaryButton
              title="Mark Day Complete"
              onPress={() => handleCompleteDay(currentDay.day_number, plan.day_count)}
              loading={busy}
            />
          )}
        </Card>
      ) : (
        <Card variant="elevated">
          <Text
            style={{
              fontFamily: 'Inter, system-ui, sans-serif',
              fontSize: 16,
              fontWeight: '600',
              color: '#5F6E48',
              textAlign: 'center',
            }}
          >
            🎉 You&rsquo;ve completed this plan!
          </Text>
        </Card>
      )}

      <View style={{ marginTop: 20 }}>
        {days.map((day) => {
          const done = progress?.days_completed.includes(day.day_number) ?? false;
          return (
            <View
              key={day.id}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingVertical: 8,
                borderBottomWidth: 1,
                borderBottomColor: '#F5F0E8',
              }}
            >
              <Text style={{ width: 24, fontSize: 15 }}>{done ? '✓' : '○'}</Text>
              <Text
                style={{
                  fontFamily: 'Inter, system-ui, sans-serif',
                  fontSize: 14,
                  color: done ? '#3C3C3C' : '#9B9B9B',
                }}
              >
                Day {day.day_number}: {day.title}
              </Text>
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
}
