import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Switch } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card } from '@/components/Card';
import { PrimaryButton } from '@/components/PrimaryButton';
import { GhostButton } from '@/components/GhostButton';
import { TextField } from '@/components/TextField';
import { EmptyState } from '@/components/EmptyState';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import type { PrayerGroup, PrayerRequestSafe } from '@/types/database';

export default function PrayerGroupDetailScreen(): React.ReactElement {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { session } = useAuthStore();
  const userId = session?.user.id;
  const queryClient = useQueryClient();

  const [composing, setComposing] = useState(false);
  const [body, setBody] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isPraise, setIsPraise] = useState(false);
  const [busy, setBusy] = useState(false);

  const groupQuery = useQuery({
    queryKey: ['prayer-group', id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('prayer_groups')
        .select('*')
        .eq('id', id!)
        .single();
      if (error) throw error;
      return data as PrayerGroup;
    },
  });

  const requestsQuery = useQuery({
    queryKey: ['prayer-requests', id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('prayer_requests_safe')
        .select('*')
        .eq('group_id', id!)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as PrayerRequestSafe[];
    },
  });

  const myInteractionsQuery = useQuery({
    queryKey: ['prayer-interactions', id, userId],
    enabled: !!id && !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('prayer_interactions')
        .select('request_id')
        .eq('user_id', userId!);
      if (error) throw error;
      return new Set((data ?? []).map((i) => i.request_id));
    },
  });

  const handlePost = async (): Promise<void> => {
    if (!body.trim() || !userId || !id) return;
    setBusy(true);
    await supabase.from('prayer_requests').insert({
      group_id: id,
      user_id: userId,
      body: body.trim(),
      is_anonymous: isAnonymous,
      is_praise: isPraise,
    });
    setBusy(false);
    setBody('');
    setIsAnonymous(false);
    setIsPraise(false);
    setComposing(false);
    queryClient.invalidateQueries({ queryKey: ['prayer-requests', id] });
  };

  const handlePray = async (requestId: string): Promise<void> => {
    if (!userId) return;
    await supabase.from('prayer_interactions').insert({ request_id: requestId, user_id: userId });
    queryClient.invalidateQueries({ queryKey: ['prayer-interactions', id, userId] });
  };

  if (groupQuery.isLoading || !groupQuery.data) {
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

  const group = groupQuery.data;
  const requests = requestsQuery.data ?? [];
  const prayedFor = myInteractionsQuery.data ?? new Set<string>();

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
        {group.name}
      </Text>
      <Text
        style={{
          fontFamily: 'Inter, system-ui, sans-serif',
          fontSize: 13,
          color: '#9B9B9B',
          marginBottom: 4,
        }}
      >
        Join code: {group.join_code}
      </Text>
      {group.description && (
        <Text
          style={{
            fontFamily: 'Inter, system-ui, sans-serif',
            fontSize: 14,
            color: '#6F6F6F',
            marginBottom: 16,
          }}
        >
          {group.description}
        </Text>
      )}

      {!composing ? (
        <PrimaryButton title="Share a Prayer Request" onPress={() => setComposing(true)} />
      ) : (
        <Card variant="elevated">
          <TextField
            value={body}
            onChangeText={setBody}
            placeholder="What's on your heart?"
            multiline
            numberOfLines={3}
            style={{ minHeight: 80, textAlignVertical: 'top' }}
          />
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 12,
            }}
          >
            <Text
              style={{ fontFamily: 'Inter, system-ui, sans-serif', fontSize: 14, color: '#3C3C3C' }}
            >
              Post anonymously
            </Text>
            <Switch
              value={isAnonymous}
              onValueChange={setIsAnonymous}
              trackColor={{ true: '#9B7343' }}
            />
          </View>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 16,
            }}
          >
            <Text
              style={{ fontFamily: 'Inter, system-ui, sans-serif', fontSize: 14, color: '#3C3C3C' }}
            >
              This is a praise report
            </Text>
            <Switch value={isPraise} onValueChange={setIsPraise} trackColor={{ true: '#9B7343' }} />
          </View>
          <PrimaryButton title="Post" onPress={handlePost} loading={busy} />
          <View style={{ height: 8 }} />
          <GhostButton title="Cancel" onPress={() => setComposing(false)} />
        </Card>
      )}

      <View style={{ height: 16 }} />

      {requests.length === 0 ? (
        <EmptyState icon="🙏" title="No requests yet" subtitle="Be the first to share." />
      ) : (
        requests.map((request) => (
          <Card key={request.id} variant="elevated" style={{ marginBottom: 12 }}>
            {request.is_praise && (
              <Text
                style={{
                  fontFamily: 'Inter, system-ui, sans-serif',
                  fontSize: 11,
                  fontWeight: '600',
                  color: '#5F6E48',
                  marginBottom: 6,
                  textTransform: 'uppercase',
                }}
              >
                Praise Report
              </Text>
            )}
            <Text
              style={{
                fontFamily: 'Inter, system-ui, sans-serif',
                fontSize: 15,
                color: '#3C3C3C',
                lineHeight: 21,
                marginBottom: 10,
              }}
            >
              {request.body}
            </Text>
            {request.is_answered && request.answered_note && (
              <Text
                style={{
                  fontFamily: 'Inter, system-ui, sans-serif',
                  fontSize: 13,
                  color: '#5F6E48',
                  fontStyle: 'italic',
                  marginBottom: 10,
                }}
              >
                Answered: {request.answered_note}
              </Text>
            )}
            <TouchableOpacity
              onPress={() => handlePray(request.id)}
              disabled={prayedFor.has(request.id)}
              style={{
                alignSelf: 'flex-start',
                backgroundColor: prayedFor.has(request.id) ? '#F4F6F1' : '#FFFFFF',
                borderWidth: 1,
                borderColor: '#E0D1B8',
                borderRadius: 16,
                paddingHorizontal: 12,
                paddingVertical: 6,
              }}
            >
              <Text
                style={{
                  fontFamily: 'Inter, system-ui, sans-serif',
                  fontSize: 13,
                  color: prayedFor.has(request.id) ? '#5F6E48' : '#6F6F6F',
                }}
              >
                {prayedFor.has(request.id) ? '🙏 Praying' : "I'm praying for this"}
              </Text>
            </TouchableOpacity>
          </Card>
        ))
      )}
    </ScrollView>
  );
}
