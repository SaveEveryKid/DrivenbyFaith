// =============================================================================
// Sync engine — flushes queued offline completions to Supabase when online.
// =============================================================================

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';
import {
  getPendingCompletions,
  markCompletionSynced,
  clearOldSynced,
  updateLastSyncAt,
  type QueuedCompletion,
} from './offlineDb';

// ─── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Appends new reflection text to existing, using a paragraph separator.
 * This preserves history rather than silently overwriting.
 */
function mergeReflectionResponse(
  existing: string | null,
  incoming: string | null,
): string | null {
  if (!incoming) return existing;
  if (!existing || existing.trim() === '') return incoming;

  // Avoid appending if the incoming text is already contained
  if (existing.includes(incoming)) return existing;

  return `${existing}\n\n---\n\n${incoming}`;
}

// ─── Sync pending completions ──────────────────────────────────────────────────

async function syncPendingCompletions(
  supabase: SupabaseClient<Database>,
): Promise<number> {
  const pending = await getPendingCompletions();

  if (pending.length === 0) return 0;

  let syncedCount = 0;

  for (const item of pending) {
    try {
      // After migration 006, completions are keyed by (user_id, completed_date).
      // Look up by today's date from the queued item.
      // The queued item stores devotional_id for reference, but the unique
      // constraint is on (user_id, completed_date).
      const today = item.client_updated_at.slice(0, 10);

      // Fetch the existing row from Supabase (if any)
      const { data: existing, error: fetchError } = await supabase
        .from('devotional_completions')
        .select('id, reflection_response, challenge_accepted, challenge_completed, prayer_duration_seconds, client_updated_at')
        .eq('user_id', item.user_id)
        .eq('completed_date', today)
        .maybeSingle();

      if (fetchError) {
        console.warn('[syncEngine] Failed to fetch existing completion:', fetchError.message);
        continue;
      }

      // Determine which timestamp takes precedence — use client_updated_at for
      // conflict resolution. If the queued item is older than what's already
      // on the server, skip it.
      if (
        existing?.client_updated_at &&
        item.client_updated_at <= existing.client_updated_at
      ) {
        // Server has newer data — mark as synced and skip
        await markCompletionSynced(item.id);
        syncedCount++;
        continue;
      }

      // Build the upsert payload
      const reflectionResponse = existing
        ? mergeReflectionResponse(existing.reflection_response, item.reflection_response)
        : item.reflection_response;

      const challengeAccepted = existing
        ? (existing.challenge_accepted || item.challenge_accepted === 1)
        : item.challenge_accepted === 1;

      const challengeCompleted = existing
        ? (existing.challenge_completed || item.challenge_completed === 1)
        : item.challenge_completed === 1;

      const prayerDuration = item.prayer_duration_seconds ?? existing?.prayer_duration_seconds ?? null;

      const payload: Record<string, unknown> = {
        user_id: item.user_id,
        devotional_id: item.devotional_id,
        completed_date: today,
        reflection_response: reflectionResponse,
        challenge_accepted: challengeAccepted,
        challenge_completed: challengeCompleted,
        prayer_duration_seconds: prayerDuration,
        client_updated_at: item.client_updated_at,
      };

      if (!existing) {
        // First time — set completed_at
        payload.completed_at = new Date().toISOString();
      }

      const { error: upsertError } = await supabase
        .from('devotional_completions')
        .upsert(
          existing
            ? { ...payload, id: existing.id }
            : payload,
          { onConflict: 'user_id,completed_date' },
        );

      if (upsertError) {
        // 23505 = unique violation. If the onConflict hint isn't supported
        // by the Supabase client, fall back to an explicit update
        if (existing) {
          const { error: updateError } = await supabase
            .from('devotional_completions')
            .update(payload)
            .eq('id', existing.id);

          if (updateError) {
            console.warn('[syncEngine] Failed to update completion:', updateError.message);
            continue;
          }
        } else {
          console.warn('[syncEngine] Failed to upsert completion:', upsertError.message);
          continue;
        }
      }

      await markCompletionSynced(item.id);
      syncedCount++;
    } catch (err) {
      console.warn('[syncEngine] Unexpected error syncing completion:', err);
    }
  }

  // Clean up old synced records
  await clearOldSynced();

  return syncedCount;
}

// ─── Factory ───────────────────────────────────────────────────────────────────

export interface SyncEngine {
  /** Flush all pending offline completions to Supabase. Returns count synced. */
  syncPendingCompletions: () => Promise<number>;
  /** Run a full sync cycle: flush completions and update the last-sync timestamp. */
  fullSync: () => Promise<number>;
}

export function createSyncEngine(supabase: SupabaseClient<Database>): SyncEngine {
  const fullSync = async (): Promise<number> => {
    const count = await syncPendingCompletions(supabase);
    await updateLastSyncAt(new Date().toISOString());
    return count;
  };

  return {
    syncPendingCompletions: () => syncPendingCompletions(supabase),
    fullSync,
  };
}
