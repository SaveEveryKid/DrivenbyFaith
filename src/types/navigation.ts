export type RootStackParamList = {
  '(tabs)': undefined;
  settings: undefined;
  'devotional/[id]': { id: string };
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
