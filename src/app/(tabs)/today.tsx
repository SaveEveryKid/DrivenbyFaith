import React, { useMemo, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  Animated,
  TouchableOpacity,
  AccessibilityInfo,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Card } from '@/components/Card';
import { ScriptureBlock } from '@/components/ScriptureBlock';
import { PrimaryButton } from '@/components/PrimaryButton';
import { EmptyState } from '@/components/EmptyState';
import { useTheme } from '@/hooks/useTheme';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { useTodayDevotional, useDevotionalStreak } from '@/hooks/useDevotional';
import { useLine } from '@/hooks/useLine';
import { use28th } from '@/hooks/use28th';
import { useAuth } from '@/hooks/useAuth';
import { UIFontFamily } from '@/constants/theme';

// ─── Skeleton placeholder ─────────────────────────────────────────────────────

function SkeletonBlock(): React.ReactElement {
  const { colors } = useTheme();

  return (
    <View
      style={{ padding: 16 }}
      accessibilityLabel="Loading devotional"
    >
      <View
        style={{
          height: 14,
          width: '40%',
          backgroundColor: colors.border,
          borderRadius: 4,
          marginBottom: 8,
        }}
      />
      <View
        style={{
          height: 24,
          width: '70%',
          backgroundColor: colors.border,
          borderRadius: 4,
          marginBottom: 16,
        }}
      />
      <View
        style={{
          height: 80,
          backgroundColor: colors.surface,
          borderRadius: 8,
          marginBottom: 16,
        }}
      />
      <View
        style={{
          height: 14,
          width: '100%',
          backgroundColor: colors.border,
          borderRadius: 4,
          marginBottom: 8,
        }}
      />
      <View
        style={{
          height: 14,
          width: '80%',
          backgroundColor: colors.border,
          borderRadius: 4,
          marginBottom: 16,
        }}
      />
      <View
        style={{
          height: 48,
          backgroundColor: colors.border,
          borderRadius: 10,
        }}
      />
    </View>
  );
}

// ─── Today's Devotional Card ─────────────────────────────────────────────────

interface DevotionalCardProps {
  devotional: {
    id: string;
    title: string;
    scripture_reference: string;
    scripture_text: string;
    translation: string;
    workplace_application: string;
  };
  isCompleted: boolean;
  completionReflection: string | null;
  onRead: () => void;
}

function DevotionalCard({
  devotional,
  isCompleted,
  completionReflection,
  onRead,
}: DevotionalCardProps): React.ReactElement {
  const { colors, typography } = useTheme();
  const previewText = useMemo(() => {
    if (devotional.workplace_application.length <= 120) {
      return devotional.workplace_application;
    }
    return devotional.workplace_application.slice(0, 120).trimEnd() + '…';
  }, [devotional.workplace_application]);

  if (isCompleted) {
    return (
      <Card variant="elevated">
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: 12,
          }}
        >
          <View
            style={{
              width: 28,
              height: 28,
              borderRadius: 14,
              backgroundColor: colors.success,
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 10,
            }}
          >
            <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '700' }}>
              ✓
            </Text>
          </View>
          <Text
            style={{
              fontFamily: typography.ui.fontFamily,
              fontSize: typography.ui.sizes.sm,
              fontWeight: '600',
              color: colors.success,
              textTransform: 'uppercase',
              letterSpacing: 0.5,
            }}
          >
            Completed
          </Text>
        </View>
        <Text
          style={{
            fontFamily: typography.scripture.fontFamily,
            fontSize: typography.scripture.sizes.base,
            fontWeight: '600',
            color: colors.text,
            marginBottom: 8,
          }}
        >
          {devotional.title}
        </Text>
        <Text
          style={{
            fontFamily: typography.ui.fontFamily,
            fontSize: typography.ui.sizes.sm,
            color: colors.textSecondary,
            marginBottom: 4,
          }}
        >
          {devotional.scripture_reference}
        </Text>
        {completionReflection ? (
          <Text
            style={{
              fontFamily: typography.scripture.fontFamily,
              fontSize: typography.scripture.sizes.small,
              color: colors.textMuted,
              fontStyle: 'italic',
              lineHeight: typography.scripture.sizes.small * typography.scripture.lineHeight,
              marginTop: 8,
              paddingTop: 8,
              borderTopWidth: 1,
              borderTopColor: colors.border,
            }}
          >
            "{completionReflection.length > 100
              ? completionReflection.slice(0, 100) + '…'
              : completionReflection}"
          </Text>
        ) : null}
      </Card>
    );
  }

  return (
    <Card variant="elevated">
      <Text
        style={{
          fontFamily: typography.scripture.fontFamily,
          fontSize: typography.ui.sizes.xl,
          fontWeight: '600',
          color: colors.text,
          marginBottom: 12,
        }}
      >
        {devotional.title}
      </Text>
      <View style={{ marginBottom: 12 }}>
        <Text
          style={{
            fontFamily: typography.ui.fontFamily,
            fontSize: typography.ui.sizes.sm,
            color: colors.textMuted,
            textTransform: 'uppercase',
            letterSpacing: 0.5,
          }}
          accessibilityLabel={`Scripture reference: ${devotional.scripture_reference}`}
        >
          {devotional.scripture_reference}
        </Text>
      </View>
      <Text
        style={{
          fontFamily: typography.ui.fontFamily,
          fontSize: typography.ui.sizes.base,
          color: colors.textSecondary,
          lineHeight: 22,
          marginBottom: 16,
        }}
        numberOfLines={3}
      >
        {previewText}
      </Text>
      <PrimaryButton
        title="Read"
        onPress={onRead}
        accessibilityLabel="Read today's devotional"
      />
    </Card>
  );
}

// ─── Completed Animation ─────────────────────────────────────────────────────

function CompletionCelebration(): React.ReactElement {
  const { colors, typography } = useTheme();
  const reducedMotion = useReducedMotion();
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    if (!reducedMotion) {
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      opacity.setValue(1);
      translateY.setValue(0);
    }
  }, [opacity, translateY, reducedMotion]);

  return (
    <Animated.View
      style={{
        opacity: reducedMotion ? 1 : opacity,
        transform: [{ translateY: reducedMotion ? 0 : translateY }],
        alignItems: 'center',
        paddingVertical: 24,
      }}
      accessibilityLabel="Today's reading is complete"
    >
      <View
        style={{
          width: 56,
          height: 56,
          borderRadius: 28,
          backgroundColor: colors.success,
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
          color: colors.text,
          marginBottom: 8,
        }}
      >
        Today's reading complete
      </Text>
      <Text
        style={{
          fontFamily: typography.ui.fontFamily,
          fontSize: typography.ui.sizes.base,
          color: colors.textSecondary,
          textAlign: 'center',
          lineHeight: 22,
        }}
      >
        Well done. You showed up and listened. God's word does its work whether you feel it or not.
      </Text>
    </Animated.View>
  );
}

// ─── Streak Display ───────────────────────────────────────────────────────────

function StreakDisplay(): React.ReactElement {
  const { colors, typography } = useTheme();
  const { streak, isLoading } = useDevotionalStreak();

  if (isLoading || !streak) return <></>;

  return (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'center',
        paddingVertical: 12,
        marginBottom: 8,
      }}
    >
      <View style={{ alignItems: 'center', marginHorizontal: 20 }}>
        <Text
          style={{
            fontFamily: typography.ui.fontFamily,
            fontSize: typography.ui.sizes['2xl'],
            fontWeight: '700',
            color: colors.accent,
          }}
        >
          {streak.currentStreak}
        </Text>
        <Text
          style={{
            fontFamily: typography.ui.fontFamily,
            fontSize: typography.ui.sizes.xs,
            color: colors.textMuted,
            textTransform: 'uppercase',
            letterSpacing: 0.5,
          }}
        >
          day streak
        </Text>
      </View>
      <View
        style={{
          width: 1,
          backgroundColor: colors.border,
          marginVertical: 4,
        }}
      />
      <View style={{ alignItems: 'center', marginHorizontal: 20 }}>
        <Text
          style={{
            fontFamily: typography.ui.fontFamily,
            fontSize: typography.ui.sizes['2xl'],
            fontWeight: '700',
            color: colors.accent,
          }}
        >
          {streak.longestStreak}
        </Text>
        <Text
          style={{
            fontFamily: typography.ui.fontFamily,
            fontSize: typography.ui.sizes.xs,
            color: colors.textMuted,
            textTransform: 'uppercase',
            letterSpacing: 0.5,
          }}
        >
          best
        </Text>
      </View>
    </View>
  );
}

// ─── Month-End Integrity Card ─────────────────────────────────────────────────

function MonthEndCard(): React.ReactElement | null {
  const { palette, typography } = useTheme();
  const router = useRouter();
  const { isMonthEndWindow, line } = useLine();
  const { isActive } = use28th();

  if (!isMonthEndWindow && !isActive) return null;

  return (
    <TouchableOpacity
      onPress={() => router.push('/28th')}
      accessibilityLabel="Month-end integrity review"
      style={{
        backgroundColor: palette.sage + '18',
        borderRadius: 10,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: palette.sage + '40',
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
        <Text style={{ fontSize: 20, marginRight: 8 }}>🛡</Text>
        <Text
          style={{
            fontFamily: UIFontFamily,
            fontSize: typography.ui.sizes.sm,
            fontWeight: '600',
            color: palette.sage,
            textTransform: 'uppercase',
            letterSpacing: 0.5,
          }}
        >
          Month-End Review
        </Text>
      </View>
      <Text
        style={{
          fontFamily: UIFontFamily,
          fontSize: typography.ui.sizes.sm,
          color: palette.ink,
          lineHeight: 20,
          marginBottom: 8,
        }}
      >
        The month is closing. Take a few minutes to review your commitments before the pressure of month-end hits.
      </Text>
      {line ? (
        <Text
          style={{
            fontFamily: typography.scripture.fontFamily,
            fontSize: typography.scripture.sizes.small,
            color: palette.muted,
            fontStyle: 'italic',
          }}
          numberOfLines={2}
        >
          "{line.length > 80 ? line.slice(0, 80) + '…' : line}"
        </Text>
      ) : (
        <Text
          style={{
            fontFamily: UIFontFamily,
            fontSize: typography.ui.sizes.xs,
            color: palette.muted,
          }}
        >
          You have not set a line yet. Now is a good time.
        </Text>
      )}
    </TouchableOpacity>
  );
}

// ─── Quick Debrief Link ───────────────────────────────────────────────────────

function QuickDebriefLink(): React.ReactElement {
  const { palette, typography } = useTheme();
  const router = useRouter();

  return (
    <TouchableOpacity
      onPress={() => router.push('/debrief/new')}
      accessibilityLabel="Quick debrief"
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        marginBottom: 16,
        backgroundColor: palette.surface,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: palette.line,
      }}
    >
      <Text style={{ fontSize: 18, marginRight: 8 }}>📋</Text>
      <Text
        style={{
          fontFamily: UIFontFamily,
          fontSize: typography.ui.sizes.sm,
          fontWeight: '600',
          color: palette.ink,
        }}
      >
        Debrief your shift
      </Text>
    </TouchableOpacity>
  );
}

// ─── Main Screen ─────────────────────────────────────────────────────────────

export default function TodayScreen(): React.ReactElement {
  const { colors, typography } = useTheme();
  const { profile } = useAuth();
  const router = useRouter();

  const {
    devotional,
    completion,
    isLoading,
    isError,
    error,
  } = useTodayDevotional();

  // ── Time-aware greeting ──────────────────────────────────────────────────

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    const name = profile?.display_name ?? 'friend';

    if (hour < 12) return `Good morning, ${name}.`;
    if (hour < 17) return `Good afternoon, ${name}.`;
    return `Good evening, ${name}.`;
  }, [profile?.display_name]);

  const formattedDate = useMemo(() => {
    const now = new Date();
    return now.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    });
  }, []);

  const isCompleted = !!completion;

  const handleRead = (): void => {
    if (devotional) {
      router.push({
        pathname: '/devotional/[id]',
        params: { id: devotional.id },
      } as never);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{
        padding: 16,
        paddingBottom: 32,
      }}
      accessibilityLabel="Today screen"
    >
      {/* Greeting */}
      <Text
        style={{
          fontFamily: typography.ui.fontFamily,
          fontSize: typography.ui.sizes.sm,
          color: colors.textMuted,
          marginBottom: 2,
        }}
        accessibilityLabel={greeting}
      >
        {greeting}
      </Text>
      <Text
        style={{
          fontFamily: typography.ui.fontFamily,
          fontSize: typography.ui.sizes.xs,
          color: colors.textMuted,
          marginBottom: 20,
        }}
      >
        {formattedDate}
      </Text>

      {/* Streak */}
      <StreakDisplay />

      {/* Month-End Integrity Card */}
      <MonthEndCard />

      {/* Quick Debrief Link */}
      <QuickDebriefLink />

      {/* Devotional Card */}
      {isLoading && <SkeletonBlock />}

      {isError && !isLoading && (
        <EmptyState
          icon="⚠"
          title="Could not load devotional"
          subtitle={error?.message ?? 'Please check your connection and try again.'}
        />
      )}

      {!isLoading && !isError && !devotional && (
        <EmptyState
          icon="🌿"
          title="No devotional scheduled for today"
          subtitle="Use this space to pray or revisit a recent reading."
        />
      )}

      {!isLoading && !isError && devotional && (
        <>
          <DevotionalCard
            devotional={devotional}
            isCompleted={isCompleted}
            completionReflection={completion?.reflection_response ?? null}
            onRead={handleRead}
          />

          {/* Completion celebration */}
          {isCompleted && <CompletionCelebration />}
        </>
      )}
    </ScrollView>
  );
}
