import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Switch,
  RefreshControl,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import {
  useDiscussionThread,
  useCreateReply,
  useEditThread,
  useEditReply,
  useDeleteThread,
  useDeleteReply,
} from '@/hooks/useDiscussions';
import { useAuth } from '@/hooks/useAuth';
import { useReportContent } from '@/hooks/usePrayer';
import { PrimaryButton } from '@/components/PrimaryButton';
import { GhostButton } from '@/components/GhostButton';
import { EmptyState } from '@/components/EmptyState';
import { UIFontFamily } from '@/constants/theme';
import type {
  DiscussionThreadWithMeta,
  DiscussionReplyWithMeta,
} from '@/hooks/useDiscussions';

function formatRelativeDate(dateStr: string): string {
  const now = Date.now();
  const date = new Date(dateStr).getTime();
  const diffMs = now - date;
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 7) return `${diffDay}d ago`;
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

function ReplyItem({
  reply,
  isOwnReply,
  onEdit,
  onDelete,
  onReport,
  palette,
}: {
  reply: DiscussionReplyWithMeta;
  isOwnReply: boolean;
  onEdit: (id: string, body: string) => void;
  onDelete: (id: string) => void;
  onReport: (id: string) => void;
  palette: ReturnType<typeof useTheme>['palette'];
}): React.ReactElement {
  const [isEditing, setIsEditing] = useState(false);
  const [editBody, setEditBody] = useState(reply.body);

  const handleSaveEdit = (): void => {
    if (editBody.trim() && editBody.trim() !== reply.body) {
      onEdit(reply.id, editBody.trim());
    }
    setIsEditing(false);
  };

  return (
    <View
      style={{
        padding: 14,
        borderBottomWidth: 1,
        borderBottomColor: palette.line,
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 6,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
          <Text
            style={{
              fontFamily: UIFontFamily,
              fontSize: 13,
              fontWeight: '600',
              color: reply.is_anonymous ? palette.muted : palette.ink,
            }}
          >
            {reply.is_anonymous
              ? 'Anonymous'
              : reply.display_name ?? 'Member'}
          </Text>
        </View>
        <Text
          style={{
            fontFamily: UIFontFamily,
            fontSize: 12,
            color: palette.inkDim,
          }}
        >
          {formatRelativeDate(reply.created_at)}
        </Text>
      </View>

      {isEditing ? (
        <View>
          <TextInput
            value={editBody}
            onChangeText={setEditBody}
            multiline
            textAlignVertical="top"
            accessibilityLabel="Edit reply"
            style={{
              fontFamily: UIFontFamily,
              fontSize: 14,
              color: palette.ink,
              backgroundColor: palette.bg,
              borderRadius: 8,
              borderWidth: 1,
              borderColor: palette.clay,
              padding: 10,
              minHeight: 60,
              marginBottom: 8,
            }}
          />
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TouchableOpacity
              onPress={handleSaveEdit}
              accessibilityLabel="Save edit"
              style={{
                backgroundColor: palette.clay,
                paddingVertical: 6,
                paddingHorizontal: 14,
                borderRadius: 6,
              }}
            >
              <Text
                style={{
                  fontFamily: UIFontFamily,
                  fontSize: 13,
                  fontWeight: '600',
                  color: '#FFFFFF',
                }}
              >
                Save
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setIsEditing(false)}
              accessibilityLabel="Cancel edit"
              style={{
                paddingVertical: 6,
                paddingHorizontal: 14,
              }}
            >
              <Text
                style={{
                  fontFamily: UIFontFamily,
                  fontSize: 13,
                  color: palette.muted,
                }}
              >
                Cancel
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <Text
          style={{
            fontFamily: UIFontFamily,
            fontSize: 14,
            color: palette.ink,
            lineHeight: 21,
            marginBottom: 6,
          }}
        >
          {reply.body}
        </Text>
      )}

      {!isEditing && (
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {isOwnReply && (
            <>
              <TouchableOpacity
                onPress={() => {
                  setEditBody(reply.body);
                  setIsEditing(true);
                }}
                accessibilityLabel="Edit reply"
              >
                <Text
                  style={{
                    fontFamily: UIFontFamily,
                    fontSize: 12,
                    color: palette.clay,
                  }}
                >
                  Edit
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => onDelete(reply.id)}
                accessibilityLabel="Delete reply"
              >
                <Text
                  style={{
                    fontFamily: UIFontFamily,
                    fontSize: 12,
                    color: '#C44E4E',
                  }}
                >
                  Delete
                </Text>
              </TouchableOpacity>
            </>
          )}
          {!isOwnReply && (
            <TouchableOpacity
              onPress={() => onReport(reply.id)}
              accessibilityLabel="Report reply"
            >
              <Text
                style={{
                  fontFamily: UIFontFamily,
                  fontSize: 12,
                  color: palette.inkDim,
                }}
              >
                Report
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
}

export default function ThreadDetailScreen(): React.ReactElement {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { palette } = useTheme();
  const router = useRouter();
  const { user } = useAuth();
  const { thread, replies, isLoading, refresh } = useDiscussionThread(
    id ?? '',
  );
  const { createReply, isCreating: isReplying } = useCreateReply();
  const { editThread } = useEditThread();
  const { editReply } = useEditReply();
  const { deleteThread } = useDeleteThread();
  const { deleteReply } = useDeleteReply();
  const { report } = useReportContent();

  const [replyBody, setReplyBody] = useState('');
  const [replyAnon, setReplyAnon] = useState(false);
  const [isEditingThread, setIsEditingThread] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editBody, setEditBody] = useState('');
  const flatListRef = useRef<FlatList>(null);

  const isOwnThread = thread?.user_id === user?.id;

  const handleSendReply = async (): Promise<void> => {
    if (!replyBody.trim() || !id || isReplying) return;

    try {
      await createReply({
        thread_id: id,
        body: replyBody.trim(),
        is_anonymous: replyAnon,
      });
      setReplyBody('');
      setReplyAnon(false);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Could not post reply.';
      Alert.alert('Error', message);
    }
  };

  const handleEditThread = async (): Promise<void> => {
    if (!isEditingThread && thread) {
      setEditTitle(thread.title);
      setEditBody(thread.body);
      setIsEditingThread(true);
      return;
    }

    if (editTitle.trim() && editBody.trim() && id) {
      try {
        await editThread(id, editTitle.trim(), editBody.trim());
        setIsEditingThread(false);
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : 'Could not update thread.';
        Alert.alert('Error', message);
      }
    }
  };

  const handleEditReplyFn = useCallback(
    async (replyId: string, body: string): Promise<void> => {
      try {
        await editReply(replyId, body);
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : 'Could not edit reply.';
        Alert.alert('Error', message);
      }
    },
    [editReply],
  );

  const handleDeleteThreadFn = useCallback((): void => {
    Alert.alert(
      'Delete Thread',
      'Are you sure you want to delete this thread?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteThread(id ?? '').then(() => router.back()),
        },
      ],
    );
  }, [deleteThread, id, router]);

  const handleDeleteReplyFn = useCallback(
    (replyId: string): void => {
      Alert.alert(
        'Delete Reply',
        'Are you sure you want to delete this reply?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: () => deleteReply(replyId),
          },
        ],
      );
    },
    [deleteReply],
  );

  const handleReportThread = useCallback((): void => {
    Alert.alert('Report Thread', 'Why are you reporting this thread?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Inappropriate',
        onPress: () =>
          report('discussion_thread', id ?? '', 'Inappropriate content'),
      },
      {
        text: 'Spam',
        onPress: () => report('discussion_thread', id ?? '', 'Spam'),
      },
      {
        text: 'Other',
        onPress: () => report('discussion_thread', id ?? '', 'Other'),
      },
    ]);
  }, [report, id]);

  const handleReportReply = useCallback(
    (replyId: string): void => {
      Alert.alert('Report Reply', 'Why are you reporting this reply?', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Inappropriate',
          onPress: () =>
            report('discussion_reply', replyId, 'Inappropriate content'),
        },
        {
          text: 'Spam',
          onPress: () => report('discussion_reply', replyId, 'Spam'),
        },
        {
          text: 'Other',
          onPress: () => report('discussion_reply', replyId, 'Other'),
        },
      ]);
    },
    [report],
  );

  if (isLoading) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: palette.bg,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <ActivityIndicator color={palette.clay} size="small" />
      </View>
    );
  }

  if (!thread) {
    return (
      <View style={{ flex: 1, backgroundColor: palette.bg }}>
        <EmptyState
          icon="💬"
          title="Thread not found"
          subtitle="This thread may have been removed."
        />
      </View>
    );
  }

  const headerComponent = (
    <View>
      {/* Thread header */}
      <View
        style={{
          padding: 16,
          borderBottomWidth: 1,
          borderBottomColor: palette.line,
        }}
      >
        {isEditingThread ? (
          <View>
            <TextInput
              value={editTitle}
              onChangeText={setEditTitle}
              accessibilityLabel="Edit thread title"
              style={{
                fontFamily: UIFontFamily,
                fontSize: 18,
                fontWeight: '700',
                color: palette.ink,
                backgroundColor: palette.bg,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: palette.clay,
                padding: 10,
                marginBottom: 8,
              }}
            />
            <TextInput
              value={editBody}
              onChangeText={setEditBody}
              multiline
              textAlignVertical="top"
              accessibilityLabel="Edit thread body"
              style={{
                fontFamily: UIFontFamily,
                fontSize: 14,
                color: palette.ink,
                backgroundColor: palette.bg,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: palette.clay,
                padding: 10,
                minHeight: 80,
                marginBottom: 8,
              }}
            />
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TouchableOpacity
                onPress={handleEditThread}
                accessibilityLabel="Save thread edit"
                style={{
                  backgroundColor: palette.clay,
                  paddingVertical: 8,
                  paddingHorizontal: 16,
                  borderRadius: 8,
                }}
              >
                <Text
                  style={{
                    fontFamily: UIFontFamily,
                    fontSize: 14,
                    fontWeight: '600',
                    color: '#FFFFFF',
                  }}
                >
                  Save
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setIsEditingThread(false)}
                style={{ paddingVertical: 8, paddingHorizontal: 16 }}
              >
                <Text
                  style={{
                    fontFamily: UIFontFamily,
                    fontSize: 14,
                    color: palette.muted,
                  }}
                >
                  Cancel
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <>
            <Text
              style={{
                fontFamily: UIFontFamily,
                fontSize: 20,
                fontWeight: '700',
                color: palette.ink,
                marginBottom: 8,
              }}
            >
              {thread.title}
            </Text>
            <Text
              style={{
                fontFamily: UIFontFamily,
                fontSize: 15,
                color: palette.ink,
                lineHeight: 22,
                marginBottom: 8,
              }}
            >
              {thread.body}
            </Text>
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text
                  style={{
                    fontFamily: UIFontFamily,
                    fontSize: 13,
                    color: palette.inkDim,
                  }}
                >
                  {thread.is_anonymous
                    ? 'Anonymous'
                    : thread.display_name ?? 'Member'}
                  {' · '}
                  {formatRelativeDate(thread.created_at)}
                </Text>
              </View>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {isOwnThread && (
                  <>
                    <TouchableOpacity
                      onPress={handleEditThread}
                      accessibilityLabel="Edit thread"
                    >
                      <Text
                        style={{
                          fontFamily: UIFontFamily,
                          fontSize: 13,
                          color: palette.clay,
                        }}
                      >
                        Edit
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={handleDeleteThreadFn}
                      accessibilityLabel="Delete thread"
                    >
                      <Text
                        style={{
                          fontFamily: UIFontFamily,
                          fontSize: 13,
                          color: '#C44E4E',
                        }}
                      >
                        Delete
                      </Text>
                    </TouchableOpacity>
                  </>
                )}
                {!isOwnThread && (
                  <TouchableOpacity
                    onPress={handleReportThread}
                    accessibilityLabel="Report thread"
                  >
                    <Text
                      style={{
                        fontFamily: UIFontFamily,
                        fontSize: 13,
                        color: palette.inkDim,
                      }}
                    >
                      Report
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </>
        )}
      </View>

      {/* Replies header */}
      <Text
        style={{
          fontFamily: UIFontFamily,
          fontSize: 14,
          fontWeight: '600',
          color: palette.muted,
          textTransform: 'uppercase',
          letterSpacing: 0.5,
          paddingHorizontal: 16,
          paddingVertical: 12,
        }}
      >
        Replies ({replies.length})
      </Text>
    </View>
  );

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1, backgroundColor: palette.bg }}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <FlatList
        ref={flatListRef}
        data={replies}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={headerComponent}
        renderItem={({ item }) => (
          <ReplyItem
            reply={item}
            isOwnReply={item.user_id === user?.id}
            onEdit={handleEditReplyFn}
            onDelete={handleDeleteReplyFn}
            onReport={handleReportReply}
            palette={palette}
          />
        )}
        ListEmptyComponent={
          <View style={{ padding: 16 }}>
            <Text
              style={{
                fontFamily: UIFontFamily,
                fontSize: 14,
                color: palette.muted,
                textAlign: 'center',
              }}
            >
              No replies yet. Be the first to respond.
            </Text>
          </View>
        }
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={refresh}
            tintColor={palette.clay}
          />
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 8 }}
      />

      {/* Reply input */}
      <View
        style={{
          borderTopWidth: 1,
          borderTopColor: palette.line,
          backgroundColor: palette.surface,
          padding: 12,
        }}
      >
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'flex-end',
            gap: 8,
          }}
        >
          <TextInput
            value={replyBody}
            onChangeText={setReplyBody}
            placeholder="Write a reply..."
            placeholderTextColor={palette.inkDim}
            multiline
            maxLength={2000}
            editable={!isReplying}
            accessibilityLabel="Write a reply"
            style={{
              fontFamily: UIFontFamily,
              fontSize: 14,
              color: palette.ink,
              backgroundColor: palette.bg,
              borderRadius: 10,
              borderWidth: 1,
              borderColor: palette.line,
              padding: 10,
              flex: 1,
              maxHeight: 100,
            }}
          />
          <TouchableOpacity
            onPress={handleSendReply}
            disabled={!replyBody.trim() || isReplying}
            accessibilityLabel="Send reply"
            style={{
              backgroundColor:
                replyBody.trim() && !isReplying
                  ? palette.clay
                  : palette.line,
              paddingVertical: 10,
              paddingHorizontal: 16,
              borderRadius: 10,
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: 42,
            }}
          >
            {isReplying ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text
                style={{
                  fontFamily: UIFontFamily,
                  fontSize: 14,
                  fontWeight: '600',
                  color: '#FFFFFF',
                }}
              >
                Send
              </Text>
            )}
          </TouchableOpacity>
        </View>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'flex-end',
            marginTop: 6,
          }}
        >
          <Text
            style={{
              fontFamily: UIFontFamily,
              fontSize: 12,
              color: palette.inkDim,
              marginRight: 8,
            }}
          >
            Reply anonymously
          </Text>
          <Switch
            value={replyAnon}
            onValueChange={setReplyAnon}
            trackColor={{ false: palette.line, true: palette.clay }}
            thumbColor={replyAnon ? palette.surface : palette.surface}
            accessibilityLabel="Reply anonymously"
            style={{ transform: [{ scaleX: 0.7 }, { scaleY: 0.7 }] }}
          />
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
