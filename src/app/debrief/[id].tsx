import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { PrimaryButton } from '@/components/PrimaryButton';
import { GhostButton } from '@/components/GhostButton';
import { ScriptureBlock } from '@/components/ScriptureBlock';
import { EmptyState } from '@/components/EmptyState';
import { useTheme } from '@/hooks/useTheme';
import { useDebriefDetail, getMoodVerse, debriefToText } from '@/hooks/useDebrief';
import { UIFontFamily } from '@/constants/theme';

const MOOD_OPTIONS = [
  { value: 1, label: 'Very low', face: '😞' },
  { value: 2, label: 'Low', face: '😔' },
  { value: 3, label: 'Okay', face: '😐' },
  { value: 4, label: 'Good', face: '🙂' },
  { value: 5, label: 'Great', face: '😊' },
];

export default function DebriefDetailScreen(): React.ReactElement {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { palette, typography } = useTheme();
  const router = useRouter();
  const {
    debrief,
    isLoading,
    isError,
    updateDebrief,
    deleteDebrief,
    isUpdating,
    isDeleting,
  } = useDebriefDetail(id);

  const [editing, setEditing] = useState(false);

  // Editable state
  const [unitsSold, setUnitsSold] = useState('');
  const [upsTaken, setUpsTaken] = useState('');
  const [wentWell, setWentWell] = useState('');
  const [wentWrong, setWentWrong] = useState('');
  const [sawGod, setSawGod] = useState('');
  const [fellShort, setFellShort] = useState('');
  const [served, setServed] = useState('');
  const [intention, setIntention] = useState('');
  const [gratitude, setGratitude] = useState('');
  const [mood, setMood] = useState<number | null>(null);

  useEffect(() => {
    if (debrief) {
      setUnitsSold(debrief.units_sold?.toString() ?? '');
      setUpsTaken(debrief.ups_taken?.toString() ?? '');
      setWentWell(debrief.went_well ?? '');
      setWentWrong(debrief.went_wrong ?? '');
      setSawGod(debrief.where_i_saw_god ?? '');
      setFellShort(debrief.where_i_fell_short ?? '');
      setServed(debrief.who_i_served ?? '');
      setIntention(debrief.tomorrow_intention ?? '');
      setGratitude(debrief.gratitude ?? '');
      setMood(debrief.mood);
    }
  }, [debrief]);

  const handleDelete = (): void => {
    Alert.alert(
      'Delete debrief',
      'Are you sure? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteDebrief();
            router.back();
          },
        },
      ],
    );
  };

  const handleSave = async (): Promise<void> => {
    await updateDebrief({
      units_sold: unitsSold ? parseInt(unitsSold, 10) : null,
      ups_taken: upsTaken ? parseInt(upsTaken, 10) : null,
      went_well: wentWell || undefined,
      went_wrong: wentWrong || undefined,
      where_i_saw_god: sawGod || undefined,
      where_i_fell_short: fellShort || undefined,
      who_i_served: served || undefined,
      tomorrow_intention: intention || undefined,
      gratitude: gratitude || undefined,
      mood,
    });
    setEditing(false);
  };

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: palette.bg, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={palette.clay} size="small" />
      </View>
    );
  }

  if (isError || !debrief) {
    return (
      <View style={{ flex: 1, backgroundColor: palette.bg }}>
        <EmptyState
          icon="⚠"
          title="Debrief not found"
          subtitle="This debrief may have been deleted or there was a problem loading it."
          action={
            <PrimaryButton title="Go back" onPress={() => router.back()} />
          }
        />
      </View>
    );
  }

  const date = new Date(debrief.debrief_date).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const verse = debrief.mood ? getMoodVerse(debrief.mood) : null;

  const labelStyle = {
    fontFamily: UIFontFamily,
    fontSize: typography.ui.sizes.sm,
    fontWeight: '600' as const,
    color: palette.muted,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
    marginBottom: 4,
    marginTop: 16,
  };

  const valueStyle = {
    fontFamily: UIFontFamily,
    fontSize: typography.ui.sizes.base,
    color: palette.ink,
    lineHeight: 22,
  };

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
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <Text
            style={{
              fontFamily: typography.scripture.fontFamily,
              fontSize: typography.ui.sizes.xl,
              fontWeight: '600',
              color: palette.ink,
              flex: 1,
            }}
          >
            {date}
          </Text>
          {!editing && (
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TouchableOpacity onPress={() => setEditing(true)} accessibilityLabel="Edit debrief">
                <Text style={{ fontFamily: UIFontFamily, fontSize: 14, color: palette.clay }}>
                  Edit
                </Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleDelete} accessibilityLabel="Delete debrief">
                <Text style={{ fontFamily: UIFontFamily, fontSize: 14, color: palette.clay }}>
                  Delete
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {editing ? (
          <>
            {/* Edit mode */}
            <View style={{ marginBottom: 20 }}>
              <Text style={labelStyle}>Units sold</Text>
              <TextInput
                value={unitsSold}
                onChangeText={setUnitsSold}
                keyboardType="numeric"
                accessibilityLabel="Units sold"
                style={editInputStyle}
              />
            </View>
            <View style={{ marginBottom: 20 }}>
              <Text style={labelStyle}>Ups taken</Text>
              <TextInput
                value={upsTaken}
                onChangeText={setUpsTaken}
                keyboardType="numeric"
                accessibilityLabel="Ups taken"
                style={editInputStyle}
              />
            </View>

            {([['went_well', wentWell, setWentWell, 'What went well'],
              ['went_wrong', wentWrong, setWentWrong, 'What went wrong'],
              ['saw_god', sawGod, setSawGod, 'Where I saw God'],
              ['fell_short', fellShort, setFellShort, 'Where I fell short'],
              ['served', served, setServed, 'Who I served'],
              ['intention', intention, setIntention, "Tomorrow's intention"],
              ['gratitude', gratitude, setGratitude, 'Gratitude'],
            ] as const).map(([, val, setter, label]) => (
              <View key={label} style={{ marginBottom: 20 }}>
                <Text style={labelStyle}>{label}</Text>
                <TextInput
                  value={val}
                  onChangeText={setter}
                  multiline
                  textAlignVertical="top"
                  accessibilityLabel={label}
                  style={[editInputStyle, { minHeight: 80 }]}
                />
              </View>
            ))}

            <Text style={labelStyle}>Mood</Text>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, marginBottom: 24 }}>
              {MOOD_OPTIONS.map((opt) => (
                <TouchableOpacity
                  key={opt.value}
                  onPress={() => setMood(opt.value)}
                  accessibilityLabel={`Mood ${opt.value}: ${opt.label}`}
                  accessibilityState={{ selected: mood === opt.value }}
                  style={{
                    alignItems: 'center',
                    padding: 8,
                    borderRadius: 8,
                    backgroundColor: mood === opt.value ? palette.clay + '20' : 'transparent',
                    borderWidth: mood === opt.value ? 1 : 0,
                    borderColor: palette.clay,
                  }}
                >
                  <Text style={{ fontSize: 32 }}>{opt.face}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={{ flexDirection: 'row', gap: 12 }}>
              <View style={{ flex: 1 }}>
                <GhostButton title="Cancel" onPress={() => setEditing(false)} />
              </View>
              <View style={{ flex: 1 }}>
                <PrimaryButton
                  title={isUpdating ? 'Saving...' : 'Save'}
                  onPress={handleSave}
                  loading={isUpdating}
                  accessibilityLabel="Save changes"
                />
              </View>
            </View>
          </>
        ) : (
          <>
            {/* View mode */}
            {debrief.units_sold != null && (
              <View style={{ flexDirection: 'row', gap: 24, marginBottom: 16 }}>
                <View style={{ flex: 1, backgroundColor: palette.surface, borderRadius: 8, padding: 12, alignItems: 'center' }}>
                  <Text style={{ fontFamily: typography.scripture.fontFamily, fontSize: typography.ui.sizes['2xl'], fontWeight: '700', color: palette.clay }}>
                    {debrief.units_sold}
                  </Text>
                  <Text style={{ fontFamily: UIFontFamily, fontSize: typography.ui.sizes.xs, color: palette.muted }}>
                    Units
                  </Text>
                </View>
                <View style={{ flex: 1, backgroundColor: palette.surface, borderRadius: 8, padding: 12, alignItems: 'center' }}>
                  <Text style={{ fontFamily: typography.scripture.fontFamily, fontSize: typography.ui.sizes['2xl'], fontWeight: '700', color: palette.sage }}>
                    {debrief.ups_taken ?? '—'}
                  </Text>
                  <Text style={{ fontFamily: UIFontFamily, fontSize: typography.ui.sizes.xs, color: palette.muted }}>
                    Ups
                  </Text>
                </View>
              </View>
            )}

            {debrief.mood != null && (
              <View style={{ alignItems: 'center', marginBottom: 20, paddingVertical: 8 }}>
                <Text style={{ fontSize: 32 }}>
                  {MOOD_OPTIONS[debrief.mood - 1]?.face ?? '😐'}
                </Text>
              </View>
            )}

            {verse && <ScriptureBlock reference={verse.reference} text={verse.text} />}

            {debrief.went_well ? <Text style={labelStyle}>What went well</Text> : null}
            {debrief.went_well ? <Text style={valueStyle}>{debrief.went_well}</Text> : null}

            {debrief.went_wrong ? <Text style={labelStyle}>What went wrong</Text> : null}
            {debrief.went_wrong ? <Text style={valueStyle}>{debrief.went_wrong}</Text> : null}

            {debrief.where_i_saw_god ? <Text style={labelStyle}>Where I saw God</Text> : null}
            {debrief.where_i_saw_god ? <Text style={valueStyle}>{debrief.where_i_saw_god}</Text> : null}

            {debrief.where_i_fell_short ? <Text style={labelStyle}>Where I fell short</Text> : null}
            {debrief.where_i_fell_short ? <Text style={valueStyle}>{debrief.where_i_fell_short}</Text> : null}

            {debrief.who_i_served ? <Text style={labelStyle}>Who I served</Text> : null}
            {debrief.who_i_served ? <Text style={valueStyle}>{debrief.who_i_served}</Text> : null}

            {debrief.tomorrow_intention ? <Text style={labelStyle}>Tomorrow's intention</Text> : null}
            {debrief.tomorrow_intention ? <Text style={valueStyle}>{debrief.tomorrow_intention}</Text> : null}

            {debrief.gratitude ? <Text style={labelStyle}>Gratitude</Text> : null}
            {debrief.gratitude ? <Text style={valueStyle}>{debrief.gratitude}</Text> : null}
          </>
        )}

        {/* Delete button in view mode */}
        {!editing && (
          <TouchableOpacity
            onPress={handleDelete}
            style={{ marginTop: 32, alignItems: 'center' }}
            accessibilityLabel="Delete this debrief"
          >
            <Text style={{ fontFamily: UIFontFamily, fontSize: 14, color: palette.muted }}>
              {isDeleting ? 'Deleting...' : 'Delete debrief'}
            </Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const editInputStyle = {
  fontFamily: 'Inter, system-ui, sans-serif',
  fontSize: 16,
  color: '#3C3C3C',
  backgroundColor: '#FFFFFF',
  borderRadius: 8,
  padding: 14,
  borderWidth: 1,
  borderColor: '#E0D1B8',
};
