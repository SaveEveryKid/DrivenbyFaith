// =============================================================================
// SM-2 Spaced Repetition Algorithm
// =============================================================================

export type RecallQuality = 1 | 2 | 3 | 4;

export interface SM2Result {
  easeFactor: number;
  interval: number;
  repetitions: number;
  nextDate: string; // ISO date string
}

/**
 * Compute the next review using the SM-2 algorithm.
 *
 * Quality ratings:
 *   1 — complete blackout, could not recall at all
 *   2 — remembered with significant effort
 *   3 — recalled with slight hesitation
 *   4 — perfect recall, no hesitation
 */
export function sm2(
  quality: RecallQuality,
  prevEaseFactor: number,
  prevInterval: number,
  prevRepetitions: number,
): SM2Result {
  // Validate quality
  if (quality < 1 || quality > 4 || !Number.isInteger(quality)) {
    throw new Error(`Invalid quality: ${quality}. Must be 1, 2, 3, or 4.`);
  }

  let newRepetitions: number;
  let newInterval: number;
  let newEaseFactor: number;

  // Ease factor update (SM-2 formula)
  const q = quality;
  newEaseFactor =
    prevEaseFactor + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02));

  // Enforce minimum ease factor of 1.3
  if (newEaseFactor < 1.3) {
    newEaseFactor = 1.3;
  }

  if (quality < 3) {
    // Failed recall — reset
    newRepetitions = 0;
    newInterval = 1;
  } else {
    // Successful recall
    newRepetitions = prevRepetitions + 1;

    if (newRepetitions === 1) {
      // First successful review
      newInterval = 1;
    } else if (newRepetitions === 2) {
      // Second successful review
      newInterval = 6;
    } else {
      // Subsequent reviews
      newInterval = Math.round(prevInterval * newEaseFactor);
    }
  }

  // Always at least 1 day
  if (newInterval < 1) {
    newInterval = 1;
  }

  const nextDate = new Date();
  nextDate.setDate(nextDate.getDate() + newInterval);
  const nextDateStr = nextDate.toISOString().slice(0, 10);

  return {
    easeFactor: Math.round(newEaseFactor * 100) / 100, // Round to 2 decimals
    interval: newInterval,
    repetitions: newRepetitions,
    nextDate: nextDateStr,
  };
}
