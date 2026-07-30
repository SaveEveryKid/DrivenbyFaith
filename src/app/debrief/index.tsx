import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  SectionList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { PrimaryButton } from '@/components/PrimaryButton';
import { EmptyState } from '@/components/EmptyState';
import { useTheme } from '@/hooks/useTheme';
import { useDebriefs, useDebriefSearch, debriefToText } from '@/hooks/useDebrief';
import { UIFontFamily, ScriptureFontFamily } from '@/constants/theme';

const MOOD_FACES: Record<number, string> = {
  1: '😞',
  2: '😔',
  3: '😐',
  4: '🙂',
  5: '😊',
};

export default function DebriefIndexScreen(): React.ReactElement {
  const { palette, typography } = useTheme();
  const router = useRouter();
  const { sections, debriefs, isLoading, isError } = useDebriefs();
  const [search, setSearch] = useState('');
  const { searchDebriefs } = useDebriefSearch(debriefs);

  const filteredDebriefs = useMemo(() => {
    return search.trim() ? searchDebriefs(search) : debriefs;
  }, [search, searchDebriefs, debriefs]);

  const filteredSections = useMemo(() => {
    if (!search.trim()) return sections;

    // Group filtered debriefs by month
    const groups = new Map<string, typeof filteredDebriefs>();
    for (const d of filteredDebriefs) {
      const date = new Date(d.debrief_date);
      const key = date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
      const existing = groups.get(key) ?? [];
      existing.push(d);
      groups.set(key, existing);
    }
    return Array.from(groups.entries()).map(([title, data]) => ({ title, data }));
  }, [search, sections, filteredDebriefs]);

  const handleExport = (): void => {
    if (filteredDebriefs.length === 0) {
      Alert.alert('Nothing to export', 'No debriefs match your current selection.');
      return;
    }

    const text = filteredDebriefs
      .map((d) => debriefToText(d))
      .join('\n\n---\n\n');

    // For now, show as an alert since we don't have sharing wired
    // In production, this would use expo-sharing
    Alert.alert(
      'Export',
      `Generated text export of ${filteredDebriefs.length} debrief${filteredDebriefs.length !== 1 ? 's' : ''}. Sharing integration is pending.`,
      [
        { text: 'OK' },
        {
          text: 'Preview',
          onPress: () => {
            Alert.alert('Export Preview', text.slice(0, 500) + (text.length > 500 ? '...' : ''));
          },
        },
      ],
    );
  };

  const formatDate = (dateStr: string): string => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' });
  };

  return (
    <View style={{ flex: 1, backgroundColor: palette.bg }}>
      {/* Header */}
      <View style={{ paddingHorizontal: 24, paddingTop: 16, paddingBottom: 12 }}>
        <Text
          style={{
            fontFamily: typography.scripture.fontFamily,
            fontSize: typography.ui.sizes['2xl'],
            fontWeight: '600',
            color: palette.ink,
            marginBottom: 8,
          }}
        >
          Deal Debriefs
        </Text>

        {/* Search */}
        <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
          <View style={{ flex: 1 }}>
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Search debriefs..."
              placeholderTextColor={palette.inkDim}
              accessibilityLabel="Search debriefs"
              style={{
                fontFamily: UIFontFamily,
                fontSize: typography.ui.sizes.sm,
                color: palette.ink,
                backgroundColor: palette.surface,
                borderRadius: 8,
                padding: 12,
                borderWidth: 1,
                borderColor: palette.line,
              }}
            />
          </View>
          {debriefs.length > 0 && (
            <TouchableOpacity
              onPress={handleExport}
              accessibilityLabel="Export debriefs"
              style={{
                paddingHorizontal: 12,
                paddingVertical: 12,
                borderRadius: 8,
                backgroundColor: palette.surface,
                borderWidth: 1,
                borderColor: palette.line,
              }}
            >
              <Text style={{ fontFamily: UIFontFamily, fontSize: 14, color: palette.clay }}>
                Export
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Content */}
      {isLoading && (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={palette.clay} size="small" />
        </View>
      )}

      {isError && (
        <EmptyState
          icon="⚠"
          title="Could not load debriefs"
          subtitle="Check your connection and try again."
        />
      )}

      {!isLoading && !isError && filteredDebriefs.length === 0 && (
        <EmptyState
          icon="📋"
          title={search.trim() ? 'No results' : 'No debriefs yet'}
          subtitle={
            search.trim()
              ? 'No debriefs match your search.'
              : 'After a shift, take a few minutes to reflect. It helps, even when you do not feel like it.'
          }
          action={
            !search.trim() ? (
              <PrimaryButton
                title="New debrief"
                onPress={() => router.push('/debrief/new')}
                accessibilityLabel="Create a new debrief"
              />
            ) : undefined
          }
        />
      )}

      {!isLoading && !isError && filteredDebriefs.length > 0 && (
        <SectionList
          sections={filteredSections}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 100 }}
          renderSectionHeader={({ section: { title } }) => (
            <Text
              style={{
                fontFamily: UIFontFamily,
                fontSize: typography.ui.sizes.sm,
                fontWeight: '600',
                color: palette.muted,
                textTransform: 'uppercase',
                letterSpacing: 0.5,
                paddingVertical: 12,
                backgroundColor: palette.bg,
              }}
            >
              {title}
            </Text>
          )}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => router.push({ pathname: '/debrief/[id]', params: { id: item.id } })}
              accessibilityLabel={`Debrief for ${item.debrief_date}`}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: palette.surface,
                borderRadius: 8,
                padding: 14,
                marginBottom: 8,
              }}
            >
              <View style={{ width: 44, alignItems: 'center', marginRight: 12 }}>
                <Text style={{ fontSize: 24 }}>
                  {item.mood ? (MOOD_FACES[item.mood] ?? '😐') : '📋'}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontFamily: UIFontFamily,
                    fontSize: typography.ui.sizes.sm,
                    fontWeight: '600',
                    color: palette.ink,
                    marginBottom: 2,
                  }}
                >
                  {new Date(item.debrief_date).toLocaleDateString('en-US', {
                    weekday: 'long',
                  })}{' '}
                  — {formatDate(item.debrief_date)}
                </Text>
                <Text
                  style={{
                    fontFamily: UIFontFamily,
                    fontSize: typography.ui.sizes.xs,
                    color: palette.muted,
                  }}
                  numberOfLines={1}
                >
                  {item.units_sold != null ? `${item.units_sold} unit${item.units_sold !== 1 ? 's' : ''}` : 'No units recorded'}
                  {item.gratitude ? ` · ${item.gratitude.slice(0, 60)}${item.gratitude.length > 60 ? '…' : ''}` : ''}
                </Text>
              </View>
              <Text style={{ fontSize: 16, color: palette.muted }}>›</Text>
            </TouchableOpacity>
          )}
          ListFooterComponent={
            <TouchableOpacity
              onPress={() => router.push('/debrief/new')}
              accessibilityLabel="Create a new debrief"
              style={{
                alignItems: 'center',
                paddingVertical: 20,
                marginTop: 8,
              }}
            >
              <Text style={{ fontFamily: UIFontFamily, fontSize: 14, color: palette.clay }}>
                + New debrief
              </Text>
            </TouchableOpacity>
          }
        />
      )}
    </View>
  );
}
