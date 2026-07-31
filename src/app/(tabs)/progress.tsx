import React, { useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useProgressDashboard } from '@/hooks/useProgress';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/hooks/useAuth';
import { UIFontFamily, ScriptureFontFamily } from '@/constants/theme';

// ─── Summary Card ─────────────────────────────────────────────────────────────

function SummaryCard({
  label,
  value,
  palette,
}: {
  label: string;
  value: string | number;
  palette: ReturnType<typeof useTheme>['palette'];
}): React.ReactElement {
  return (
    <View
      style={{
        backgroundColor: palette.surface,
        borderRadius: 10,
        paddingHorizontal: 14,
        paddingVertical: 12,
        minWidth: 100,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: palette.line,
      }}
    >
      <Text
        style={{
          fontFamily: UIFontFamily,
          fontSize: 11,
          fontWeight: '600',
          color: palette.muted,
          textTransform: 'uppercase',
          letterSpacing: 0.4,
          marginBottom: 4,
          textAlign: 'center',
        }}
        numberOfLines={2}
      >
        {label}
      </Text>
      <Text
        style={{
          fontFamily: UIFontFamily,
          fontSize: 22,
          fontWeight: '700',
          color: palette.ink,
        }}
      >
        {value}
      </Text>
    </View>
  );
}

// ─── Section Header ───────────────────────────────────────────────────────────

function SectionHeader({
  title,
  palette,
}: {
  title: string;
  palette: ReturnType<typeof useTheme>['palette'];
}): React.ReactElement {
  return (
    <Text
      style={{
        fontFamily: UIFontFamily,
        fontSize: 14,
        fontWeight: '600',
        color: palette.muted,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 12,
        marginTop: 24,
      }}
    >
      {title}
    </Text>
  );
}

// ─── Dot Grid ─────────────────────────────────────────────────────────────────

function DotGrid({
  days,
  palette,
  accessibilityLabel,
}: {
  days: boolean[];
  palette: ReturnType<typeof useTheme>['palette'];
  accessibilityLabel: string;
}): React.ReactElement {
  return (
    <View
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="image"
      style={{
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
        paddingVertical: 4,
      }}
    >
      {days.map((filled, i) => (
        <View
          key={i}
          style={{
            width: 14,
            height: 14,
            borderRadius: 7,
            backgroundColor: filled ? palette.clay : palette.line,
          }}
        />
      ))}
    </View>
  );
}

// ─── Stat Row ─────────────────────────────────────────────────────────────────

function StatRow({
  label,
  value,
  palette,
}: {
  label: string;
  value: string | number;
  palette: ReturnType<typeof useTheme>['palette'];
}): React.ReactElement {
  return (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: palette.line,
      }}
    >
      <Text
        style={{
          fontFamily: UIFontFamily,
          fontSize: 15,
          color: palette.ink,
        }}
      >
        {label}
      </Text>
      <Text
        style={{
          fontFamily: UIFontFamily,
          fontSize: 15,
          fontWeight: '600',
          color: palette.clay,
        }}
      >
        {value}
      </Text>
    </View>
  );
}

// ─── Month name helper ────────────────────────────────────────────────────────

function formatMonth(monthStr: string): string {
  if (!monthStr) return '';
  const [year, month] = monthStr.split('-');
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];
  const idx = parseInt(month, 10) - 1;
  if (idx < 0 || idx > 11) return monthStr;
  return `${months[idx]} ${year}`;
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function ProgressScreen(): React.ReactElement {
  const { palette } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const { data, isLoading, isError, refetch } = useProgressDashboard();

  const handleRefresh = useCallback(() => {
    void refetch();
  }, [refetch]);

  const navigateToYearInReview = useCallback(() => {
    router.push('/progress/year-in-review');
  }, [router]);

  // ─── Loading state ──────────────────────────────────────────────────────

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

  // ─── Empty / error state ────────────────────────────────────────────────

  if (!data || isError) {
    return (
      <ScrollView
        style={{ flex: 1, backgroundColor: palette.bg }}
        contentContainerStyle={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          padding: 32,
        }}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={handleRefresh}
            tintColor={palette.clay}
          />
        }
      >
        <Text style={{ fontSize: 48, marginBottom: 16 }}>📊</Text>
        <Text
          style={{
            fontFamily: UIFontFamily,
            fontSize: 18,
            fontWeight: '600',
            color: palette.ink,
            textAlign: 'center',
            marginBottom: 8,
          }}
        >
          {isError ? "Something went wrong" : "Your Progress"}
        </Text>
        <Text
          style={{
            fontFamily: UIFontFamily,
            fontSize: 14,
            color: palette.muted,
            textAlign: 'center',
            lineHeight: 20,
            marginBottom: 24,
          }}
        >
          {isError
            ? "We couldn't load your progress right now. Pull down to try again."
            : "Start reading devotionals and logging your walk to see your progress here."}
        </Text>
      </ScrollView>
    );
  }

  // ─── Main content ───────────────────────────────────────────────────────

  const completionDays = data.last30Days.filter(Boolean).length;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: palette.bg }}
      contentContainerStyle={{ padding: 16, paddingBottom: 48 }}
      refreshControl={
        <RefreshControl
          refreshing={isLoading}
          onRefresh={handleRefresh}
          tintColor={palette.clay}
        />
      }
    >
      {/* ── Year in Review Banner (if eligible) ──────────────────────── */}
      {data.yearInReviewAvailable && (
        <TouchableOpacity
          onPress={navigateToYearInReview}
          accessibilityLabel="View your year in review"
          accessibilityRole="button"
          style={{
            backgroundColor: palette.sage,
            borderRadius: 12,
            padding: 16,
            marginBottom: 20,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontFamily: UIFontFamily,
                fontSize: 13,
                fontWeight: '600',
                color: '#FFFFFF',
                textTransform: 'uppercase',
                letterSpacing: 0.4,
                marginBottom: 4,
              }}
            >
              Your Year in Review
            </Text>
            <Text
              style={{
                fontFamily: UIFontFamily,
                fontSize: 15,
                color: '#FFFFFF',
                opacity: 0.9,
              }}
            >
              See how God has been at work in your daily walk
            </Text>
          </View>
          <Text style={{ color: '#FFFFFF', fontSize: 20, marginLeft: 8 }}>›</Text>
        </TouchableOpacity>
      )}

      {/* ── Summary Cards Row ────────────────────────────────────────── */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 10, paddingBottom: 4 }}
        style={{ marginBottom: 8 }}
      >
        <SummaryCard
          label="Current streak"
          value={`${data.currentStreak}d`}
          palette={palette}
        />
        <SummaryCard
          label="Longest streak"
          value={`${data.longestStreak}d`}
          palette={palette}
        />
        <SummaryCard
          label="Verses mastered"
          value={data.versesMastered}
          palette={palette}
        />
        <SummaryCard
          label="Prayer interactions"
          value={data.prayerInteractionsThisMonth}
          palette={palette}
        />
        <SummaryCard
          label="Days in Scripture"
          value={data.daysInScriptureThisMonth}
          palette={palette}
        />
        <SummaryCard
          label="Service acts"
          value={data.serviceActsLogged}
          palette={palette}
        />
      </ScrollView>

      {/* ── Rhythm Section ───────────────────────────────────────────── */}
      <SectionHeader title="Rhythm" palette={palette} />

      <View
        style={{
          backgroundColor: palette.surface,
          borderRadius: 10,
          padding: 16,
          borderWidth: 1,
          borderColor: palette.line,
        }}
      >
        <Text
          style={{
            fontFamily: UIFontFamily,
            fontSize: 13,
            color: palette.muted,
            marginBottom: 12,
          }}
        >
          Last 30 days of devotional reading
        </Text>

        <DotGrid
          days={data.last30Days}
          palette={palette}
          accessibilityLabel={`${completionDays} of 30 days with devotional reading in the past 30 days`}
        />

        <Text
          style={{
            fontFamily: UIFontFamily,
            fontSize: 13,
            color: palette.inkDim,
            marginTop: 10,
          }}
        >
          {completionDays} of 30 days
        </Text>
      </View>

      {/* ── Prayer Section ───────────────────────────────────────────── */}
      <SectionHeader title="Prayer" palette={palette} />

      <View
        style={{
          backgroundColor: palette.surface,
          borderRadius: 10,
          overflow: 'hidden',
          borderWidth: 1,
          borderColor: palette.line,
        }}
      >
        <StatRow
          label="Interactions given this month"
          value={data.prayerInteractionsThisMonth}
          palette={palette}
        />
        <StatRow
          label="Requests posted"
          value={data.prayerRequestsPosted}
          palette={palette}
        />
        <StatRow
          label="Requests marked answered"
          value={data.prayerRequestsAnswered}
          palette={palette}
        />
      </View>

      {/* ── Words Section ────────────────────────────────────────────── */}
      <SectionHeader title="Words" palette={palette} />

      <View
        style={{
          backgroundColor: palette.surface,
          borderRadius: 10,
          overflow: 'hidden',
          borderWidth: 1,
          borderColor: palette.line,
        }}
      >
        <StatRow
          label="Total words written"
          value={data.totalWords.toLocaleString()}
          palette={palette}
        />
        <StatRow
          label="Average words per reflection"
          value={data.avgWordsPerReflection}
          palette={palette}
        />
      </View>

      {/* ── Scripture Section ────────────────────────────────────────── */}
      <SectionHeader title="Scripture" palette={palette} />

      <View
        style={{
          backgroundColor: palette.surface,
          borderRadius: 10,
          overflow: 'hidden',
          borderWidth: 1,
          borderColor: palette.line,
        }}
      >
        <StatRow
          label="Days with devotional read"
          value={`${data.scriptureCompletionPct}%`}
          palette={palette}
        />

        {data.readingPlan ? (
          <StatRow
            label={`${data.readingPlan.name}`}
            value={`Day ${data.readingPlan.day} of ${data.readingPlan.total}`}
            palette={palette}
          />
        ) : (
          <View
            style={{
              paddingHorizontal: 16,
              paddingVertical: 14,
            }}
          >
            <Text
              style={{
                fontFamily: UIFontFamily,
                fontSize: 15,
                color: palette.inkDim,
              }}
            >
              No active reading plan
            </Text>
          </View>
        )}
      </View>

      {/* ── Service Section ──────────────────────────────────────────── */}
      <SectionHeader title="Service" palette={palette} />

      <View
        style={{
          backgroundColor: palette.surface,
          borderRadius: 10,
          overflow: 'hidden',
          borderWidth: 1,
          borderColor: palette.line,
          marginBottom: 8,
        }}
      >
        <StatRow
          label="'Who I served' entries"
          value={data.serviceEntries}
          palette={palette}
        />
        <StatRow
          label="Gratitude entries"
          value={data.gratitudeEntries}
          palette={palette}
        />
      </View>

      {/* ── Footer note ──────────────────────────────────────────────── */}
      <Text
        style={{
          fontFamily: UIFontFamily,
          fontSize: 12,
          color: palette.inkDim,
          textAlign: 'center',
          marginTop: 20,
          lineHeight: 18,
        }}
      >
        Your rhythm, not a ranking. Keep walking.
      </Text>
    </ScrollView>
  );
}
