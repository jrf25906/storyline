import { NavigationProp } from '@react-navigation/native';
import {
  RootStackParamList,
  AuthStackParamList,
  MainTabParamList,
  BouncePlanStackParamList,
  CoachStackParamList,
  TrackerStackParamList,
  BudgetStackParamList,
  ProfileStackParamList,
} from '@types';

// Type tests to ensure navigation types are properly configured
describe('Navigation Types', () => {
  it('should have all required root stack screens', () => {
    // This is a compile-time check - if types are wrong, TypeScript will error
    const validRootScreens: (keyof RootStackParamList)[] = [
      'Auth',
      'Main',
      'AddJobApplication',
      'EditJobApplication',
      'ResumeScanner',
      'BudgetDetails',
      'CoachSettings',
    ];

    expect(validRootScreens).toHaveLength(7);
  });

  it('should have all required auth stack screens', () => {
    const validAuthScreens: (keyof AuthStackParamList)[] = [
      'Welcome',
      'LayoffDetails',
      'PersonalInfo',
      'Goals',
      'Login',
      'Signup',
      'ForgotPassword',
    ];

    expect(validAuthScreens).toHaveLength(7);
  });

  it('should have all required main tab screens', () => {
    const validTabScreens: (keyof MainTabParamList)[] = [
      'Home',
      'BouncePlan',
      'Coach',
      'Tracker',
      'Budget',
      'Profile',
    ];

    expect(validTabScreens).toHaveLength(6);
  });

  it('should have proper params for screens that need them', () => {
    // Test that TypeScript properly types screen params
    type EditJobParams = RootStackParamList['EditJobApplication'];
    const validParams: EditJobParams = {
      applicationId: 'test-id',
      returnTo: 'Tracker',
    };

    expect(validParams.applicationId).toBe('test-id');
    expect(validParams.returnTo).toBe('Tracker');
  });

  it('should have proper params for onboarding flow', () => {
    type PersonalInfoParams = AuthStackParamList['PersonalInfo'];
    const validParams: PersonalInfoParams = {
      layoffDate: '2024-01-01',
      industry: 'Technology',
    };

    expect(validParams.layoffDate).toBe('2024-01-01');
    expect(validParams.industry).toBe('Technology');
  });

  it('should properly type navigation prop', () => {
    // This is a compile-time check
    type NavProp = NavigationProp<RootStackParamList>;
    
    // If this compiles, our navigation prop types are correct
    const mockNavigate = (nav: NavProp) => {
      nav.navigate('Main');
      nav.navigate('EditJobApplication', { applicationId: '123' });
    };

    expect(typeof mockNavigate).toBe('function');
  });
});