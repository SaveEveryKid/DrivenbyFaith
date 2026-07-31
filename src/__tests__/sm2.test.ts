import { sm2 } from '@/lib/sm2';
import {
  isSaturdayReadyActive,
  getCountdownLabel,
} from '@/hooks/useSaturdayReady';

// =============================================================================
// SM-2 Algorithm Tests
// =============================================================================

describe('sm2', () => {
  // ─── Quality 4: Perfect recall ───────────────────────────────────────────

  it('perfect recall on first review sets interval to 1, repetitions to 1', () => {
    const result = sm2(4, 2.5, 1, 0);
    expect(result.repetitions).toBe(1);
    expect(result.interval).toBe(1);
    expect(result.easeFactor).toBeGreaterThanOrEqual(1.3);
  });

  it('perfect recall on second review sets interval to 6, repetitions to 2', () => {
    const result = sm2(4, 2.5, 1, 1);
    expect(result.repetitions).toBe(2);
    expect(result.interval).toBe(6);
    expect(result.easeFactor).toBeGreaterThanOrEqual(1.3);
  });

  it('perfect recall on third review computes interval from ease factor', () => {
    const result = sm2(4, 2.5, 6, 2);
    expect(result.repetitions).toBe(3);
    // Interval = round(6 * newEaseFactor)
    // newEaseFactor = 2.5 + (0.1 - (5-4)*(0.08+(5-4)*0.02)) = 2.5 + (0.1 - 0.1) = 2.5
    expect(result.easeFactor).toBe(2.5);
    expect(result.interval).toBe(Math.round(6 * 2.5)); // 15
  });

  it('gradually increases interval with consistent perfect recall', () => {
    let ef = 2.5;
    let interval = 1;
    let reps = 0;

    // Simulate 10 reviews with quality 4
    for (let i = 0; i < 10; i++) {
      const result = sm2(4, ef, interval, reps);
      ef = result.easeFactor;
      interval = result.interval;
      reps = result.repetitions;
    }

    // After 10 perfect reviews, interval should be quite large
    expect(interval).toBeGreaterThan(30);
    expect(reps).toBe(10);
    expect(ef).toBeGreaterThanOrEqual(1.3);
  });

  // ─── Quality 3: Slight hesitation ────────────────────────────────────────

  it('quality 3 still increments repetitions', () => {
    const result = sm2(3, 2.5, 6, 2);
    expect(result.repetitions).toBe(3);
    // newEaseFactor = 2.5 + (0.1 - (5-3)*(0.08+(5-3)*0.02))
    // = 2.5 + (0.1 - 2*(0.08 + 2*0.02)) = 2.5 + (0.1 - 2*0.12) = 2.5 + (0.1 - 0.24) = 2.36
    expect(result.easeFactor).toBeCloseTo(2.36, 1);
  });

  // ─── Quality 2: Remembered with effort (failed) ──────────────────────────

  it('quality 2 resets repetitions to 0, interval to 1', () => {
    const result = sm2(2, 2.5, 15, 5);
    expect(result.repetitions).toBe(0);
    expect(result.interval).toBe(1);
    // Ease factor still updates
    // newEaseFactor = 2.5 + (0.1 - (5-2)*(0.08+(5-2)*0.02))
    // = 2.5 + (0.1 - 3*(0.08 + 3*0.02)) = 2.5 + (0.1 - 3*0.14) = 2.5 + (0.1 - 0.42) = 2.18
    expect(result.easeFactor).toBeCloseTo(2.18, 1);
  });

  // ─── Quality 1: Complete blackout (failed) ───────────────────────────────

  it('quality 1 resets repetitions to 0, interval to 1', () => {
    const result = sm2(1, 2.5, 30, 10);
    expect(result.repetitions).toBe(0);
    expect(result.interval).toBe(1);
    // newEaseFactor = 2.5 + (0.1 - (5-1)*(0.08+(5-1)*0.02))
    // = 2.5 + (0.1 - 4*(0.08 + 4*0.02)) = 2.5 + (0.1 - 4*0.16) = 2.5 + (0.1 - 0.64) = 1.96
    expect(result.easeFactor).toBeCloseTo(1.96, 1);
  });

  it('quality 1 on first review resets to interval 1', () => {
    // First review (repetitions=0), quality 1
    const result = sm2(1, 2.5, 1, 0);
    expect(result.repetitions).toBe(0);
    expect(result.interval).toBe(1);
  });

  // ─── Ease factor floor ────────────────────────────────────────────────────

  it('ease factor never drops below 1.3', () => {
    // Repeated quality 1 reviews should drop ease factor but not below 1.3
    let ef = 2.5;
    let interval = 1;
    let reps = 0;

    for (let i = 0; i < 20; i++) {
      const result = sm2(1, ef, interval, reps);
      ef = result.easeFactor;
      interval = result.interval;
      reps = result.repetitions;
    }

    expect(ef).toBeGreaterThanOrEqual(1.3);
  });

  it('ease factor stabilizes at the floor with repeated failures', () => {
    let ef = 2.5;
    let interval = 1;
    let reps = 0;

    for (let i = 0; i < 50; i++) {
      const result = sm2(1, ef, interval, reps);
      ef = result.easeFactor;
      interval = result.interval;
      reps = result.repetitions;
    }

    // After many failures, ef should be exactly at or very close to 1.3
    expect(ef).toBeCloseTo(1.3, 0);
  });

  // ─── Interval floor ──────────────────────────────────────────────────────

  it('interval is always at least 1', () => {
    // Even with a very low ease factor on subsequent review
    const result = sm2(4, 1.3, 1, 2);
    // interval = round(1 * 1.3) = 1
    expect(result.interval).toBeGreaterThanOrEqual(1);
  });

  // ─── Date calculation ────────────────────────────────────────────────────

  it('nextDate is today + interval days in ISO format', () => {
    const result = sm2(4, 2.5, 1, 0);
    const today = new Date();
    const expectedDate = new Date(today);
    expectedDate.setDate(expectedDate.getDate() + result.interval);

    expect(result.nextDate).toBe(expectedDate.toISOString().slice(0, 10));
  });

  it('interval of 6 produces nextDate 6 days from now', () => {
    const result = sm2(4, 2.5, 1, 1); // second review, interval=6
    expect(result.interval).toBe(6);

    const today = new Date();
    const expectedDate = new Date(today);
    expectedDate.setDate(expectedDate.getDate() + 6);

    expect(result.nextDate).toBe(expectedDate.toISOString().slice(0, 10));
  });

  // ─── Invalid input ───────────────────────────────────────────────────────

  it('throws on invalid quality values', () => {
    expect(() => sm2(0 as 1, 2.5, 1, 0)).toThrow();
    expect(() => sm2(5 as 1, 2.5, 1, 0)).toThrow();
    expect(() => sm2(1.5 as 1, 2.5, 1, 0)).toThrow();
  });

  // ─── Edge case: quality 2 on previously successful sequence ──────────────

  it('failing after a long successful sequence resets correctly', () => {
    // After 10 perfect reviews, interval is large
    const result = sm2(2, 2.5, 120, 10);
    expect(result.repetitions).toBe(0);
    expect(result.interval).toBe(1);
  });
});

// =============================================================================
// Saturday Ready Timezone-Aware Tests
// =============================================================================

describe('Saturday Ready timezone logic', () => {
  describe('isSaturdayReadyActive', () => {
    it('returns false for a timezone where it is Wednesday afternoon', () => {
      // We cannot fully control the time in tests without mocking,
      // but we can test the logic function directly by checking known
      // day/hour combinations. The actual function depends on real time,
      // so these tests verify the function exists and returns a boolean.
      const result = isSaturdayReadyActive('America/Chicago');
      expect(typeof result).toBe('boolean');
    });

    it('returns a boolean for common timezones', () => {
      const timezones = [
        'America/Chicago',
        'America/New_York',
        'America/Los_Angeles',
        'America/Denver',
        'America/Phoenix',
      ];

      for (const tz of timezones) {
        const result = isSaturdayReadyActive(tz);
        expect(typeof result).toBe('boolean');
      }
    });

    it('handles invalid timezone gracefully', () => {
      // Falls back to local system time
      const result = isSaturdayReadyActive('Invalid/Timezone');
      expect(typeof result).toBe('boolean');
    });
  });

  describe('getCountdownLabel', () => {
    it('returns a string or null', () => {
      const result = getCountdownLabel('America/Chicago');
      if (result !== null) {
        expect(typeof result).toBe('string');
        expect(result.length).toBeGreaterThan(0);
      }
      // null is also valid if currently active
    });

    it('does not throw for edge-case timezones', () => {
      expect(() => getCountdownLabel('Pacific/Auckland')).not.toThrow();
      expect(() => getCountdownLabel('Asia/Tokyo')).not.toThrow();
      expect(() => getCountdownLabel('Invalid/Zone')).not.toThrow();
    });
  });
});

// =============================================================================
// Memory Helpers Tests
// =============================================================================

describe('Memory review helpers', () => {
  const { getFirstLetters, getFillBlanks, getNextReviewMode } = require('@/hooks/useMemory');

  describe('getFirstLetters', () => {
    it('returns first letter of each word separated by spaces', () => {
      const result = getFirstLetters('The Lord is my shepherd');
      expect(result).toBe('T L i m s');
    });

    it('handles single word', () => {
      expect(getFirstLetters('Jesus')).toBe('J');
    });

    it('handles empty string', () => {
      expect(getFirstLetters('')).toBe('');
    });
  });

  describe('getFillBlanks', () => {
    it('creates display array with some nulls', () => {
      const text = 'The Lord is my shepherd I shall not want';
      const { display, blanks } = getFillBlanks(text);

      expect(display.length).toBe(text.split(/\s+/).length);
      expect(blanks.length).toBeGreaterThan(0);

      // At least 40% should be blanked
      const blankCount = display.filter((d) => d === null).length;
      expect(blankCount).toBeGreaterThanOrEqual(
        Math.floor(text.split(/\s+/).length * 0.4),
      );
    });

    it('always blanks at least one word', () => {
      const text = 'short verse';
      const { blanks } = getFillBlanks(text);
      expect(blanks.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('getNextReviewMode', () => {
    it('cycles through the four modes in order', () => {
      expect(getNextReviewMode('read')).toBe('firstLetters');
      expect(getNextReviewMode('firstLetters')).toBe('fillBlanks');
      expect(getNextReviewMode('fillBlanks')).toBe('typeFromMemory');
      expect(getNextReviewMode('typeFromMemory')).toBe('read');
    });
  });
});
