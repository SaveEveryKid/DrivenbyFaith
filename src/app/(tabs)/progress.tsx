import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { format, parseISO, subDays, isSameDay } from 'date-fns';
import { Card } from '@/components/Card';
import { PrimaryButton } from '@/components/PrimaryButton';
import { TextField } from '@/components/TextField';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import type { DevotionalCompletion, DealDebrief } from '@/types/database';

function todayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function computeStreak(completedDates: Date[]): number {
  if (completedDates.length === 0) return 0;
  const uniqueDays: Date[] = [];
  for (const d of completedDates) {
    if (!uniqueDays.some((u) => isSameDay(u, d))) uniqueDays.push(d);
  }
  uniqueDays.sort((a, b) => b.getTime() - a.getTime());

  let cursor = new Date();
  if (!isSameDay(uniqueDays[0], cursor) && !isSameDay(uniqueDays[0], subDays(cursor, 1))) {
    return 0;
  }
  if (!isSameDay(uniqueDays[0], cursor)) {
    cursor = subDays(cursor, 1);
  }

  let streak = 0;
  for (const day of uniqueDays) {
    if (isSameDay(day, cursor)) {
      streak += 1;
      cursor = subDays(cursor, 1);
    } else {
      break;
    }
  }
  return streak;
}

const MOODS = [
  { value: 1, emoji: '😞' },
  { value: 2, emoji: '😕' },
  { value: 3, emoji: '😐' },
  { value: 4, emoji: '🙂' },
  { value: 5, emoji: '😄' },
];

export default function ProgressScreen(): React.ReactElement {
  const { session } = useAuthStore();
  const userId = session?.user.id;
  const queryClient = useQueryClient();

  const [mood, setMood] = useState<number | null>(null);
  const [wentWell, setWentWell] = useState('');
  const [whereISawGod, setWhereISawGod] = useState('');
  const [gratitude, setGratitude] = useState('');
  const [saving, setSaving] = useState(false);

  const completionsQuery = useQuery({
    queryKey: ['progress', 'completions', userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('devotional_completions')
        .select('*')
        .eq('user_id', userId!)
        .order('completed_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as DevotionalCompletion[];
    },
  });

  const debriefsQuery = useQuery({
    queryKey: ['progress', 'debriefs', userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('deal_debriefs')
        .select('*')
        .eq('user_id', userId!)
        .order('debrief_date', { ascending: false })
        .limit(5);
      if (error) throw error;
      return (data ?? []) as DealDebrief[];
    },
  });

  const todaysDebrief = useMemo(
    () => debriefsQuery.data?.find((d) => d.debrief_date === todayDateString()),
    [debriefsQuery.data],
  );

  const streak = useMemo(() => {
    const dates = (completionsQuery.data ?? []).map((c) => parseISO(c.completed_at));
    return computeStreak(dates);
  }, [completionsQuery.data]);

  const totalCompletions = completionsQuery.data?.length ?? 0;

  const handleSaveDebrief = async (): Promise<void> => {
    if (!userId) return;
    setSaving(true);
    await supabase.from('deal_debriefs').upsert(
      {
        user_id: userId,
        debrief_date: todayDateString(),
        mood,
        went_well: wentWell.trim() || null,
        where_i_saw_god: whereISawGod.trim() || null,
        gratitude: gratitude.trim() || null,
      },
      { onConflict: 'user_id,debrief_date' },
    );
    setSaving(false);
    setMood(null);
    setWentWell('');
    setWhereISawGod('');
    setGratitude('');
    queryClient.invalidateQueries({ queryKey: ['progress', 'debriefs', userId] });
  };

  if (completionsQuery.isLoading) {
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

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: '#FDFBF7' }}
      contentContainerStyle={{ padding: 16 }}
    >
      <Text
        style={{
          fontFamily: 'Georgia, serif',
          fontSize: 24,
          fontWeight: '700',
          color: '#3C3C3C',
          marginBottom: 16,
        }}
      >
        Your Progress
      </Text>

      <View style={{ flexDirection: 'row', marginBottom: 20 }}>
        <Card variant="elevated" style={{ flex: 1, marginRight: 8, alignItems: 'center' }}>
          <Text
            style={{
              fontFamily: 'Georgia, serif',
              fontSize: 32,
              fontWeight: '700',
              color: '#9B7343',
            }}
          >
            {streak}
          </Text>
          <Text
            style={{ fontFamily: 'Inter, system-ui, sans-serif', fontSize: 13, color: '#9B9B9B' }}
          >
            Day Streak
          </Text>
        </Card>
        <Card variant="elevated" style={{ flex: 1, marginLeft: 8, alignItems: 'center' }}>
          <Text
            style={{
              fontFamily: 'Georgia, serif',
              fontSize: 32,
              fontWeight: '700',
              color: '#9B7343',
            }}
          >
            {totalCompletions}
          </Text>
          <Text
            style={{ fontFamily: 'Inter, system-ui, sans-serif', fontSize: 13, color: '#9B9B9B' }}
          >
            Devotionals
          </Text>
        </Card>
      </View>

      <Text
        style={{
          fontFamily: 'Inter, system-ui, sans-serif',
          fontSize: 13,
          fontWeight: '600',
          color: '#6F6F6F',
          textTransform: 'uppercase',
          letterSpacing: 0.5,
          marginBottom: 12,
        }}
      >
        Deal Debrief
      </Text>

      {todaysDebrief ? (
        <Card variant="elevated" style={{ marginBottom: 20 }}>
          <Text
            style={{
              fontFamily: 'Inter, system-ui, sans-serif',
              fontSize: 15,
              fontWeight: '600',
              color: '#5F6E48',
            }}
          >
            ✓ Today&rsquo;s debrief saved
          </Text>
        </Card>
      ) : (
        <Card variant="elevated" style={{ marginBottom: 20 }}>
          <Text
            style={{
              fontFamily: 'Inter, system-ui, sans-serif',
              fontSize: 14,
              color: '#6F6F6F',
              marginBottom: 10,
            }}
          >
            How was today?
          </Text>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 }}>
            {MOODS.map((m) => (
              <TouchableOpacity
                key={m.value}
                onPress={() => setMood(m.value)}
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 24,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: mood === m.value ? '#F5F0E8' : 'transparent',
                  borderWidth: mood === m.value ? 1.5 : 0,
                  borderColor: '#9B7343',
                }}
              >
                <Text style={{ fontSize: 24 }}>{m.emoji}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <TextField
            label="What went well?"
            value={wentWell}
            onChangeText={setWentWell}
            multiline
            placeholder="Optional"
          />
          <TextField
            label="Where did you see God today?"
            value={whereISawGod}
            onChangeText={setWhereISawGod}
            multiline
            placeholder="Optional"
          />
          <TextField
            label="Gratitude"
            value={gratitude}
            onChangeText={setGratitude}
            multiline
            placeholder="Optional"
          />
          <PrimaryButton
            title="Save Today's Debrief"
            onPress={handleSaveDebrief}
            loading={saving}
          />
        </Card>
      )}

      {debriefsQuery.data && debriefsQuery.data.length > 0 && (
        <>
          <Text
            style={{
              fontFamily: 'Inter, system-ui, sans-serif',
              fontSize: 13,
              fontWeight: '600',
              color: '#6F6F6F',
              textTransform: 'uppercase',
              letterSpacing: 0.5,
              marginBottom: 12,
            }}
          >
            Recent Debriefs
          </Text>
          {debriefsQuery.data.map((debrief) => (
            <Card key={debrief.id} style={{ marginBottom: 10 }}>
              <View
                style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}
              >
                <Text
                  style={{
                    fontFamily: 'Inter, system-ui, sans-serif',
                    fontSize: 13,
                    fontWeight: '600',
                    color: '#3C3C3C',
                  }}
                >
                  {format(parseISO(debrief.debrief_date), 'EEEE, MMM d')}
                </Text>
                {debrief.mood && (
                  <Text style={{ fontSize: 16 }}>
                    {MOODS.find((m) => m.value === debrief.mood)?.emoji}
                  </Text>
                )}
              </View>
              {debrief.went_well && (
                <Text
                  style={{
                    fontFamily: 'Inter, system-ui, sans-serif',
                    fontSize: 13,
                    color: '#6F6F6F',
                  }}
                  numberOfLines={2}
                >
                  {debrief.went_well}
                </Text>
              )}
            </Card>
          ))}
        </>
      )}
    </ScrollView>
  );
}
