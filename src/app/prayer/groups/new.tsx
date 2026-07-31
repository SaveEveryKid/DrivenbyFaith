import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  Switch,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { useCreateGroup } from '@/hooks/usePrayer';
import { PrimaryButton } from '@/components/PrimaryButton';
import { UIFontFamily } from '@/constants/theme';

export default function NewGroupScreen(): React.ReactElement {
  const { palette } = useTheme();
  const router = useRouter();
  const { createGroup, isCreating } = useCreateGroup();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [joinCode, setJoinCode] = useState<string | null>(null);

  const canSubmit = name.trim().length >= 2 && !isCreating && !joinCode;

  const handleSubmit = async (): Promise<void> => {
    if (!canSubmit) return;

    try {
      const group = await createGroup({
        name: name.trim(),
        description: description.trim() || null,
        is_private: isPrivate,
      });

      setJoinCode(group.join_code);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Could not create group.';
      Alert.alert('Error', message);
    }
  };

  const handleDone = (): void => {
    router.back();
  };

  // Success state: show join code
  if (joinCode) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: palette.bg,
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: 32,
        }}
      >
        <Text
          style={{
            fontFamily: UIFontFamily,
            fontSize: 20,
            fontWeight: '700',
            color: palette.ink,
            textAlign: 'center',
            marginBottom: 12,
          }}
        >
          Group Created
        </Text>
        <Text
          style={{
            fontFamily: UIFontFamily,
            fontSize: 14,
            color: palette.muted,
            textAlign: 'center',
            marginBottom: 24,
            lineHeight: 20,
          }}
        >
          Share this code with others so they can join your group.
        </Text>
        <Text
          style={{
            fontFamily: 'Georgia, serif',
            fontSize: 36,
            fontWeight: '700',
            color: palette.clay,
            letterSpacing: 6,
            marginBottom: 32,
          }}
        >
          {joinCode}
        </Text>
        <PrimaryButton
          title="Done"
          onPress={handleDone}
          accessibilityLabel="Finish creating group"
        />
      </View>
    );
  }

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
          Create a Prayer Group
        </Text>

        {/* Name */}
        <Text
          style={{
            fontFamily: UIFontFamily,
            fontSize: 14,
            fontWeight: '600',
            color: palette.muted,
            marginBottom: 6,
          }}
        >
          Group Name *
        </Text>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="e.g., Honda Floor Prayer"
          placeholderTextColor={palette.inkDim}
          maxLength={60}
          editable={!isCreating}
          accessibilityLabel="Group name"
          style={{
            fontFamily: UIFontFamily,
            fontSize: 16,
            color: palette.ink,
            backgroundColor: palette.surface,
            borderRadius: 10,
            borderWidth: 1,
            borderColor: palette.line,
            padding: 14,
            marginBottom: 16,
          }}
        />

        {/* Description */}
        <Text
          style={{
            fontFamily: UIFontFamily,
            fontSize: 14,
            fontWeight: '600',
            color: palette.muted,
            marginBottom: 6,
          }}
        >
          Description (optional)
        </Text>
        <TextInput
          value={description}
          onChangeText={setDescription}
          placeholder="What is this group about?"
          placeholderTextColor={palette.inkDim}
          maxLength={200}
          multiline
          numberOfLines={3}
          textAlignVertical="top"
          editable={!isCreating}
          accessibilityLabel="Group description"
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
            minHeight: 80,
          }}
        />

        {/* Private toggle */}
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
              Private Group
            </Text>
            <Text
              style={{
                fontFamily: UIFontFamily,
                fontSize: 13,
                color: palette.muted,
                lineHeight: 18,
              }}
            >
              Only people with the join code can find and join.
            </Text>
          </View>
          <Switch
            value={isPrivate}
            onValueChange={setIsPrivate}
            disabled={isCreating}
            trackColor={{ false: palette.line, true: palette.sage }}
            thumbColor={isPrivate ? palette.surface : palette.surface}
            accessibilityLabel="Make this a private group"
          />
        </View>

        <PrimaryButton
          title={isCreating ? 'Creating...' : 'Create Group'}
          loading={isCreating}
          onPress={handleSubmit}
          disabled={!canSubmit}
          accessibilityLabel="Create prayer group"
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
