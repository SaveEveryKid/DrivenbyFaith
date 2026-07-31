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

export default function TermsOfServiceScreen(): React.ReactElement {
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
        Terms of Service
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

      <Section title="Welcome" palette={palette}>
        Driven by Faith is a discipleship tool for automotive sales professionals. It exists to help you connect your daily work on the dealership floor with your walk with Christ. These terms are simple: be honest, be kind, and use the app for its intended purpose.
      </Section>

      <Section title="Who can use the app" palette={palette}>
        You must be at least 16 years old. There is no test of faith required — you don't need to be a Christian to use it. The content assumes a Christian worldview and is designed for those exploring or practicing Christian faith in the context of their work.
      </Section>

      <Section title="Free and Premium" palette={palette}>
        The core devotional, prayer community, situation library, deal debrief tool, and progress dashboard are free. Premium features — including the AI biblical coach, Saturday Ready, reading plans beyond the starter plan, and advanced memory verse tools — require a paid subscription. You can cancel anytime. No refunds for partial months, but you keep access through the end of your billing period.
      </Section>

      <Section title="Your content" palette={palette}>
        You own everything you write: your reflections, prayer requests, deal debriefs, and Coach conversations. By posting in a shared prayer group or community discussion, you grant other members of that group the right to see your content within the app. You may remove your own posts anytime.
      </Section>

      <Section title="Community conduct" palette={palette}>
        Prayer groups and community discussions are spaces for honesty and encouragement. Harassment, spam, or content that exploits others will result in removal from the group and, in serious cases, account suspension. If you see something that shouldn't be here, report it — every piece of content has a report option.
      </Section>

      <Section title="AI Coach" palette={palette}>
        The AI Coach offers biblical wisdom and pastoral counsel, but it is not a substitute for a pastor, counselor, or professional therapist. It draws from Scripture and sound theology, but it is a tool — not a person. Use it to point you back to your Bible, your church, and trusted mentors.
      </Section>

      <Section title="The app is provided as-is" palette={palette}>
        We build Driven by Faith with care and prayer. But like any software, it may have bugs or interruptions. We do not guarantee uninterrupted service. We are not liable for any loss related to your use of the app. If something critical breaks, we will work hard to fix it.
      </Section>

      <Section title="Changes to these terms" palette={palette}>
        If we update these terms, we will notify you in the app with a clear message. Continued use after a change means you accept the new terms. If a change is significant, we'll ask you to review and agree before continuing.
      </Section>

      <Section title="Account termination" palette={palette}>
        You may delete your account anytime from Settings — your data will be permanently removed. We reserve the right to suspend accounts that violate these terms or engage in harmful behavior. Our goal is not punishment but protecting the community this app serves.
      </Section>

      <Section title="Contact" palette={palette}>
        Questions about these terms? Reach us at support@drivenbyfaith.app. This is a small project built by people who care deeply about both the automotive industry and the kingdom of God. We want to hear from you.
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
        "Whatever you do, work at it with all your heart, as working for the Lord, not for human masters."
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
        Colossians 3:23
      </Text>
    </ScrollView>
  );
}
