// =============================================================================
// Notifications settings screen
// =============================================================================

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Switch,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/hooks/useAuth';
import { UIFontFamily } from '@/constants/theme';
import {
  registerForPushNotifications,
  savePushToken,
  saveNotificationPreferences,
  areNotificationsAvailable,
  type NotificationPreferences,
  DEFAULT_NOTIFICATION_PREFERENCES,
} from '@/lib/notifications';

interface TimePickerProps {
  value: string; // HH:MM in UTC
  onChange: (time: string) => void;
  disabled?: boolean;
  label?: string;
}

function TimePickerRow({
  value,
  onChange,
  disabled,
}: TimePickerProps): React.ReactElement {
  const { palette } = useTheme();

  // Format UTC time string to local display string
  const formatLocalDisplay = (utcTime: string): string => {
    const [h, m] = utcTime.split(':').map(Number);
    // Convert UTC to local for display
    const now = new Date();
    const localDate = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      h,
      m,
    );
    const hours = localDate.getHours();
    const minutes = localDate.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${ampm}`;
  };

  // Preset times in UTC that map to nice local times
  const PRESETS_UTC = [
    { label: '6:00 AM', utc: '11:00' },
    { label: '7:00 AM', utc: '12:00' },
    { label: '8:00 AM', utc: '13:00' },
    { label: '9:00 AM', utc: '14:00' },
    { label: '12:00 PM', utc: '17:00' },
    { label: '6:00 PM', utc: '23:00' },
    { label: '8:00 PM', utc: '01:00' },
    { label: '9:00 PM', utc: '02:00' },
  ];

  const cycleTime = (): void => {
    if (disabled) return;
    // Find the current preset index
    const currentIdx = PRESETS_UTC.findIndex((p) => p.utc === value);
    const nextIdx = currentIdx < 0 ? 0 : (currentIdx + 1) % PRESETS_UTC.length;
    onChange(PRESETS_UTC[nextIdx].utc);
  };

  return (
    <TouchableOpacity
      onPress={cycleTime}
      disabled={disabled}
      accessibilityLabel={`Reminder time: ${formatLocalDisplay(value)}`}
      style={{
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 8,
        backgroundColor: disabled ? palette.bg : palette.bg,
        borderWidth: 1,
        borderColor: palette.line,
        opacity: disabled ? 0.4 : 1,
      }}
    >
      <Text
        style={{
          fontFamily: UIFontFamily,
          fontSize: 14,
          color: disabled ? palette.inkDim : palette.ink,
        }}
      >
        {formatLocalDisplay(value)}
      </Text>
    </TouchableOpacity>
  );
}

export default function NotificationSettingsScreen(): React.ReactElement {
  const { palette } = useTheme();
  const { user, profile } = useAuth();
  const router = useRouter();

  const [preferences, setPreferences] = useState<NotificationPreferences>(
    DEFAULT_NOTIFICATION_PREFERENCES,
  );
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // ── Load notification permission status ───────────────────────────────────

  useEffect(() => {
    const check = async (): Promise<void> => {
      const available = await areNotificationsAvailable();
      setHasPermission(available);
    };
    void check();
  }, []);

  // ── Load preferences from profile ─────────────────────────────────────────

  useEffect(() => {
    if (profile) {
      const prefs = profile.notification_preferences as
        | Record<string, unknown>
        | undefined;
      setPreferences({
        devotional_reminder_enabled:
          (prefs?.devotional_reminder_enabled as boolean) ??
          DEFAULT_NOTIFICATION_PREFERENCES.devotional_reminder_enabled,
        devotional_reminder_time:
          (prefs?.devotional_reminder_time as string) ??
          DEFAULT_NOTIFICATION_PREFERENCES.devotional_reminder_time,
        saturday_ready_reminder_enabled:
          (prefs?.saturday_ready_reminder_enabled as boolean) ??
          DEFAULT_NOTIFICATION_PREFERENCES.saturday_ready_reminder_enabled,
        prayer_reminder_enabled:
          (prefs?.prayer_reminder_enabled as boolean) ??
          DEFAULT_NOTIFICATION_PREFERENCES.prayer_reminder_enabled,
        memory_reminder_enabled:
          (prefs?.memory_reminder_enabled as boolean) ??
          DEFAULT_NOTIFICATION_PREFERENCES.memory_reminder_enabled,
        memory_reminder_time:
          (prefs?.memory_reminder_time as string) ??
          DEFAULT_NOTIFICATION_PREFERENCES.memory_reminder_time,
      });
    }
  }, [profile]);

  // ── Toggle helpers ────────────────────────────────────────────────────────

  const updatePreference = <K extends keyof NotificationPreferences>(
    key: K,
    value: NotificationPreferences[K],
  ): void => {
    setPreferences((prev) => {
      const next = { ...prev, [key]: value };
      if (user) {
        void saveNotificationPreferences(user.id, next);
      }
      return next;
    });
  };

  // ── Register for push on mount ────────────────────────────────────────────

  useEffect(() => {
    if (!user || hasPermission === false) return;

    const register = async (): Promise<void> => {
      const token = await registerForPushNotifications();
      if (token) {
        await savePushToken(user.id, token);
      }
    };

    void register();
  }, [user, hasPermission]);

  // ── Enable all ────────────────────────────────────────────────────────────

  const handleEnableAll = (): void => {
    if (hasPermission === false) {
      Alert.alert(
        'Notifications disabled',
        'Enable notifications in your device settings to receive reminders.',
        [
          { text: 'OK', style: 'default' },
        ],
      );
      return;
    }

    const allEnabled: NotificationPreferences = {
      devotional_reminder_enabled: true,
      devotional_reminder_time: preferences.devotional_reminder_time,
      saturday_ready_reminder_enabled: true,
      prayer_reminder_enabled: true,
      memory_reminder_enabled: true,
      memory_reminder_time: preferences.memory_reminder_time,
    };
    setPreferences(allEnabled);
    if (user) {
      void saveNotificationPreferences(user.id, allEnabled);
    }
  };

  // ── Count active reminders ─────────────────────────────────────────────────

  const activeCount = [
    preferences.devotional_reminder_enabled,
    preferences.saturday_ready_reminder_enabled,
    preferences.prayer_reminder_enabled,
    preferences.memory_reminder_enabled,
  ].filter(Boolean).length;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: palette.bg }}
      contentContainerStyle={{ padding: 24, paddingBottom: 48 }}
    >
      {/* Permission status */}
      {hasPermission === false && (
        <View
          style={{
            backgroundColor: palette.surface,
            borderRadius: 10,
            padding: 16,
            marginBottom: 24,
            borderWidth: 1,
            borderColor: palette.line,
          }}
        >
          <Text
            style={{
              fontFamily: UIFontFamily,
              fontSize: 14,
              color: palette.muted,
              lineHeight: 20,
            }}
          >
            Notifications are disabled for this app. Enable them in your device settings
            to receive reminders.
          </Text>
        </View>
      )}

      {/* Max 3 per day info */}
      <View
        style={{
          backgroundColor: palette.surface,
          borderRadius: 10,
          padding: 16,
          marginBottom: 24,
          borderWidth: 1,
          borderColor: palette.line,
        }}
      >
        <Text
          style={{
            fontFamily: UIFontFamily,
            fontSize: 14,
            color: palette.muted,
            lineHeight: 20,
          }}
        >
          We limit notifications to a maximum of 3 per day. You control
          which reminders you receive and when.
        </Text>
        <Text
          style={{
            fontFamily: UIFontFamily,
            fontSize: 13,
            color: palette.clay,
            marginTop: 8,
          }}
        >
          {activeCount} of 4 reminders active
        </Text>
      </View>

      {/* Daily Devotional */}
      <Text
        style={{
          fontFamily: UIFontFamily,
          fontSize: 14,
          fontWeight: '600',
          color: palette.muted,
          textTransform: 'uppercase',
          letterSpacing: 0.5,
          marginBottom: 12,
        }}
      >
        Reminders
      </Text>

      <View
        style={{
          backgroundColor: palette.surface,
          borderRadius: 10,
          overflow: 'hidden',
          marginBottom: 24,
        }}
      >
        {/* Devotional reminder */}
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingHorizontal: 16,
            paddingVertical: 14,
            borderBottomWidth: 1,
            borderBottomColor: palette.line,
          }}
        >
          <View style={{ flex: 1, marginRight: 12 }}>
            <Text
              style={{
                fontFamily: UIFontFamily,
                fontSize: 16,
                color: palette.ink,
              }}
            >
              Daily devotional
            </Text>
            <Text
              style={{
                fontFamily: UIFontFamily,
                fontSize: 13,
                color: palette.muted,
                marginTop: 2,
              }}
            >
              Every morning
            </Text>
          </View>
          <TimePickerRow
            value={preferences.devotional_reminder_time}
            onChange={(time) => updatePreference('devotional_reminder_time', time)}
            disabled={!preferences.devotional_reminder_enabled}
          />
          <Switch
            value={preferences.devotional_reminder_enabled}
            onValueChange={(val) =>
              updatePreference('devotional_reminder_enabled', val)
            }
            trackColor={{ false: palette.line, true: palette.sage }}
            thumbColor={
              preferences.devotional_reminder_enabled
                ? '#FFFFFF'
                : '#FFFFFF'
            }
            style={{ marginLeft: 8 }}
            accessibilityLabel="Daily devotional reminder"
          />
        </View>

        {/* Saturday Ready */}
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingHorizontal: 16,
            paddingVertical: 14,
            borderBottomWidth: 1,
            borderBottomColor: palette.line,
          }}
        >
          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontFamily: UIFontFamily,
                fontSize: 16,
                color: palette.ink,
              }}
            >
              Saturday Ready
            </Text>
            <Text
              style={{
                fontFamily: UIFontFamily,
                fontSize: 13,
                color: palette.muted,
                marginTop: 2,
              }}
            >
              Friday afternoon
            </Text>
          </View>
          <Switch
            value={preferences.saturday_ready_reminder_enabled}
            onValueChange={(val) =>
              updatePreference('saturday_ready_reminder_enabled', val)
            }
            trackColor={{ false: palette.line, true: palette.sage }}
            thumbColor={
              preferences.saturday_ready_reminder_enabled
                ? '#FFFFFF'
                : '#FFFFFF'
            }
            accessibilityLabel="Saturday Ready reminder"
          />
        </View>

        {/* Prayer requests */}
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingHorizontal: 16,
            paddingVertical: 14,
            borderBottomWidth: 1,
            borderBottomColor: palette.line,
          }}
        >
          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontFamily: UIFontFamily,
                fontSize: 16,
                color: palette.ink,
              }}
            >
              Prayer requests
            </Text>
            <Text
              style={{
                fontFamily: UIFontFamily,
                fontSize: 13,
                color: palette.muted,
                marginTop: 2,
              }}
            >
              When group members pray for you
            </Text>
          </View>
          <Switch
            value={preferences.prayer_reminder_enabled}
            onValueChange={(val) =>
              updatePreference('prayer_reminder_enabled', val)
            }
            trackColor={{ false: palette.line, true: palette.sage }}
            thumbColor={
              preferences.prayer_reminder_enabled ? '#FFFFFF' : '#FFFFFF'
            }
            accessibilityLabel="Prayer request notifications"
          />
        </View>

        {/* Memory review */}
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingHorizontal: 16,
            paddingVertical: 14,
          }}
        >
          <View style={{ flex: 1, marginRight: 12 }}>
            <Text
              style={{
                fontFamily: UIFontFamily,
                fontSize: 16,
                color: palette.ink,
              }}
            >
              Memory review
            </Text>
            <Text
              style={{
                fontFamily: UIFontFamily,
                fontSize: 13,
                color: palette.muted,
                marginTop: 2,
              }}
            >
              Daily review reminder
            </Text>
          </View>
          <TimePickerRow
            value={preferences.memory_reminder_time}
            onChange={(time) => updatePreference('memory_reminder_time', time)}
            disabled={!preferences.memory_reminder_enabled}
          />
          <Switch
            value={preferences.memory_reminder_enabled}
            onValueChange={(val) =>
              updatePreference('memory_reminder_enabled', val)
            }
            trackColor={{ false: palette.line, true: palette.sage }}
            thumbColor={
              preferences.memory_reminder_enabled ? '#FFFFFF' : '#FFFFFF'
            }
            style={{ marginLeft: 8 }}
            accessibilityLabel="Memory review reminder"
          />
        </View>
      </View>

      {/* Note about timezone */}
      <Text
        style={{
          fontFamily: UIFontFamily,
          fontSize: 13,
          color: palette.inkDim,
          textAlign: 'center',
          lineHeight: 18,
        }}
      >
        Times are shown in your local timezone. Preferences are saved to your
        account and sync across devices.
      </Text>
    </ScrollView>
  );
}
