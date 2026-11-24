export type AuthStackParamList = {
  Login: undefined;
  Signup: undefined;
  PrivacyPolicy: undefined;
};

export type MainTabParamList = {
  Dashboard: undefined;
  Wallet: undefined;
  Goals: undefined;
  Premium: undefined;
  Profile: undefined;
};

export type RootStackParamList = {
  Main: undefined;
  AddMoney: undefined;
  GoalDetail: { goalId: string };
  Insurance: undefined;
  PrivacyPolicy: undefined;
};
