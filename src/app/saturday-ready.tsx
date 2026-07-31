import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card } from '@/components/Card';
import { ScriptureBlock } from '@/components/ScriptureBlock';
import { PrimaryButton } from '@/components/PrimaryButton';
import { Paywall } from '@/components/Paywall';
import { TextField } from '@/components/TextField';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import type { SaturdayReady, SaturdayReadyResponse } from '@/types/database';

function todayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export default function SaturdayReadyScreen(): React.ReactElement {
  const { session, profile } = useAuthStore();
  const userId = session?.user.id;
  const queryClient = useQueryClient();
  const [showPaywall, setShowPaywall] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const entryQuery = useQuery({
    queryKey: ['saturday-ready', 'current', todayDateString()],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_current_saturday_ready');
      if (error) throw error;
      return data as SaturdayReady | null;
    },
  });

  const entry = entryQuery.data;

  const responseQuery = useQuery({
    queryKey: ['saturday-ready-response', todayDateString(), userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('saturday_ready_responses')
        .select('*')
        .eq('response_date', todayDateString())
        .eq('user_id', userId!)
        .maybeSingle();
      if (error) throw error;
      return data as SaturdayReadyResponse | null;
    },
  });

  const response = responseQuery.data;

  useEffect(() => {
    setSelected(response?.commitments_selected ?? []);
    setNotes(response?.notes ?? '');
  }, [response?.commitments_selected, response?.notes]);

  const isLocked = !!entry?.is_premium && profile?.subscription_tier !== 'premium';

  const toggleCommitment = (commitment: string): void => {
    setSelected((prev) =>
      prev.includes(commitment) ? prev.filter((c) => c !== commitment) : [...prev, commitment],
    );
  };

  const handleSave = async (): Promise<void> => {
    if (!entry || !userId) return;
    setSaving(true);
    await supabase.from('saturday_ready_responses').upsert(
      {
        user_id: userId,
        saturday_ready_id: entry.id,
        response_date: todayDateString(),
        commitments_selected: selected,
        notes: notes.trim() || null,
        completed_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,response_date' },
    );
    setSaving(false);
    queryClient.invalidateQueries({ queryKey: ['saturday-ready-response', todayDateString(), userId] });
  };

  if (entryQuery.isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#FDFBF7', alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color="#9B7343" />
      </View>
    );
  }

  if (!entry) {
    return (
      <View style={{ flex: 1, backgroundColor: '#FDFBF7', alignItems: 'center', justifyContent: 'center', padding: 32 }}>
        <Text style={{ fontFamily: 'Inter, system-ui, sans-serif', color: '#9B9B9B', textAlign: 'center' }}>
          No Saturday Ready content is available yet.
        </Text>
      </View>
    );
  }

  if (isLocked && !showPaywall) {
    return (
      <ScrollView style={{ flex: 1, backgroundColor: '#FDFBF7' }} contentContainerStyle={{ padding: 16 }}>
        <Card variant="elevated">
          <Text style={{ fontFamily: 'Georgia, serif', fontSize: 20, fontWeight: '600', color: '#3C3C3C', marginBottom: 12 }}>
            {entry.theme}
          </Text>
          <Text style={{ fontFamily: 'Inter, system-ui, sans-serif', fontSize: 13, color: '#B08C57', marginBottom: 16 }}>
            Saturday Ready is a Premium feature.
          </Text>
          <PrimaryButton title="Unlock with Premium" onPress={() => setShowPaywall(true)} />
        </Card>
      </ScrollView>
    );
  }

  if (isLocked && showPaywall) {
    return (
      <Paywall
        feature="Saturday Ready"
        onSubscribe={() => setShowPaywall(false)}
        onDismiss={() => setShowPaywall(false)}
      />
    );
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#FDFBF7' }} contentContainerStyle={{ padding: 16 }}>
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
      <Text style={{ fontFamily: 'Georgia, serif', fontSize: 22, fontWeight: '700', color: '#3C3C3C', marginBottom: 16 }}>
        {entry.theme}
      </Text>

      <Card variant="elevated">
        <ScriptureBlock reference={entry.scripture_reference} text={entry.scripture_text} />
        <Text style={{ fontFamily: 'Inter, system-ui, sans-serif', fontSize: 15, color: '#6F6F6F', lineHeight: 22, marginBottom: 20 }}>
          {entry.preparation_body}
        </Text>

        <Text
          style={{
            fontFamily: 'Inter, system-ui, sans-serif',
            fontSize: 13,
            fontWeight: '600',
            color: '#6F6F6F',
            textTransform: 'uppercase',
            letterSpacing: 0.5,
            marginBottom: 10,
          }}
        >
          Three Commitments
        </Text>
        {entry.three_commitments.map((commitment) => {
          const checked = selected.includes(commitment);
          return (
            <TouchableOpacity
              key={commitment}
              onPress={() => toggleCommitment(commitment)}
              style={{ flexDirection: 'row', marginBottom: 12, alignItems: 'flex-start' }}
            >
              <View
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: 5,
                  borderWidth: 1.5,
                  borderColor: '#9B7343',
                  backgroundColor: checked ? '#9B7343' : 'transparent',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 10,
                  marginTop: 2,
                }}
              >
                {checked && <Text style={{ color: '#FFFFFF', fontSize: 12 }}>✓</Text>}
              </View>
              <Text
                style={{
                  flex: 1,
                  fontFamily: 'Inter, system-ui, sans-serif',
                  fontSize: 14,
                  color: '#3C3C3C',
                  lineHeight: 20,
                }}
              >
                {commitment}
              </Text>
            </TouchableOpacity>
          );
        })}

        <Text
          style={{
            fontFamily: 'Inter, system-ui, sans-serif',
            fontSize: 13,
            fontWeight: '600',
            color: '#6F6F6F',
            textTransform: 'uppercase',
            letterSpacing: 0.5,
            marginTop: 8,
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
          {entry.prayer}
        </Text>

        <TextField
          label="Notes (optional)"
          value={notes}
          onChangeText={setNotes}
          placeholder="Anything on your heart before tomorrow?"
          multiline
          numberOfLines={3}
          style={{ minHeight: 80, textAlignVertical: 'top' }}
        />

        <PrimaryButton title={response ? 'Update' : 'Save'} onPress={handleSave} loading={saving} />
      </Card>
    </ScrollView>
  );
}
