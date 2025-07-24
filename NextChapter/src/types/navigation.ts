import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { CompositeScreenProps, NavigatorScreenParams } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

// Root Stack Navigator
export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  Main: NavigatorScreenParams<MainTabParamList>;
  // Modal screens
  AddJobApplication: { returnTo?: string };
  EditJobApplication: { applicationId: string; returnTo?: string };
  ResumeScanner: undefined;
  BudgetDetails: undefined;
  CoachSettings: undefined;
};

// Auth Stack Navigator
export type AuthStackParamList = {
  Welcome: undefined;
  LayoffDetails: undefined;
  PersonalInfo: { layoffDate: string; industry: string };
  Goals: { layoffDate: string; industry: string; name: string };
  Login: undefined;
  Signup: undefined;
  ForgotPassword: undefined;
};

// Main Tab Navigator
export type MainTabParamList = {
  Home: undefined;
  BouncePlan: NavigatorScreenParams<BouncePlanStackParamList>;
  Coach: NavigatorScreenParams<CoachStackParamList>;
  Tracker: NavigatorScreenParams<TrackerStackParamList>;
  Budget: NavigatorScreenParams<BudgetStackParamList>;
  Profile: NavigatorScreenParams<ProfileStackParamList>;
};

// Feature Stack Navigators
export type BouncePlanStackParamList = {
  BouncePlanOverview: undefined;
  DailyTask: { taskId: string; day: number };
  TaskHistory: undefined;
};

export type CoachStackParamList = {
  CoachChat: undefined;
  CoachHistory: undefined;
};

export type TrackerStackParamList = {
  JobApplications: undefined;
  ApplicationDetails: { applicationId: string };
};

export type BudgetStackParamList = {
  BudgetOverview: undefined;
  BudgetCalculator: undefined;
  ExpenseTracker: undefined;
};

export type ProfileStackParamList = {
  ProfileOverview: undefined;
  Settings: undefined;
  ThemeSettings: undefined;
  Wellness: undefined;
  About: undefined;
};

// Screen Props Types
export type RootStackScreenProps<T extends keyof RootStackParamList> = 
  NativeStackScreenProps<RootStackParamList, T>;

export type AuthStackScreenProps<T extends keyof AuthStackParamList> = CompositeScreenProps<
  NativeStackScreenProps<AuthStackParamList, T>,
  RootStackScreenProps<'Auth'>
>;

export type MainTabScreenProps<T extends keyof MainTabParamList> = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, T>,
  RootStackScreenProps<'Main'>
>;

export type BouncePlanStackScreenProps<T extends keyof BouncePlanStackParamList> = CompositeScreenProps<
  NativeStackScreenProps<BouncePlanStackParamList, T>,
  MainTabScreenProps<'BouncePlan'>
>;

export type CoachStackScreenProps<T extends keyof CoachStackParamList> = CompositeScreenProps<
  NativeStackScreenProps<CoachStackParamList, T>,
  MainTabScreenProps<'Coach'>
>;

export type TrackerStackScreenProps<T extends keyof TrackerStackParamList> = CompositeScreenProps<
  NativeStackScreenProps<TrackerStackParamList, T>,
  MainTabScreenProps<'Tracker'>
>;

export type BudgetStackScreenProps<T extends keyof BudgetStackParamList> = CompositeScreenProps<
  NativeStackScreenProps<BudgetStackParamList, T>,
  MainTabScreenProps<'Budget'>
>;

export type ProfileStackScreenProps<T extends keyof ProfileStackParamList> = CompositeScreenProps<
  NativeStackScreenProps<ProfileStackParamList, T>,
  MainTabScreenProps<'Profile'>
>;

// Navigation prop declaration for TypeScript
declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}