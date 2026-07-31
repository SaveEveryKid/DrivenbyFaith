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
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { useCreateThread, CATEGORIES } from '@/hooks/useDiscussions';
import { PrimaryButton } from '@/components/PrimaryButton';
import { UIFontFamily } from '@/constants/theme';
import type { DiscussionCategory } from '@/hooks/useDiscussions';

export default function NewThreadScreen(): React.ReactElement {
  const { category } = useLocalSearchParams<{ category: string }>();
  const { palette } = useTheme();
  const router = useRouter();
  const { createThread, isCreating } = useCreateThread();

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);

  const categoryInfo = CATEGORIES.find((c) => c.category === category);
  const categoryLabel = categoryInfo?.label ?? category ?? '';

  const canSubmit =
    title.trim().length >= 3 &&
    body.trim().length >= 3 &&
    !!category &&
    !isCreating;

  const handleSubmit = async (): Promise<void> => {
    if (!canSubmit) return;

    try {
      await createThread({
        category: category as DiscussionCategory,
        title: title.trim(),
        body: body.trim(),
        is_anonymous: isAnonymous,
      });
      router.back();
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Could not create thread.';
      Alert.alert('Error', message);
    }
  };

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
            marginBottom: 4,
          }}
        >
          New Thread
        </Text>
        <Text
          style={{
            fontFamily: UIFontFamily,
            fontSize: 14,
            color: palette.muted,
            marginBottom: 24,
          }}
        >
          in {categoryLabel}
        </Text>

        {/* Title */}
        <Text
          style={{
            fontFamily: UIFontFamily,
            fontSize: 14,
            fontWeight: '600',
            color: palette.muted,
            marginBottom: 6,
          }}
        >
          Title *
        </Text>
        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder="What do you want to discuss?"
          placeholderTextColor={palette.inkDim}
          maxLength={120}
          editable={!isCreating}
          accessibilityLabel="Thread title"
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
          Body *
        </Text>
        <TextInput
          value={body}
          onChangeText={setBody}
          placeholder="Share your thoughts..."
          placeholderTextColor={palette.inkDim}
          maxLength={5000}
          multiline
          numberOfLines={6}
          textAlignVertical="top"
          editable={!isCreating}
          accessibilityLabel="Thread body"
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
            minHeight: 140,
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
              Your name will not be shown.
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

        <PrimaryButton
          title={isCreating ? 'Posting...' : 'Post Thread'}
          loading={isCreating}
          onPress={handleSubmit}
          disabled={!canSubmit}
          accessibilityLabel="Post new discussion thread"
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
