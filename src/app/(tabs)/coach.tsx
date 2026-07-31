import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { EmptyState } from '@/components/EmptyState';
import { Paywall } from '@/components/Paywall';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import type { CoachMessage } from '@/types/database';

export default function CoachScreen(): React.ReactElement {
  const { session, profile } = useAuthStore();
  const userId = session?.user.id;
  const queryClient = useQueryClient();
  const scrollRef = useRef<ScrollView>(null);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [limitReached, setLimitReached] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const conversationQuery = useQuery({
    queryKey: ['coach-conversation', userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error: convError } = await supabase
        .from('coach_conversations')
        .select('*')
        .eq('user_id', userId!)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (convError) throw convError;
      return data;
    },
  });

  const conversationId = conversationQuery.data?.id ?? null;

  const messagesQuery = useQuery({
    queryKey: ['coach-messages', conversationId],
    enabled: !!conversationId,
    queryFn: async () => {
      const { data, error: msgError } = await supabase
        .from('coach_messages')
        .select('*')
        .eq('conversation_id', conversationId!)
        .order('created_at', { ascending: true });
      if (msgError) throw msgError;
      return (data ?? []) as CoachMessage[];
    },
  });

  const messages = messagesQuery.data ?? [];

  useEffect(() => {
    scrollRef.current?.scrollToEnd({ animated: true });
  }, [messages.length]);

  const handleSend = async (): Promise<void> => {
    const text = input.trim();
    if (!text || sending || !userId) return;
    setError(null);
    setSending(true);

    try {
      let activeConversationId = conversationId;
      if (!activeConversationId) {
        const { data: newConversation, error: createError } = await supabase
          .from('coach_conversations')
          .insert({ user_id: userId })
          .select('id')
          .single();
        if (createError || !newConversation)
          throw createError ?? new Error('Could not start conversation');
        activeConversationId = newConversation.id;
        queryClient.setQueryData(['coach-conversation', userId], { id: activeConversationId });
      }

      setInput('');

      const { data, error: invokeError } = await supabase.functions.invoke('coach', {
        body: { conversation_id: activeConversationId, message: text },
      });

      if (invokeError) {
        const status = (invokeError as { context?: { status?: number } }).context?.status;
        if (status === 429) {
          setLimitReached(true);
        } else {
          setError('Something went wrong. Please try again.');
        }
        return;
      }

      void data;
      queryClient.invalidateQueries({ queryKey: ['coach-messages', activeConversationId] });
    } finally {
      setSending(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: '#FDFBF7' }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={80}
    >
      {messages.length === 0 ? (
        <EmptyState
          icon="💬"
          title="AI Coach"
          subtitle="Ask about a situation on the floor. Get biblical guidance, grounded in Scripture."
        />
      ) : (
        <ScrollView ref={scrollRef} contentContainerStyle={{ padding: 16 }}>
          {messages.map((msg) => (
            <View
              key={msg.id}
              style={{
                alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                backgroundColor: msg.role === 'user' ? '#9B7343' : '#FFFFFF',
                borderWidth: msg.role === 'user' ? 0 : 1,
                borderColor: '#E0D1B8',
                borderRadius: 14,
                paddingVertical: 10,
                paddingHorizontal: 14,
                marginBottom: 10,
                maxWidth: '85%',
              }}
            >
              <Text
                style={{
                  fontFamily: 'Inter, system-ui, sans-serif',
                  fontSize: 15,
                  lineHeight: 21,
                  color: msg.role === 'user' ? '#FFFFFF' : '#3C3C3C',
                }}
              >
                {msg.content}
              </Text>
            </View>
          ))}
          {sending && (
            <View style={{ alignSelf: 'flex-start', marginBottom: 10 }}>
              <ActivityIndicator color="#9B7343" />
            </View>
          )}
        </ScrollView>
      )}

      {limitReached && (
        <Paywall
          feature="Unlimited coaching"
          onSubscribe={() => setLimitReached(false)}
          onDismiss={() => setLimitReached(false)}
        />
      )}

      {!limitReached && (
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            padding: 12,
            borderTopWidth: 1,
            borderTopColor: '#E0D1B8',
            backgroundColor: '#FDFBF7',
          }}
        >
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder="Ask the coach…"
            placeholderTextColor="#9B9B9B"
            multiline
            style={{
              flex: 1,
              fontFamily: 'Inter, system-ui, sans-serif',
              fontSize: 15,
              color: '#3C3C3C',
              backgroundColor: '#FFFFFF',
              borderWidth: 1,
              borderColor: '#E0D1B8',
              borderRadius: 20,
              paddingHorizontal: 16,
              paddingVertical: 10,
              maxHeight: 100,
              marginRight: 8,
            }}
          />
          <TouchableOpacity
            onPress={handleSend}
            disabled={sending || !input.trim()}
            style={{
              backgroundColor: '#9B7343',
              width: 44,
              height: 44,
              borderRadius: 22,
              alignItems: 'center',
              justifyContent: 'center',
              opacity: sending || !input.trim() ? 0.5 : 1,
            }}
          >
            <Text style={{ color: '#FFFFFF', fontSize: 18 }}>↑</Text>
          </TouchableOpacity>
        </View>
      )}

      {error && (
        <Text
          style={{
            fontFamily: 'Inter, system-ui, sans-serif',
            fontSize: 12,
            color: '#C44E4E',
            textAlign: 'center',
            paddingBottom: 8,
          }}
        >
          {error}
        </Text>
      )}

      {profile?.subscription_tier === 'free' && !limitReached && (
        <Text
          style={{
            fontFamily: 'Inter, system-ui, sans-serif',
            fontSize: 11,
            color: '#9B9B9B',
            textAlign: 'center',
            paddingBottom: 8,
          }}
        >
          Free plan: 5 messages/day
        </Text>
      )}
    </KeyboardAvoidingView>
  );
}
