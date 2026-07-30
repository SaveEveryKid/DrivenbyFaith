import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { PrimaryButton } from '@/components/PrimaryButton';
import { GhostButton } from '@/components/GhostButton';
import { ScriptureBlock } from '@/components/ScriptureBlock';
import { useTheme } from '@/hooks/useTheme';
import { useCreateDebrief, getMoodVerse } from '@/hooks/useDebrief';
import { UIFontFamily } from '@/constants/theme';

// ─── Step type ────────────────────────────────────────────────────────────────

type Step = 'units' | 'went_well' | 'went_wrong' | 'saw_god' | 'fell_short' | 'served' | 'intention' | 'gratitude' | 'mood' | 'verse' | 'done';

const STEPS: Step[] = [
  'units', 'went_well', 'went_wrong', 'saw_god', 'fell_short',
  'served', 'intention', 'gratitude', 'mood', 'verse', 'done',
];

const MOOD_OPTIONS = [
  { value: 1, label: 'Very low', face: '😞' },
  { value: 2, label: 'Low', face: '😔' },
  { value: 3, label: 'Okay', face: '😐' },
  { value: 4, label: 'Good', face: '🙂' },
  { value: 5, label: 'Great', face: '😊' },
];

export default function NewDebriefScreen(): React.ReactElement {
  const { palette, typography } = useTheme();
  const router = useRouter();
  const { createDebrief, isCreating } = useCreateDebrief();
  const [step, setStep] = useState<Step>('units');

  // Form state
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

  const currentIndex = STEPS.indexOf(step);

  const next = (): void => {
    const idx = STEPS.indexOf(step);
    if (idx < STEPS.length - 1) setStep(STEPS[idx + 1]);
  };

  const back = (): void => {
    const idx = STEPS.indexOf(step);
    if (idx > 0) setStep(STEPS[idx - 1]);
  };

  const handleSave = async (): Promise<void> => {
    await createDebrief({
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
    router.back();
  };

  const renderStep = (): React.ReactNode => {
    switch (step) {
      case 'units':
        return (
          <>
            <Text style={stepTitleStyle}>
              Numbers (optional)
            </Text>
            <Text style={hintStyle}>
              Just the facts. No judgment attached.
            </Text>
            <View style={fieldContainerStyle}>
              <Text style={labelStyle}>Units sold</Text>
              <TextInput
                value={unitsSold}
                onChangeText={setUnitsSold}
                placeholder="0"
                placeholderTextColor={palette.inkDim}
                keyboardType="numeric"
                accessibilityLabel="Units sold"
                style={inputStyle}
              />
            </View>
            <View style={fieldContainerStyle}>
              <Text style={labelStyle}>Ups taken</Text>
              <TextInput
                value={upsTaken}
                onChangeText={setUpsTaken}
                placeholder="0"
                placeholderTextColor={palette.inkDim}
                keyboardType="numeric"
                accessibilityLabel="Ups taken"
                style={inputStyle}
              />
            </View>
          </>
        );

      case 'went_well':
        return (
          <>
            <Text style={stepTitleStyle}>What went well</Text>
            <Text style={hintStyle}>
              Give yourself credit. Small wins count.
            </Text>
            <TextInput
              value={wentWell}
              onChangeText={setWentWell}
              placeholder="A deal that closed cleanly, a good conversation, a moment of patience..."
              placeholderTextColor={palette.inkDim}
              multiline
              textAlignVertical="top"
              accessibilityLabel="What went well"
              style={inputAreaStyle}
            />
          </>
        );

      case 'went_wrong':
        return (
          <>
            <Text style={stepTitleStyle}>What went wrong</Text>
            <Text style={hintStyle}>
              Name it honestly. No fixing yet.
            </Text>
            <TextInput
              value={wentWrong}
              onChangeText={setWentWrong}
              placeholder="A deal that fell apart, a mistake, a conflict..."
              placeholderTextColor={palette.inkDim}
              multiline
              textAlignVertical="top"
              accessibilityLabel="What went wrong"
              style={inputAreaStyle}
            />
          </>
        );

      case 'saw_god':
        return (
          <>
            <Text style={stepTitleStyle}>Where I saw God</Text>
            <Text style={hintStyle}>
              Even in a showroom. Even on a hard day.
            </Text>
            <TextInput
              value={sawGod}
              onChangeText={setSawGod}
              placeholder="A moment of grace, an unexpected kindness, a sense of presence..."
              placeholderTextColor={palette.inkDim}
              multiline
              textAlignVertical="top"
              accessibilityLabel="Where I saw God"
              style={inputAreaStyle}
            />
          </>
        );

      case 'fell_short':
        return (
          <>
            <Text style={stepTitleStyle}>Where I fell short</Text>
            <Text style={hintStyle}>
              Not to wallow. To be real and release it.
            </Text>
            <TextInput
              value={fellShort}
              onChangeText={setFellShort}
              placeholder="A short temper, a half-truth, avoiding a hard conversation..."
              placeholderTextColor={palette.inkDim}
              multiline
              textAlignVertical="top"
              accessibilityLabel="Where I fell short"
              style={inputAreaStyle}
            />
          </>
        );

      case 'served':
        return (
          <>
            <Text style={stepTitleStyle}>Who I served</Text>
            <Text style={hintStyle}>
              Not who bought, but who you genuinely helped.
            </Text>
            <TextInput
              value={served}
              onChangeText={setServed}
              placeholder="A first-time buyer, a family on a budget, a coworker who needed backup..."
              placeholderTextColor={palette.inkDim}
              multiline
              textAlignVertical="top"
              accessibilityLabel="Who I served"
              style={inputAreaStyle}
            />
          </>
        );

      case 'intention':
        return (
          <>
            <Text style={stepTitleStyle}>Tomorrow's intention</Text>
            <Text style={hintStyle}>
              One thing you will do differently or carry forward.
            </Text>
            <TextInput
              value={intention}
              onChangeText={setIntention}
              placeholder="I will greet every customer with genuine curiosity..."
              placeholderTextColor={palette.inkDim}
              multiline
              textAlignVertical="top"
              accessibilityLabel="Tomorrow's intention"
              style={inputAreaStyle}
            />
          </>
        );

      case 'gratitude':
        return (
          <>
            <Text style={stepTitleStyle}>Gratitude</Text>
            <Text style={hintStyle}>
              Even on the hardest days, something held.
            </Text>
            <TextInput
              value={gratitude}
              onChangeText={setGratitude}
              placeholder="Health, family, a coworker who had my back, a customer who was kind..."
              placeholderTextColor={palette.inkDim}
              multiline
              textAlignVertical="top"
              accessibilityLabel="Gratitude"
              style={inputAreaStyle}
            />
          </>
        );

      case 'mood':
        return (
          <>
            <Text style={stepTitleStyle}>How you're feeling</Text>
            <Text style={hintStyle}>
              No right answer. Just honest.
            </Text>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 16 }}>
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
                  <Text
                    style={{
                      fontFamily: UIFontFamily,
                      fontSize: 11,
                      color: mood === opt.value ? palette.clay : palette.muted,
                      marginTop: 4,
                    }}
                  >
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        );

      case 'verse': {
        const verse = mood ? getMoodVerse(mood) : getMoodVerse(3);
        return (
          <>
            <Text style={stepTitleStyle}>A word for where you are</Text>
            <Text style={hintStyle}>
              Chosen for how you are actually feeling, not how you think you should feel.
            </Text>
            <ScriptureBlock reference={verse.reference} text={verse.text} />
          </>
        );
      }

      case 'done':
        return (
          <View style={{ alignItems: 'center', paddingVertical: 32 }}>
            <Text style={{ fontSize: 48, marginBottom: 16 }}>✓</Text>
            <Text style={stepTitleStyle}>
              Debrief complete
            </Text>
            <Text style={[hintStyle, { textAlign: 'center' }]}>
              What you wrote here matters. It is a record of a real day on a real floor, held before a real God.
            </Text>
          </View>
        );

      default:
        return null;
    }
  };

  // ─── Styles ────────────────────────────────────────────────────────────────

  const stepTitleStyle = {
    fontFamily: typography.scripture.fontFamily,
    fontSize: typography.ui.sizes.xl,
    fontWeight: '600' as const,
    color: palette.ink,
    marginBottom: 8,
  };

  const hintStyle = {
    fontFamily: UIFontFamily,
    fontSize: typography.ui.sizes.sm,
    color: palette.muted,
    lineHeight: 20,
    marginBottom: 24,
  };

  const labelStyle = {
    fontFamily: UIFontFamily,
    fontSize: typography.ui.sizes.sm,
    fontWeight: '600' as const,
    color: palette.ink,
    marginBottom: 8,
  };

  const fieldContainerStyle = {
    marginBottom: 20,
  };

  const inputStyle = {
    fontFamily: UIFontFamily,
    fontSize: typography.ui.sizes.base,
    color: palette.ink,
    backgroundColor: palette.surface,
    borderRadius: 8,
    padding: 14,
    borderWidth: 1,
    borderColor: palette.line,
  };

  const inputAreaStyle = {
    ...inputStyle,
    minHeight: 120,
    textAlignVertical: 'top' as const,
  };

  // ─── Progress indicator ────────────────────────────────────────────────────

  const progressPercent = Math.round(((currentIndex + 1) / STEPS.length) * 100);

  if (isCreating) {
    return (
      <View style={{ flex: 1, backgroundColor: palette.bg, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={palette.clay} size="small" />
        <Text style={{ fontFamily: UIFontFamily, fontSize: 14, color: palette.muted, marginTop: 12 }}>
          Saving...
        </Text>
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
        {/* Progress bar */}
        <View style={{ flexDirection: 'row', marginBottom: 32, alignItems: 'center', gap: 8 }}>
          <View
            style={{
              flex: 1,
              height: 4,
              backgroundColor: palette.line,
              borderRadius: 2,
              overflow: 'hidden',
            }}
          >
            <View
              style={{
                height: '100%',
                width: `${progressPercent}%`,
                backgroundColor: palette.clay,
                borderRadius: 2,
              }}
            />
          </View>
          <Text
            style={{
              fontFamily: UIFontFamily,
              fontSize: 12,
              color: palette.muted,
            }}
          >
            {currentIndex + 1}/{STEPS.length}
          </Text>
        </View>

        {renderStep()}

        {/* Navigation */}
        <View style={{ flexDirection: 'row', marginTop: 32, gap: 12 }}>
          {step !== 'units' && step !== 'done' && (
            <View style={{ flex: 1 }}>
              <GhostButton title="Back" onPress={back} />
            </View>
          )}
          {step === 'done' ? (
            <View style={{ flex: 1 }}>
              <PrimaryButton
                title="Save debrief"
                onPress={handleSave}
                accessibilityLabel="Save your debrief"
              />
            </View>
          ) : (
            <View style={{ flex: 1 }}>
              <PrimaryButton
                title={step === 'mood' ? 'See verse' : 'Next'}
                onPress={step === 'mood' && mood === null ? () => {} : next}
                disabled={step === 'mood' && mood === null}
                accessibilityLabel={step === 'mood' ? 'See your verse' : 'Next step'}
              />
            </View>
          )}
        </View>

        {step !== 'done' && (
          <TouchableOpacity
            onPress={handleSave}
            style={{ marginTop: 16, alignItems: 'center' }}
            accessibilityLabel="Skip and save now"
          >
            <Text
              style={{
                fontFamily: UIFontFamily,
                fontSize: typography.ui.sizes.sm,
                color: palette.muted,
              }}
            >
              Skip and save now
            </Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
