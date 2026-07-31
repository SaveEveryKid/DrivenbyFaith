import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { UIFontFamily, ScriptureFontFamily } from '@/constants/theme';

// ─── Section block ────────────────────────────────────────────────────────────

function Section({
  title,
  children,
  palette,
}: {
  title: string;
  children: React.ReactNode;
  palette: ReturnType<typeof useTheme>['palette'];
}): React.ReactElement {
  return (
    <View style={{ marginBottom: 20 }}>
      <Text
        style={{
          fontFamily: UIFontFamily,
          fontSize: 16,
          fontWeight: '600',
          color: palette.ink,
          marginBottom: 8,
        }}
      >
        {title}
      </Text>
      <Text
        style={{
          fontFamily: UIFontFamily,
          fontSize: 15,
          color: palette.ink,
          lineHeight: 22,
        }}
      >
        {children}
      </Text>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function PrivacyPolicyScreen(): React.ReactElement {
  const { palette } = useTheme();

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: palette.bg }}
      contentContainerStyle={{ padding: 24, paddingBottom: 48 }}
    >
      <Text
        style={{
          fontFamily: ScriptureFontFamily,
          fontSize: 22,
          color: palette.scripture,
          textAlign: 'center',
          marginBottom: 6,
          lineHeight: 30,
        }}
      >
        Privacy Policy
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
        Last updated: July 2026
      </Text>

      <Section title="What we collect" palette={palette}>
        We collect only what helps your discipleship. That includes your name and dealership (if you choose to share them), your devotional completions and reflections, prayer requests you post, memory verse progress, deal debrief entries, and app preferences like notification times and text size. We do not collect your location, contacts, browsing history, or anything unrelated to your walk with Christ and your life in the dealership.
      </Section>

      <Section title="How we use your data" palette={palette}>
        Your data is used to serve you — to show you today's devotional, track your memory verses, connect you with your prayer group, and help you see the rhythm of your daily walk. We use prayer reminder times to send the notifications you asked for. We use your burdens and faith context to help the AI Coach offer pastoral wisdom that fits where you are.
      </Section>

      <Section title="What we never do" palette={palette}>
        Nothing is sold. We do not share, rent, or trade your data with any third party. We do not serve targeted ads. We do not build profiles to sell to dealerships or marketing platforms. Your data stays between you and God — and the small team that keeps the app running.
      </Section>

      <Section title="Anonymous prayer" palette={palette}>
        When you post a prayer request as anonymous, it is truly anonymous. Your group members see the request but not your name. The database stores the flag but not your identity in the prayer context. Even we cannot trace an anonymous prayer back to you at the database level — the anonymity is enforced by our application logic.
      </Section>

      <Section title="Your control" palette={palette}>
        You can delete your account and all your data with one tap from Settings. You can export all your data anytime in portable JSON format. You can update or remove any prayer request you posted. You can change your burdens, your profile, your notification preferences at any time.
      </Section>

      <Section title="Data retention" palette={palette}>
        We keep your data as long as your account is active. When you delete your account, all your personal data is permanently removed within 30 days. Some anonymized, aggregate metrics (like daily active user counts) may persist for the health of the service.
      </Section>

      <Section title="Security" palette={palette}>
        Your data is stored in a secure, encrypted database with row-level security — meaning each row of your data can only be read by you. Authentication tokens are stored in your device's secure keychain or keystore. You can enable biometric lock (Face ID or fingerprint) for an extra layer of protection when you open the app.
      </Section>

      <Section title="Contact" palette={palette}>
        If you have questions about your data or this policy, reach out to us at privacy@drivenbyfaith.app. We are a small team building this for brothers and sisters on the dealership floor — we take your trust seriously.
      </Section>

      <Text
        style={{
          fontFamily: ScriptureFontFamily,
          fontSize: 16,
          color: palette.scripture,
          textAlign: 'center',
          marginTop: 24,
          fontStyle: 'italic',
          lineHeight: 24,
        }}
      >
        "The Lord will watch over your coming and going both now and forevermore."
      </Text>
      <Text
        style={{
          fontFamily: UIFontFamily,
          fontSize: 12,
          color: palette.muted,
          textAlign: 'center',
          marginTop: 4,
        }}
      >
        Psalm 121:8
      </Text>
    </ScrollView>
  );
}
