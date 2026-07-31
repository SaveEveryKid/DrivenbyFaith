import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { PrimaryButton } from '@/components/PrimaryButton';
import { EmptyState } from '@/components/EmptyState';
import { useTheme } from '@/hooks/useTheme';
import {
  useMemoryVerse,
  useReviewMemoryVerse,
  getFirstLetters,
  getFillBlanks,
  getNextReviewMode,
} from '@/hooks/useMemory';
import type { ReviewMode, RecallQuality } from '@/hooks/useMemory';

export default function MemoryReviewScreen(): React.ReactElement {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { palette, typography } = useTheme();
  const { verse, isLoading, isError, error } = useMemoryVerse(id);
  const { review, isReviewing } = useReviewMemoryVerse();

  const [mode, setMode] = useState<ReviewMode>('read');
  const [userInput, setUserInput] = useState('');
  const [hasReviewed, setHasReviewed] = useState(false);
  const [selectedQuality, setSelectedQuality] = useState<RecallQuality | null>(null);

  // ── Computed values ───────────────────────────────────────────────────────

  const blanksData = useMemo(() => {
    if (!verse) return { display: [] as (string | null)[], blanks: [] as number[] };
    return getFillBlanks(verse.verse_text);
  }, [verse, mode]); // re-randomize each time mode changes to fillBlanks

  const firstLetters = useMemo(() => {
    if (!verse) return '';
    return getFirstLetters(verse.verse_text);
  }, [verse]);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleNextMode = (): void => {
    const next = getNextReviewMode(mode);
    setMode(next);
    if (next === 'fillBlanks') {
      // Force re-memo of blanks by triggering state update
      setUserInput('');
    }
  };

  const handleRateRecall = async (quality: RecallQuality): Promise<void> => {
    if (!verse) return;
    setSelectedQuality(quality);
    await review(verse, quality);
    setHasReviewed(true);
  };

  const handleDone = (): void => {
    router.back();
  };

  // ── Render ────────────────────────────────────────────────────────────────

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

  if (isError || !verse) {
    return (
      <EmptyState
        icon="⚠"
        title="Could not load verse"
        subtitle={error?.message ?? 'This memory verse could not be found.'}
      />
    );
  }

  const qualityLabels: { value: RecallQuality; label: string; description: string }[] = [
    { value: 1, label: 'Blackout', description: 'Could not recall at all' },
    { value: 2, label: 'With effort', description: 'Remembered with significant effort' },
    { value: 3, label: 'Slight hesitation', description: 'Recalled with only slight hesitation' },
    { value: 4, label: 'Perfect', description: 'Recalled perfectly, no hesitation' },
  ];

  const renderModeContent = (): React.ReactElement => {
    switch (mode) {
      case 'read':
        return (
          <View>
            <Text
              style={{
                fontFamily: typography.scripture.fontFamily,
                fontSize: typography.scripture.sizes.base,
                color: palette.ink,
                lineHeight: typography.scripture.sizes.base * typography.scripture.lineHeight,
                marginBottom: 16,
              }}
            >
              {verse.verse_text}
            </Text>
            <Text
              style={{
                fontFamily: typography.ui.fontFamily,
                fontSize: typography.ui.sizes.xs,
                color: palette.muted,
                textTransform: 'uppercase',
                letterSpacing: 0.5,
              }}
            >
              Read the verse carefully. Then move to the next mode.
            </Text>
          </View>
        );

      case 'firstLetters':
        return (
          <View>
            <Text
              style={{
                fontFamily: 'Courier New, monospace',
                fontSize: typography.ui.sizes.base,
                color: palette.ink,
                letterSpacing: 2,
                lineHeight: 28,
                marginBottom: 16,
              }}
            >
              {firstLetters}
            </Text>
            <Text
              style={{
                fontFamily: typography.ui.fontFamily,
                fontSize: typography.ui.sizes.xs,
                color: palette.muted,
              }}
            >
              Try to recite the verse using only the first letter of each word.
            </Text>
          </View>
        );

      case 'fillBlanks': {
        const words = verse.verse_text.split(/\s+/);
        return (
          <View>
            <Text
              style={{
                fontFamily: typography.scripture.fontFamily,
                fontSize: typography.scripture.sizes.base,
                color: palette.ink,
                lineHeight: typography.scripture.sizes.base * typography.scripture.lineHeight,
                marginBottom: 16,
              }}
            >
              {words.map((word, i) => (
                <Text key={i}>
                  {blanksData.display[i] !== null ? (
                    <Text style={{ color: palette.ink }}>{word}</Text>
                  ) : (
                    <Text
                      style={{
                        color: palette.clay,
                        borderBottomWidth: 1,
                        borderBottomColor: palette.clay,
                        paddingHorizontal: 2,
                      }}
                    >
                      ____
                    </Text>
                  )}
                  {i < words.length - 1 ? ' ' : ''}
                </Text>
              ))}
            </Text>
            <Text
              style={{
                fontFamily: typography.ui.fontFamily,
                fontSize: typography.ui.sizes.xs,
                color: palette.muted,
              }}
            >
              Fill in the missing words from memory.
            </Text>
          </View>
        );
      }

      case 'typeFromMemory':
        return (
          <View>
            <TextInput
              value={userInput}
              onChangeText={setUserInput}
              placeholder="Type the verse from memory…"
              placeholderTextColor={palette.inkDim}
              multiline
              numberOfLines={5}
              textAlignVertical="top"
              autoCapitalize="none"
              accessibilityLabel="Type the verse from memory"
              style={{
                fontFamily: typography.scripture.fontFamily,
                fontSize: typography.scripture.sizes.base,
                color: palette.ink,
                backgroundColor: palette.surface,
                borderWidth: 1,
                borderColor: palette.line,
                borderRadius: 10,
                padding: 12,
                minHeight: 120,
                marginBottom: 16,
                lineHeight: typography.scripture.sizes.base * typography.scripture.lineHeight,
              }}
            />
            {/* Diff comparison */}
            {userInput.trim().length > 0 && (
              <View
                style={{
                  backgroundColor: palette.surface,
                  borderRadius: 10,
                  padding: 12,
                  marginBottom: 12,
                  borderWidth: 1,
                  borderColor: palette.line,
                }}
              >
                <Text
                  style={{
                    fontFamily: typography.ui.fontFamily,
                    fontSize: typography.ui.sizes.xs,
                    fontWeight: '600',
                    color: palette.muted,
                    textTransform: 'uppercase',
                    letterSpacing: 0.5,
                    marginBottom: 6,
                  }}
                >
                  Compare
                </Text>
                <Text
                  style={{
                    fontFamily: typography.scripture.fontFamily,
                    fontSize: typography.scripture.sizes.small,
                    color: palette.sage,
                    lineHeight: typography.scripture.sizes.small * typography.scripture.lineHeight,
                  }}
                >
                  {verse.verse_text}
                </Text>
              </View>
            )}
          </View>
        );
    }
  };

  if (hasReviewed) {
    return (
      <ScrollView
        style={{ flex: 1, backgroundColor: palette.bg }}
        contentContainerStyle={{
          padding: 24,
          alignItems: 'center',
          justifyContent: 'center',
          flexGrow: 1,
        }}
      >
        <View
          style={{
            width: 56,
            height: 56,
            borderRadius: 28,
            backgroundColor: palette.sage,
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 16,
          }}
        >
          <Text style={{ color: '#FFFFFF', fontSize: 28 }}>✓</Text>
        </View>
        <Text
          style={{
            fontFamily: typography.scripture.fontFamily,
            fontSize: typography.ui.sizes.xl,
            fontWeight: '600',
            color: palette.ink,
            marginBottom: 8,
            textAlign: 'center',
          }}
        >
          Review complete
        </Text>
        <Text
          style={{
            fontFamily: typography.ui.fontFamily,
            fontSize: typography.ui.sizes.sm,
            color: palette.muted,
            textAlign: 'center',
            lineHeight: 20,
            marginBottom: 24,
          }}
        >
          Your next review is scheduled based on how well you recalled this verse. Steady practice deepens what sticks.
        </Text>
        <PrimaryButton
          title="Done"
          onPress={handleDone}
          accessibilityLabel="Return to memory verses"
        />
      </ScrollView>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: palette.bg }}
      contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
      accessibilityLabel={`Review memory verse: ${verse.reference}`}
    >
      {/* Reference */}
      <Text
        style={{
          fontFamily: typography.ui.fontFamily,
          fontSize: typography.ui.sizes.sm,
          fontWeight: '600',
          color: palette.clay,
          textTransform: 'uppercase',
          letterSpacing: 0.5,
          marginBottom: 4,
        }}
      >
        {verse.reference} ({verse.translation})
      </Text>

      {/* Mode indicator */}
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
        <Text
          style={{
            fontFamily: typography.ui.fontFamily,
            fontSize: typography.ui.sizes.xs,
            color: palette.muted,
          }}
        >
          Mode: {mode === 'read' ? 'Read' : mode === 'firstLetters' ? 'First Letters' : mode === 'fillBlanks' ? 'Fill Blanks' : 'Type from Memory'}
        </Text>
        <View style={{ flex: 1 }} />
        {mode !== 'typeFromMemory' && (
          <TouchableOpacity
            onPress={handleNextMode}
            accessibilityLabel="Next review mode"
            style={{
              paddingVertical: 6,
              paddingHorizontal: 12,
              backgroundColor: palette.clay + '14',
              borderRadius: 6,
            }}
          >
            <Text
              style={{
                fontFamily: typography.ui.fontFamily,
                fontSize: typography.ui.sizes.xs,
                fontWeight: '600',
                color: palette.clay,
              }}
            >
              Next mode
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Review content */}
      <View
        style={{
          backgroundColor: palette.surface,
          borderRadius: 12,
          padding: 16,
          marginBottom: 24,
          borderWidth: 1,
          borderColor: palette.line,
        }}
      >
        {renderModeContent()}
      </View>

      {/* Rating section — only shown after type-from-memory or as final step */}
      <View style={{ marginBottom: 24 }}>
        <Text
          style={{
            fontFamily: typography.ui.fontFamily,
            fontSize: typography.ui.sizes.sm,
            fontWeight: '600',
            color: palette.ink,
            marginBottom: 12,
          }}
        >
          Rate your recall
        </Text>
        {qualityLabels.map((q) => (
          <TouchableOpacity
            key={q.value}
            onPress={() => handleRateRecall(q.value)}
            disabled={isReviewing}
            accessibilityLabel={`Rate recall: ${q.label} — ${q.description}`}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingVertical: 12,
              paddingHorizontal: 14,
              marginBottom: 8,
              backgroundColor:
                selectedQuality === q.value ? palette.clay + '14' : palette.surface,
              borderRadius: 10,
              borderWidth: 1,
              borderColor:
                selectedQuality === q.value ? palette.clay : palette.line,
              opacity: isReviewing ? 0.5 : 1,
            }}
          >
            <View
              style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                backgroundColor:
                  selectedQuality === q.value ? palette.clay : palette.line + '40',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 10,
              }}
            >
              <Text
                style={{
                  fontFamily: typography.ui.fontFamily,
                  fontSize: typography.ui.sizes.sm,
                  fontWeight: '700',
                  color: selectedQuality === q.value ? '#FFFFFF' : palette.muted,
                }}
              >
                {q.value}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontFamily: typography.ui.fontFamily,
                  fontSize: typography.ui.sizes.sm,
                  fontWeight: '600',
                  color: palette.ink,
                }}
              >
                {q.label}
              </Text>
              <Text
                style={{
                  fontFamily: typography.ui.fontFamily,
                  fontSize: typography.ui.sizes.xs,
                  color: palette.muted,
                }}
              >
                {q.description}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
        {isReviewing && (
          <ActivityIndicator
            color={palette.clay}
            size="small"
            style={{ marginTop: 8 }}
          />
        )}
      </View>
    </ScrollView>
  );
}
