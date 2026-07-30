import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { PrimaryButton } from '@/components/PrimaryButton';
import { GhostButton } from '@/components/GhostButton';
import { useTheme } from '@/hooks/useTheme';
import { useLine } from '@/hooks/useLine';
import { UIFontFamily, ScriptureFontFamily } from '@/constants/theme';

export default function LineScreen(): React.ReactElement {
  const { palette, typography } = useTheme();
  const router = useRouter();
  const { line, lastReviewedAt, isLoading, saveLine, isSaving } = useLine();
  const [value, setValue] = useState(line ?? '');

  useEffect(() => {
    if (line !== null && value === '') {
      setValue(line);
    }
  }, [line, value]);

  const hasChanges = value.trim() !== (line ?? '').trim();
  const isEmpty = value.trim() === '';

  const handleSave = async (): Promise<void> => {
    await saveLine(value.trim());
    router.back();
  };

  const formatDate = (dateStr: string): string => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: palette.bg, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={palette.clay} size="small" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: palette.bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={{ padding: 24, paddingBottom: 48 }}
        keyboardShouldPersistTaps="handled"
      >
        <Text
          style={{
            fontFamily: typography.scripture.fontFamily,
            fontSize: typography.ui.sizes.xl,
            fontWeight: '600',
            color: palette.ink,
            marginBottom: 8,
          }}
        >
          The Line You Will Not Cross
        </Text>
        <Text
          style={{
            fontFamily: UIFontFamily,
            fontSize: typography.ui.sizes.sm,
            color: palette.muted,
            lineHeight: 20,
            marginBottom: 24,
          }}
        >
          One clear commitment you make before the pressure hits. When the moment comes — and it will — you have already decided.
        </Text>

        {lastReviewedAt && (
          <View
            style={{
              backgroundColor: palette.surface,
              borderRadius: 8,
              padding: 12,
              marginBottom: 20,
            }}
          >
            <Text
              style={{
                fontFamily: UIFontFamily,
                fontSize: typography.ui.sizes.xs,
                color: palette.muted,
              }}
            >
              Your line was last reviewed on {formatDate(lastReviewedAt)}
            </Text>
          </View>
        )}

        <View
          style={{
            backgroundColor: palette.surface,
            borderRadius: 10,
            padding: 16,
            marginBottom: 24,
          }}
        >
          <Text
            style={{
              fontFamily: UIFontFamily,
              fontSize: typography.ui.sizes.sm,
              fontWeight: '600',
              color: palette.ink,
              marginBottom: 8,
            }}
          >
            My line
          </Text>
          <TextInput
            value={value}
            onChangeText={setValue}
            placeholder="I will not..."
            placeholderTextColor={palette.inkDim}
            multiline
            textAlignVertical="top"
            accessibilityLabel="Your line you will not cross"
            style={{
              fontFamily: ScriptureFontFamily,
              fontSize: typography.scripture.sizes.base,
              color: palette.scripture,
              minHeight: 120,
              lineHeight: typography.scripture.sizes.base * typography.scripture.lineHeight,
              paddingVertical: 8,
            }}
          />
        </View>

        <Text
          style={{
            fontFamily: UIFontFamily,
            fontSize: typography.ui.sizes.sm,
            color: palette.muted,
            lineHeight: 20,
            marginBottom: 24,
          }}
        >
          This is between you and God. It does not need to impress anyone. A good line is specific — name the situation, name your response. "I will not lie about a vehicle's history." "I will not pad the payment." "I will not disparage a coworker to close a deal."
        </Text>

        <View style={{ flexDirection: 'row', gap: 12 }}>
          <View style={{ flex: 1 }}>
            <GhostButton
              title="Cancel"
              onPress={() => router.back()}
            />
          </View>
          <View style={{ flex: 1 }}>
            <PrimaryButton
              title={isSaving ? 'Saving...' : 'Save'}
              onPress={handleSave}
              loading={isSaving}
              disabled={isEmpty}
              accessibilityLabel="Save your line"
            />
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
