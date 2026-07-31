export type RootStackParamList = {
  '(tabs)': undefined;
  settings: undefined;
  'settings/notifications': undefined;
  'settings/security': undefined;
  paywall: undefined;
  line: undefined;
  '28th': undefined;
  'devotional/[id]': { id: string };
  'debrief/new': undefined;
  'debrief/index': undefined;
  'debrief/[id]': { id: string };
  'situation/index': undefined;
  'situation/[slug]': { slug: string };
  'saturday-ready/[id]': { id: string };
  'plans/index': undefined;
  'plans/[slug]': { slug: string };
  'plans/day/[id]': { id: string };
  'memory/index': undefined;
  'memory/review/[id]': { id: string };
  'prayer/groups': undefined;
  'prayer/groups/new': undefined;
  'prayer/groups/join': undefined;
  'prayer/groups/[id]': { id: string };
  'prayer/requests/new': { groupId?: string };
  'discussions/index': undefined;
  'discussions/[category]': { category: string };
  'discussions/[category]/new': { category: string };
  'discussions/thread/[id]': { id: string };
};

export type AuthStackParamList = {
  login: undefined;
  signup: undefined;
  onboarding: undefined;
};

export type TabParamList = {
  today: undefined;
  library: undefined;
  coach: { context?: string; id?: string } | undefined;
  prayer: undefined;
  progress: undefined;
};
