import React from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { usePrayerGroups, useLeaveGroup } from '@/hooks/usePrayer';
import { EmptyState } from '@/components/EmptyState';
import { PrimaryButton } from '@/components/PrimaryButton';
import { GhostButton } from '@/components/GhostButton';
import { UIFontFamily } from '@/constants/theme';
import type { PrayerGroupWithMeta } from '@/hooks/usePrayer';

export default function GroupsScreen(): React.ReactElement {
  const { palette } = useTheme();
  const router = useRouter();
  const { groups, isLoading, isError, error } = usePrayerGroups();
  const { leaveGroup, isLeaving } = useLeaveGroup();

  const handleCreateGroup = (): void => {
    router.push('/prayer/groups/new');
  };

  const handleJoinGroup = (): void => {
    router.push('/prayer/groups/join');
  };

  const handleGroupPress = (groupId: string): void => {
    router.push(`/prayer/groups/${groupId}`);
  };

  const handleLeaveGroup = (group: PrayerGroupWithMeta): void => {
    if (isLeaving) return;

    Alert.alert(
      'Leave Group',
      `Are you sure you want to leave "${group.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Leave',
          style: 'destructive',
          onPress: () => leaveGroup(group.id),
        },
      ],
    );
  };

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

  if (isError) {
    return (
      <View style={{ flex: 1, backgroundColor: palette.bg }}>
        <EmptyState
          icon="⚠"
          title="Could not load groups"
          subtitle={error?.message ?? 'Something went wrong.'}
        />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: palette.bg }}>
      <View
        style={{
          flexDirection: 'row',
          paddingHorizontal: 16,
          paddingTop: 60,
          paddingBottom: 12,
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Text
          style={{
            fontFamily: UIFontFamily,
            fontSize: 28,
            fontWeight: '700',
            color: palette.ink,
          }}
        >
          My Groups
        </Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <GhostButton
            title="Join"
            onPress={handleJoinGroup}
            accessibilityLabel="Join a prayer group"
          />
          <PrimaryButton
            title="Create"
            onPress={handleCreateGroup}
            accessibilityLabel="Create a prayer group"
          />
        </View>
      </View>

      {groups.length === 0 ? (
        <EmptyState
          icon="🕊"
          title="You have not joined any prayer groups yet"
          subtitle="Prayer keeps you connected. Create or join a group to get started."
          action={
            <View style={{ gap: 12, width: '100%', paddingHorizontal: 32 }}>
              <PrimaryButton
                title="Create a Group"
                onPress={handleCreateGroup}
                accessibilityLabel="Create a prayer group"
              />
              <GhostButton
                title="Join a Group"
                onPress={handleJoinGroup}
                accessibilityLabel="Join a prayer group with a code"
              />
            </View>
          }
        />
      ) : (
        <FlatList
          data={groups}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => handleGroupPress(item.id)}
              onLongPress={() => handleLeaveGroup(item)}
              accessibilityLabel={`Open prayer group ${item.name}`}
              accessibilityRole="button"
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
                  alignItems: 'flex-start',
                }}
              >
                <View style={{ flex: 1, marginRight: 12 }}>
                  <Text
                    style={{
                      fontFamily: UIFontFamily,
                      fontSize: 16,
                      fontWeight: '600',
                      color: palette.ink,
                      marginBottom: 4,
                    }}
                    numberOfLines={1}
                  >
                    {item.name}
                  </Text>
                  {item.description && (
                    <Text
                      style={{
                        fontFamily: UIFontFamily,
                        fontSize: 14,
                        color: palette.muted,
                        lineHeight: 20,
                        marginBottom: 8,
                      }}
                      numberOfLines={2}
                    >
                      {item.description}
                    </Text>
                  )}
                </View>
                {item.user_role === 'leader' && (
                  <Text
                    style={{
                      fontFamily: UIFontFamily,
                      fontSize: 11,
                      fontWeight: '600',
                      color: palette.clay,
                      textTransform: 'uppercase',
                      letterSpacing: 0.5,
                    }}
                  >
                    Leader
                  </Text>
                )}
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text
                  style={{
                    fontFamily: UIFontFamily,
                    fontSize: 12,
                    color: palette.inkDim,
                  }}
                >
                  {item.member_count}{' '}
                  {item.member_count === 1 ? 'member' : 'members'}
                </Text>
                {item.is_private && (
                  <>
                    <Text style={{ color: palette.inkDim, marginHorizontal: 6 }}>
                      ·
                    </Text>
                    <Text
                      style={{
                        fontFamily: UIFontFamily,
                        fontSize: 12,
                        color: palette.inkDim,
                      }}
                    >
                      Private
                    </Text>
                  </>
                )}
              </View>
            </TouchableOpacity>
          )}
          contentContainerStyle={{ paddingBottom: 24 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={isLoading} tintColor={palette.clay} />
          }
        />
      )}
    </View>
  );
}
