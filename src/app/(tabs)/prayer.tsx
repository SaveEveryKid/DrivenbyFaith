import React from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { usePrayerGroups } from '@/hooks/usePrayer';
import { EmptyState } from '@/components/EmptyState';
import { PrimaryButton } from '@/components/PrimaryButton';
import { GhostButton } from '@/components/GhostButton';
import { UIFontFamily } from '@/constants/theme';
import type { PrayerGroupWithMeta } from '@/hooks/usePrayer';

function GroupCard({
  group,
  onPress,
  palette,
}: {
  group: PrayerGroupWithMeta;
  onPress: () => void;
  palette: ReturnType<typeof useTheme>['palette'];
}): React.ReactElement {
  return (
    <TouchableOpacity
      onPress={onPress}
      accessibilityLabel={`Open prayer group ${group.name}`}
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
              numberOfLines={2}
            >
              {group.description}
            </Text>
          )}
        </View>
        {group.user_role === 'leader' && (
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
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
        }}
      >
        <Text
          style={{
            fontFamily: UIFontFamily,
            fontSize: 12,
            color: palette.inkDim,
          }}
        >
          {group.member_count} {group.member_count === 1 ? 'member' : 'members'}
        </Text>
        {group.is_private && (
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
  );
}

export default function PrayerScreen(): React.ReactElement {
  const { palette } = useTheme();
  const router = useRouter();
  const { groups, isLoading, isError, error } = usePrayerGroups();

  const handleCreateGroup = (): void => {
    router.push('/prayer/groups/new');
  };

  const handleJoinGroup = (): void => {
    router.push('/prayer/groups/join');
  };

  const handleGroupPress = (groupId: string): void => {
    router.push(`/prayer/groups/${groupId}`);
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
          subtitle={error?.message ?? 'Something went wrong. Pull to try again.'}
        />
      </View>
    );
  }

  if (groups.length === 0) {
    return (
      <View style={{ flex: 1, backgroundColor: palette.bg }}>
        <EmptyState
          icon="🕊"
          title="Prayer keeps you connected"
          subtitle="Create or join a group to share prayer requests and pray with others on the floor."
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
          Prayer
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

      <FlatList
        data={groups}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <GroupCard
            group={item}
            onPress={() => handleGroupPress(item.id)}
            palette={palette}
          />
        )}
        contentContainerStyle={{ paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <Text
            style={{
              fontFamily: UIFontFamily,
              fontSize: 13,
              fontWeight: '600',
              color: palette.muted,
              textTransform: 'uppercase',
              letterSpacing: 0.5,
              paddingHorizontal: 16,
              paddingBottom: 12,
            }}
          >
            My Groups
          </Text>
        }
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            tintColor={palette.clay}
          />
        }
      />
    </View>
  );
}
