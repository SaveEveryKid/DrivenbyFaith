export type RootStackParamList = {
  '(tabs)': undefined;
  settings: undefined;
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
};

export type AuthStackParamList = {
  login: undefined;
  signup: undefined;
  onboarding: undefined;
};

export type TabParamList = {
  today: undefined;
  library: undefined;
  coach: undefined;
  prayer: undefined;
  progress: undefined;
};
