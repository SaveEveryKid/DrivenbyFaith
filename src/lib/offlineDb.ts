// =============================================================================
// Offline SQLite database layer using expo-sqlite
// =============================================================================

import * as SQLite from 'expo-sqlite';
import type { DevotionalRow } from '@/types/database';

// ─── Local types ───────────────────────────────────────────────────────────────

export interface QueuedCompletion {
  id: string;
  user_id: string;
  devotional_id: string;
  reflection_response: string | null;
  challenge_accepted: number; // 0 or 1 as SQLite INT
  challenge_completed: number; // 0 or 1 as SQLite INT
  prayer_duration_seconds: number | null;
  client_updated_at: string;
  synced: number; // 0 or 1 as SQLite INT
  created_at: string;
}

export interface CompletionToQueue {
  id: string;
  user_id: string;
  devotional_id: string;
  reflection_response: string | null;
  challenge_accepted: boolean;
  challenge_completed: boolean;
  prayer_duration_seconds: number | null;
  client_updated_at: string;
}

// ─── Database singleton ────────────────────────────────────────────────────────

let db: SQLite.SQLiteDatabase | null = null;

async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (!db) {
    db = await SQLite.openDatabaseAsync('driven_by_faith.db');
  }
  return db;
}

// ─── Initialization ────────────────────────────────────────────────────────────

const LAST_SYNC_KEY = 'last_sync_at';

export async function initOfflineDb(): Promise<void> {
  const database = await getDatabase();

  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS devotionals_cache (
      id TEXT PRIMARY KEY,
      publish_date TEXT NOT NULL,
      title TEXT NOT NULL,
      scripture_reference TEXT NOT NULL,
      scripture_text TEXT NOT NULL,
      translation TEXT NOT NULL,
      workplace_application TEXT NOT NULL,
      reflection_prompt TEXT NOT NULL,
      prayer TEXT NOT NULL,
      challenge TEXT NOT NULL,
      audio_url TEXT,
      is_premium INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS devotional_completions_queue (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      devotional_id TEXT NOT NULL,
      reflection_response TEXT,
      challenge_accepted INTEGER NOT NULL DEFAULT 0,
      challenge_completed INTEGER NOT NULL DEFAULT 0,
      prayer_duration_seconds INTEGER,
      client_updated_at TEXT NOT NULL,
      synced INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sync_metadata (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);
}

// ─── Devotionals cache ─────────────────────────────────────────────────────────

function rowToDevotional(row: Record<string, unknown>): DevotionalRow {
  return {
    id: row.id as string,
    publish_date: row.publish_date as string,
    title: row.title as string,
    scripture_reference: row.scripture_reference as string,
    scripture_text: row.scripture_text as string,
    translation: row.translation as string,
    workplace_application: row.workplace_application as string,
    reflection_prompt: row.reflection_prompt as string,
    prayer: row.prayer as string,
    challenge: row.challenge as string,
    audio_url: (row.audio_url as string) ?? null,
    is_premium: (row.is_premium as number) === 1,
    created_at: row.created_at as string,
  };
}

export async function cacheDevotionals(devotionals: DevotionalRow[]): Promise<void> {
  const database = await getDatabase();

  for (const d of devotionals) {
    await database.runAsync(
      `INSERT INTO devotionals_cache
        (id, publish_date, title, scripture_reference, scripture_text,
         translation, workplace_application, reflection_prompt, prayer,
         challenge, audio_url, is_premium, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         publish_date = excluded.publish_date,
         title = excluded.title,
         scripture_reference = excluded.scripture_reference,
         scripture_text = excluded.scripture_text,
         translation = excluded.translation,
         workplace_application = excluded.workplace_application,
         reflection_prompt = excluded.reflection_prompt,
         prayer = excluded.prayer,
         challenge = excluded.challenge,
         audio_url = excluded.audio_url,
         is_premium = excluded.is_premium,
         created_at = excluded.created_at`,
      [
        d.id,
        d.publish_date,
        d.title,
        d.scripture_reference,
        d.scripture_text,
        d.translation,
        d.workplace_application,
        d.reflection_prompt,
        d.prayer,
        d.challenge,
        d.audio_url,
        d.is_premium ? 1 : 0,
        d.created_at,
      ],
    );
  }
}

export async function getCachedDevotionals(): Promise<DevotionalRow[]> {
  const database = await getDatabase();
  const rows = await database.getAllAsync<Record<string, unknown>>(
    'SELECT * FROM devotionals_cache ORDER BY publish_date ASC',
  );
  return rows.map(rowToDevotional);
}

export async function getCachedDevotionalByDate(date: string): Promise<DevotionalRow | null> {
  const database = await getDatabase();
  const row = await database.getFirstAsync<Record<string, unknown>>(
    'SELECT * FROM devotionals_cache WHERE publish_date = ?',
    [date],
  );
  return row ? rowToDevotional(row) : null;
}

export async function getCachedDevotionalById(id: string): Promise<DevotionalRow | null> {
  const database = await getDatabase();
  const row = await database.getFirstAsync<Record<string, unknown>>(
    'SELECT * FROM devotionals_cache WHERE id = ?',
    [id],
  );
  return row ? rowToDevotional(row) : null;
}

// ─── Completion queue ──────────────────────────────────────────────────────────

export async function queueCompletion(completion: CompletionToQueue): Promise<void> {
  const database = await getDatabase();

  await database.runAsync(
    `INSERT INTO devotional_completions_queue
      (id, user_id, devotional_id, reflection_response, challenge_accepted,
       challenge_completed, prayer_duration_seconds, client_updated_at, synced, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?)
     ON CONFLICT(id) DO UPDATE SET
       reflection_response = excluded.reflection_response,
       challenge_accepted = excluded.challenge_accepted,
       challenge_completed = excluded.challenge_completed,
       prayer_duration_seconds = excluded.prayer_duration_seconds,
       client_updated_at = excluded.client_updated_at,
       synced = 0`,
    [
      completion.id,
      completion.user_id,
      completion.devotional_id,
      completion.reflection_response,
      completion.challenge_accepted ? 1 : 0,
      completion.challenge_completed ? 1 : 0,
      completion.prayer_duration_seconds,
      completion.client_updated_at,
      new Date().toISOString(),
    ],
  );
}

function rowToQueuedCompletion(row: Record<string, unknown>): QueuedCompletion {
  return {
    id: row.id as string,
    user_id: row.user_id as string,
    devotional_id: row.devotional_id as string,
    reflection_response: (row.reflection_response as string) ?? null,
    challenge_accepted: row.challenge_accepted as number,
    challenge_completed: row.challenge_completed as number,
    prayer_duration_seconds: (row.prayer_duration_seconds as number) ?? null,
    client_updated_at: row.client_updated_at as string,
    synced: row.synced as number,
    created_at: row.created_at as string,
  };
}

export async function getPendingCompletions(): Promise<QueuedCompletion[]> {
  const database = await getDatabase();
  const rows = await database.getAllAsync<Record<string, unknown>>(
    'SELECT * FROM devotional_completions_queue WHERE synced = 0 ORDER BY client_updated_at ASC',
  );
  return rows.map(rowToQueuedCompletion);
}

export async function markCompletionSynced(id: string): Promise<void> {
  const database = await getDatabase();
  await database.runAsync(
    'UPDATE devotional_completions_queue SET synced = 1 WHERE id = ?',
    [id],
  );
}

export async function clearOldSynced(): Promise<void> {
  const database = await getDatabase();
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  await database.runAsync(
    'DELETE FROM devotional_completions_queue WHERE synced = 1 AND created_at < ?',
    [sevenDaysAgo],
  );
}

// ─── Sync metadata ─────────────────────────────────────────────────────────────

export async function getLastSyncAt(): Promise<string | null> {
  const database = await getDatabase();
  const row = await database.getFirstAsync<Record<string, unknown>>(
    'SELECT value FROM sync_metadata WHERE key = ?',
    [LAST_SYNC_KEY],
  );
  return row ? (row.value as string) : null;
}

export async function updateLastSyncAt(timestamp: string): Promise<void> {
  const database = await getDatabase();
  await database.runAsync(
    `INSERT INTO sync_metadata (key, value) VALUES (?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
    [LAST_SYNC_KEY, timestamp],
  );
}
