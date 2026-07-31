import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ScriptureBlock } from '@/components/ScriptureBlock';
import { PrimaryButton } from '@/components/PrimaryButton';
import { EmptyState } from '@/components/EmptyState';
import { useTheme } from '@/hooks/useTheme';
import { useSaturdayReady, useSaveSaturdayReadyResponse } from '@/hooks/useSaturdayReady';
import { UIFontFamily, ScriptureFontFamily } from '@/constants/theme';

export default function SaturdayReadyScreen(): React.ReactElement {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { palette, typography } = useTheme();
  const { saturdayReady, response, isLoading, isError, error } = useSaturdayReady();
  const { save, isSaving } = useSaveSaturdayReadyResponse(id);

  const [selectedCommitments, setSelectedCommitments] = useState<string[]>(
    response?.commitments_selected ?? [],
  );
  const [notes, setNotes] = useState<string>(response?.notes ?? '');

  const isAlreadyCompleted = !!response;

  const commitments: string[] = useMemo(() => {
    if (!saturdayReady?.three_commitments) return [];
    if (Array.isArray(saturdayReady.three_commitments)) {
      return saturdayReady.three_commitments as string[];
    }
    return [];
  }, [saturdayReady?.three_commitments]);

  const toggleCommitment = (commitment: string): void => {
    setSelectedCommitments((prev) => {
      if (prev.includes(commitment)) {
        return prev.filter((c) => c !== commitment);
      }
      if (prev.length >= 3) {
        return prev;
      }
      return [...prev, commitment];
    });
  };

  const handleComplete = async (): Promise<void> => {
    await save({
      commitmentsSelected: selectedCommitments,
      notes: notes.trim() || null,
    });
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

  if (isError || !saturdayReady) {
    return (
      <EmptyState
        icon="⚠"
        title="Could not load Saturday Ready"
        subtitle={error?.message ?? 'Please check your connection and try again.'}
      />
    );
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: palette.bg }}
      contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
      accessibilityLabel="Saturday Ready preparation"
    >
      {/* Theme */}
      <Text
        style={{
          fontFamily: UIFontFamily,
          fontSize: typography.ui.sizes.sm,
          fontWeight: '600',
          color: palette.sage,
          textTransform: 'uppercase',
          letterSpacing: 0.5,
          marginBottom: 4,
        }}
        accessibilityLabel={`Theme: ${saturdayReady.theme}`}
      >
        Saturday Ready
      </Text>
      <Text
        style={{
          fontFamily: typography.scripture.fontFamily,
          fontSize: typography.scripture.sizes.large,
          fontWeight: '600',
          color: palette.ink,
          marginBottom: 16,
        }}
      >
        {saturdayReady.theme}
      </Text>

      {/* Scripture */}
      <ScriptureBlock
        reference={saturdayReady.scripture_reference}
        text={saturdayReady.scripture_text}
      />

      {/* Preparation body */}
      <Text
        style={{
          fontFamily: UIFontFamily,
          fontSize: typography.ui.sizes.base,
          color: palette.ink,
          lineHeight: typography.ui.sizes.base * 1.5,
          marginBottom: 24,
        }}
      >
        {saturdayReady.preparation_body}
      </Text>

      {/* Already completed view */}
      {isAlreadyCompleted && (
        <View
          style={{
            backgroundColor: palette.surface,
            borderRadius: 12,
            padding: 16,
            marginBottom: 24,
            borderWidth: 1,
            borderColor: palette.line,
          }}
          accessibilityLabel="Saturday commitments"
        >
          <Text
            style={{
              fontFamily: typography.scripture.fontFamily,
              fontSize: typography.ui.sizes.lg,
              fontWeight: '600',
              color: palette.ink,
              marginBottom: 12,
            }}
          >
            Your Saturday commitments
          </Text>
          {(response?.commitments_selected ?? []).map((c: string, idx: number) => (
            <View
              key={idx}
              style={{
                flexDirection: 'row',
                alignItems: 'flex-start',
                marginBottom: 8,
              }}
            >
              <Text
                style={{
                  fontFamily: UIFontFamily,
                  fontSize: typography.ui.sizes.sm,
                  color: palette.sage,
                  marginRight: 8,
                  fontWeight: '700',
                }}
              >
                ✓
              </Text>
              <Text
                style={{
                  fontFamily: UIFontFamily,
                  fontSize: typography.ui.sizes.sm,
                  color: palette.ink,
                  flex: 1,
                  lineHeight: 20,
                }}
              >
                {c}
              </Text>
            </View>
          ))}
          {response?.notes ? (
            <Text
              style={{
                fontFamily: typography.scripture.fontFamily,
                fontSize: typography.scripture.sizes.small,
                color: palette.muted,
                fontStyle: 'italic',
                marginTop: 12,
                paddingTop: 12,
                borderTopWidth: 1,
                borderTopColor: palette.line,
              }}
            >
              {response.notes}
            </Text>
          ) : null}
        </View>
      )}

      {/* Commitment selection (if not yet completed) */}
      {!isAlreadyCompleted && (
        <>
          <Text
            style={{
              fontFamily: UIFontFamily,
              fontSize: typography.ui.sizes.sm,
              fontWeight: '600',
              color: palette.ink,
              marginBottom: 12,
            }}
          >
            Choose up to three commitments
          </Text>
          {commitments.map((commitment, idx) => {
            const isSelected = selectedCommitments.includes(commitment);
            const isDisabled = !isSelected && selectedCommitments.length >= 3;

            return (
              <TouchableOpacity
                key={idx}
                onPress={() => toggleCommitment(commitment)}
                disabled={isDisabled}
                accessibilityLabel={`Commitment ${idx + 1}: ${commitment}`}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: isSelected, disabled: isDisabled }}
                style={{
                  flexDirection: 'row',
                  alignItems: 'flex-start',
                  paddingVertical: 12,
                  paddingHorizontal: 14,
                  marginBottom: 8,
                  backgroundColor: isSelected
                    ? palette.clay + '14'
                    : palette.surface,
                  borderRadius: 10,
                  borderWidth: 1,
                  borderColor: isSelected ? palette.clay : palette.line,
                  opacity: isDisabled ? 0.4 : 1,
                }}
              >
                <View
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: 4,
                    borderWidth: 2,
                    borderColor: isSelected ? palette.clay : palette.line,
                    backgroundColor: isSelected ? palette.clay : 'transparent',
                    marginRight: 10,
                    marginTop: 1,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {isSelected && (
                    <Text style={{ color: palette.surface, fontSize: 14, fontWeight: '700' }}>
                      ✓
                    </Text>
                  )}
                </View>
                <Text
                  style={{
                    fontFamily: UIFontFamily,
                    fontSize: typography.ui.sizes.sm,
                    color: palette.ink,
                    flex: 1,
                    lineHeight: 20,
                  }}
                >
                  {commitment}
                </Text>
              </TouchableOpacity>
            );
          })}
        </>
      )}

      {/* Closing prayer */}
      <View
        style={{
          backgroundColor: palette.surface,
          borderRadius: 12,
          padding: 16,
          marginTop: 24,
          marginBottom: 24,
          borderWidth: 1,
          borderColor: palette.line,
        }}
      >
        <Text
          style={{
            fontFamily: UIFontFamily,
            fontSize: typography.ui.sizes.xs,
            fontWeight: '600',
            color: palette.muted,
            textTransform: 'uppercase',
            letterSpacing: 0.5,
            marginBottom: 8,
          }}
        >
          Closing Prayer
        </Text>
        <Text
          style={{
            fontFamily: typography.scripture.fontFamily,
            fontSize: typography.scripture.sizes.small,
            color: palette.ink,
            lineHeight: typography.scripture.sizes.small * typography.scripture.lineHeight,
          }}
        >
          {saturdayReady.prayer}
        </Text>
      </View>

      {/* Notes textarea (if not completed) */}
      {!isAlreadyCompleted && (
        <View style={{ marginBottom: 24 }}>
          <Text
            style={{
              fontFamily: UIFontFamily,
              fontSize: typography.ui.sizes.xs,
              fontWeight: '600',
              color: palette.muted,
              textTransform: 'uppercase',
              letterSpacing: 0.5,
              marginBottom: 8,
            }}
          >
            Notes (optional)
          </Text>
          <TextInput
            value={notes}
            onChangeText={setNotes}
            placeholder="Write any thoughts or prayers here…"
            placeholderTextColor={palette.inkDim}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            accessibilityLabel="Notes"
            style={{
              fontFamily: UIFontFamily,
              fontSize: typography.ui.sizes.sm,
              color: palette.ink,
              backgroundColor: palette.surface,
              borderWidth: 1,
              borderColor: palette.line,
              borderRadius: 10,
              padding: 12,
              minHeight: 100,
              lineHeight: 20,
            }}
          />
        </View>
      )}

      {/* Complete button (if not completed) */}
      {!isAlreadyCompleted && (
        <PrimaryButton
          title="Complete"
          onPress={handleComplete}
          loading={isSaving}
          disabled={selectedCommitments.length === 0}
          accessibilityLabel="Complete Saturday Ready preparation"
        />
      )}
    </ScrollView>
  );
}
