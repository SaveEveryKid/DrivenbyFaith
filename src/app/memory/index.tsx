import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { useMemoryVerses, useAddMemoryVerse } from '@/hooks/useMemory';
import { PrimaryButton } from '@/components/PrimaryButton';
import { GhostButton } from '@/components/GhostButton';
import { EmptyState } from '@/components/EmptyState';
import type { MemoryVerseRow } from '@/types/database';

export default function MemoryVerseListScreen(): React.ReactElement {
  const router = useRouter();
  const { palette, typography } = useTheme();
  const { verses, dueCount, isLoading, isError, error } = useMemoryVerses();
  const { addVerse, isAdding } = useAddMemoryVerse();

  const [showAddForm, setShowAddForm] = useState(false);
  const [newReference, setNewReference] = useState('');
  const [newText, setNewText] = useState('');

  const today = new Date().toISOString().slice(0, 10);

  const handleAddVerse = async (): Promise<void> => {
    if (!newReference.trim() || !newText.trim()) {
      Alert.alert('Missing fields', 'Please enter both a reference and the verse text.');
      return;
    }
    await addVerse({
      reference: newReference.trim(),
      verseText: newText.trim(),
    });
    setNewReference('');
    setNewText('');
    setShowAddForm(false);
  };

  const handleVersePress = (verse: MemoryVerseRow): void => {
    router.push({
      pathname: '/memory/review/[id]',
      params: { id: verse.id },
    });
  };

  const renderVerseItem = ({
    item: verse,
  }: {
    item: MemoryVerseRow;
  }): React.ReactElement => {
    const isDue = verse.next_review_date <= today;
    const preview =
      verse.verse_text.length > 60
        ? verse.verse_text.slice(0, 60).trimEnd() + '…'
        : verse.verse_text;

    return (
      <TouchableOpacity
        onPress={() => handleVersePress(verse)}
        accessibilityLabel={`${verse.reference}: ${preview}${isDue ? ', due for review' : ''}`}
        style={{
          backgroundColor: palette.surface,
          borderRadius: 12,
          padding: 16,
          marginBottom: 10,
          borderWidth: 1,
          borderColor: isDue ? palette.clay + '50' : palette.line,
        }}
      >
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 6,
          }}
        >
          <Text
            style={{
              fontFamily: typography.ui.fontFamily,
              fontSize: typography.ui.sizes.sm,
              fontWeight: '600',
              color: palette.ink,
              textTransform: 'uppercase',
              letterSpacing: 0.5,
            }}
          >
            {verse.reference}
          </Text>
          {isDue && (
            <View
              style={{
                backgroundColor: palette.clay,
                borderRadius: 6,
                paddingHorizontal: 8,
                paddingVertical: 2,
              }}
            >
              <Text
                style={{
                  fontFamily: typography.ui.fontFamily,
                  fontSize: typography.ui.sizes.xs,
                  fontWeight: '600',
                  color: '#FFFFFF',
                }}
              >
                Due
              </Text>
            </View>
          )}
        </View>
        <Text
          style={{
            fontFamily: typography.scripture.fontFamily,
            fontSize: typography.scripture.sizes.small,
            color: palette.ink,
            lineHeight: typography.scripture.sizes.small * typography.scripture.lineHeight,
            marginBottom: 8,
          }}
        >
          {preview}
        </Text>
        <Text
          style={{
            fontFamily: typography.ui.fontFamily,
            fontSize: typography.ui.sizes.xs,
            color: palette.muted,
          }}
        >
          Next review: {new Date(verse.next_review_date + 'T12:00:00').toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
          })}
        </Text>
      </TouchableOpacity>
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
      <EmptyState
        icon="⚠"
        title="Could not load memory verses"
        subtitle={error?.message ?? 'Please check your connection and try again.'}
      />
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: palette.bg }}>
      {/* Due count banner */}
      {dueCount > 0 && (
        <View
          style={{
            backgroundColor: palette.clay + '10',
            paddingVertical: 10,
            paddingHorizontal: 16,
            borderBottomWidth: 1,
            borderBottomColor: palette.line,
          }}
          accessibilityLabel={`${dueCount} verses due for review`}
        >
          <Text
            style={{
              fontFamily: typography.ui.fontFamily,
              fontSize: typography.ui.sizes.sm,
              color: palette.clay,
              fontWeight: '600',
            }}
          >
            {dueCount} verse{dueCount !== 1 ? 's' : ''} due for review
          </Text>
        </View>
      )}

      <FlatList
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        data={verses}
        keyExtractor={(item) => item.id}
        renderItem={renderVerseItem}
        ListHeaderComponent={
          <View style={{ marginBottom: 16 }}>
            {!showAddForm ? (
              <GhostButton
                title="+ Add a verse"
                onPress={() => setShowAddForm(true)}
                accessibilityLabel="Add a new memory verse"
              />
            ) : (
              <View
                style={{
                  backgroundColor: palette.surface,
                  borderRadius: 12,
                  padding: 16,
                  marginBottom: 16,
                  borderWidth: 1,
                  borderColor: palette.line,
                }}
              >
                <Text
                  style={{
                    fontFamily: typography.ui.fontFamily,
                    fontSize: typography.ui.sizes.sm,
                    fontWeight: '600',
                    color: palette.ink,
                    marginBottom: 12,
                  }}
                >
                  Add a memory verse
                </Text>
                <TextInput
                  value={newReference}
                  onChangeText={setNewReference}
                  placeholder="Reference (e.g. Romans 8:28)"
                  placeholderTextColor={palette.inkDim}
                  accessibilityLabel="Verse reference"
                  style={{
                    fontFamily: typography.ui.fontFamily,
                    fontSize: typography.ui.sizes.sm,
                    color: palette.ink,
                    backgroundColor: palette.bg,
                    borderWidth: 1,
                    borderColor: palette.line,
                    borderRadius: 8,
                    padding: 10,
                    marginBottom: 10,
                  }}
                />
                <TextInput
                  value={newText}
                  onChangeText={setNewText}
                  placeholder="Verse text"
                  placeholderTextColor={palette.inkDim}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                  accessibilityLabel="Verse text"
                  style={{
                    fontFamily: typography.scripture.fontFamily,
                    fontSize: typography.scripture.sizes.small,
                    color: palette.ink,
                    backgroundColor: palette.bg,
                    borderWidth: 1,
                    borderColor: palette.line,
                    borderRadius: 8,
                    padding: 10,
                    minHeight: 80,
                    marginBottom: 12,
                    lineHeight: typography.scripture.sizes.small * typography.scripture.lineHeight,
                  }}
                />
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <View style={{ flex: 1 }}>
                    <PrimaryButton
                      title="Save"
                      onPress={handleAddVerse}
                      loading={isAdding}
                      accessibilityLabel="Save memory verse"
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <PrimaryButton
                      title="Cancel"
                      variant="outline"
                      onPress={() => setShowAddForm(false)}
                      accessibilityLabel="Cancel adding verse"
                    />
                  </View>
                </View>
              </View>
            )}
          </View>
        }
        ListEmptyComponent={
          !showAddForm ? (
            <EmptyState
              icon="📝"
              title="No memory verses yet"
              subtitle="Add a verse to start memorizing Scripture. Review regularly to commit it to memory."
              action={
                <PrimaryButton
                  title="Add your first verse"
                  onPress={() => setShowAddForm(true)}
                  accessibilityLabel="Add your first memory verse"
                />
              }
            />
          ) : null
        }
        accessibilityLabel="Memory verses list"
      />
    </View>
  );
}
