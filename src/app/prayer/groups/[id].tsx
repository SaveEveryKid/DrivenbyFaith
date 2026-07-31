import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  TextInput,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import {
  usePrayerGroup,
  usePrayerRequests,
  useAnsweredRequests,
  useInteractPrayer,
  useMarkAnswered,
  useReportContent,
  useLeaveGroup,
  useRemoveMember,
  useRemovePrayerRequest,
} from '@/hooks/usePrayer';
import { useAuth } from '@/hooks/useAuth';
import { PrimaryButton } from '@/components/PrimaryButton';
import { GhostButton } from '@/components/GhostButton';
import { EmptyState } from '@/components/EmptyState';
import { UIFontFamily } from '@/constants/theme';
import type { PrayerRequestSafe, PrayerGroupMember } from '@/hooks/usePrayer';

type TabKey = 'requests' | 'answered' | 'members';

function formatTimeAgo(dateStr: string): string {
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

function RequestCard({
  request,
  onPray,
  onMarkAnswered,
  onReport,
  onRemove,
  isCurrentUserRequest,
  isLeader,
  palette,
}: {
  request: PrayerRequestSafe;
  onPray: () => void;
  onMarkAnswered: () => void;
  onReport: () => void;
  onRemove: () => void;
  isCurrentUserRequest: boolean;
  isLeader: boolean;
  palette: ReturnType<typeof useTheme>['palette'];
}): React.ReactElement {
  const [showAnsweredInput, setShowAnsweredInput] = useState(false);
  const [answeredNote, setAnsweredNote] = useState('');

  const handleMarkAnswered = (): void => {
    if (showAnsweredInput && answeredNote.trim()) {
      onMarkAnswered();
      setShowAnsweredInput(false);
      setAnsweredNote('');
    } else {
      setShowAnsweredInput(true);
    }
  };

  return (
    <View
      style={{
        backgroundColor: palette.surface,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: palette.line,
        padding: 16,
        marginHorizontal: 16,
        marginBottom: 10,
      }}
    >
      {/* Header */}
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 8,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
          {request.is_praise && (
            <Text
              style={{
                fontFamily: UIFontFamily,
                fontSize: 12,
                fontWeight: '600',
                color: palette.sage,
                backgroundColor: palette.sage + '1A',
                paddingHorizontal: 8,
                paddingVertical: 2,
                borderRadius: 4,
                marginRight: 8,
                overflow: 'hidden',
              }}
            >
              Praise
            </Text>
          )}
          <Text
            style={{
              fontFamily: UIFontFamily,
              fontSize: 13,
              fontWeight: '600',
              color: request.is_anonymous ? palette.muted : palette.ink,
              flex: 1,
            }}
            numberOfLines={1}
          >
            {request.is_anonymous
              ? 'Anonymous'
              : request.display_name ?? 'Member'}
          </Text>
        </View>
        <Text
          style={{
            fontFamily: UIFontFamily,
            fontSize: 12,
            color: palette.inkDim,
          }}
        >
          {formatTimeAgo(request.created_at)}
        </Text>
      </View>

      {/* Body */}
      <Text
        style={{
          fontFamily: UIFontFamily,
          fontSize: 15,
          color: palette.ink,
          lineHeight: 22,
          marginBottom: 12,
        }}
      >
        {request.body}
      </Text>

      {/* Answered note */}
      {request.is_answered && request.answered_note && (
        <Text
          style={{
            fontFamily: UIFontFamily,
            fontSize: 13,
            color: palette.sage,
            fontStyle: 'italic',
            marginBottom: 12,
          }}
        >
          Answered: {request.answered_note}
        </Text>
      )}

      {/* Answered input (inline) */}
      {showAnsweredInput && !request.is_answered && (
        <View style={{ marginBottom: 12 }}>
          <TextInput
            value={answeredNote}
            onChangeText={setAnsweredNote}
            placeholder="How was this prayer answered?"
            placeholderTextColor={palette.inkDim}
            multiline
            numberOfLines={2}
            textAlignVertical="top"
            accessibilityLabel="Answered note"
            style={{
              fontFamily: UIFontFamily,
              fontSize: 14,
              color: palette.ink,
              backgroundColor: palette.bg,
              borderRadius: 8,
              borderWidth: 1,
              borderColor: palette.sage,
              padding: 10,
              minHeight: 60,
              marginBottom: 8,
            }}
          />
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TouchableOpacity
              onPress={handleMarkAnswered}
              disabled={!answeredNote.trim()}
              accessibilityLabel="Confirm mark as answered"
              style={{
                backgroundColor: palette.sage,
                paddingVertical: 8,
                paddingHorizontal: 16,
                borderRadius: 8,
                opacity: answeredNote.trim() ? 1 : 0.5,
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
                Confirm
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setShowAnsweredInput(false)}
              accessibilityLabel="Cancel mark as answered"
              style={{
                paddingVertical: 8,
                paddingHorizontal: 16,
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
      )}

      {/* Actions */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <TouchableOpacity
          onPress={onPray}
          disabled={request.has_prayed}
          accessibilityLabel={
            request.has_prayed ? 'Already prayed' : 'I prayed for this'
          }
          accessibilityRole="button"
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingVertical: 6,
            paddingHorizontal: 10,
            borderRadius: 8,
            backgroundColor: request.has_prayed
              ? palette.sage + '1A'
              : palette.line + '40',
            opacity: request.has_prayed ? 0.8 : 1,
          }}
        >
          <Text style={{ fontSize: 14, marginRight: 6 }}>
            {request.has_prayed ? '🙏' : '✋'}
          </Text>
          <Text
            style={{
              fontFamily: UIFontFamily,
              fontSize: 13,
              fontWeight: request.has_prayed ? '600' : '400',
              color: request.has_prayed ? palette.sage : palette.muted,
            }}
          >
            {request.has_prayed ? 'Prayed' : 'I prayed'}{' '}
            {request.prayer_count > 0 && `(${request.prayer_count})`}
          </Text>
        </TouchableOpacity>

        <View style={{ flexDirection: 'row', gap: 4 }}>
          {(isCurrentUserRequest || isLeader) && !request.is_answered && (
            <TouchableOpacity
              onPress={handleMarkAnswered}
              accessibilityLabel="Mark as answered"
              style={{
                paddingVertical: 6,
                paddingHorizontal: 8,
              }}
            >
              <Text
                style={{
                  fontFamily: UIFontFamily,
                  fontSize: 13,
                  color: palette.sage,
                }}
              >
                Answered
              </Text>
            </TouchableOpacity>
          )}

          {(isCurrentUserRequest || isLeader) && (
            <TouchableOpacity
              onPress={onRemove}
              accessibilityLabel="Remove prayer request"
              style={{
                paddingVertical: 6,
                paddingHorizontal: 8,
              }}
            >
              <Text
                style={{
                  fontFamily: UIFontFamily,
                  fontSize: 13,
                  color: '#C44E4E',
                }}
              >
                Remove
              </Text>
            </TouchableOpacity>
          )}

          {!isCurrentUserRequest && (
            <TouchableOpacity
              onPress={onReport}
              accessibilityLabel="Report prayer request"
              style={{
                paddingVertical: 6,
                paddingHorizontal: 8,
              }}
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
    </View>
  );
}

export default function GroupDetailScreen(): React.ReactElement {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { palette } = useTheme();
  const router = useRouter();
  const { user } = useAuth();
  const { group, members, isLoading } = usePrayerGroup(id ?? '');
  const { requests, refresh: refreshRequests } = usePrayerRequests(id ?? '');
  const { requests: answered, refresh: refreshAnswered } = useAnsweredRequests(
    id ?? '',
  );
  const { interact } = useInteractPrayer();
  const { markAnswered } = useMarkAnswered();
  const { report } = useReportContent();
  const { leaveGroup } = useLeaveGroup();
  const { removeMember } = useRemoveMember();
  const { removeRequest } = useRemovePrayerRequest();

  const [activeTab, setActiveTab] = useState<TabKey>('requests');

  const isLeader = group?.user_role === 'leader';

  const handlePray = useCallback(
    async (requestId: string): Promise<void> => {
      try {
        await interact(requestId, id ?? '');
      } catch {
        // UNIQUE constraint — silently handled in hook
      }
    },
    [interact, id],
  );

  const handleMarkAnswered = useCallback(
    async (requestId: string, note: string): Promise<void> => {
      try {
        await markAnswered(requestId, id ?? '', { answered_note: note });
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : 'Could not mark as answered.';
        Alert.alert('Error', message);
      }
    },
    [markAnswered, id],
  );

  const handleReport = useCallback(
    (requestId: string): void => {
      Alert.alert('Report', 'Why are you reporting this request?', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Inappropriate',
          onPress: () =>
            report('prayer_request', requestId, 'Inappropriate content'),
        },
        {
          text: 'Spam',
          onPress: () => report('prayer_request', requestId, 'Spam'),
        },
        {
          text: 'Other',
          onPress: () => report('prayer_request', requestId, 'Other'),
        },
      ]);
    },
    [report],
  );

  const handleRemoveRequest = useCallback(
    (requestId: string): void => {
      Alert.alert(
        'Remove Request',
        'Are you sure you want to remove this prayer request?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Remove',
            style: 'destructive',
            onPress: () => removeRequest(requestId, id ?? ''),
          },
        ],
      );
    },
    [removeRequest, id],
  );

  const handleLeaveGroup = useCallback((): void => {
    Alert.alert(
      'Leave Group',
      'Are you sure you want to leave this group?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Leave',
          style: 'destructive',
          onPress: () =>
            leaveGroup(id ?? '').then(() => router.back()),
        },
      ],
    );
  }, [leaveGroup, id, router]);

  const handleRemoveMember = useCallback(
    (memberUserId: string, memberName: string): void => {
      Alert.alert(
        'Remove Member',
        `Remove ${memberName} from the group?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Remove',
            style: 'destructive',
            onPress: () => removeMember(id ?? '', memberUserId),
          },
        ],
      );
    },
    [removeMember, id],
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

  if (!group) {
    return (
      <View style={{ flex: 1, backgroundColor: palette.bg }}>
        <EmptyState
          icon="🕊"
          title="Group not found"
          subtitle="This group may have been removed or you are no longer a member."
        />
      </View>
    );
  }

  const tabs: { key: TabKey; label: string }[] = [
    { key: 'requests', label: 'Requests' },
    { key: 'answered', label: 'Answered' },
    { key: 'members', label: 'Members' },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: palette.bg }}>
      {/* Group header */}
      <View
        style={{
          padding: 16,
          paddingTop: 8,
          borderBottomWidth: 1,
          borderBottomColor: palette.line,
        }}
      >
        <Text
          style={{
            fontFamily: UIFontFamily,
            fontSize: 22,
            fontWeight: '700',
            color: palette.ink,
            marginBottom: 4,
          }}
        >
          {group.name}
        </Text>
        {group.description && (
          <Text
            style={{
              fontFamily: UIFontFamily,
              fontSize: 14,
              color: palette.muted,
              lineHeight: 20,
              marginBottom: 8,
            }}
          >
            {group.description}
          </Text>
        )}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Text
            style={{
              fontFamily: UIFontFamily,
              fontSize: 12,
              color: palette.inkDim,
            }}
          >
            {group.member_count}{' '}
            {group.member_count === 1 ? 'member' : 'members'}
          </Text>
          <GhostButton
            title="Leave Group"
            onPress={handleLeaveGroup}
            accessibilityLabel="Leave this prayer group"
          />
        </View>
      </View>

      {/* Tab bar */}
      <View
        style={{
          flexDirection: 'row',
          borderBottomWidth: 1,
          borderBottomColor: palette.line,
        }}
      >
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            onPress={() => setActiveTab(tab.key)}
            accessibilityLabel={`${tab.label} tab`}
            accessibilityRole="tab"
            style={{
              flex: 1,
              paddingVertical: 12,
              alignItems: 'center',
              borderBottomWidth: 2,
              borderBottomColor:
                activeTab === tab.key ? palette.clay : 'transparent',
            }}
          >
            <Text
              style={{
                fontFamily: UIFontFamily,
                fontSize: 14,
                fontWeight: activeTab === tab.key ? '600' : '400',
                color:
                  activeTab === tab.key ? palette.clay : palette.inkDim,
              }}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Tab content */}
      {activeTab === 'requests' && (
        <View style={{ flex: 1 }}>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingHorizontal: 16,
              paddingVertical: 12,
            }}
          >
            <Text
              style={{
                fontFamily: UIFontFamily,
                fontSize: 14,
                fontWeight: '600',
                color: palette.muted,
                textTransform: 'uppercase',
                letterSpacing: 0.5,
              }}
            >
              Prayer Requests
            </Text>
            <PrimaryButton
              title="New Request"
              onPress={() =>
                router.push(`/prayer/requests/new?groupId=${id}`)
              }
              accessibilityLabel="Create a new prayer request"
            />
          </View>

          <FlatList
            data={requests}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <RequestCard
                request={item}
                onPray={() => handlePray(item.id)}
                onMarkAnswered={() => {
                  // Will handle inline via the card's own state
                }}
                onReport={() => handleReport(item.id)}
                onRemove={() => handleRemoveRequest(item.id)}
                isCurrentUserRequest={item.user_id === user?.id}
                isLeader={isLeader}
                palette={palette}
              />
            )}
            contentContainerStyle={{ paddingTop: 4, paddingBottom: 24 }}
            ListEmptyComponent={
              <EmptyState
                icon="🙏"
                title="No prayer requests yet"
                subtitle="Be the first to share a request with your group."
              />
            }
            refreshControl={
              <RefreshControl
                refreshing={false}
                onRefresh={refreshRequests}
                tintColor={palette.clay}
              />
            }
            showsVerticalScrollIndicator={false}
          />
        </View>
      )}

      {activeTab === 'answered' && (
        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontFamily: UIFontFamily,
              fontSize: 14,
              fontWeight: '600',
              color: palette.muted,
              textTransform: 'uppercase',
              letterSpacing: 0.5,
              padding: 16,
              paddingBottom: 8,
            }}
          >
            Answered Prayers
          </Text>

          <FlatList
            data={answered}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View
                style={{
                  backgroundColor: palette.surface,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: palette.line,
                  padding: 16,
                  marginHorizontal: 16,
                  marginBottom: 10,
                }}
              >
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    marginBottom: 6,
                  }}
                >
                  <Text
                    style={{
                      fontFamily: UIFontFamily,
                      fontSize: 13,
                      fontWeight: '600',
                      color: palette.ink,
                    }}
                  >
                    {item.is_anonymous
                      ? 'Anonymous'
                      : item.display_name ?? 'Member'}
                  </Text>
                  {item.answered_at && (
                    <Text
                      style={{
                        fontFamily: UIFontFamily,
                        fontSize: 12,
                        color: palette.inkDim,
                      }}
                    >
                      {formatTimeAgo(item.answered_at)}
                    </Text>
                  )}
                </View>
                <Text
                  style={{
                    fontFamily: UIFontFamily,
                    fontSize: 15,
                    color: palette.ink,
                    lineHeight: 22,
                    marginBottom: 4,
                  }}
                >
                  {item.body}
                </Text>
                {item.answered_note && (
                  <Text
                    style={{
                      fontFamily: UIFontFamily,
                      fontSize: 13,
                      color: palette.sage,
                      fontStyle: 'italic',
                    }}
                  >
                    {item.answered_note}
                  </Text>
                )}
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    marginTop: 8,
                  }}
                >
                  <Text style={{ fontSize: 12, marginRight: 4 }}>🙏</Text>
                  <Text
                    style={{
                      fontFamily: UIFontFamily,
                      fontSize: 12,
                      color: palette.muted,
                    }}
                  >
                    {item.prayer_count}{' '}
                    {item.prayer_count === 1 ? 'person prayed' : 'people prayed'}
                  </Text>
                </View>
              </View>
            )}
            contentContainerStyle={{ paddingTop: 4, paddingBottom: 24 }}
            ListEmptyComponent={
              <EmptyState
                icon="✨"
                title="No answered prayers yet"
                subtitle="When prayers are marked as answered, they will appear here."
              />
            }
            refreshControl={
              <RefreshControl
                refreshing={false}
                onRefresh={refreshAnswered}
                tintColor={palette.clay}
              />
            }
            showsVerticalScrollIndicator={false}
          />
        </View>
      )}

      {activeTab === 'members' && (
        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontFamily: UIFontFamily,
              fontSize: 14,
              fontWeight: '600',
              color: palette.muted,
              textTransform: 'uppercase',
              letterSpacing: 0.5,
              padding: 16,
              paddingBottom: 8,
            }}
          >
            Members ({members.length})
          </Text>

          <FlatList
            data={members}
            keyExtractor={(item) => item.user_id}
            renderItem={({ item }: { item: PrayerGroupMember }) => (
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  borderBottomWidth: 1,
                  borderBottomColor: palette.line,
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                  <Text
                    style={{
                      fontFamily: UIFontFamily,
                      fontSize: 16,
                      color: palette.ink,
                      flex: 1,
                    }}
                  >
                    {item.display_name ?? 'Member'}
                    {item.user_id === user?.id ? ' (you)' : ''}
                  </Text>
                  <Text
                    style={{
                      fontFamily: UIFontFamily,
                      fontSize: 12,
                      fontWeight: '600',
                      color:
                        item.role === 'leader' ? palette.clay : palette.inkDim,
                      textTransform: 'uppercase',
                      letterSpacing: 0.5,
                      marginRight: 8,
                    }}
                  >
                    {item.role === 'leader' ? 'Leader' : 'Member'}
                  </Text>
                </View>
                {isLeader && item.user_id !== user?.id && (
                  <TouchableOpacity
                    onPress={() =>
                      handleRemoveMember(
                        item.user_id,
                        item.display_name ?? 'Member',
                      )
                    }
                    accessibilityLabel={`Remove ${item.display_name ?? 'member'} from group`}
                    style={{
                      paddingVertical: 4,
                      paddingHorizontal: 8,
                    }}
                  >
                    <Text
                      style={{
                        fontFamily: UIFontFamily,
                        fontSize: 13,
                        color: '#C44E4E',
                      }}
                    >
                      Remove
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
            contentContainerStyle={{ paddingBottom: 24 }}
            showsVerticalScrollIndicator={false}
          />
        </View>
      )}
    </View>
  );
}
