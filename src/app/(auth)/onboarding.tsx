import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Animated,
  KeyboardAvoidingView,
  Platform,
  type NativeSyntheticEvent,
  type NativeScrollEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/lib/AuthProvider';
import { supabase } from '@/lib/supabase';
import { PrimaryButton } from '@/components/PrimaryButton';
import { useTheme } from '@/hooks/useTheme';

// ─── Constants ───────────────────────────────────────────────────────────────

const TOTAL_STEPS = 6;

const FAITH_CONTEXT_OPTIONS = [
  { value: 'new_to_faith', label: 'New to faith', subtitle: 'Still figuring it out' },
  { value: 'coming_back', label: 'Coming back', subtitle: 'Reconnecting after time away' },
  { value: 'walking_steady', label: 'Walking steady', subtitle: 'Consistent in your faith' },
  { value: 'leading_others', label: 'Leading others', subtitle: 'Helping others grow' },
] as const;

const BURDEN_OPTIONS = [
  'Integrity pressure',
  'Burnout',
  'Anger',
  'Money fear',
  'Family strain',
  'Comparison',
  'Isolation',
  'Temptation',
  'Purpose',
] as const;

// ─── Validation schemas per step ─────────────────────────────────────────────

const profileSchema = z.object({
  display_name: z.string().min(1, 'Name is required'),
  dealership: z.string().optional().default(''),
  brand: z.string().optional().default(''),
  role: z.string().optional().default(''),
  years_in_business: z
    .number({ invalid_type_error: 'Enter a number' })
    .int()
    .min(0)
    .max(50)
    .nullable()
    .optional(),
});

const faithContextSchema = z.object({
  faith_context: z.enum(
    ['new_to_faith', 'coming_back', 'walking_steady', 'leading_others'],
    { message: 'Please select one' },
  ),
});

const burdensSchema = z.object({
  burdens: z.array(z.string()).optional().default([]),
});

const lineSchema = z.object({
  line_wont_cross: z.string().optional().default(''),
});

const fullOnboardingSchema = profileSchema
  .merge(faithContextSchema)
  .merge(burdensSchema)
  .merge(lineSchema);

type OnboardingFormValues = z.infer<typeof fullOnboardingSchema>;

// ─── Progress indicator ──────────────────────────────────────────────────────

function ProgressDots({ step, total }: { step: number; total: number }): React.ReactElement {
  const { colors } = useTheme();
  return (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 8,
        marginBottom: 32,
      }}
    >
      {Array.from({ length: total }).map((_, i) => (
        <View
          key={i}
          style={{
            width: i === step ? 24 : 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: i === step ? colors.accent : colors.border,
          }}
        />
      ))}
    </View>
  );
}

// ─── Screen ──────────────────────────────────────────────────────────────────

export default function OnboardingScreen(): React.ReactElement {
  const { colors, motion } = useTheme();
  const { user, refreshProfile } = useAuth();
  const [step, setStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    trigger,
    formState: { errors },
    getValues,
  } = useForm<OnboardingFormValues>({
    resolver: zodResolver(fullOnboardingSchema),
    defaultValues: {
      display_name: '',
      dealership: '',
      brand: '',
      role: '',
      years_in_business: null,
      faith_context: undefined,
      burdens: [],
      line_wont_cross: '',
    },
    mode: 'onChange',
  });

  const selectedBurdens = watch('burdens') ?? [];
  const faithContext = watch('faith_context');

  // ── Animated step transition ───────────────────────────────────────────────

  const animateToStep = useCallback(
    (newStep: number) => {
      Animated.sequence([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: motion.duration.fast,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: motion.duration.normal,
          useNativeDriver: true,
        }),
      ]).start();
      setStep(newStep);
      setError(null);
    },
    [fadeAnim, motion.duration],
  );

  // ── Step navigation with validation ────────────────────────────────────────

  const handleNext = useCallback(async () => {
    let isValid = true;

    // Validate the current step's fields
    if (step === 1) {
      const result = await trigger([
        'display_name',
        'dealership',
        'brand',
        'role',
        'years_in_business',
      ]);
      isValid = result;
    } else if (step === 2) {
      const result = await trigger('faith_context');
      isValid = result;
    }

    if (isValid && step < TOTAL_STEPS - 1) {
      animateToStep(step + 1);
    }
  }, [step, trigger, animateToStep]);

  const handleBack = useCallback(() => {
    if (step > 0) {
      animateToStep(step - 1);
    }
  }, [step, animateToStep]);

  // ── Toggle burden chip ─────────────────────────────────────────────────────

  const toggleBurden = useCallback(
    (burden: string) => {
      const current = getValues('burdens') ?? [];
      if (current.includes(burden)) {
        setValue(
          'burdens',
          current.filter((b) => b !== burden),
          { shouldValidate: true },
        );
      } else {
        setValue('burdens', [...current, burden], { shouldValidate: true });
      }
    },
    [getValues, setValue],
  );

  // ── Submit onboarding ──────────────────────────────────────────────────────

  const onSubmit = useCallback(
    async (values: OnboardingFormValues) => {
      if (!user) return;

      setIsSubmitting(true);
      setError(null);

      const { error: upsertError } = await supabase
        .from('profiles')
        .upsert(
          {
            id: user.id,
            display_name: values.display_name,
            dealership: values.dealership || null,
            brand: values.brand || null,
            role: values.role || null,
            years_in_business: values.years_in_business ?? null,
            faith_context: values.faith_context,
            burdens: values.burdens ?? [],
            line_wont_cross: values.line_wont_cross || null,
            onboarding_complete: true,
          },
          { onConflict: 'id' },
        );

      setIsSubmitting(false);

      if (upsertError) {
        setError('Something went wrong saving your profile. Please try again.');
        return;
      }

      await refreshProfile();
      // Auth guard will handle redirect to tabs
    },
    [user, refreshProfile],
  );

  const handleBegin = useCallback(() => {
    handleSubmit(onSubmit)();
  }, [handleSubmit, onSubmit]);

  // ── Render step content ────────────────────────────────────────────────────

  const renderStep = (): React.ReactElement => {
    switch (step) {
      case 0:
        return (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontSize: 56, marginBottom: 24 }}>✝</Text>
            <Text
              style={{
                fontFamily: 'Georgia, serif',
                fontSize: 28,
                fontWeight: '700',
                color: colors.text,
                textAlign: 'center',
                marginBottom: 12,
              }}
            >
              Driven by Faith
            </Text>
            <Text
              style={{
                fontFamily: 'Inter, system-ui, sans-serif',
                fontSize: 16,
                color: colors.textSecondary,
                textAlign: 'center',
                lineHeight: 24,
                paddingHorizontal: 16,
              }}
            >
              Scripture for the floor you actually work.
            </Text>
          </View>
        );

      case 1:
        return (
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ paddingBottom: 24 }}
            keyboardShouldPersistTaps="handled"
          >
            <Text
              style={{
                fontFamily: 'Inter, system-ui, sans-serif',
                fontSize: 22,
                fontWeight: '700',
                color: colors.text,
                marginBottom: 8,
              }}
            >
              Tell us about yourself
            </Text>
            <Text
              style={{
                fontFamily: 'Inter, system-ui, sans-serif',
                fontSize: 14,
                color: colors.textSecondary,
                marginBottom: 24,
                lineHeight: 20,
              }}
            >
              This helps us serve you better. You can change this any time.
            </Text>

            {/* Display name */}
            <Text style={fieldLabelStyle(colors.textSecondary)}>Display name</Text>
            <Controller
              control={control}
              name="display_name"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  style={inputStyle(errors.display_name ? colors.error : colors.border, colors)}
                  placeholder="Your name"
                  placeholderTextColor={colors.textMuted}
                  textContentType="name"
                  autoComplete="name"
                  accessibilityLabel="Display name"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                />
              )}
            />
            {errors.display_name && (
              <Text style={errorTextStyle(colors.error)}>
                {errors.display_name.message}
              </Text>
            )}

            {/* Dealership */}
            <Text style={fieldLabelStyle(colors.textSecondary)}>Dealership</Text>
            <Controller
              control={control}
              name="dealership"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  style={inputStyle(colors.border, colors)}
                  placeholder="e.g., Main Street Motors"
                  placeholderTextColor={colors.textMuted}
                  accessibilityLabel="Dealership"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                />
              )}
            />

            {/* Brand */}
            <Text style={fieldLabelStyle(colors.textSecondary)}>Brand</Text>
            <Controller
              control={control}
              name="brand"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  style={inputStyle(colors.border, colors)}
                  placeholder="e.g., Toyota, Ford, independent"
                  placeholderTextColor={colors.textMuted}
                  accessibilityLabel="Brand"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                />
              )}
            />

            {/* Role */}
            <Text style={fieldLabelStyle(colors.textSecondary)}>Role</Text>
            <Controller
              control={control}
              name="role"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  style={inputStyle(colors.border, colors)}
                  placeholder="e.g., sales consultant, finance, GSM"
                  placeholderTextColor={colors.textMuted}
                  accessibilityLabel="Role"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                />
              )}
            />

            {/* Years in business */}
            <Text style={fieldLabelStyle(colors.textSecondary)}>Years in business</Text>
            <Controller
              control={control}
              name="years_in_business"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  style={inputStyle(
                    errors.years_in_business ? colors.error : colors.border,
                    colors,
                  )}
                  placeholder="0–50"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="number-pad"
                  accessibilityLabel="Years in business"
                  onBlur={onBlur}
                  onChangeText={(text) => {
                    const num = text === '' ? null : parseInt(text, 10);
                    onChange(isNaN(num as number) ? value : num);
                  }}
                  value={value != null ? String(value) : ''}
                />
              )}
            />
            {errors.years_in_business && (
              <Text style={errorTextStyle(colors.error)}>
                {errors.years_in_business.message}
              </Text>
            )}
          </ScrollView>
        );

      case 2:
        return (
          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontFamily: 'Inter, system-ui, sans-serif',
                fontSize: 22,
                fontWeight: '700',
                color: colors.text,
                marginBottom: 8,
              }}
            >
              Where are you with your faith?
            </Text>
            <Text
              style={{
                fontFamily: 'Inter, system-ui, sans-serif',
                fontSize: 14,
                color: colors.textSecondary,
                marginBottom: 24,
                lineHeight: 20,
              }}
            >
              This helps us serve you better. It stays private.
            </Text>

            {FAITH_CONTEXT_OPTIONS.map((option) => {
              const isSelected = faithContext === option.value;
              return (
                <TouchableOpacity
                  key={option.value}
                  onPress={() =>
                    setValue('faith_context', option.value, {
                      shouldValidate: true,
                    })
                  }
                  style={{
                    backgroundColor: isSelected
                      ? colors.accent
                      : colors.surfaceElevated,
                    borderWidth: 1.5,
                    borderColor: isSelected ? colors.accent : colors.border,
                    borderRadius: 12,
                    paddingHorizontal: 20,
                    paddingVertical: 16,
                    marginBottom: 12,
                  }}
                  accessibilityLabel={option.label}
                  accessibilityState={{ selected: isSelected }}
                >
                  <Text
                    style={{
                      fontFamily: 'Inter, system-ui, sans-serif',
                      fontSize: 16,
                      fontWeight: '600',
                      color: isSelected ? '#FFFFFF' : colors.text,
                      marginBottom: 2,
                    }}
                  >
                    {option.label}
                  </Text>
                  <Text
                    style={{
                      fontFamily: 'Inter, system-ui, sans-serif',
                      fontSize: 13,
                      color: isSelected
                        ? 'rgba(255,255,255,0.8)'
                        : colors.textMuted,
                    }}
                  >
                    {option.subtitle}
                  </Text>
                </TouchableOpacity>
              );
            })}
            {errors.faith_context && (
              <Text style={errorTextStyle(colors.error)}>
                {errors.faith_context.message}
              </Text>
            )}
          </View>
        );

      case 3:
        return (
          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontFamily: 'Inter, system-ui, sans-serif',
                fontSize: 22,
                fontWeight: '700',
                color: colors.text,
                marginBottom: 8,
              }}
            >
              What are you carrying right now?
            </Text>
            <Text
              style={{
                fontFamily: 'Inter, system-ui, sans-serif',
                fontSize: 14,
                color: colors.textSecondary,
                marginBottom: 24,
                lineHeight: 20,
              }}
            >
              Select all that apply. Private.
            </Text>

            <View
              style={{
                flexDirection: 'row',
                flexWrap: 'wrap',
                gap: 10,
              }}
            >
              {BURDEN_OPTIONS.map((burden) => {
                const isSelected = selectedBurdens.includes(burden);
                return (
                  <TouchableOpacity
                    key={burden}
                    onPress={() => toggleBurden(burden)}
                    style={{
                      backgroundColor: isSelected
                        ? colors.accent
                        : colors.surfaceElevated,
                      borderWidth: 1.5,
                      borderColor: isSelected ? colors.accent : colors.border,
                      borderRadius: 20,
                      paddingHorizontal: 16,
                      paddingVertical: 10,
                    }}
                    accessibilityLabel={burden}
                    accessibilityState={{ selected: isSelected }}
                  >
                    <Text
                      style={{
                        fontFamily: 'Inter, system-ui, sans-serif',
                        fontSize: 14,
                        fontWeight: isSelected ? '600' : '400',
                        color: isSelected ? '#FFFFFF' : colors.text,
                      }}
                    >
                      {burden}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        );

      case 4:
        return (
          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontFamily: 'Inter, system-ui, sans-serif',
                fontSize: 22,
                fontWeight: '700',
                color: colors.text,
                marginBottom: 8,
              }}
            >
              The line you won't cross
            </Text>
            <Text
              style={{
                fontFamily: 'Inter, system-ui, sans-serif',
                fontSize: 14,
                color: colors.textSecondary,
                marginBottom: 24,
                lineHeight: 20,
              }}
            >
              Write the one thing you will not do for a commission. Your line.
              Private. We'll remind you near month-end.
            </Text>

            <Controller
              control={control}
              name="line_wont_cross"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  style={{
                    fontFamily: 'Inter, system-ui, sans-serif',
                    fontSize: 16,
                    color: colors.text,
                    backgroundColor: colors.surfaceElevated,
                    borderWidth: 1,
                    borderColor: colors.border,
                    borderRadius: 12,
                    paddingHorizontal: 16,
                    paddingVertical: 14,
                    minHeight: 120,
                    textAlignVertical: 'top',
                  }}
                  placeholder="I will not..."
                  placeholderTextColor={colors.textMuted}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                  accessibilityLabel="Your line you won't cross"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                />
              )}
            />
          </View>
        );

      case 5:
        return (
          <View
            style={{
              flex: 1,
              alignItems: 'center',
              justifyContent: 'center',
              paddingHorizontal: 16,
            }}
          >
            <Text
              style={{
                fontFamily: 'Georgia, serif',
                fontSize: 22,
                lineHeight: 34,
                color: colors.scripture,
                textAlign: 'center',
                marginBottom: 16,
              }}
            >
              "I am the vine; you are the branches. Whoever abides in me and I in
              him, he it is that bears much fruit, for apart from me you can do
              nothing."
            </Text>
            <Text
              style={{
                fontFamily: 'Inter, system-ui, sans-serif',
                fontSize: 14,
                color: colors.textMuted,
                textTransform: 'uppercase',
                letterSpacing: 1,
                textAlign: 'center',
                marginBottom: 32,
              }}
            >
              John 15:5 (ESV)
            </Text>

            {/* Error display */}
            {error && (
              <Text
                style={{
                  fontFamily: 'Inter, system-ui, sans-serif',
                  fontSize: 14,
                  color: colors.error,
                  textAlign: 'center',
                  marginBottom: 16,
                }}
              >
                {error}
              </Text>
            )}
          </View>
        );

      default:
        return <View />;
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  const isLastStep = step === TOTAL_STEPS - 1;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <View style={{ flex: 1, paddingHorizontal: 32, paddingTop: 48 }}>
          {/* Progress dots */}
          <ProgressDots step={step} total={TOTAL_STEPS} />

          {/* Step content */}
          <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
            {renderStep()}
          </Animated.View>

          {/* Bottom buttons */}
          <View style={{ paddingBottom: 32 }}>
            {step === 0 ? (
              <PrimaryButton
                title="Get started"
                onPress={() => animateToStep(1)}
                accessibilityLabel="Get started"
              />
            ) : isLastStep ? (
              <PrimaryButton
                title="Begin"
                loading={isSubmitting}
                onPress={handleBegin}
                accessibilityLabel="Begin"
              />
            ) : (
              <View style={{ flexDirection: 'row', gap: 12 }}>
                <View style={{ flex: 1 }}>
                  <PrimaryButton
                    title="Back"
                    variant="outline"
                    onPress={handleBack}
                    accessibilityLabel="Go back"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <PrimaryButton
                    title="Next"
                    onPress={handleNext}
                    accessibilityLabel="Next"
                  />
                </View>
              </View>
            )}
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─── Style helpers ───────────────────────────────────────────────────────────

function fieldLabelStyle(color: string) {
  return {
    fontFamily: 'Inter, system-ui, sans-serif',
    fontSize: 14,
    fontWeight: '600' as const,
    color,
    marginBottom: 6,
    marginTop: 16,
  };
}

function inputStyle(
  borderColor: string,
  colors: ReturnType<typeof useTheme>['colors'],
) {
  return {
    fontFamily: 'Inter, system-ui, sans-serif',
    fontSize: 16,
    color: colors.text,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 4,
  };
}

function errorTextStyle(color: string) {
  return {
    fontFamily: 'Inter, system-ui, sans-serif',
    fontSize: 13,
    color,
    marginBottom: 8,
  };
}
