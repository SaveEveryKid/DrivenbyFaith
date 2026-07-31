import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Animated,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { ScriptureBlock } from '@/components/ScriptureBlock';
import { Paywall } from '@/components/Paywall';
import { EmptyState } from '@/components/EmptyState';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/hooks/useAuth';
import {
  useCoachConversations,
  useCoachMessages,
  useCreateConversation,
  useSendMessage,
  useCoachUsage,
  useDeleteConversation,
  RateLimitError,
} from '@/hooks/useCoach';
import { useSituationDetail } from '@/hooks/useSituations';
import { useDebriefDetail, debriefToText } from '@/hooks/useDebrief';
import type { CoachMessageRow } from '@/types/database';
import type { ConversationListItem } from '@/hooks/useCoach';
import { UIFontFamily, ScriptureFontFamily } from '@/constants/theme';

// ─── Suggestion chips ────────────────────────────────────────────────────────

const SUGGESTION_CHIPS = [
  "I'm struggling with integrity pressure on a deal",
  "How do I serve a customer I can't stand?",
] as const;

// ─── Typing indicator ────────────────────────────────────────────────────────

function TypingIndicator({ palette }: { palette: { inkDim: string } }): React.ReactElement {
  const dots = useRef([new Animated.Value(0), new Animated.Value(0), new Animated.Value(0)]).current;

  useEffect(() => {
    const animations = dots.map((dot, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 200),
          Animated.timing(dot, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(dot, {
            toValue: 0,
            duration: 400,
            useNativeDriver: true,
          }),
        ]),
      ),
    );
    Animated.parallel(animations).start();
    return () => {
      animations.forEach((a) => a.stop());
    };
  }, [dots]);

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 16 }}>
      {dots.map((dot, i) => (
        <Animated.View
          key={i}
          style={{
            width: 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: palette.inkDim,
            marginHorizontal: 3,
            opacity: dot.interpolate({
              inputRange: [0, 1],
              outputRange: [0.3, 1],
            }),
            transform: [
              {
                scale: dot.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.8, 1.2],
                }),
              },
            ],
          }}
        />
      ))}
    </View>
  );
}

// ─── Message bubble ──────────────────────────────────────────────────────────

function MessageBubble({
  msg,
  palette,
  typography,
}: {
  msg: CoachMessageRow;
  palette: ReturnType<typeof useTheme>['palette'];
  typography: ReturnType<typeof useTheme>['typography'];
}): React.ReactElement {
  const isUser = msg.role === 'user';

  return (
    <View
      style={{
        alignSelf: isUser ? 'flex-end' : 'flex-start',
        maxWidth: '80%',
        marginVertical: 6,
        marginHorizontal: 16,
      }}
      accessibilityLabel={isUser ? 'Your message' : 'Coach message'}
    >
      <View
        style={{
          backgroundColor: isUser ? '#EDE7DD' : palette.surface,
          borderRadius: 14,
          paddingHorizontal: 16,
          paddingVertical: 12,
          borderWidth: isUser ? 0 : 1,
          borderColor: isUser ? 'transparent' : palette.line,
        }}
      >
        {/* Render content, detecting Scripture references for special styling */}
        <MessageContent
          content={msg.content}
          scriptureRefs={msg.scripture_refs}
          isUser={isUser}
          palette={palette}
          typography={typography}
        />
      </View>
    </View>
  );
}

// ─── Message content with Scripture detection ────────────────────────────────

function MessageContent({
  content,
  scriptureRefs,
  isUser,
  palette,
  typography,
}: {
  content: string;
  scriptureRefs: string[] | null;
  isUser: boolean;
  palette: ReturnType<typeof useTheme>['palette'];
  typography: ReturnType<typeof useTheme>['typography'];
}): React.ReactElement {
  // Rough Scripture detection: look for lines containing verse references
  const parts = splitScriptureContent(content, scriptureRefs);

  return (
    <View>
      {parts.map((part, idx) => {
        if (part.type === 'scripture') {
          return (
            <View
              key={idx}
              style={{
                marginVertical: 8,
                paddingLeft: 12,
                borderLeftWidth: 3,
                borderLeftColor: palette.clay,
              }}
            >
              <Text
                style={{
                  fontFamily: ScriptureFontFamily,
                  fontSize: typography.scripture.sizes.small,
                  lineHeight:
                    typography.scripture.sizes.small * typography.scripture.lineHeight,
                  color: palette.scripture,
                  fontStyle: 'italic',
                }}
              >
                {part.text}
              </Text>
            </View>
          );
        }

        return (
          <Text
            key={idx}
            style={{
              fontFamily: UIFontFamily,
              fontSize: typography.ui.sizes.base,
              lineHeight: 22,
              color: isUser ? '#3C3C3C' : palette.ink,
            }}
          >
            {part.text}
          </Text>
        );
      })}
    </View>
  );
}

// ─── Scripture content splitter ──────────────────────────────────────────────

interface ContentPart {
  type: 'text' | 'scripture';
  text: string;
}

function splitScriptureContent(
  content: string,
  scriptureRefs: string[] | null,
): ContentPart[] {
  if (!scriptureRefs || scriptureRefs.length === 0) {
    return [{ type: 'text', text: content }];
  }

  // Build regex from known references
  const refPattern = scriptureRefs
    .map((ref) => ref.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    .join('|');

  const regex = new RegExp(`(${refPattern})`, 'g');
  const parts: ContentPart[] = [];
  let lastIdx = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(content)) !== null) {
    // Text before the reference
    if (match.index > lastIdx) {
      const before = content.slice(lastIdx, match.index).trim();
      if (before) {
        const lastPart = parts[parts.length - 1];
        if (lastPart && lastPart.type === 'text') {
          lastPart.text += '\n\n' + before;
        } else {
          parts.push({ type: 'text', text: before });
        }
      }
    }

    // Find the scripture text after the reference (up to next ref or end)
    const refEnd = match.index + match[0].length;
    const after = content.slice(refEnd);
    const nextRefRegex = new RegExp(`(${refPattern})`);
    const nextMatch = nextRefRegex.exec(after);
    const scriptureText = nextMatch
      ? after.slice(0, nextMatch.index).trim()
      : after.trim();

    parts.push({
      type: 'scripture',
      text: scriptureText || match[0],
    });

    lastIdx = nextMatch ? refEnd + nextMatch.index : content.length;

    // Reset regex state for the sliced content
    regex.lastIndex = lastIdx;
  }

  // Remaining text
  if (lastIdx < content.length) {
    const remaining = content.slice(lastIdx).trim();
    if (remaining) {
      parts.push({ type: 'text', text: remaining });
    }
  }

  return parts.length > 0 ? parts : [{ type: 'text', text: content }];
}

// ─── Past Conversations Modal ────────────────────────────────────────────────

function PastConversationsModal({
  visible,
  onClose,
  conversations,
  isLoading,
  onSelect,
  onDelete,
  isDeleting,
  palette,
  typography,
}: {
  visible: boolean;
  onClose: () => void;
  conversations: ConversationListItem[];
  isLoading: boolean;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  isDeleting: boolean;
  palette: ReturnType<typeof useTheme>['palette'];
  typography: ReturnType<typeof useTheme>['typography'];
}): React.ReactElement {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={{ flex: 1, backgroundColor: palette.bg }}>
        {/* Header */}
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingHorizontal: 20,
            paddingVertical: 16,
            borderBottomWidth: 1,
            borderBottomColor: palette.line,
          }}
        >
          <Text
            style={{
              fontFamily: typography.scripture.fontFamily,
              fontSize: typography.ui.sizes.xl,
              fontWeight: '600',
              color: palette.ink,
            }}
          >
            Past Conversations
          </Text>
          <TouchableOpacity onPress={onClose} accessibilityLabel="Close past conversations">
            <Text
              style={{
                fontFamily: UIFontFamily,
                fontSize: typography.ui.sizes.base,
                color: palette.muted,
              }}
            >
              Done
            </Text>
          </TouchableOpacity>
        </View>

        {isLoading ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <ActivityIndicator color={palette.clay} size="small" />
          </View>
        ) : conversations.length === 0 ? (
          <EmptyState
            icon="💬"
            title="No conversations yet"
            subtitle="Your conversations with the Coach will appear here."
          />
        ) : (
          <FlatList
            data={conversations}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ paddingVertical: 8 }}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => onSelect(item.id)}
                onLongPress={() => {
                  Alert.alert(
                    'Delete conversation',
                    'Are you sure you want to delete this conversation?',
                    [
                      { text: 'Cancel', style: 'cancel' },
                      {
                        text: 'Delete',
                        style: 'destructive',
                        onPress: () => onDelete(item.id),
                      },
                    ],
                  );
                }}
                disabled={isDeleting}
                accessibilityLabel={`Conversation: ${item.title ?? 'Untitled'}`}
                style={{
                  paddingHorizontal: 20,
                  paddingVertical: 14,
                  borderBottomWidth: 1,
                  borderBottomColor: palette.line,
                }}
              >
                <Text
                  style={{
                    fontFamily: UIFontFamily,
                    fontSize: typography.ui.sizes.base,
                    fontWeight: '500',
                    color: palette.ink,
                    marginBottom: 4,
                  }}
                  numberOfLines={1}
                >
                  {item.title ?? 'New conversation'}
                </Text>
                <View style={{ flexDirection: 'row', gap: 12 }}>
                  <Text
                    style={{
                      fontFamily: UIFontFamily,
                      fontSize: typography.ui.sizes.xs,
                      color: palette.inkDim,
                    }}
                  >
                    {item.message_count} message{item.message_count !== 1 ? 's' : ''}
                  </Text>
                  {item.last_message_at && (
                    <Text
                      style={{
                        fontFamily: UIFontFamily,
                        fontSize: typography.ui.sizes.xs,
                        color: palette.inkDim,
                      }}
                    >
                      {formatRelativeDate(item.last_message_at)}
                    </Text>
                  )}
                </View>
              </TouchableOpacity>
            )}
          />
        )}
      </View>
    </Modal>
  );
}

// ─── Date formatter ──────────────────────────────────────────────────────────

function formatRelativeDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// ─── Build context message from situation ────────────────────────────────────

function buildSituationContext(
  situation: NonNullable<ReturnType<typeof useSituationDetail>['situation']>,
): string {
  const parts: string[] = [
    `I'd like to talk about this situation: "${situation.title}"`,
    '',
    situation.situation_body,
  ];

  if (situation.biblical_principle) {
    parts.push('', `Biblical principle I'm reflecting on: ${situation.biblical_principle}`);
  }

  if (situation.reflection_question) {
    parts.push('', `My question: ${situation.reflection_question}`);
  }

  return parts.join('\n');
}

// ─── Main coach screen ───────────────────────────────────────────────────────

export default function CoachScreen(): React.ReactElement {
  const { palette, typography } = useTheme();
  const { user } = useAuth();
  const params = useLocalSearchParams<{ context?: string; id?: string }>();

  // Existing conversation state
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [hasStartedConversation, setHasStartedConversation] = useState(false);

  // Past conversations modal
  const [showPastConversations, setShowPastConversations] = useState(false);

  // Input state
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);

  // Paywall state
  const [showPaywall, setShowPaywall] = useState(false);

  // Flashing FlatList ref
  const flatListRef = useRef<FlatList>(null);

  // Hooks
  const { conversations, isLoading: convsLoading, refresh: refreshConvs } = useCoachConversations();
  const { messages, isLoading: msgsLoading } = useCoachMessages(activeConversationId);
  const { createConversation, isCreating } = useCreateConversation();
  const { sendMessage, isStreaming, streamingContent, cancelStream } =
    useSendMessage();
  const { usage, isLoading: usageLoading } = useCoachUsage();
  const { deleteConversation, isDeleting } = useDeleteConversation();

  // Context-aware entry: situation slug
  const contextSlug = params.context && params.context !== 'debrief' ? params.context : null;
  const { situation } = useSituationDetail(contextSlug ?? '');

  // Context-aware entry: debrief
  const debriefId = params.context === 'debrief' ? params.id : null;
  const { debrief } = useDebriefDetail(debriefId ?? '');

  // Auto-create conversation from context
  const contextSeededRef = useRef(false);

  useEffect(() => {
    if (contextSeededRef.current) return;
    if (!user) return;

    const seedContext = async (): Promise<void> => {
      let contextMessage: string | null = null;

      if (situation && contextSlug) {
        contextMessage = buildSituationContext(situation);
      } else if (debrief && debriefId) {
        contextMessage =
          `I'd like to debrief a day with the Coach. Here's my debrief:\n\n${debriefToText(debrief)}`;
      }

      if (contextMessage) {
        contextSeededRef.current = true;
        try {
          const conv = await createConversation(
            contextSlug
              ? `Situation: ${situation?.title ?? contextSlug}`
              : `Debrief: ${new Date(debrief?.debrief_date ?? '').toLocaleDateString()}`,
          );
          setActiveConversationId(conv.id);
          setHasStartedConversation(true);
          // Auto-send the context as the first message
          await sendMessage(conv.id, contextMessage);
        } catch (err) {
          if (err instanceof RateLimitError) {
            setShowPaywall(true);
          } else {
            Alert.alert(
              'Could not start conversation',
              'Something went wrong. Please try again.',
            );
          }
        }
      }
    };

    seedContext();
  }, [
    situation,
    contextSlug,
    debrief,
    debriefId,
    user,
    createConversation,
    sendMessage,
  ]);

  // Scroll to bottom when messages change or streaming content updates
  useEffect(() => {
    if (messages.length > 0 || streamingContent) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 150);
    }
  }, [messages, streamingContent]);

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handleNewConversation = useCallback(async () => {
    if (!user) return;
    if (usage.messagesUsedThisMonth >= usage.limit) {
      setShowPaywall(true);
      return;
    }

    try {
      const conv = await createConversation();
      setActiveConversationId(conv.id);
      setHasStartedConversation(true);
    } catch {
      Alert.alert('Error', 'Could not create a new conversation. Please try again.');
    }
  }, [user, usage, createConversation]);

  const handleSelectConversation = useCallback((id: string) => {
    setActiveConversationId(id);
    setHasStartedConversation(true);
    setShowPastConversations(false);
  }, []);

  const handleDeleteConversation = useCallback(
    async (id: string) => {
      try {
        await deleteConversation(id);
        if (activeConversationId === id) {
          setActiveConversationId(null);
          setHasStartedConversation(false);
        }
        refreshConvs();
      } catch {
        Alert.alert('Error', 'Could not delete conversation. Please try again.');
      }
    },
    [deleteConversation, activeConversationId, refreshConvs],
  );

  const handleSend = useCallback(async () => {
    const trimmed = inputText.trim();
    if (!trimmed || isSending || isStreaming) return;
    if (usage.messagesUsedThisMonth >= usage.limit) {
      setShowPaywall(true);
      return;
    }

    setInputText('');
    setIsSending(true);

    try {
      if (!activeConversationId) {
        const conv = await createConversation();
        setActiveConversationId(conv.id);
        setHasStartedConversation(true);
        await sendMessage(conv.id, trimmed);
      } else {
        await sendMessage(activeConversationId, trimmed);
      }
      refreshConvs();
    } catch (err) {
      if (err instanceof RateLimitError) {
        setShowPaywall(true);
      } else {
        Alert.alert(
          'Could not reach the Coach',
          'Could not reach the Coach. Try again.',
        );
      }
    } finally {
      setIsSending(false);
    }
  }, [
    inputText,
    isSending,
    isStreaming,
    usage,
    activeConversationId,
    createConversation,
    sendMessage,
    refreshConvs,
  ]);

  const handleSuggestionTap = useCallback(
    async (suggestion: string) => {
      if (usage.messagesUsedThisMonth >= usage.limit) {
        setShowPaywall(true);
        return;
      }

      setIsSending(true);

      try {
        let convId = activeConversationId;
        if (!convId) {
          const conv = await createConversation();
          convId = conv.id;
          setActiveConversationId(conv.id);
          setHasStartedConversation(true);
        }
        // Set input to suggestion so it appears, then send
        setInputText('');
        // Use a separate send via the same path
        await sendMessage(convId, suggestion);
        refreshConvs();
      } catch (err) {
        if (err instanceof RateLimitError) {
          setShowPaywall(true);
        } else {
          Alert.alert(
            'Could not reach the Coach',
            'Could not reach the Coach. Try again.',
          );
        }
      } finally {
        setIsSending(false);
      }
    },
    [
      usage,
      activeConversationId,
      createConversation,
      sendMessage,
      refreshConvs,
    ],
  );

  // ── Compute messages for display (include streaming content) ────────────────

  const displayMessages: CoachMessageRow[] = React.useMemo(() => {
    if (!isStreaming || !streamingContent) return messages;

    // Check if we already have an assistant message at the end
    const lastMsg = messages[messages.length - 1];
    if (lastMsg && lastMsg.role === 'assistant' && lastMsg.id.startsWith('temp-assistant-')) {
      // Replace streaming content in the last message
      return [
        ...messages.slice(0, -1),
        { ...lastMsg, content: streamingContent },
      ];
    }

    // Add a temporary streaming message
    return [
      ...messages,
      {
        id: 'streaming-temp',
        conversation_id: activeConversationId ?? '',
        role: 'assistant',
        content: streamingContent,
        scripture_refs: null,
        created_at: new Date().toISOString(),
      },
    ];
  }, [messages, isStreaming, streamingContent, activeConversationId]);

  // ── Usage header ───────────────────────────────────────────────────────────

  const usageLabel = usage.isPremium
    ? `${usage.messagesUsedThisMonth} of ${usage.limit} messages this month`
    : `${usage.messagesUsedThisMonth} of ${usage.limit} free messages this month`;

  const usagePercent = Math.min(usage.messagesUsedThisMonth / usage.limit, 1);
  const usageBarColor =
    usagePercent >= 1 ? palette.inkDim : usagePercent >= 0.8 ? palette.brass : palette.sage;

  // ── Paywall gate ───────────────────────────────────────────────────────────

  if (showPaywall) {
    return (
      <Paywall
        feature="Unlimited Coach conversations"
        onSubscribe={() => {
          Alert.alert(
            'Subscribe',
            'Premium subscription will be available when RevenueCat is configured.',
          );
          setShowPaywall(false);
        }}
        onDismiss={() => setShowPaywall(false)}
      />
    );
  }

  // ── Empty / welcome state ──────────────────────────────────────────────────

  if (!hasStartedConversation && !isCreating) {
    return (
      <View style={{ flex: 1, backgroundColor: palette.bg }}>
        {/* Header */}
        <View
          style={{
            paddingHorizontal: 20,
            paddingTop: 60,
            paddingBottom: 16,
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontFamily: typography.scripture.fontFamily,
                fontSize: typography.ui.sizes['2xl'],
                fontWeight: '600',
                color: palette.ink,
              }}
            >
              Coach
            </Text>
            {!usageLoading && (
              <View style={{ marginTop: 6 }}>
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <View
                    style={{
                      flex: 1,
                      height: 4,
                      backgroundColor: palette.line,
                      borderRadius: 2,
                      overflow: 'hidden',
                    }}
                  >
                    <View
                      style={{
                        height: '100%',
                        width: `${usagePercent * 100}%`,
                        backgroundColor: usageBarColor,
                        borderRadius: 2,
                      }}
                    />
                  </View>
                  <Text
                    style={{
                      fontFamily: UIFontFamily,
                      fontSize: typography.ui.sizes.xs,
                      color: palette.muted,
                    }}
                  >
                    {usageLabel}
                  </Text>
                </View>
              </View>
            )}
          </View>
          <TouchableOpacity
            onPress={() => setShowPastConversations(true)}
            accessibilityLabel="View past conversations"
            style={{ paddingLeft: 16, paddingVertical: 4 }}
          >
            <Text style={{ fontSize: 22, color: palette.muted }}>☰</Text>
          </TouchableOpacity>
        </View>

        {/* Welcome */}
        <View
          style={{
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            paddingHorizontal: 32,
          }}
        >
          <Text style={{ fontSize: 48, marginBottom: 16 }}>✝</Text>
          <Text
            style={{
              fontFamily: typography.scripture.fontFamily,
              fontSize: typography.ui.sizes.xl,
              fontWeight: '600',
              color: palette.ink,
              textAlign: 'center',
              marginBottom: 16,
            }}
          >
            I'm here to help you walk with God through the pressures of the floor.
          </Text>
          <Text
            style={{
              fontFamily: UIFontFamily,
              fontSize: typography.ui.sizes.base,
              color: palette.muted,
              textAlign: 'center',
              lineHeight: 22,
              marginBottom: 32,
            }}
          >
            Ask me anything — a situation, a Scripture, a struggle.
          </Text>

          {/* Suggestion chips */}
          <View style={{ gap: 10, width: '100%' }}>
            {SUGGESTION_CHIPS.map((chip) => (
              <TouchableOpacity
                key={chip}
                onPress={() => handleSuggestionTap(chip)}
                disabled={isSending}
                accessibilityLabel={`Ask: ${chip}`}
                style={{
                  backgroundColor: palette.surface,
                  borderRadius: 12,
                  paddingHorizontal: 18,
                  paddingVertical: 14,
                  borderWidth: 1,
                  borderColor: palette.line,
                }}
              >
                <Text
                  style={{
                    fontFamily: UIFontFamily,
                    fontSize: typography.ui.sizes.sm,
                    color: palette.ink,
                    lineHeight: 20,
                  }}
                >
                  {chip}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Start fresh */}
          <TouchableOpacity
            onPress={handleNewConversation}
            disabled={isCreating}
            accessibilityLabel="Start a new conversation"
            style={{
              marginTop: 24,
              paddingVertical: 12,
              paddingHorizontal: 24,
              borderRadius: 10,
              backgroundColor: palette.clay,
            }}
          >
            <Text
              style={{
                fontFamily: UIFontFamily,
                fontSize: typography.ui.sizes.base,
                fontWeight: '600',
                color: '#FFFFFF',
              }}
            >
              {isCreating ? 'Starting...' : 'Start a conversation'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Past conversations modal */}
        <PastConversationsModal
          visible={showPastConversations}
          onClose={() => setShowPastConversations(false)}
          conversations={conversations}
          isLoading={convsLoading}
          onSelect={handleSelectConversation}
          onDelete={handleDeleteConversation}
          isDeleting={isDeleting}
          palette={palette}
          typography={typography}
        />
      </View>
    );
  }

  // ── Conversation view ──────────────────────────────────────────────────────

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: palette.bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      {/* Header */}
      <View
        style={{
          paddingHorizontal: 20,
          paddingTop: 60,
          paddingBottom: 12,
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottomWidth: 1,
          borderBottomColor: palette.line,
        }}
      >
        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontFamily: typography.scripture.fontFamily,
              fontSize: typography.ui.sizes.lg,
              fontWeight: '600',
              color: palette.ink,
            }}
            numberOfLines={1}
          >
            Coach
          </Text>
          {!usageLoading && (
            <Text
              style={{
                fontFamily: UIFontFamily,
                fontSize: typography.ui.sizes.xs,
                color: palette.muted,
                marginTop: 2,
              }}
            >
              {usageLabel}
            </Text>
          )}
        </View>
        <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
          <TouchableOpacity
            onPress={handleNewConversation}
            disabled={isCreating || isStreaming}
            accessibilityLabel="Start new conversation"
          >
            <Text
              style={{
                fontFamily: UIFontFamily,
                fontSize: typography.ui.sizes.sm,
                color: palette.clay,
                fontWeight: '600',
              }}
            >
              New
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setShowPastConversations(true)}
            accessibilityLabel="View past conversations"
          >
            <Text style={{ fontSize: 20, color: palette.muted }}>☰</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Messages */}
      {msgsLoading && messages.length === 0 ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={palette.clay} size="small" />
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={displayMessages}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{
            paddingVertical: 12,
            flexGrow: 1,
            justifyContent: displayMessages.length === 0 ? 'center' : 'flex-start',
          }}
          onContentSizeChange={() => {
            flatListRef.current?.scrollToEnd({ animated: false });
          }}
          onLayout={() => {
            flatListRef.current?.scrollToEnd({ animated: false });
          }}
          ListEmptyComponent={
            <EmptyState
              icon="💬"
              title="Start the conversation"
              subtitle="Share what's on your mind. The Coach is here to help."
            />
          }
          renderItem={({ item }) => (
            <MessageBubble msg={item} palette={palette} typography={typography} />
          )}
          ListFooterComponent={
            isStreaming && !streamingContent ? (
              <View style={{ paddingLeft: 16 }}>
                <TypingIndicator palette={palette} />
              </View>
            ) : null
          }
        />
      )}

      {/* Input bar */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'flex-end',
          paddingHorizontal: 16,
          paddingVertical: 12,
          borderTopWidth: 1,
          borderTopColor: palette.line,
          backgroundColor: palette.bg,
        }}
      >
        <TextInput
          value={inputText}
          onChangeText={setInputText}
          placeholder="Ask the Coach..."
          placeholderTextColor={palette.inkDim}
          multiline
          maxLength={2000}
          editable={!isStreaming && !isSending}
          accessibilityLabel="Type your message to the Coach"
          style={{
            flex: 1,
            fontFamily: UIFontFamily,
            fontSize: typography.ui.sizes.base,
            color: palette.ink,
            backgroundColor: palette.surface,
            borderRadius: 12,
            paddingHorizontal: 16,
            paddingVertical: 12,
            maxHeight: 120,
            borderWidth: 1,
            borderColor: palette.line,
          }}
        />
        <TouchableOpacity
          onPress={isStreaming ? cancelStream : handleSend}
          disabled={
            isStreaming
              ? false // allow cancel
              : !inputText.trim() || isSending
          }
          accessibilityLabel={isStreaming ? 'Cancel response' : 'Send message'}
          style={{
            marginLeft: 8,
            width: 44,
            height: 44,
            borderRadius: 22,
            backgroundColor:
              isStreaming
                ? 'transparent'
                : inputText.trim() && !isSending
                  ? palette.clay
                  : palette.line,
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: isStreaming ? 1 : 0,
            borderColor: isStreaming ? palette.inkDim : 'transparent',
          }}
        >
          <Text style={{ fontSize: 18, color: isStreaming ? palette.inkDim : '#FFFFFF' }}>
            {isStreaming ? '■' : '↑'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Past conversations modal */}
      <PastConversationsModal
        visible={showPastConversations}
        onClose={() => setShowPastConversations(false)}
        conversations={conversations}
        isLoading={convsLoading}
        onSelect={handleSelectConversation}
        onDelete={handleDeleteConversation}
        isDeleting={isDeleting}
        palette={palette}
        typography={typography}
      />
    </KeyboardAvoidingView>
  );
}
