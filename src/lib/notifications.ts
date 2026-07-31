// =============================================================================
// Notification service — Expo Push Notifications setup and token management
// =============================================================================

import { Platform } from 'react-native';
import { supabase } from './supabase';

// Lazy-loaded module type — avoids hard dependency for type checking
interface NotificationsModuleType {
  getPermissionsAsync(): Promise<{ status: string }>;
  requestPermissionsAsync(): Promise<{ status: string }>;
  getExpoPushTokenAsync(options?: { projectId?: string }): Promise<{ data: string; type: string }>;
}

let NotificationsModule: NotificationsModuleType | null = null;

async function getNotificationsModule(): Promise<NotificationsModuleType | null> {
  if (NotificationsModule) return NotificationsModule;
  try {
    NotificationsModule = await import('expo-notifications');
    return NotificationsModule;
  } catch {
    console.warn('[Notifications] expo-notifications not available');
    return null;
  }
}

// ─── Types ───────────────────────────────────────────────────────────────────

export interface NotificationPreferences {
  devotional_reminder_enabled: boolean;
  devotional_reminder_time: string; // HH:MM in UTC
  saturday_ready_reminder_enabled: boolean;
  prayer_reminder_enabled: boolean;
  memory_reminder_enabled: boolean;
  memory_reminder_time: string; // HH:MM in UTC
}

export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  devotional_reminder_enabled: true,
  devotional_reminder_time: '12:00', // 7am America/Chicago = ~12:00 UTC
  saturday_ready_reminder_enabled: true,
  prayer_reminder_enabled: true,
  memory_reminder_enabled: true,
  memory_reminder_time: '14:00', // 9am America/Chicago = ~14:00 UTC
};

// ─── Register for push notifications ─────────────────────────────────────────

export async function registerForPushNotifications(): Promise<string | null> {
  const Notifications = await getNotificationsModule();
  if (!Notifications) return null;

  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      return null;
    }

    const projectId = process.env.EXPO_PUBLIC_PROJECT_ID;
    const tokenData = await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId } : undefined,
    );

    return tokenData.data;
  } catch (err) {
    console.warn('[Notifications] Failed to register:', err);
    return null;
  }
}

// ─── Save push token to Supabase ─────────────────────────────────────────────

export async function savePushToken(
  userId: string,
  token: string,
): Promise<void> {
  try {
    const platform = Platform.OS as 'ios' | 'android';

    // Upsert: if a row with this token exists, update it; otherwise insert
    const { error } = await supabase.from('notification_tokens').upsert(
      {
        user_id: userId,
        expo_push_token: token,
        platform,
        active: true,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: 'expo_push_token',
      },
    );

    if (error) {
      console.warn('[Notifications] Failed to save push token:', error.message);
    }
  } catch (err) {
    console.warn('[Notifications] Failed to save push token:', err);
  }
}

// ─── Save notification preferences to profiles ───────────────────────────────

export async function saveNotificationPreferences(
  userId: string,
  preferences: NotificationPreferences,
): Promise<void> {
  try {
    const { error } = await supabase
      .from('profiles')
      .update({
        devotional_reminder_enabled: preferences.devotional_reminder_enabled,
        devotional_reminder_time: preferences.devotional_reminder_time,
        saturday_ready_reminder_enabled:
          preferences.saturday_ready_reminder_enabled,
        prayer_reminder_enabled: preferences.prayer_reminder_enabled,
        memory_reminder_enabled: preferences.memory_reminder_enabled,
        memory_reminder_time: preferences.memory_reminder_time,
      } as Record<string, unknown>)
      .eq('id', userId);

    if (error) {
      console.warn(
        '[Notifications] Failed to save preferences:',
        error.message,
      );
    }
  } catch (err) {
    console.warn('[Notifications] Failed to save preferences:', err);
  }
}

// ─── Check if notifications are available ────────────────────────────────────

export async function areNotificationsAvailable(): Promise<boolean> {
  const Notifications = await getNotificationsModule();
  if (!Notifications) return false;

  try {
    const { status } = await Notifications.getPermissionsAsync();
    return status === 'granted';
  } catch {
    return false;
  }
}
