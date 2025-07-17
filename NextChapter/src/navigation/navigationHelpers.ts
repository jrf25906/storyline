import { NavigationProp, useNavigation } from '@react-navigation/native';
import { RootStackParamList } from '../types/navigation';

/**
 * Type-safe navigation hook
 * Use this hook to get typed navigation throughout the app
 */
export function useAppNavigation() {
  return useNavigation<NavigationProp<RootStackParamList>>();
}

/**
 * Navigation helper functions
 */
export const navigationHelpers = {
  /**
   * Navigate to the job application add screen
   */
  navigateToAddJobApplication: (navigation: NavigationProp<RootStackParamList>, returnTo?: string) => {
    navigation.navigate('AddJobApplication', { returnTo });
  },

  /**
   * Navigate to the job application edit screen
   */
  navigateToEditJobApplication: (
    navigation: NavigationProp<RootStackParamList>, 
    applicationId: string, 
    returnTo?: string
  ) => {
    navigation.navigate('EditJobApplication', { applicationId, returnTo });
  },

  /**
   * Navigate to the resume scanner
   */
  navigateToResumeScanner: (navigation: NavigationProp<RootStackParamList>) => {
    navigation.navigate('ResumeScanner');
  },

  /**
   * Navigate to budget details
   */
  navigateToBudgetDetails: (navigation: NavigationProp<RootStackParamList>) => {
    navigation.navigate('BudgetDetails');
  },

  /**
   * Navigate to coach settings
   */
  navigateToCoachSettings: (navigation: NavigationProp<RootStackParamList>) => {
    navigation.navigate('CoachSettings');
  },

  /**
   * Reset to main tabs (useful after onboarding)
   */
  resetToMain: (navigation: NavigationProp<RootStackParamList>) => {
    navigation.reset({
      index: 0,
      routes: [{ name: 'Main' }],
    });
  },

  /**
   * Reset to auth (useful after logout)
   */
  resetToAuth: (navigation: NavigationProp<RootStackParamList>) => {
    navigation.reset({
      index: 0,
      routes: [{ name: 'Auth' }],
    });
  },
};

/**
 * Screen focus effect helper
 * Use this to perform actions when a screen comes into focus
 */
export function useScreenFocus(callback: () => void, deps: React.DependencyList = []) {
  const navigation = useNavigation();

  React.useEffect(() => {
    const unsubscribe = navigation.addListener('focus', callback);
    return unsubscribe;
  }, deps);
}