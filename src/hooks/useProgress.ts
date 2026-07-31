import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface ProgressDashboard {
  /** Current devotional streak (consecutive days) */
  currentStreak: number;
  /** Longest devotional streak ever */
  longestStreak: number;
  /** Verses with interval > 21 days (SM-2 mastered) */
  versesMastered: number;
  /** Prayer interactions this month */
  prayerInteractionsThisMonth: number;
  /** Unique days with devotional completions this month */
  daysInScriptureThisMonth: number;
  /** Service acts logged (deal_debriefs with non-null who_i_served) */
  serviceActsLogged: number;
  /** Devotional completion days for the last 30 days (filled/empty) */
  last30Days: boolean[];
  /** Today's date string for reference */
  today: string;
  /** Prayer requests posted */
  prayerRequestsPosted: number;
  /** Prayer requests marked answered */
  prayerRequestsAnswered: number;
  /** Total words written across reflections, debriefs, prayer requests */
  totalWords: number;
  /** Average words per reflection */
  avgWordsPerReflection: number;
  /** Days with devotional read (percentage, 0-100) */
  scriptureCompletionPct: number;
  /** Current reading plan info */
  readingPlan: {
    name: string;
    day: number;
    total: number;
    percentage: number;
  } | null;
  /** Service entries */
  serviceEntries: number;
  /** Gratitude entries */
  gratitudeEntries: number;
  /** Year in review eligibility */
  yearInReviewAvailable: boolean;
  /** Days since first activity */
  daysSinceFirstActivity: number;
}

interface DashboardInput {
  userId: string;
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

function countWords(text: string | null | undefined): number {
  if (!text) return 0;
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function calculateStreak(dates: string[]): { current: number; longest: number } {
  if (dates.length === 0) return { current: 0, longest: 0 };

  const uniqueDates = [...new Set(dates.map((d) => d.slice(0, 10)))].sort().reverse();
  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

  // Current streak: count consecutive days backward from today or yesterday
  let current = 0;
  const startDate = uniqueDates[0] === today || uniqueDates[0] === yesterday ? uniqueDates[0] : null;

  if (startDate) {
    let checkDate = new Date(startDate);
    const dateSet = new Set(uniqueDates);
    while (dateSet.has(checkDate.toISOString().slice(0, 10))) {
      current++;
      checkDate.setDate(checkDate.getDate() - 1);
    }
  }

  // Longest streak
  let longest = 0;
  let running = 0;
  const sortedDates = [...uniqueDates].sort();

  for (let i = 0; i < sortedDates.length; i++) {
    if (i === 0) {
      running = 1;
    } else {
      const prev = new Date(sortedDates[i - 1]);
      const curr = new Date(sortedDates[i]);
      const diffDays = (curr.getTime() - prev.getTime()) / 86400000;
      if (Math.round(diffDays) === 1) {
        running++;
      } else {
        running = 1;
      }
    }
    if (running > longest) longest = running;
  }

  return { current, longest };
}

// ─── Main query function ──────────────────────────────────────────────────────

async function fetchDashboard({ userId }: DashboardInput): Promise<ProgressDashboard> {
  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().slice(0, 10);
  const thirtyDaysAgo = new Date(today.getTime() - 30 * 86400000).toISOString().slice(0, 10);

  // Run all queries in parallel
  const [
    completionsResult,
    memoryVersesResult,
    prayerInteractionsResult,
    prayerRequestsResult,
    dealDebriefsResult,
    readingPlanResult,
    serviceLogResult,
  ] = await Promise.all([
    // Devotional completions
    supabase
      .from('devotional_completions')
      .select('completed_at, reflection_response, challenge_accepted')
      .eq('user_id', userId)
      .order('completed_at', { ascending: false }),

    // Memory verses mastered (interval > 21)
    supabase
      .from('memory_verses')
      .select('id, interval_days')
      .eq('user_id', userId),

    // Prayer interactions this month
    supabase
      .from('prayer_interactions')
      .select('id, created_at')
      .eq('user_id', userId)
      .gte('created_at', monthStart),

    // Prayer requests
    supabase
      .from('prayer_requests')
      .select('id, body, is_answered, created_at')
      .eq('user_id', userId),

    // Deal debriefs (for service acts, gratitude, words)
    supabase
      .from('deal_debriefs')
      .select('who_i_served, gratitude, went_well, went_wrong, where_i_saw_god, where_i_fell_short, tomorrow_intention')
      .eq('user_id', userId),

    // Reading plan progress
    supabase
      .from('reading_plan_progress')
      .select('current_day, days_completed, reading_plans:plan_id ( title, day_count )')
      .eq('user_id', userId)
      .is('completed_at', null)
      .limit(1),

    // Service log
    supabase
      .from('service_log')
      .select('id')
      .eq('user_id', userId),
  ]);

  const completions = (completionsResult.data ?? []) as { completed_at: string; reflection_response: string | null; challenge_accepted: boolean }[];
  const memoryVerses = (memoryVersesResult.data ?? []) as { id: string; interval_days: number }[];
  const prayerInteractions = (prayerInteractionsResult.data ?? []) as { id: string; created_at: string }[];
  const prayerRequests = (prayerRequestsResult.data ?? []) as { id: string; body: string; is_answered: boolean; created_at: string }[];
  const dealDebriefs = (dealDebriefsResult.data ?? []) as {
    who_i_served: string | null;
    gratitude: string | null;
    went_well: string | null;
    went_wrong: string | null;
    where_i_saw_god: string | null;
    where_i_fell_short: string | null;
    tomorrow_intention: string | null;
  }[];
  const readingPlanProgress = (readingPlanResult.data ?? []) as {
    current_day: number;
    days_completed: number[];
    reading_plans: { title: string; day_count: number } | null;
  }[];
  const serviceLog = (serviceLogResult.data ?? []) as { id: string }[];

  // ─── Compute streak ─────────────────────────────────────────────────
  const completionDates = completions.map((c) => c.completed_at);
  const { current: currentStreak, longest: longestStreak } = calculateStreak(completionDates);

  // ─── Verses mastered ────────────────────────────────────────────────
  const versesMastered = memoryVerses.filter((v) => v.interval_days > 21).length;

  // ─── Prayer interactions this month ─────────────────────────────────
  const prayerInteractionsThisMonth = prayerInteractions.length;

  // ─── Days in Scripture this month ───────────────────────────────────
  const uniqueDaysInMonth = new Set(
    completions
      .filter((c) => c.completed_at >= monthStart)
      .map((c) => c.completed_at.slice(0, 10)),
  );
  const daysInScriptureThisMonth = uniqueDaysInMonth.size;

  // ─── Service acts ───────────────────────────────────────────────────
  const serviceActsLogged = dealDebriefs.filter((d) => d.who_i_served != null).length;

  // ─── Last 30 days dot grid ──────────────────────────────────────────
  const completedDateSet = new Set(completions.map((c) => c.completed_at.slice(0, 10)));
  const last30Days: boolean[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(today.getTime() - i * 86400000).toISOString().slice(0, 10);
    last30Days.push(completedDateSet.has(d));
  }

  // ─── Prayer requests ────────────────────────────────────────────────
  const prayerRequestsPosted = prayerRequests.length;
  const prayerRequestsAnswered = prayerRequests.filter((r) => r.is_answered).length;

  // ─── Words ──────────────────────────────────────────────────────────
  let totalWords = 0;
  let reflectionWordCount = 0;
  let reflectionCount = 0;

  for (const c of completions) {
    const w = countWords(c.reflection_response);
    totalWords += w;
    if (c.reflection_response) {
      reflectionWordCount += w;
      reflectionCount++;
    }
  }

  for (const d of dealDebriefs) {
    totalWords += countWords(d.went_well);
    totalWords += countWords(d.went_wrong);
    totalWords += countWords(d.where_i_saw_god);
    totalWords += countWords(d.where_i_fell_short);
    totalWords += countWords(d.tomorrow_intention);
    totalWords += countWords(d.gratitude);
  }

  for (const r of prayerRequests) {
    totalWords += countWords(r.body);
  }

  const avgWordsPerReflection = reflectionCount > 0 ? Math.round(reflectionWordCount / reflectionCount) : 0;

  // ─── Scripture completion percentage ───────────────────────────────
  // Days since first activity (or account creation), capped at min 30
  const allDates = completions.map((c) => c.completed_at.slice(0, 10)).sort();
  let daysSinceFirstActivity = 30;
  let firstActivityDate: string | null = null;
  if (allDates.length > 0) {
    firstActivityDate = allDates[0];
    const firstDate = new Date(firstActivityDate);
    const diffDays = Math.ceil((today.getTime() - firstDate.getTime()) / 86400000) + 1;
    daysSinceFirstActivity = Math.max(diffDays, 1);
  }

  const completionDaysThisPeriod = new Set(
    completions
      .filter((c) => c.completed_at >= thirtyDaysAgo)
      .map((c) => c.completed_at.slice(0, 10)),
  ).size;
  const scriptureCompletionPct = daysSinceFirstActivity > 0
    ? Math.round((completionDaysThisPeriod / Math.min(daysSinceFirstActivity, 30)) * 100)
    : 0;

  // ─── Reading plan ──────────────────────────────────────────────────
  let readingPlan: ProgressDashboard['readingPlan'] = null;
  if (readingPlanProgress.length > 0) {
    const rp = readingPlanProgress[0];
    const plan = rp.reading_plans;
    if (plan && plan.day_count > 0) {
      readingPlan = {
        name: plan.title,
        day: rp.current_day,
        total: plan.day_count,
        percentage: Math.round((rp.current_day / plan.day_count) * 100),
      };
    }
  }

  // ─── Service & Gratitude ───────────────────────────────────────────
  const serviceEntries = dealDebriefs.filter((d) => d.who_i_served != null && d.who_i_served.trim() !== '').length;
  const gratitudeEntries = dealDebriefs.filter((d) => d.gratitude != null && d.gratitude.trim() !== '').length;

  // ─── Year in Review eligibility ────────────────────────────────────
  const yearInReviewAvailable = daysSinceFirstActivity >= 90;

  return {
    currentStreak,
    longestStreak,
    versesMastered,
    prayerInteractionsThisMonth,
    daysInScriptureThisMonth,
    serviceActsLogged,
    last30Days,
    today: todayStr,
    prayerRequestsPosted,
    prayerRequestsAnswered,
    totalWords,
    avgWordsPerReflection,
    scriptureCompletionPct,
    readingPlan,
    serviceEntries,
    gratitudeEntries,
    yearInReviewAvailable,
    daysSinceFirstActivity,
  };
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useProgressDashboard() {
  const { user } = useAuth();

  const queryResult = useQuery<ProgressDashboard>({
    queryKey: ['progressDashboard', user?.id],
    queryFn: () => {
      if (!user) {
        return {
          currentStreak: 0,
          longestStreak: 0,
          versesMastered: 0,
          prayerInteractionsThisMonth: 0,
          daysInScriptureThisMonth: 0,
          serviceActsLogged: 0,
          last30Days: [],
          today: new Date().toISOString().slice(0, 10),
          prayerRequestsPosted: 0,
          prayerRequestsAnswered: 0,
          totalWords: 0,
          avgWordsPerReflection: 0,
          scriptureCompletionPct: 0,
          readingPlan: null,
          serviceEntries: 0,
          gratitudeEntries: 0,
          yearInReviewAvailable: false,
          daysSinceFirstActivity: 0,
        };
      }
      return fetchDashboard({ userId: user.id });
    },
    enabled: !!user,
    staleTime: 60000, // 1 minute
    retry: 2,
  });

  return queryResult;
}

// ─── Year in Review ───────────────────────────────────────────────────────────

export interface YearInReviewData {
  topVerse: string | null;
  topBurdens: string[];
  prayerCount: number;
  answeredCount: number;
  mostActiveMonth: string | null;
  longestStreak: number;
  totalWords: number;
  versesMastered: number;
  serviceActs: number;
}

export function useYearInReview() {
  const { user } = useAuth();

  return useQuery<YearInReviewData>({
    queryKey: ['yearInReview', user?.id],
    queryFn: async () => {
      if (!user) {
        return {
          topVerse: null,
          topBurdens: [],
          prayerCount: 0,
          answeredCount: 0,
          mostActiveMonth: null,
          longestStreak: 0,
          totalWords: 0,
          versesMastered: 0,
          serviceActs: 0,
        };
      }

      const yearAgo = new Date(Date.now() - 365 * 86400000).toISOString().slice(0, 10);

      const [
        completionsResult,
        profileResult,
        prayerRequestsResult,
        dealDebriefsResult,
        memoryVersesResult,
      ] = await Promise.all([
        supabase
          .from('devotional_completions')
          .select('completed_at, reflection_response')
          .eq('user_id', user.id),

        supabase
          .from('profiles')
          .select('burdens')
          .eq('id', user.id)
          .single(),

        supabase
          .from('prayer_requests')
          .select('id, is_answered, body, created_at')
          .eq('user_id', user.id),

        supabase
          .from('deal_debriefs')
          .select('who_i_served, went_well, went_wrong')
          .eq('user_id', user.id),

        supabase
          .from('memory_verses')
          .select('id, interval_days, reference')
          .eq('user_id', user.id),
      ]);

      const completions = (completionsResult.data ?? []) as {
        completed_at: string;
        reflection_response: string | null;
      }[];
      const burdens = ((profileResult.data as Record<string, unknown> | null)?.burdens ?? []) as string[];
      const prayerRequests = (prayerRequestsResult.data ?? []) as {
        id: string;
        is_answered: boolean;
        body: string;
        created_at: string;
      }[];
      const dealDebriefs = (dealDebriefsResult.data ?? []) as {
        who_i_served: string | null;
        went_well: string | null;
        went_wrong: string | null;
      }[];
      const memoryVerses = (memoryVersesResult.data ?? []) as {
        id: string;
        interval_days: number;
        reference: string;
      }[];

      // Most active month
      const monthCounts: Record<string, number> = {};
      for (const c of completions) {
        const month = c.completed_at.slice(0, 7); // YYYY-MM
        monthCounts[month] = (monthCounts[month] || 0) + 1;
      }
      let mostActiveMonth: string | null = null;
      let maxCount = 0;
      for (const [month, count] of Object.entries(monthCounts)) {
        if (count > maxCount) {
          maxCount = count;
          mostActiveMonth = month;
        }
      }

      // Top verse (most referenced — use the most recent completions' scripture)
      const topVerse = memoryVerses.length > 0
        ? memoryVerses.sort((a, b) => b.interval_days - a.interval_days)[0].reference
        : null;

      // Streak
      const { longest: longestStreak } = calculateStreak(
        completions.map((c) => c.completed_at),
      );

      // Total words
      let totalWords = 0;
      for (const c of completions) {
        totalWords += countWords(c.reflection_response);
      }
      for (const r of prayerRequests) {
        totalWords += countWords(r.body);
      }
      for (const d of dealDebriefs) {
        totalWords += countWords(d.went_well);
        totalWords += countWords(d.went_wrong);
      }

      // Service acts
      const serviceActs = dealDebriefs.filter(
        (d) => d.who_i_served != null && d.who_i_served.trim() !== '',
      ).length;

      // Verses mastered
      const versesMastered = memoryVerses.filter((v) => v.interval_days > 21).length;

      return {
        topVerse,
        topBurdens: burdens,
        prayerCount: prayerRequests.length,
        answeredCount: prayerRequests.filter((r) => r.is_answered).length,
        mostActiveMonth,
        longestStreak,
        totalWords,
        versesMastered,
        serviceActs,
      };
    },
    enabled: !!user,
    staleTime: 300000, // 5 minutes
    retry: 2,
  });
}
