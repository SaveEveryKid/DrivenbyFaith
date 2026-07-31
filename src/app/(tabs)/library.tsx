import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { SectionHeader } from '@/components/SectionHeader';
import { Card } from '@/components/Card';
import { EmptyState } from '@/components/EmptyState';
import { supabase } from '@/lib/supabase';
import type { Situation, ReadingPlan } from '@/types/database';

const CATEGORY_LABELS: Record<Situation['category'], string> = {
  customer: 'Customer',
  management: 'Management',
  coworker: 'Coworker',
  self: 'Self',
  family: 'Family',
  money: 'Money',
  ethics: 'Ethics',
};

export default function LibraryScreen(): React.ReactElement {
  const [search, setSearch] = useState('');

  const situationsQuery = useQuery({
    queryKey: ['situations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('situations')
        .select('*')
        .order('title', { ascending: true });
      if (error) throw error;
      return (data ?? []) as Situation[];
    },
  });

  const plansQuery = useQuery({
    queryKey: ['reading-plans'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reading_plans')
        .select('*')
        .order('title', { ascending: true });
      if (error) throw error;
      return (data ?? []) as ReadingPlan[];
    },
  });

  const filteredSituations = useMemo(() => {
    const situations = situationsQuery.data ?? [];
    const q = search.trim().toLowerCase();
    if (!q) return situations;
    return situations.filter(
      (s) => s.title.toLowerCase().includes(q) || s.situation_body.toLowerCase().includes(q),
    );
  }, [situationsQuery.data, search]);

  const groupedSituations = useMemo(() => {
    const groups = new Map<Situation['category'], Situation[]>();
    for (const situation of filteredSituations) {
      const list = groups.get(situation.category) ?? [];
      list.push(situation);
      groups.set(situation.category, list);
    }
    return groups;
  }, [filteredSituations]);

  if (situationsQuery.isLoading || plansQuery.isLoading) {
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
      contentContainerStyle={{ paddingBottom: 32 }}
    >
      <View style={{ padding: 16, paddingBottom: 0 }}>
        <Text
          style={{
            fontFamily: 'Georgia, serif',
            fontSize: 24,
            fontWeight: '700',
            color: '#3C3C3C',
            marginBottom: 16,
          }}
        >
          Library
        </Text>
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search situations…"
          placeholderTextColor="#9B9B9B"
          style={{
            fontFamily: 'Inter, system-ui, sans-serif',
            fontSize: 15,
            color: '#3C3C3C',
            backgroundColor: '#FFFFFF',
            borderWidth: 1,
            borderColor: '#E0D1B8',
            borderRadius: 10,
            paddingHorizontal: 14,
            paddingVertical: 10,
          }}
        />
      </View>

      {plansQuery.data && plansQuery.data.length > 0 && (
        <View>
          <SectionHeader title="Reading Plans" />
          <View style={{ paddingHorizontal: 16 }}>
            {plansQuery.data.map((plan) => (
              <TouchableOpacity
                key={plan.id}
                onPress={() => router.push(`/reading-plan/${plan.id}`)}
                style={{ marginBottom: 12 }}
              >
                <Card variant="elevated">
                  <Text
                    style={{
                      fontFamily: 'Georgia, serif',
                      fontSize: 17,
                      fontWeight: '600',
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
                        fontSize: 13,
                        color: '#9B9B9B',
                        marginBottom: 6,
                      }}
                    >
                      {plan.subtitle}
                    </Text>
                  )}
                  <Text
                    style={{
                      fontFamily: 'Inter, system-ui, sans-serif',
                      fontSize: 12,
                      color: '#B08C57',
                    }}
                  >
                    {plan.day_count} days{plan.is_premium ? ' · Premium' : ''}
                  </Text>
                </Card>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      <SectionHeader title="Situations" />
      {filteredSituations.length === 0 ? (
        <EmptyState icon="🔍" title="No results" subtitle="Try a different search term." />
      ) : (
        <View style={{ paddingHorizontal: 16 }}>
          {Array.from(groupedSituations.entries()).map(([category, situations]) => (
            <View key={category} style={{ marginBottom: 16 }}>
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
                {CATEGORY_LABELS[category]}
              </Text>
              {situations.map((situation) => (
                <TouchableOpacity
                  key={situation.id}
                  onPress={() => router.push(`/situation/${situation.id}`)}
                  style={{ marginBottom: 10 }}
                >
                  <Card>
                    <Text
                      style={{
                        fontFamily: 'Inter, system-ui, sans-serif',
                        fontSize: 15,
                        fontWeight: '600',
                        color: '#3C3C3C',
                        marginBottom: 4,
                      }}
                    >
                      {situation.title}
                    </Text>
                    <Text
                      style={{
                        fontFamily: 'Inter, system-ui, sans-serif',
                        fontSize: 13,
                        color: '#9B9B9B',
                      }}
                      numberOfLines={2}
                    >
                      {situation.situation_body}
                    </Text>
                  </Card>
                </TouchableOpacity>
              ))}
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}
