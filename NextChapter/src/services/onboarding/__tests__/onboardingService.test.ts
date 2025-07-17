import { OnboardingService } from '../onboardingService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { encryptData, decryptData } from '../../../utils/encryption';
import { supabase } from '../../api/supabase';

// Mock dependencies
jest.mock('@react-native-async-storage/async-storage');
jest.mock('../../../utils/encryption');
jest.mock('../../api/supabase');

describe('OnboardingService', () => {
  const mockUserId = 'test-user-123';
  const mockOnboardingData = {
    // Layoff details
    company: 'Tech Corp',
    role: 'Software Engineer',
    layoffDate: '2025-01-01',
    severanceWeeks: '12',
    // Personal info
    firstName: 'John',
    lastName: 'Doe',
    phone: '555-123-4567',
    location: 'San Francisco, CA',
    // Goals
    goals: ['job-search', 'financial', 'wellness'],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (encryptData as jest.Mock).mockImplementation((data) => 
      Promise.resolve(`encrypted_${JSON.stringify(data)}`)
    );
    (decryptData as jest.Mock).mockImplementation((data) => 
      Promise.resolve(JSON.parse(data.replace('encrypted_', '')))
    );
  });

  describe('saveProgress', () => {
    it('should encrypt and save onboarding progress locally', async () => {
      const service = new OnboardingService();
      await service.saveProgress(mockUserId, 'layoff-details', {
        company: 'Tech Corp',
        role: 'Software Engineer',
        layoffDate: '2025-01-01',
        severanceWeeks: '12',
      });

      expect(encryptData).toHaveBeenCalledWith({
        currentStep: 'layoff-details',
        data: {
          company: 'Tech Corp',
          role: 'Software Engineer',
          layoffDate: '2025-01-01',
          severanceWeeks: '12',
        },
        timestamp: expect.any(Number),
      });

      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        '@next_chapter/onboarding_progress_test-user-123',
        expect.stringContaining('encrypted_')
      );
    });

    it('should handle encryption errors gracefully', async () => {
      (encryptData as jest.Mock).mockRejectedValueOnce(new Error('Encryption failed'));
      
      const service = new OnboardingService();
      await expect(service.saveProgress(mockUserId, 'layoff-details', {}))
        .rejects.toThrow('Failed to save onboarding progress');
    });
  });

  describe('loadProgress', () => {
    it('should decrypt and load onboarding progress', async () => {
      const encryptedData = 'encrypted_{"currentStep":"personal-info","data":{"firstName":"John"},"timestamp":123456}';
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(encryptedData);

      const service = new OnboardingService();
      const progress = await service.loadProgress(mockUserId);

      expect(AsyncStorage.getItem).toHaveBeenCalledWith(
        '@next_chapter/onboarding_progress_test-user-123'
      );
      expect(decryptData).toHaveBeenCalledWith(encryptedData);
      expect(progress).toEqual({
        currentStep: 'personal-info',
        data: { firstName: 'John' },
        timestamp: 123456,
      });
    });

    it('should return null if no progress exists', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(null);

      const service = new OnboardingService();
      const progress = await service.loadProgress(mockUserId);

      expect(progress).toBeNull();
    });
  });

  describe('completeOnboarding', () => {
    it('should save complete onboarding data to Supabase', async () => {
      const mockUpdate = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: null }),
      });
      const mockUpsert = jest.fn().mockResolvedValue({ error: null });
      
      (supabase.from as jest.Mock).mockImplementation((table: string) => {
        if (table === 'profiles') {
          return { update: mockUpdate };
        }
        return { 
          upsert: mockUpsert,
          update: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({ error: null }),
          }),
        };
      });

      const service = new OnboardingService();
      await service.completeOnboarding(mockUserId, mockOnboardingData);

      // Check profile update
      expect(supabase.from).toHaveBeenCalledWith('profiles');
      expect(mockUpdate).toHaveBeenCalledWith({
        first_name: 'John',
        last_name: 'Doe',
        phone: '555-123-4567',
        location: 'San Francisco, CA',
        updated_at: expect.any(String),
      });

      // Check layoff details
      expect(supabase.from).toHaveBeenCalledWith('layoff_details');
      expect(mockUpsert).toHaveBeenCalledWith({
        user_id: mockUserId,
        company: 'Tech Corp',
        role: 'Software Engineer',
        layoff_date: '2025-01-01',
        severance_weeks: 12,
        severance_end_date: expect.any(String),
      }, { onConflict: 'user_id' });

      // Check goals
      expect(supabase.from).toHaveBeenCalledWith('user_goals');
      expect(mockUpsert).toHaveBeenCalledWith([
        { user_id: mockUserId, goal_type: 'job-search', is_active: true },
        { user_id: mockUserId, goal_type: 'financial', is_active: true },
        { user_id: mockUserId, goal_type: 'wellness', is_active: true },
      ], { onConflict: 'user_id,goal_type' });
    });

    it('should clear local progress after successful completion', async () => {
      // Mock all the required database operations
      const mockUpdate = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: null }),
      });
      const mockUpsert = jest.fn().mockResolvedValue({ error: null });
      
      (supabase.from as jest.Mock).mockImplementation((table: string) => {
        if (table === 'profiles') {
          return { update: mockUpdate };
        }
        return { 
          upsert: mockUpsert,
          update: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({ error: null }),
          }),
        };
      });

      const service = new OnboardingService();
      await service.completeOnboarding(mockUserId, mockOnboardingData);

      expect(AsyncStorage.removeItem).toHaveBeenCalledWith(
        '@next_chapter/onboarding_progress_test-user-123'
      );
    });

    it('should calculate severance end date', async () => {
      const mockUpdate = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: null }),
      });
      const mockUpsert = jest.fn().mockResolvedValue({ error: null });
      
      (supabase.from as jest.Mock).mockImplementation((table: string) => {
        if (table === 'profiles') {
          return { update: mockUpdate };
        }
        return { 
          upsert: mockUpsert,
          update: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({ error: null }),
          }),
        };
      });
      
      const service = new OnboardingService();
      await service.completeOnboarding(mockUserId, mockOnboardingData);

      // Check that severance end date was calculated
      const layoffDetailsCalls = mockUpsert.mock.calls.find(
        call => call[0].user_id === mockUserId && call[0].company
      );
      expect(layoffDetailsCalls[0].severance_end_date).toBeDefined();
      
      // Verify it's 12 weeks after layoff date
      const expectedEndDate = new Date('2025-01-01');
      expectedEndDate.setDate(expectedEndDate.getDate() + (12 * 7));
      expect(layoffDetailsCalls[0].severance_end_date).toBe(
        expectedEndDate.toISOString().split('T')[0]
      );
    });

    it('should handle Supabase errors', async () => {
      (supabase.from as jest.Mock).mockImplementation((table: string) => {
        if (table === 'profiles') {
          return { 
            update: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({ 
                error: { message: 'Database error' } 
              }),
            }),
          };
        }
        return { 
          upsert: jest.fn().mockResolvedValue({ error: null }),
          update: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({ error: null }),
          }),
        };
      });

      const service = new OnboardingService();
      await expect(service.completeOnboarding(mockUserId, mockOnboardingData))
        .rejects.toThrow('Failed to save profile: Database error');
    });
  });

  describe('validateStep', () => {
    it('should validate layoff details step', () => {
      const service = new OnboardingService();
      
      expect(service.validateStep('layoff-details', {
        company: 'Tech Corp',
        role: 'Engineer',
        layoffDate: '2025-01-01',
      })).toBe(true);

      expect(service.validateStep('layoff-details', {
        company: '',
        role: 'Engineer',
      })).toBe(false);
    });

    it('should validate personal info step', () => {
      const service = new OnboardingService();
      
      expect(service.validateStep('personal-info', {
        firstName: 'John',
        lastName: 'Doe',
      })).toBe(true);

      expect(service.validateStep('personal-info', {
        firstName: '',
      })).toBe(false);
    });

    it('should validate goals step', () => {
      const service = new OnboardingService();
      
      expect(service.validateStep('goals', {
        goals: ['job-search'],
      })).toBe(true);

      expect(service.validateStep('goals', {
        goals: [],
      })).toBe(false);
    });
  });

  describe('getNextStep', () => {
    it('should return the correct next step', () => {
      const service = new OnboardingService();
      
      expect(service.getNextStep('welcome')).toBe('layoff-details');
      expect(service.getNextStep('layoff-details')).toBe('personal-info');
      expect(service.getNextStep('personal-info')).toBe('goals');
      expect(service.getNextStep('goals')).toBeNull();
    });
  });

  describe('getPreviousStep', () => {
    it('should return the correct previous step', () => {
      const service = new OnboardingService();
      
      expect(service.getPreviousStep('welcome')).toBeNull();
      expect(service.getPreviousStep('layoff-details')).toBe('welcome');
      expect(service.getPreviousStep('personal-info')).toBe('layoff-details');
      expect(service.getPreviousStep('goals')).toBe('personal-info');
    });
  });

  describe('clearProgress', () => {
    it('should clear saved onboarding progress', async () => {
      const service = new OnboardingService();
      await service.clearProgress(mockUserId);

      expect(AsyncStorage.removeItem).toHaveBeenCalledWith(
        '@next_chapter/onboarding_progress_test-user-123'
      );
    });
  });
});