import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  Switch,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import {
  usePrayerGroups,
  useCreatePrayerRequest as useCreateRequest,
} from '@/hooks/usePrayer';
import { PrimaryButton } from '@/components/PrimaryButton';
import { UIFontFamily } from '@/constants/theme';
import type { PrayerGroupWithMeta } from '@/hooks/usePrayer';

export default function NewPrayerRequestScreen(): React.ReactElement {
  const { groupId: defaultGroupId } = useLocalSearchParams<{
    groupId?: string;
  }>();
  const { palette } = useTheme();
  const router = useRouter();
  const { groups } = usePrayerGroups();
  const { createRequest, isCreating } = useCreateRequest();

  const [selectedGroupId, setSelectedGroupId] = useState<string>(
    defaultGroupId ?? '',
  );
  const [body, setBody] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isPraise, setIsPraise] = useState(false);
  const [showGroupPicker, setShowGroupPicker] = useState(false);

  const canSubmit =
    body.trim().length >= 3 && selectedGroupId.length > 0 && !isCreating;

  const handleSubmit = async (): Promise<void> => {
    if (!canSubmit) return;

    try {
      await createRequest({
        group_id: selectedGroupId,
        body: body.trim(),
        is_anonymous: isAnonymous,
        is_praise: isPraise,
      });
      router.back();
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : 'Could not create prayer request.';
      Alert.alert('Error', message);
    }
  };

  const selectedGroup = groups.find((g) => g.id === selectedGroupId);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1, backgroundColor: palette.bg }}
    >
      <ScrollView
        contentContainerStyle={{ padding: 16, paddingTop: 24 }}
        keyboardShouldPersistTaps="handled"
      >
        <Text
          style={{
            fontFamily: UIFontFamily,
            fontSize: 24,
            fontWeight: '700',
            color: palette.ink,
            marginBottom: 24,
          }}
        >
          New Prayer Request
        </Text>

        {/* Group selector */}
        <Text
          style={{
            fontFamily: UIFontFamily,
            fontSize: 14,
            fontWeight: '600',
            color: palette.muted,
            marginBottom: 6,
          }}
        >
          Group *
        </Text>
        <TouchableOpacity
          onPress={() => setShowGroupPicker(!showGroupPicker)}
          accessibilityLabel="Select a prayer group"
          accessibilityRole="button"
          style={{
            backgroundColor: palette.surface,
            borderRadius: 10,
            borderWidth: 1,
            borderColor: palette.line,
            padding: 14,
            marginBottom: 16,
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Text
            style={{
              fontFamily: UIFontFamily,
              fontSize: 16,
              color: selectedGroup ? palette.ink : palette.inkDim,
            }}
          >
            {selectedGroup ? selectedGroup.name : 'Choose a group'}
          </Text>
          <Text style={{ fontSize: 12, color: palette.inkDim }}>
            {showGroupPicker ? '▲' : '▼'}
          </Text>
        </TouchableOpacity>

        {showGroupPicker && (
          <View
            style={{
              backgroundColor: palette.surface,
              borderRadius: 10,
              borderWidth: 1,
              borderColor: palette.line,
              marginBottom: 16,
              overflow: 'hidden',
            }}
          >
            {groups.length === 0 && (
              <Text
                style={{
                  fontFamily: UIFontFamily,
                  fontSize: 14,
                  color: palette.muted,
                  padding: 14,
                  textAlign: 'center',
                }}
              >
                You are not in any groups yet.
              </Text>
            )}
            {groups.map((group) => (
              <TouchableOpacity
                key={group.id}
                onPress={() => {
                  setSelectedGroupId(group.id);
                  setShowGroupPicker(false);
                }}
                accessibilityLabel={`Select ${group.name}`}
                style={{
                  paddingVertical: 12,
                  paddingHorizontal: 14,
                  borderBottomWidth: 1,
                  borderBottomColor: palette.line,
                  backgroundColor:
                    selectedGroupId === group.id
                      ? palette.clay + '1A'
                      : 'transparent',
                }}
              >
                <Text
                  style={{
                    fontFamily: UIFontFamily,
                    fontSize: 15,
                    color: palette.ink,
                    fontWeight:
                      selectedGroupId === group.id ? '600' : '400',
                  }}
                >
                  {group.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Body */}
        <Text
          style={{
            fontFamily: UIFontFamily,
            fontSize: 14,
            fontWeight: '600',
            color: palette.muted,
            marginBottom: 6,
          }}
        >
          Your Prayer *
        </Text>
        <TextInput
          value={body}
          onChangeText={setBody}
          placeholder="Share what is on your heart..."
          placeholderTextColor={palette.inkDim}
          maxLength={1000}
          multiline
          numberOfLines={5}
          textAlignVertical="top"
          editable={!isCreating}
          accessibilityLabel="Prayer request body"
          style={{
            fontFamily: UIFontFamily,
            fontSize: 16,
            color: palette.ink,
            backgroundColor: palette.surface,
            borderRadius: 10,
            borderWidth: 1,
            borderColor: palette.line,
            padding: 14,
            marginBottom: 20,
            minHeight: 120,
          }}
        />

        {/* Anonymous toggle */}
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingVertical: 12,
            paddingHorizontal: 4,
            marginBottom: 8,
          }}
        >
          <View style={{ flex: 1, marginRight: 12 }}>
            <Text
              style={{
                fontFamily: UIFontFamily,
                fontSize: 16,
                fontWeight: '600',
                color: palette.ink,
                marginBottom: 2,
              }}
            >
              Post Anonymously
            </Text>
            <Text
              style={{
                fontFamily: UIFontFamily,
                fontSize: 13,
                color: palette.muted,
                lineHeight: 18,
              }}
            >
              Your name will not be shown to the group.
            </Text>
          </View>
          <Switch
            value={isAnonymous}
            onValueChange={setIsAnonymous}
            disabled={isCreating}
            trackColor={{ false: palette.line, true: palette.clay }}
            thumbColor={isAnonymous ? palette.surface : palette.surface}
            accessibilityLabel="Post anonymously"
          />
        </View>

        {/* Praise toggle */}
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingVertical: 12,
            paddingHorizontal: 4,
            marginBottom: 32,
          }}
        >
          <View style={{ flex: 1, marginRight: 12 }}>
            <Text
              style={{
                fontFamily: UIFontFamily,
                fontSize: 16,
                fontWeight: '600',
                color: palette.ink,
                marginBottom: 2,
              }}
            >
              This is a Praise Report
            </Text>
            <Text
              style={{
                fontFamily: UIFontFamily,
                fontSize: 13,
                color: palette.muted,
                lineHeight: 18,
              }}
            >
              Share what God has done.
            </Text>
          </View>
          <Switch
            value={isPraise}
            onValueChange={setIsPraise}
            disabled={isCreating}
            trackColor={{ false: palette.line, true: palette.sage }}
            thumbColor={isPraise ? palette.surface : palette.surface}
            accessibilityLabel="This is a praise report"
          />
        </View>

        <PrimaryButton
          title={isCreating ? 'Sharing...' : 'Share Request'}
          loading={isCreating}
          onPress={handleSubmit}
          disabled={!canSubmit}
          accessibilityLabel="Share prayer request"
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
