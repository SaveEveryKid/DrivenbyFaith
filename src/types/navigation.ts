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
