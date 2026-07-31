import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card } from '@/components/Card';
import { Paywall } from '@/components/Paywall';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import type { Situation } from '@/types/database';

export default function SituationDetailScreen(): React.ReactElement {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { session, profile } = useAuthStore();
  const userId = session?.user.id;
  const queryClient = useQueryClient();
  const [showPaywall, setShowPaywall] = useState(false);

  const situationQuery = useQuery({
    queryKey: ['situation', id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase.from('situations').select('*').eq('id', id!).single();
      if (error) throw error;
      return data as Situation;
    },
  });

  const saveQuery = useQuery({
    queryKey: ['situation-save', id, userId],
    enabled: !!id && !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('situation_saves')
        .select('id')
        .eq('situation_id', id!)
        .eq('user_id', userId!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const toggleSave = async (): Promise<void> => {
    if (!id || !userId) return;
    if (saveQuery.data) {
      await supabase.from('situation_saves').delete().eq('situation_id', id).eq('user_id', userId);
    } else {
      await supabase.from('situation_saves').insert({ situation_id: id, user_id: userId });
    }
    queryClient.invalidateQueries({ queryKey: ['situation-save', id, userId] });
  };

  if (situationQuery.isLoading || !situationQuery.data) {
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

  const situation = situationQuery.data;
  const isLocked = situation.is_premium && profile?.subscription_tier !== 'premium';

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
            {situation.title}
          </Text>
          <Text
            style={{
              fontFamily: 'Inter, system-ui, sans-serif',
              fontSize: 13,
              color: '#B08C57',
              marginBottom: 16,
            }}
          >
            This situation guide is a Premium feature.
          </Text>
          <TouchableOpacity onPress={() => setShowPaywall(true)}>
            <Text
              style={{
                fontFamily: 'Inter, system-ui, sans-serif',
                fontSize: 15,
                color: '#9B7343',
                fontWeight: '600',
              }}
            >
              Unlock with Premium →
            </Text>
          </TouchableOpacity>
        </Card>
      </ScrollView>
    );
  }

  if (isLocked && showPaywall) {
    return (
      <Paywall
        feature="This situation guide"
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
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: 12,
        }}
      >
        <Text
          style={{
            fontFamily: 'Georgia, serif',
            fontSize: 22,
            fontWeight: '700',
            color: '#3C3C3C',
            flex: 1,
            marginRight: 12,
          }}
        >
          {situation.title}
        </Text>
        <TouchableOpacity onPress={toggleSave}>
          <Text style={{ fontSize: 22 }}>{saveQuery.data ? '★' : '☆'}</Text>
        </TouchableOpacity>
      </View>

      <Card variant="elevated">
        <Text style={sectionLabelStyle}>The Situation</Text>
        <Text style={bodyStyle}>{situation.situation_body}</Text>

        <Text style={sectionLabelStyle}>Biblical Principle</Text>
        <Text style={bodyStyle}>{situation.biblical_principle}</Text>

        <Text style={sectionLabelStyle}>Scripture</Text>
        {situation.scripture_refs.map((ref) => (
          <Text
            key={ref}
            style={{ ...bodyStyle, fontFamily: 'Georgia, serif', fontStyle: 'italic' }}
          >
            {ref}
          </Text>
        ))}
        <View style={{ height: 8 }} />

        <Text style={sectionLabelStyle}>Practical Response</Text>
        <Text style={bodyStyle}>{situation.practical_response}</Text>

        <Text style={sectionLabelStyle}>Prayer</Text>
        <Text style={{ ...bodyStyle, fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>
          {situation.prayer}
        </Text>

        <Text style={sectionLabelStyle}>Reflect</Text>
        <Text style={{ ...bodyStyle, marginBottom: 0 }}>{situation.reflection_question}</Text>
      </Card>
    </ScrollView>
  );
}

const sectionLabelStyle = {
  fontFamily: 'Inter, system-ui, sans-serif',
  fontSize: 13,
  fontWeight: '600' as const,
  color: '#6F6F6F',
  textTransform: 'uppercase' as const,
  letterSpacing: 0.5,
  marginBottom: 8,
};

const bodyStyle = {
  fontFamily: 'Inter, system-ui, sans-serif',
  fontSize: 15,
  color: '#3C3C3C',
  lineHeight: 22,
  marginBottom: 16,
};
