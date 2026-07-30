import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Animated,
  Alert,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { ScriptureBlock } from '@/components/ScriptureBlock';
import { PrimaryButton } from '@/components/PrimaryButton';
import { GhostButton } from '@/components/GhostButton';
import { useTheme } from '@/hooks/useTheme';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { useDevotionalById } from '@/hooks/useDevotional';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import type { CompleteDevotionalData } from '@/hooks/useDevotional';

// ─── Types ───────────────────────────────────────────────────────────────────

type Section = 1 | 2 | 3 | 4 | 5;

interface SectionState {
  reflection: string;
  prayerSeconds: number;
  prayerRunning: boolean;
  challengeAccepted: boolean;
  challengeCompleted: boolean;
}

// ─── Progress Indicator ──────────────────────────────────────────────────────

function ProgressDots({
  current,
  total,
}: {
  current: Section;
  total: number;
}): React.ReactElement {
  const { colors } = useTheme();

  return (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 6,
        paddingVertical: 8,
      }}
      accessibilityLabel={`Section ${current} of ${total}`}
    >
      {Array.from({ length: total }, (_, i) => {
        const section = (i + 1) as Section;
        const isActive = section === current;
        const isPast = section < current;

        return (
          <View
            key={i}
            style={{
              width: isActive ? 24 : 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: isActive
                ? colors.accent
                : isPast
                  ? colors.accentLight
                  : colors.border,
            }}
          />
        );
      })}
    </View>
  );
}

// ─── Prayer Timer ────────────────────────────────────────────────────────────

function PrayerTimer({
  onComplete,
  onTick,
  running,
}: {
  onComplete: () => void;
  onTick: (remaining: number) => void;
  running: boolean;
}): React.ReactElement {
  const { colors, typography } = useTheme();
  const [remaining, setRemaining] = useState(60);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastHapticRef = useRef<number>(60);

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setRemaining((prev) => {
          const next = prev - 1;

          // Haptic pulses at milestone seconds
          if (
            (next === 30 || next === 10 || next === 0) &&
            next !== lastHapticRef.current
          ) {
            lastHapticRef.current = next;
            if (next === 0) {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            } else {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }
          }

          onTick(next);

          if (next <= 0) {
            if (intervalRef.current) clearInterval(intervalRef.current);
            onComplete();
            return 0;
          }
          return next;
        });
      }, 1000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [running, onComplete, onTick]);

  const minutes = Math.floor(Math.max(0, remaining) / 60);
  const seconds = Math.max(0, remaining) % 60;
  const displayTime = `${minutes}:${seconds.toString().padStart(2, '0')}`;

  // Progress for the circle: starts at 1 (full), goes to 0
  const progress = remaining / 60;
  const circumference = 2 * Math.PI * 80; // radius = 80

  return (
    <View style={{ alignItems: 'center', marginVertical: 24 }}>
      {/* Circular timer */}
      <View
        style={{
          width: 180,
          height: 180,
          position: 'relative',
          alignItems: 'center',
          justifyContent: 'center',
        }}
        accessibilityLabel={`Prayer timer: ${displayTime} remaining`}
      >
        {/* Background circle */}
        <View
          style={{
            position: 'absolute',
            width: 180,
            height: 180,
            borderRadius: 90,
            borderWidth: 4,
            borderColor: colors.border,
          }}
        />
        {/* Foreground arc — simulated with a View border trick */}
        <View
          style={{
            position: 'absolute',
            width: 180,
            height: 180,
            borderRadius: 90,
            borderWidth: 4,
            borderColor: 'transparent',
            borderTopColor: colors.accent,
            borderRightColor: progress > 0.25 ? colors.accent : 'transparent',
            borderBottomColor: progress > 0.5 ? colors.accent : 'transparent',
            borderLeftColor: progress > 0.75 ? colors.accent : 'transparent',
            transform: [{ rotate: '-90deg' }],
          }}
        />
        {/* Time display */}
        <Text
          style={{
            fontFamily: typography.ui.fontFamily,
            fontSize: 42,
            fontWeight: '300',
            color: colors.accent,
            fontVariant: ['tabular-nums'],
          }}
        >
          {displayTime}
        </Text>
      </View>
    </View>
  );
}

// ─── Section 1: Scripture ────────────────────────────────────────────────────

function ScriptureSection({
  devotional,
  onContinue,
}: {
  devotional: NonNullable<ReturnType<typeof useDevotionalById>['devotional']>;
  onContinue: () => void;
}): React.ReactElement {
  const { colors, typography } = useTheme();

  return (
    <View style={{ flex: 1, justifyContent: 'space-between' }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 8, paddingTop: 8 }}
      >
        <Text
          style={{
            fontFamily: typography.ui.fontFamily,
            fontSize: typography.ui.sizes.sm,
            color: colors.textMuted,
            textTransform: 'uppercase',
            letterSpacing: 0.5,
            marginBottom: 16,
          }}
        >
          Scripture
        </Text>
        <ScriptureBlock
          reference={devotional.scripture_reference}
          text={devotional.scripture_text}
          translation={devotional.translation}
        />
      </ScrollView>
      <View style={{ paddingHorizontal: 16, paddingBottom: 16 }}>
        <PrimaryButton
          title="Continue"
          onPress={onContinue}
          accessibilityLabel="Continue to next section"
        />
      </View>
    </View>
  );
}

// ─── Section 2: On the Floor ─────────────────────────────────────────────────

function OnTheFloorSection({
  devotional,
  onContinue,
}: {
  devotional: NonNullable<ReturnType<typeof useDevotionalById>['devotional']>;
  onContinue: () => void;
}): React.ReactElement {
  const { colors, typography } = useTheme();

  return (
    <View style={{ flex: 1, justifyContent: 'space-between' }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 8, paddingTop: 8 }}
      >
        <Text
          style={{
            fontFamily: typography.ui.fontFamily,
            fontSize: typography.ui.sizes.sm,
            color: colors.textMuted,
            textTransform: 'uppercase',
            letterSpacing: 0.5,
            marginBottom: 16,
          }}
        >
          On the Floor
        </Text>
        <Text
          style={{
            fontFamily: typography.ui.fontFamily,
            fontSize: typography.ui.sizes.base,
            color: colors.text,
            lineHeight: 26,
          }}
        >
          {devotional.workplace_application}
        </Text>
      </ScrollView>
      <View style={{ paddingHorizontal: 16, paddingBottom: 16 }}>
        <PrimaryButton
          title="Continue"
          onPress={onContinue}
          accessibilityLabel="Continue to reflection"
        />
      </View>
    </View>
  );
}

// ─── Section 3: Reflect ─────────────────────────────────────────────────────

function ReflectSection({
  devotional,
  reflection,
  onReflectionChange,
  onContinue,
}: {
  devotional: NonNullable<ReturnType<typeof useDevotionalById>['devotional']>;
  reflection: string;
  onReflectionChange: (text: string) => void;
  onContinue: () => void;
}): React.ReactElement {
  const { colors, typography } = useTheme();

  return (
    <View style={{ flex: 1, justifyContent: 'space-between' }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 8, paddingTop: 8 }}
        keyboardShouldPersistTaps="handled"
      >
        <Text
          style={{
            fontFamily: typography.ui.fontFamily,
            fontSize: typography.ui.sizes.sm,
            color: colors.textMuted,
            textTransform: 'uppercase',
            letterSpacing: 0.5,
            marginBottom: 16,
          }}
        >
          Reflect
        </Text>
        <Text
          style={{
            fontFamily: typography.scripture.fontFamily,
            fontSize: typography.scripture.sizes.base,
            color: colors.text,
            lineHeight: typography.scripture.sizes.base * typography.scripture.lineHeight,
            marginBottom: 20,
            fontStyle: 'italic',
          }}
        >
          {devotional.reflection_prompt}
        </Text>
        <TextInput
          style={{
            fontFamily: typography.ui.fontFamily,
            fontSize: typography.ui.sizes.base,
            color: colors.text,
            lineHeight: 24,
            backgroundColor: colors.surface,
            borderRadius: 8,
            padding: 16,
            minHeight: 140,
            textAlignVertical: 'top',
            borderWidth: 1,
            borderColor: colors.border,
          }}
          multiline
          placeholder="Write your thoughts here…"
          placeholderTextColor={colors.textMuted}
          value={reflection}
          onChangeText={onReflectionChange}
          accessibilityLabel="Reflection input"
          textAlignVertical="top"
        />
      </ScrollView>
      <View style={{ paddingHorizontal: 16, paddingBottom: 16 }}>
        <PrimaryButton
          title="Continue"
          onPress={onContinue}
          accessibilityLabel="Continue to prayer"
        />
      </View>
    </View>
  );
}

// ─── Section 4: Pray ─────────────────────────────────────────────────────────

function PraySection({
  devotional,
  onComplete,
  onSkip,
}: {
  devotional: NonNullable<ReturnType<typeof useDevotionalById>['devotional']>;
  onComplete: (durationSeconds: number) => void;
  onSkip: () => void;
}): React.ReactElement {
  const { colors, typography } = useTheme();
  const reducedMotion = useReducedMotion();
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerDone, setTimerDone] = useState(false);
  const finalSecondsRef = useRef(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const handleStart = useCallback(() => {
    setTimerRunning(true);
  }, []);

  const handleTick = useCallback((remaining: number) => {
    finalSecondsRef.current = 60 - remaining;
  }, []);

  const handleTimerComplete = useCallback(() => {
    setTimerDone(true);
    setTimerRunning(false);

    if (!reducedMotion) {
      Animated.sequence([
        Animated.timing(fadeAnim, {
          toValue: 0.8,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }

    onComplete(finalSecondsRef.current);
  }, [onComplete, reducedMotion, fadeAnim]);

  const handleSkip = useCallback(() => {
    onSkip();
  }, [onSkip]);

  return (
    <View style={{ flex: 1, justifyContent: 'space-between' }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 8, paddingTop: 8 }}
      >
        <Text
          style={{
            fontFamily: typography.ui.fontFamily,
            fontSize: typography.ui.sizes.sm,
            color: colors.textMuted,
            textTransform: 'uppercase',
            letterSpacing: 0.5,
            marginBottom: 16,
          }}
        >
          Pray
        </Text>
        <Animated.View style={{ opacity: fadeAnim }}>
          <Text
            style={{
              fontFamily: typography.scripture.fontFamily,
              fontSize: typography.scripture.sizes.base,
              color: colors.scripture,
              lineHeight: typography.scripture.sizes.base * typography.scripture.lineHeight,
              marginBottom: 8,
              fontStyle: 'italic',
            }}
          >
            {devotional.prayer}
          </Text>
        </Animated.View>

        {/* Prayer Timer */}
        {!timerRunning && !timerDone && (
          <PrayerTimer
            running={false}
            onComplete={handleTimerComplete}
            onTick={handleTick}
          />
        )}

        {timerRunning && (
          <PrayerTimer
            running={true}
            onComplete={handleTimerComplete}
            onTick={handleTick}
          />
        )}

        {timerDone && (
          <View
            style={{
              alignItems: 'center',
              paddingVertical: 24,
            }}
          >
            <View
              style={{
                width: 48,
                height: 48,
                borderRadius: 24,
                backgroundColor: colors.accent,
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 12,
              }}
            >
              <Text style={{ color: '#FFFFFF', fontSize: 24 }}>✓</Text>
            </View>
            <Text
              style={{
                fontFamily: typography.ui.fontFamily,
                fontSize: typography.ui.sizes.base,
                color: colors.textSecondary,
              }}
            >
              Time spent with God is never wasted.
            </Text>
          </View>
        )}
      </ScrollView>

      <View style={{ paddingHorizontal: 16, paddingBottom: 16, gap: 8 }}>
        {!timerRunning && !timerDone && (
          <>
            <PrimaryButton
              title="Start 60-second timer"
              onPress={handleStart}
              accessibilityLabel="Start prayer timer"
            />
            <GhostButton
              title="I'm done praying"
              onPress={handleSkip}
              accessibilityLabel="Skip prayer timer"
            />
          </>
        )}
        {timerDone && (
          <PrimaryButton
            title="Continue"
            onPress={() => onComplete(finalSecondsRef.current)}
            accessibilityLabel="Continue to challenge"
          />
        )}
      </View>
    </View>
  );
}

// ─── Section 5: Today's Challenge ────────────────────────────────────────────

function ChallengeSection({
  devotional,
  challengeAccepted: initialAccepted,
  challengeCompleted: initialCompleted,
  onAccept,
  onMarkDone,
  onFinish,
}: {
  devotional: NonNullable<ReturnType<typeof useDevotionalById>['devotional']>;
  challengeAccepted: boolean;
  challengeCompleted: boolean;
  onAccept: () => void;
  onMarkDone: () => void;
  onFinish: () => void;
}): React.ReactElement {
  const { colors, typography } = useTheme();
  const [accepted, setAccepted] = useState(initialAccepted);
  const [done, setDone] = useState(initialCompleted);

  const handleAccept = useCallback(() => {
    setAccepted(true);
    onAccept();
  }, [onAccept]);

  const handleMarkDone = useCallback(() => {
    setDone(true);
    onMarkDone();
  }, [onMarkDone]);

  return (
    <View style={{ flex: 1, justifyContent: 'space-between' }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 8, paddingTop: 8 }}
      >
        <Text
          style={{
            fontFamily: typography.ui.fontFamily,
            fontSize: typography.ui.sizes.sm,
            color: colors.textMuted,
            textTransform: 'uppercase',
            letterSpacing: 0.5,
            marginBottom: 16,
          }}
        >
          Today's Challenge
        </Text>
        <View
          style={{
            backgroundColor: colors.surface,
            borderRadius: 12,
            padding: 20,
            marginBottom: 24,
          }}
        >
          <Text
            style={{
              fontFamily: typography.ui.fontFamily,
              fontSize: typography.ui.sizes.base,
              color: colors.text,
              lineHeight: 26,
            }}
          >
            {devotional.challenge}
          </Text>
        </View>

        {accepted && (
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              marginBottom: 16,
              paddingHorizontal: 4,
            }}
          >
            <View
              style={{
                width: 20,
                height: 20,
                borderRadius: 10,
                backgroundColor: colors.accent,
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 8,
              }}
            >
              <Text style={{ color: '#FFFFFF', fontSize: 12, fontWeight: '700' }}>
                ✓
              </Text>
            </View>
            <Text
              style={{
                fontFamily: typography.ui.fontFamily,
                fontSize: typography.ui.sizes.sm,
                color: colors.accent,
                fontWeight: '600',
              }}
            >
              Challenge accepted
            </Text>
          </View>
        )}
      </ScrollView>

      <View style={{ paddingHorizontal: 16, paddingBottom: 16, gap: 8 }}>
        {!accepted && (
          <PrimaryButton
            title="I accept this challenge"
            onPress={handleAccept}
            accessibilityLabel="Accept today's challenge"
          />
        )}
        {accepted && !done && (
          <>
            <PrimaryButton
              title="Mark as done"
              onPress={handleMarkDone}
              accessibilityLabel="Mark challenge as completed"
            />
            <GhostButton
              title="Finish"
              onPress={onFinish}
              accessibilityLabel="Finish devotional"
            />
          </>
        )}
        {(accepted && done) && (
          <PrimaryButton
            title="Finish"
            onPress={onFinish}
            accessibilityLabel="Finish devotional"
          />
        )}
      </View>
    </View>
  );
}

// ─── Share Button (stub) ─────────────────────────────────────────────────────

function ShareButton({
  onPress,
}: {
  onPress: () => void;
}): React.ReactElement {
  const { colors, typography } = useTheme();

  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: colors.border,
      }}
      accessibilityLabel="Share this devotional"
    >
      <Text
        style={{
          fontFamily: typography.ui.fontFamily,
          fontSize: typography.ui.sizes.base,
          fontWeight: '600',
          color: colors.text,
          marginRight: 6,
        }}
      >
        Share
      </Text>
      <Text style={{ fontSize: 16 }}>↗</Text>
    </TouchableOpacity>
  );
}

// ─── Main Reader Screen ──────────────────────────────────────────────────────

export default function DevotionalReaderScreen(): React.ReactElement {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors, typography } = useTheme();
  const { user } = useAuth();

  const { devotional, completion, isLoading, isError, error } =
    useDevotionalById(id ?? '');

  const [currentSection, setCurrentSection] = useState<Section>(1);
  const [reflection, setReflection] = useState(completion?.reflection_response ?? '');
  const [prayerDuration, setPrayerDuration] = useState<number>(0);
  const [challengeAccepted, setChallengeAccepted] = useState(
    completion?.challenge_accepted ?? false,
  );
  const [challengeCompleted, setChallengeCompleted] = useState(
    completion?.challenge_completed ?? false,
  );

  // Section transition animation
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const reducedMotion = useReducedMotion();

  // Persist reflection auto-save
  const persistReflection = useCallback(
    async (text: string) => {
      if (!user || !devotional) return;
      await supabase
        .from('devotional_completions')
        .upsert(
          {
            user_id: user.id,
            devotional_id: devotional.id,
            reflection_response: text,
            client_updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id, devotional_id' },
        );
    },
    [user, devotional],
  );

  // Debounced auto-save for reflection
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleReflectionChange = useCallback(
    (text: string) => {
      setReflection(text);
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(() => {
        persistReflection(text);
      }, 2000);
    },
    [persistReflection],
  );

  // Cleanup save timer
  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, []);

  const transitionTo = useCallback(
    (section: Section) => {
      if (reducedMotion) {
        setCurrentSection(section);
        return;
      }
      Animated.sequence([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setCurrentSection(section);
      });
    },
    [fadeAnim, reducedMotion],
  );

  const handleDismiss = useCallback(() => {
    if (currentSection > 1) {
      Alert.alert(
        'Leave without finishing?',
        'Your reflection will be saved.',
        [
          { text: 'Stay', style: 'cancel' },
          {
            text: 'Leave',
            style: 'destructive',
            onPress: () => router.back(),
          },
        ],
      );
    } else {
      router.back();
    }
  }, [currentSection, router]);

  const handleSaveCompletion = useCallback(
    async (data: CompleteDevotionalData) => {
      if (!user || !devotional) return;
      try {
        await supabase.from('devotional_completions').upsert(
          {
            user_id: user.id,
            devotional_id: devotional.id,
            ...data,
            client_updated_at: new Date().toISOString(),
            completed_at: new Date().toISOString(),
          },
          { onConflict: 'user_id, devotional_id' },
        );
      } catch {
        // Fail silently — the data is also saved incrementally
      }
    },
    [user, devotional],
  );

  const handlePrayerComplete = useCallback(
    (durationSeconds: number) => {
      setPrayerDuration(durationSeconds);
    },
    [],
  );

  const handleFinish = useCallback(async () => {
    await handleSaveCompletion({
      reflection_response: reflection || null,
      challenge_accepted: challengeAccepted,
      challenge_completed: challengeCompleted,
      prayer_duration_seconds: prayerDuration || null,
    });
    router.back();
  }, [
    handleSaveCompletion,
    reflection,
    challengeAccepted,
    challengeCompleted,
    prayerDuration,
    router,
  ]);

  const handleAcceptChallenge = useCallback(() => {
    setChallengeAccepted(true);
  }, []);

  const handleMarkDone = useCallback(() => {
    setChallengeCompleted(true);
  }, []);

  // Share stub
  const handleShare = useCallback(() => {
    // Integration point for expo-sharing / react-native-view-shot
    // Capture the Scripture + reflection as an image and open the share sheet
    Alert.alert(
      'Share',
      'Sharing will be available in a future update.',
    );
  }, []);

  // ── Loading state ────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: colors.background,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <View
          style={{
            width: 48,
            height: 48,
            borderRadius: 24,
            backgroundColor: colors.surface,
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 16,
          }}
        >
          <ActivityIndicator color={colors.accent} size="small" />
        </View>
        <Text
          style={{
            fontFamily: typography.ui.fontFamily,
            fontSize: typography.ui.sizes.sm,
            color: colors.textMuted,
          }}
        >
          Loading…
        </Text>
      </View>
    );
  }

  // ── Error state ──────────────────────────────────────────────────────────

  if (isError || !devotional) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: colors.background,
          alignItems: 'center',
          justifyContent: 'center',
          padding: 32,
        }}
      >
        <Text style={{ fontSize: 48, marginBottom: 16 }}>⚠</Text>
        <Text
          style={{
            fontFamily: typography.ui.fontFamily,
            fontSize: typography.ui.sizes.lg,
            fontWeight: '600',
            color: colors.text,
            textAlign: 'center',
            marginBottom: 8,
          }}
        >
          Could not load devotional
        </Text>
        <Text
          style={{
            fontFamily: typography.ui.fontFamily,
            fontSize: typography.ui.sizes.sm,
            color: colors.textMuted,
            textAlign: 'center',
            marginBottom: 24,
          }}
        >
          {error?.message ?? 'The devotional could not be found.'}
        </Text>
        <PrimaryButton
          title="Go back"
          onPress={() => router.back()}
          accessibilityLabel="Go back to today screen"
        />
      </View>
    );
  }

  // ── Main render ──────────────────────────────────────────────────────────

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.background,
      }}
    >
      {/* Header */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 16,
          paddingTop: Platform.OS === 'ios' ? 56 : 16,
          paddingBottom: 8,
          backgroundColor: colors.background,
        }}
      >
        <Text
          style={{
            fontFamily: typography.scripture.fontFamily,
            fontSize: typography.ui.sizes.base,
            fontWeight: '600',
            color: colors.text,
          }}
          numberOfLines={1}
        >
          {devotional.title}
        </Text>
        <TouchableOpacity
          onPress={handleDismiss}
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: colors.surface,
            alignItems: 'center',
            justifyContent: 'center',
          }}
          accessibilityLabel="Close devotional reader"
        >
          <Text
            style={{
              fontSize: 16,
              color: colors.textMuted,
              fontWeight: '500',
            }}
          >
            ✕
          </Text>
        </TouchableOpacity>
      </View>

      {/* Progress dots */}
      <ProgressDots current={currentSection} total={5} />

      {/* Section content */}
      <Animated.View
        style={{
          flex: 1,
          opacity: reducedMotion ? 1 : fadeAnim,
        }}
      >
        {currentSection === 1 && (
          <ScriptureSection
            devotional={devotional}
            onContinue={() => transitionTo(2)}
          />
        )}

        {currentSection === 2 && (
          <OnTheFloorSection
            devotional={devotional}
            onContinue={() => transitionTo(3)}
          />
        )}

        {currentSection === 3 && (
          <ReflectSection
            devotional={devotional}
            reflection={reflection}
            onReflectionChange={handleReflectionChange}
            onContinue={() => transitionTo(4)}
          />
        )}

        {currentSection === 4 && (
          <PraySection
            devotional={devotional}
            onComplete={handlePrayerComplete}
            onSkip={() => transitionTo(5)}
          />
        )}

        {currentSection === 5 && (
          <>
            <ChallengeSection
              devotional={devotional}
              challengeAccepted={challengeAccepted}
              challengeCompleted={challengeCompleted}
              onAccept={handleAcceptChallenge}
              onMarkDone={handleMarkDone}
              onFinish={handleFinish}
            />
            <View style={{ paddingHorizontal: 16, paddingBottom: 24 }}>
              <ShareButton onPress={handleShare} />
            </View>
          </>
        )}
      </Animated.View>
    </View>
  );
}
