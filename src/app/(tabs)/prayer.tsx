import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Switch } from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { Card } from '@/components/Card';
import { PrimaryButton } from '@/components/PrimaryButton';
import { GhostButton } from '@/components/GhostButton';
import { TextField } from '@/components/TextField';
import { EmptyState } from '@/components/EmptyState';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import type { PrayerGroup } from '@/types/database';

function generateJoinCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export default function PrayerScreen(): React.ReactElement {
  const { session } = useAuthStore();
  const userId = session?.user.id;
  const queryClient = useQueryClient();

  const [mode, setMode] = useState<'list' | 'join' | 'create'>('list');
  const [joinCode, setJoinCode] = useState('');
  const [groupName, setGroupName] = useState('');
  const [groupDescription, setGroupDescription] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const groupsQuery = useQuery({
    queryKey: ['prayer-groups', userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data: memberships, error: memberError } = await supabase
        .from('prayer_group_members')
        .select('group_id')
        .eq('user_id', userId!);
      if (memberError) throw memberError;
      const groupIds = (memberships ?? []).map((m) => m.group_id);
      if (groupIds.length === 0) return [] as PrayerGroup[];
      const { data: groups, error: groupsError } = await supabase
        .from('prayer_groups')
        .select('*')
        .in('id', groupIds)
        .order('created_at', { ascending: false });
      if (groupsError) throw groupsError;
      return (groups ?? []) as PrayerGroup[];
    },
  });

  const resetForms = (): void => {
    setMode('list');
    setJoinCode('');
    setGroupName('');
    setGroupDescription('');
    setIsPrivate(false);
    setError(null);
  };

  const handleJoin = async (): Promise<void> => {
    if (!joinCode.trim()) return;
    setBusy(true);
    setError(null);
    const { data, error: rpcError } = await supabase.rpc('join_prayer_group_by_code', {
      p_join_code: joinCode.trim().toUpperCase(),
    });
    setBusy(false);
    if (rpcError || !data) {
      setError('No group found for that code.');
      return;
    }
    queryClient.invalidateQueries({ queryKey: ['prayer-groups', userId] });
    resetForms();
    router.push(`/prayer-group/${data.id}`);
  };

  const handleCreate = async (): Promise<void> => {
    if (!groupName.trim() || !userId) return;
    setBusy(true);
    setError(null);
    const { data: group, error: createError } = await supabase
      .from('prayer_groups')
      .insert({
        name: groupName.trim(),
        description: groupDescription.trim() || null,
        join_code: generateJoinCode(),
        created_by: userId,
        is_private: isPrivate,
      })
      .select('*')
      .single();

    if (createError || !group) {
      setBusy(false);
      setError('Could not create group. Please try again.');
      return;
    }

    await supabase.from('prayer_group_members').insert({
      group_id: group.id,
      user_id: userId,
      role: 'leader',
    });

    setBusy(false);
    queryClient.invalidateQueries({ queryKey: ['prayer-groups', userId] });
    resetForms();
    router.push(`/prayer-group/${group.id}`);
  };

  if (groupsQuery.isLoading) {
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

  const groups = groupsQuery.data ?? [];

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
        Prayer
      </Text>

      {mode === 'list' && (
        <>
          {groups.length === 0 ? (
            <EmptyState
              icon="🙏"
              title="No prayer groups yet"
              subtitle="Join a group with a code, or start your own."
            />
          ) : (
            groups.map((group) => (
              <TouchableOpacity
                key={group.id}
                onPress={() => router.push(`/prayer-group/${group.id}`)}
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
                    {group.name}
                  </Text>
                  {group.description && (
                    <Text
                      style={{
                        fontFamily: 'Inter, system-ui, sans-serif',
                        fontSize: 13,
                        color: '#9B9B9B',
                      }}
                      numberOfLines={2}
                    >
                      {group.description}
                    </Text>
                  )}
                </Card>
              </TouchableOpacity>
            ))
          )}

          <View style={{ flexDirection: 'row', marginTop: 12 }}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <GhostButton title="Join with Code" onPress={() => setMode('join')} />
            </View>
            <View style={{ flex: 1 }}>
              <GhostButton title="Create Group" onPress={() => setMode('create')} />
            </View>
          </View>
        </>
      )}

      {mode === 'join' && (
        <Card variant="elevated">
          <Text
            style={{
              fontFamily: 'Inter, system-ui, sans-serif',
              fontSize: 15,
              fontWeight: '600',
              color: '#3C3C3C',
              marginBottom: 12,
            }}
          >
            Join a group
          </Text>
          <TextField
            label="Join Code"
            value={joinCode}
            onChangeText={setJoinCode}
            autoCapitalize="characters"
            placeholder="ABC123"
          />
          {error && (
            <Text
              style={{
                fontFamily: 'Inter, system-ui, sans-serif',
                fontSize: 13,
                color: '#C44E4E',
                marginBottom: 12,
              }}
            >
              {error}
            </Text>
          )}
          <PrimaryButton title="Join" onPress={handleJoin} loading={busy} />
          <View style={{ height: 8 }} />
          <GhostButton title="Cancel" onPress={resetForms} />
        </Card>
      )}

      {mode === 'create' && (
        <Card variant="elevated">
          <Text
            style={{
              fontFamily: 'Inter, system-ui, sans-serif',
              fontSize: 15,
              fontWeight: '600',
              color: '#3C3C3C',
              marginBottom: 12,
            }}
          >
            Create a group
          </Text>
          <TextField
            label="Group Name"
            value={groupName}
            onChangeText={setGroupName}
            placeholder="Floor Team Prayer"
          />
          <TextField
            label="Description (optional)"
            value={groupDescription}
            onChangeText={setGroupDescription}
            placeholder="What's this group for?"
            multiline
          />
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 16,
            }}
          >
            <Text
              style={{ fontFamily: 'Inter, system-ui, sans-serif', fontSize: 15, color: '#3C3C3C' }}
            >
              Private group
            </Text>
            <Switch
              value={isPrivate}
              onValueChange={setIsPrivate}
              trackColor={{ true: '#9B7343' }}
            />
          </View>
          {error && (
            <Text
              style={{
                fontFamily: 'Inter, system-ui, sans-serif',
                fontSize: 13,
                color: '#C44E4E',
                marginBottom: 12,
              }}
            >
              {error}
            </Text>
          )}
          <PrimaryButton title="Create" onPress={handleCreate} loading={busy} />
          <View style={{ height: 8 }} />
          <GhostButton title="Cancel" onPress={resetForms} />
        </Card>
      )}
    </ScrollView>
  );
}
