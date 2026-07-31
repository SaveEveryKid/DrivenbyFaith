import React, { useEffect, useState } from 'react';
import { Text, ScrollView, View, TouchableOpacity } from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { Card } from '@/components/Card';
import { ScriptureBlock } from '@/components/ScriptureBlock';
import { PrimaryButton } from '@/components/PrimaryButton';
import { EmptyState } from '@/components/EmptyState';
import { Paywall } from '@/components/Paywall';
import { TextField } from '@/components/TextField';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import type { Devotional, DevotionalCompletion } from '@/types/database';

function todayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

export default function TodayScreen(): React.ReactElement {
  const { session, profile } = useAuthStore();
  const userId = session?.user.id;
  const queryClient = useQueryClient();
  const [showPaywall, setShowPaywall] = useState(false);
  const [reflection, setReflection] = useState('');
  const [saving, setSaving] = useState(false);

  const devotionalQuery = useQuery({
    queryKey: ['devotional', 'today', todayDateString()],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_todays_devotional');
      if (error) throw error;
      return data as Devotional | null;
    },
  });

  const devotional = devotionalQuery.data;

  const completionQuery = useQuery({
    queryKey: ['devotional-completion', todayDateString(), userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('devotional_completions')
        .select('*')
        .eq('completed_date', todayDateString())
        .eq('user_id', userId!)
        .maybeSingle();
      if (error) throw error;
      return data as DevotionalCompletion | null;
    },
  });

  const completion = completionQuery.data;

  useEffect(() => {
    setReflection(completion?.reflection_response ?? '');
  }, [completion?.reflection_response]);

  const isLocked = !!devotional?.is_premium && profile?.subscription_tier !== 'premium';

  const handleMarkComplete = async (): Promise<void> => {
    if (!devotional || !userId) return;
    setSaving(true);
    await supabase.from('devotional_completions').upsert(
      {
        user_id: userId,
        devotional_id: devotional.id,
        completed_date: todayDateString(),
        reflection_response: reflection.trim() || null,
        challenge_accepted: true,
        completed_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,completed_date' },
    );
    setSaving(false);
    queryClient.invalidateQueries({ queryKey: ['devotional-completion', todayDateString(), userId] });
    queryClient.invalidateQueries({ queryKey: ['progress'] });
  };

  if (devotionalQuery.isLoading) {
    return (
      <ScrollView
        style={{ flex: 1, backgroundColor: '#FDFBF7' }}
        contentContainerStyle={{ padding: 16 }}
      >
        <Text style={{ fontFamily: 'Inter, system-ui, sans-serif', color: '#9B9B9B' }}>
          Loading…
        </Text>
      </ScrollView>
    );
  }

  if (!devotional) {
    return (
      <View style={{ flex: 1, backgroundColor: '#FDFBF7' }}>
        <EmptyState
          icon="📖"
          title="No devotional available"
          subtitle="There's no devotional content yet. Check back soon."
        />
      </View>
    );
  }

  if (isLocked && !showPaywall) {
    return (
      <ScrollView
        style={{ flex: 1, backgroundColor: '#FDFBF7' }}
        contentContainerStyle={{ padding: 16 }}
      >
        <TodayHeader onSettings={() => router.push('/settings')} />
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
            {devotional.title}
          </Text>
          <ScriptureBlock
            reference={devotional.scripture_reference}
            text={devotional.scripture_text}
            translation={devotional.translation}
          />
          <Text
            style={{
              fontFamily: 'Inter, system-ui, sans-serif',
              fontSize: 13,
              color: '#B08C57',
              marginBottom: 16,
            }}
          >
            This devotional is a Premium feature.
          </Text>
          <PrimaryButton title="Unlock with Premium" onPress={() => setShowPaywall(true)} />
        </Card>
      </ScrollView>
    );
  }

  if (isLocked && showPaywall) {
    return (
      <Paywall
        feature="Today's devotional"
        onSubscribe={() => setShowPaywall(false)}
        onDismiss={() => setShowPaywall(false)}
      />
    );
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: '#FDFBF7' }}
      contentContainerStyle={{ padding: 16 }}
    >
      <TodayHeader onSettings={() => router.push('/settings')} />

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
          {devotional.title}
        </Text>
        <ScriptureBlock
          reference={devotional.scripture_reference}
          text={devotional.scripture_text}
          translation={devotional.translation}
        />
        <Text
          style={{
            fontFamily: 'Inter, system-ui, sans-serif',
            fontSize: 15,
            color: '#6F6F6F',
            lineHeight: 22,
            marginBottom: 16,
          }}
        >
          {devotional.workplace_application}
        </Text>

        <Text
          style={{
            fontFamily: 'Inter, system-ui, sans-serif',
            fontSize: 13,
            fontWeight: '600',
            color: '#6F6F6F',
            textTransform: 'uppercase',
            letterSpacing: 0.5,
            marginBottom: 8,
          }}
        >
          Reflect
        </Text>
        <Text
          style={{
            fontFamily: 'Inter, system-ui, sans-serif',
            fontSize: 15,
            color: '#6F6F6F',
            lineHeight: 22,
            marginBottom: 12,
          }}
        >
          {devotional.reflection_prompt}
        </Text>
        <TextField
          value={reflection}
          onChangeText={setReflection}
          placeholder="Write your reflection (optional)"
          multiline
          numberOfLines={3}
          style={{ minHeight: 88, textAlignVertical: 'top' }}
        />

        <Text
          style={{
            fontFamily: 'Inter, system-ui, sans-serif',
            fontSize: 13,
            fontWeight: '600',
            color: '#6F6F6F',
            textTransform: 'uppercase',
            letterSpacing: 0.5,
            marginBottom: 8,
          }}
        >
          Prayer
        </Text>
        <Text
          style={{
            fontFamily: 'Georgia, serif',
            fontSize: 15,
            fontStyle: 'italic',
            color: '#6F6F6F',
            lineHeight: 22,
            marginBottom: 16,
          }}
        >
          {devotional.prayer}
        </Text>

        <Text
          style={{
            fontFamily: 'Inter, system-ui, sans-serif',
            fontSize: 13,
            fontWeight: '600',
            color: '#6F6F6F',
            textTransform: 'uppercase',
            letterSpacing: 0.5,
            marginBottom: 8,
          }}
        >
          Today&rsquo;s Challenge
        </Text>
        <Text
          style={{
            fontFamily: 'Inter, system-ui, sans-serif',
            fontSize: 15,
            color: '#6F6F6F',
            lineHeight: 22,
            marginBottom: 20,
          }}
        >
          {devotional.challenge}
        </Text>

        {completion ? (
          <View
            style={{
              backgroundColor: '#F4F6F1',
              borderRadius: 10,
              paddingVertical: 12,
              paddingHorizontal: 16,
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
              ✓ Completed today
            </Text>
          </View>
        ) : (
          <PrimaryButton title="Mark Complete" onPress={handleMarkComplete} loading={saving} />
        )}
      </Card>

      <TouchableOpacity onPress={() => router.push('/saturday-ready')} style={{ marginTop: 16 }}>
        <Card>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ flex: 1, marginRight: 12 }}>
              <Text
                style={{
                  fontFamily: 'Inter, system-ui, sans-serif',
                  fontSize: 13,
                  fontWeight: '600',
                  color: '#B08C57',
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                  marginBottom: 4,
                }}
              >
                Saturday Ready
              </Text>
              <Text
                style={{
                  fontFamily: 'Inter, system-ui, sans-serif',
                  fontSize: 14,
                  color: '#6F6F6F',
                }}
              >
                Prepare your heart for the busiest day of the week.
              </Text>
            </View>
            <Text style={{ fontSize: 18, color: '#9B7343' }}>→</Text>
          </View>
        </Card>
      </TouchableOpacity>
    </ScrollView>
  );
}

function TodayHeader({ onSettings }: { onSettings: () => void }): React.ReactElement {
  return (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 20,
      }}
    >
      <View>
        <Text
          style={{
            fontFamily: 'Inter, system-ui, sans-serif',
            fontSize: 14,
            color: '#9B9B9B',
            marginBottom: 4,
          }}
        >
          {greeting()}
        </Text>
        <Text
          style={{
            fontFamily: 'Georgia, serif',
            fontSize: 24,
            fontWeight: '700',
            color: '#3C3C3C',
          }}
        >
          Today&rsquo;s Devotional
        </Text>
      </View>
      <TouchableOpacity onPress={onSettings} style={{ padding: 4 }}>
        <Text style={{ fontSize: 22 }}>⚙️</Text>
      </TouchableOpacity>
    </View>
  );
}
