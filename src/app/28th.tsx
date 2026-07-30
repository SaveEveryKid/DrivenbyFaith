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
import { ScriptureBlock } from '@/components/ScriptureBlock';
import { EmptyState } from '@/components/EmptyState';
import { useTheme } from '@/hooks/useTheme';
import { use28th } from '@/hooks/use28th';
import { useLine } from '@/hooks/useLine';
import { UIFontFamily, ScriptureFontFamily } from '@/constants/theme';

const PSALM_139 = {
  reference: 'Psalm 139:23-24',
  text: 'Search me, O God, and know my heart. Try me and know my thoughts. And see if there be any grievous way in me, and lead me in the way everlasting.',
};

const INTEGRITY_PRAYER =
  'Father, the end of the month brings pressure that can bend what I know to be right. Search me. Show me where I am tempted to cut corners or compromise. Give me the courage to hold the line — not because my will is strong, but because my trust is in you. Lead me in the way everlasting, even when it costs me. Amen.';

export default function TwentyEighthScreen(): React.ReactElement {
  const { palette, typography } = useTheme();
  const router = useRouter();
  const { isActive, entry, isLoading, isError, saveEntry, isSaving } = use28th();
  const { line } = useLine();

  const [commitment, setCommitment] = useState(entry?.confession ?? '');
  const [confession, setConfession] = useState(entry?.confession ?? '');
  const [repairStep, setRepairStep] = useState(entry?.repair_step ?? '');

  const hasSaved = !!entry;

  useEffect(() => {
    if (entry) {
      // The pre-commitment lives in confession field
      setCommitment(entry.confession);
      setConfession(entry.confession);
      setRepairStep(entry.repair_step);
    }
  }, [entry]);

  if (!isActive) {
    return (
      <View style={{ flex: 1, backgroundColor: palette.bg }}>
        <EmptyState
          icon="⌛"
          title="Not yet"
          subtitle="The 28th experience opens during the last three days of each month — a time to pause, review your commitments, and reset before the next month begins."
        />
      </View>
    );
  }

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: palette.bg, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={palette.clay} size="small" />
      </View>
    );
  }

  if (isError) {
    return (
      <View style={{ flex: 1, backgroundColor: palette.bg }}>
        <EmptyState
          icon="⚠"
          title="Something went wrong"
          subtitle="Could not load your 28th review. Please try again."
          action={
            <PrimaryButton title="Go back" onPress={() => router.back()} />
          }
        />
      </View>
    );
  }

  const handleSave = async (): Promise<void> => {
    await saveEntry(commitment, repairStep);
  };

  const verseFontSize = typography.scripture.sizes.base;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: palette.bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={{ padding: 24, paddingBottom: 48 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <Text
          style={{
            fontFamily: typography.scripture.fontFamily,
            fontSize: typography.ui.sizes.xl,
            fontWeight: '600',
            color: palette.ink,
            marginBottom: 8,
          }}
        >
          The 28th
        </Text>
        <Text
          style={{
            fontFamily: UIFontFamily,
            fontSize: typography.ui.sizes.sm,
            color: palette.muted,
            lineHeight: 20,
            marginBottom: 32,
          }}
        >
          The month is closing. Before the next one starts, take a moment to look back with honesty and ahead with intention. This space is private — nothing here is tracked or measured.
        </Text>

        {/* Section A: The Line */}
        <View
          style={{
            backgroundColor: palette.surface,
            borderRadius: 10,
            padding: 20,
            marginBottom: 24,
          }}
        >
          <Text
            style={{
              fontFamily: UIFontFamily,
              fontSize: typography.ui.sizes.sm,
              fontWeight: '600',
              color: palette.muted,
              textTransform: 'uppercase',
              letterSpacing: 0.5,
              marginBottom: 12,
            }}
          >
            Your Line
          </Text>
          {line ? (
            <Text
              style={{
                fontFamily: ScriptureFontFamily,
                fontSize: verseFontSize,
                color: palette.scripture,
                lineHeight: verseFontSize * typography.scripture.lineHeight,
                marginBottom: 12,
                fontStyle: 'italic',
              }}
            >
              "{line}"
            </Text>
          ) : (
            <Text
              style={{
                fontFamily: UIFontFamily,
                fontSize: typography.ui.sizes.sm,
                color: palette.muted,
                marginBottom: 12,
              }}
            >
              You have not set a line yet. Consider what you would not do, no matter the pressure.
            </Text>
          )}
          <Text
            style={{
              fontFamily: UIFontFamily,
              fontSize: typography.ui.sizes.sm,
              color: palette.sage,
            }}
            onPress={() => router.push('/line')}
          >
            {line ? 'Review or update your line' : 'Set your line'}
          </Text>
        </View>

        {/* Section B: Scripture + Prayer */}
        <View style={{ marginBottom: 24 }}>
          <ScriptureBlock
            reference={PSALM_139.reference}
            text={PSALM_139.text}
          />
          <View
            style={{
              backgroundColor: palette.surface,
              borderRadius: 10,
              padding: 16,
              marginTop: 8,
            }}
          >
            <Text
              style={{
                fontFamily: ScriptureFontFamily,
                fontSize: typography.scripture.sizes.small,
                color: palette.scripture,
                lineHeight:
                  typography.scripture.sizes.small * typography.scripture.lineHeight,
                fontStyle: 'italic',
              }}
            >
              {INTEGRITY_PRAYER}
            </Text>
          </View>
        </View>

        {/* Section C: Pre-commitment */}
        <View
          style={{
            backgroundColor: palette.surface,
            borderRadius: 10,
            padding: 20,
            marginBottom: 24,
          }}
        >
          <Text
            style={{
              fontFamily: UIFontFamily,
              fontSize: typography.ui.sizes.sm,
              fontWeight: '600',
              color: palette.muted,
              textTransform: 'uppercase',
              letterSpacing: 0.5,
              marginBottom: 8,
            }}
          >
            For my next shift, I will...
          </Text>
          <TextInput
            value={commitment}
            onChangeText={setCommitment}
            placeholder="Name one specific commitment..."
            placeholderTextColor={palette.inkDim}
            multiline
            textAlignVertical="top"
            accessibilityLabel="Pre-commitment for your next shift"
            style={{
              fontFamily: UIFontFamily,
              fontSize: typography.ui.sizes.base,
              color: palette.ink,
              minHeight: 80,
              lineHeight: typography.ui.sizes.base * 1.5,
              paddingVertical: 8,
            }}
          />
        </View>

        {/* Section D: Confession & Repair (optional) */}
        <View
          style={{
            backgroundColor: palette.surface,
            borderRadius: 10,
            padding: 20,
            marginBottom: 24,
          }}
        >
          <Text
            style={{
              fontFamily: UIFontFamily,
              fontSize: typography.ui.sizes.sm,
              fontWeight: '600',
              color: palette.muted,
              textTransform: 'uppercase',
              letterSpacing: 0.5,
              marginBottom: 4,
            }}
          >
            Confession & Repair
          </Text>
          <Text
            style={{
              fontFamily: UIFontFamily,
              fontSize: typography.ui.sizes.xs,
              color: palette.muted,
              marginBottom: 16,
              lineHeight: 18,
            }}
          >
            Optional. This is between you and God. If this month brought a moment you need to name honestly and begin to repair, write it here.
          </Text>

          <Text
            style={{
              fontFamily: UIFontFamily,
              fontSize: typography.ui.sizes.sm,
              fontWeight: '600',
              color: palette.ink,
              marginBottom: 6,
            }}
          >
            What happened
          </Text>
          <TextInput
            value={confession}
            onChangeText={setConfession}
            placeholder="Name what happened..."
            placeholderTextColor={palette.inkDim}
            multiline
            textAlignVertical="top"
            accessibilityLabel="Confession: what happened"
            style={{
              fontFamily: UIFontFamily,
              fontSize: typography.ui.sizes.base,
              color: palette.ink,
              minHeight: 80,
              lineHeight: typography.ui.sizes.base * 1.5,
              paddingVertical: 8,
              marginBottom: 16,
            }}
          />

          <Text
            style={{
              fontFamily: UIFontFamily,
              fontSize: typography.ui.sizes.sm,
              fontWeight: '600',
              color: palette.ink,
              marginBottom: 6,
            }}
          >
            A step toward repair
          </Text>
          <TextInput
            value={repairStep}
            onChangeText={setRepairStep}
            placeholder="One concrete thing you can do..."
            placeholderTextColor={palette.inkDim}
            multiline
            textAlignVertical="top"
            accessibilityLabel="Repair step"
            style={{
              fontFamily: UIFontFamily,
              fontSize: typography.ui.sizes.base,
              color: palette.ink,
              minHeight: 80,
              lineHeight: typography.ui.sizes.base * 1.5,
              paddingVertical: 8,
            }}
          />
        </View>

        {/* Save */}
        <PrimaryButton
          title={isSaving ? 'Saving...' : hasSaved ? 'Update' : 'Save'}
          onPress={handleSave}
          loading={isSaving}
          accessibilityLabel="Save your 28th entry"
        />

        {hasSaved && (
          <Text
            style={{
              fontFamily: UIFontFamily,
              fontSize: typography.ui.sizes.sm,
              color: palette.sage,
              textAlign: 'center',
              marginTop: 16,
            }}
          >
            Your entry has been saved. These words are held in confidence.
          </Text>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
