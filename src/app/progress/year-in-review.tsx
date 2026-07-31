import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useYearInReview, useProgressDashboard } from '@/hooks/useProgress';
import { useTheme } from '@/hooks/useTheme';
import { UIFontFamily, ScriptureFontFamily } from '@/constants/theme';

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

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  sub,
  palette,
}: {
  label: string;
  value: string | number;
  sub?: string;
  palette: ReturnType<typeof useTheme>['palette'];
}): React.ReactElement {
  return (
    <View
      style={{
        backgroundColor: palette.surface,
        borderRadius: 10,
        padding: 16,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: palette.line,
        flex: 1,
        minWidth: 100,
      }}
    >
      <Text
        style={{
          fontFamily: UIFontFamily,
          fontSize: 24,
          fontWeight: '700',
          color: palette.clay,
          marginBottom: 4,
        }}
      >
        {value}
      </Text>
      <Text
        style={{
          fontFamily: UIFontFamily,
          fontSize: 12,
          fontWeight: '600',
          color: palette.muted,
          textTransform: 'uppercase',
          letterSpacing: 0.3,
          textAlign: 'center',
        }}
      >
        {label}
      </Text>
      {sub && (
        <Text
          style={{
            fontFamily: UIFontFamily,
            fontSize: 11,
            color: palette.inkDim,
            marginTop: 4,
            textAlign: 'center',
          }}
        >
          {sub}
        </Text>
      )}
    </View>
  );
}

// ─── Divider ──────────────────────────────────────────────────────────────────

function Divider({
  palette,
}: {
  palette: ReturnType<typeof useTheme>['palette'];
}): React.ReactElement {
  return (
    <View
      style={{
        width: 40,
        height: 3,
        borderRadius: 2,
        backgroundColor: palette.brass,
        alignSelf: 'center',
        marginVertical: 16,
      }}
    />
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function YearInReviewScreen(): React.ReactElement {
  const { palette, isDark } = useTheme();
  const router = useRouter();
  const { data, isLoading } = useYearInReview();
  const { data: dashboard } = useProgressDashboard();

  const handleShare = (): void => {
    Alert.alert(
      'Share as image',
      'This feature will allow you to share your Year in Review as an image. Coming soon.',
      [{ text: 'OK' }],
    );
  };

  // ─── Loading ────────────────────────────────────────────────────────────

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

  // ─── Not enough data ────────────────────────────────────────────────────

  if (!data || dashboard?.daysSinceFirstActivity !== undefined && dashboard.daysSinceFirstActivity < 90) {
    return (
      <ScrollView
        style={{ flex: 1, backgroundColor: palette.bg }}
        contentContainerStyle={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          padding: 32,
        }}
      >
        <Text style={{ fontSize: 48, marginBottom: 16 }}>🌱</Text>
        <Text
          style={{
            fontFamily: ScriptureFontFamily,
            fontSize: 20,
            color: palette.scripture,
            textAlign: 'center',
            marginBottom: 12,
            lineHeight: 28,
          }}
        >
          Keep walking
        </Text>
        <Text
          style={{
            fontFamily: UIFontFamily,
            fontSize: 15,
            color: palette.muted,
            textAlign: 'center',
            lineHeight: 22,
          }}
        >
          Your Year in Review will be ready when you have more history. Keep showing up — God is at work in your daily walk, even when you can't see the full picture yet.
        </Text>
      </ScrollView>
    );
  }

  // ─── Full Year in Review ────────────────────────────────────────────────

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: palette.bg }}
      contentContainerStyle={{ padding: 24, paddingBottom: 64 }}
    >
      {/* Header */}
      <View style={{ alignItems: 'center', marginBottom: 24 }}>
        <Text style={{ fontSize: 40, marginBottom: 12 }}>✝</Text>
        <Text
          style={{
            fontFamily: ScriptureFontFamily,
            fontSize: 22,
            color: palette.scripture,
            textAlign: 'center',
            marginBottom: 4,
            lineHeight: 30,
          }}
        >
          Your Year in Review
        </Text>
        <Text
          style={{
            fontFamily: UIFontFamily,
            fontSize: 14,
            color: palette.muted,
            textAlign: 'center',
          }}
        >
          A look at God's faithfulness in your daily walk
        </Text>
      </View>

      <Divider palette={palette} />

      {/* Top stats row 1 */}
      <View style={{ flexDirection: 'row', gap: 10, marginBottom: 10 }}>
        <StatCard
          label="Prayers"
          value={data.prayerCount}
          sub={`${data.answeredCount} answered`}
          palette={palette}
        />
        <StatCard
          label="Longest streak"
          value={`${data.longestStreak}d`}
          palette={palette}
        />
      </View>

      {/* Top stats row 2 */}
      <View style={{ flexDirection: 'row', gap: 10, marginBottom: 10 }}>
        <StatCard
          label="Verses mastered"
          value={data.versesMastered}
          palette={palette}
        />
        <StatCard
          label="Service acts"
          value={data.serviceActs}
          palette={palette}
        />
      </View>

      {/* Top stats row 3 */}
      <View style={{ flexDirection: 'row', gap: 10, marginBottom: 16 }}>
        <StatCard
          label="Words written"
          value={data.totalWords.toLocaleString()}
          palette={palette}
        />
        <StatCard
          label="Most active month"
          value={data.mostActiveMonth ? formatMonth(data.mostActiveMonth) : '—'}
          palette={palette}
        />
      </View>

      <Divider palette={palette} />

      {/* Top verse */}
      {data.topVerse && (
        <View
          style={{
            backgroundColor: palette.surface,
            borderRadius: 10,
            padding: 20,
            alignItems: 'center',
            borderWidth: 1,
            borderColor: palette.line,
            marginBottom: 16,
          }}
        >
          <Text
            style={{
              fontFamily: UIFontFamily,
              fontSize: 12,
              fontWeight: '600',
              color: palette.muted,
              textTransform: 'uppercase',
              letterSpacing: 0.4,
              marginBottom: 8,
            }}
          >
            Your top verse
          </Text>
          <Text
            style={{
              fontFamily: ScriptureFontFamily,
              fontSize: 18,
              color: palette.scripture,
              textAlign: 'center',
              lineHeight: 26,
              fontStyle: 'italic',
            }}
          >
            {data.topVerse}
          </Text>
        </View>
      )}

      {/* Burden tags */}
      {data.topBurdens.length > 0 && (
        <View
          style={{
            backgroundColor: palette.surface,
            borderRadius: 10,
            padding: 16,
            borderWidth: 1,
            borderColor: palette.line,
            marginBottom: 16,
          }}
        >
          <Text
            style={{
              fontFamily: UIFontFamily,
              fontSize: 12,
              fontWeight: '600',
              color: palette.muted,
              textTransform: 'uppercase',
              letterSpacing: 0.4,
              marginBottom: 12,
            }}
          >
            Burdens you've carried
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {data.topBurdens.map((b, i) => (
              <View
                key={i}
                style={{
                  backgroundColor: isDark
                    ? 'rgba(194, 168, 125, 0.15)'
                    : 'rgba(155, 115, 67, 0.1)',
                  borderRadius: 16,
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                }}
              >
                <Text
                  style={{
                    fontFamily: UIFontFamily,
                    fontSize: 13,
                    color: palette.clay,
                  }}
                >
                  {b}
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}

      <Divider palette={palette} />

      {/* Grace note */}
      <View style={{ alignItems: 'center', marginTop: 8 }}>
        <Text
          style={{
            fontFamily: ScriptureFontFamily,
            fontSize: 16,
            color: palette.scripture,
            textAlign: 'center',
            lineHeight: 24,
            marginBottom: 8,
            fontStyle: 'italic',
          }}
        >
          "He who began a good work in you will carry it on to completion."
        </Text>
        <Text
          style={{
            fontFamily: UIFontFamily,
            fontSize: 13,
            color: palette.muted,
            textAlign: 'center',
            marginBottom: 24,
          }}
        >
          Philippians 1:6
        </Text>
      </View>

      {/* Share button */}
      <TouchableOpacity
        onPress={handleShare}
        accessibilityLabel="Share as image"
        accessibilityRole="button"
        style={{
          backgroundColor: palette.surface,
          borderRadius: 10,
          paddingVertical: 14,
          alignItems: 'center',
          borderWidth: 1,
          borderColor: palette.line,
          marginBottom: 24,
        }}
      >
        <Text
          style={{
            fontFamily: UIFontFamily,
            fontSize: 16,
            fontWeight: '600',
            color: palette.clay,
          }}
        >
          Share as image
        </Text>
      </TouchableOpacity>

      {/* Close */}
      <TouchableOpacity
        onPress={() => router.back()}
        accessibilityLabel="Close year in review"
        accessibilityRole="button"
        style={{ alignItems: 'center' }}
      >
        <Text
          style={{
            fontFamily: UIFontFamily,
            fontSize: 15,
            color: palette.inkDim,
            textDecorationLine: 'underline',
          }}
        >
          Close
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
