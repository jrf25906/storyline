import { renderHook, act } from '@testing-library/react-hooks';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useBudgetStore } from '../budgetStore';
import { BudgetData, BudgetFormData } from '../../types/budget';
import * as budgetService from '../../services/budget/budgetService';

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

jest.mock('../../services/budget/budgetService', () => ({
  saveBudgetData: jest.fn(),
  loadBudgetData: jest.fn(),
  deleteBudgetData: jest.fn(),
}));

const mockBudgetService = budgetService as jest.Mocked<typeof budgetService>;

describe('BudgetStore', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Set up default mock implementations
    mockBudgetService.saveBudgetData.mockImplementation(async (data) => ({
      ...data,
      id: data.id || '1',
      lastUpdated: new Date(),
      createdAt: data.createdAt || new Date(),
    }));
    
    mockBudgetService.loadBudgetData.mockResolvedValue(null);
    mockBudgetService.deleteBudgetData.mockResolvedValue(true);
  });

  describe('State Management', () => {
    it('should initialize with default state', () => {
      const { result } = renderHook(() => useBudgetStore());

      expect(result.current.budgetData).toBeNull();
      expect(result.current.runway).toBeNull();
      expect(result.current.alerts).toEqual([]);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('should update budget data and calculate runway', async () => {
      const { result } = renderHook(() => useBudgetStore());
      
      const formData: BudgetFormData = {
        monthlyIncome: 5000,
        currentSavings: 10000,
        monthlyExpenses: 3000,
        severanceAmount: 5000,
        state: 'CA',
        hasHealthInsurance: true,
        dependentsCount: 0,
      };

      await act(async () => {
        await result.current.updateBudget(formData);
      });

      expect(result.current.budgetData).toBeDefined();
      expect(result.current.budgetData?.currentSavings).toBe(10000);
      expect(result.current.budgetData?.monthlyExpenses).toBe(3000);
      expect(result.current.runway).toBeDefined();
      expect(result.current.runway?.totalAvailableFunds).toBeGreaterThan(15000);
    });

    it('should generate alerts for low runway', async () => {
      const { result } = renderHook(() => useBudgetStore());
      
      const formData: BudgetFormData = {
        monthlyIncome: 2000,
        currentSavings: 3000,
        monthlyExpenses: 2500,
        severanceAmount: 0,
        state: 'CA',
        hasHealthInsurance: false,
        dependentsCount: 0,
      };

      await act(async () => {
        await result.current.updateBudget(formData);
      });

      expect(result.current.alerts.length).toBeGreaterThan(0);
      expect(result.current.alerts.some(a => a.type === 'low_runway')).toBe(true);
    });
  });

  describe('Local Storage', () => {
    it('should save budget data to AsyncStorage', async () => {
      const { result } = renderHook(() => useBudgetStore());
      
      const formData: BudgetFormData = {
        monthlyIncome: 5000,
        currentSavings: 10000,
        monthlyExpenses: 3000,
        severanceAmount: 5000,
        state: 'CA',
        hasHealthInsurance: true,
        dependentsCount: 0,
      };

      await act(async () => {
        await result.current.updateBudget(formData);
      });

      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        '@next_chapter/budget_data',
        expect.any(String)
      );

      const savedData = JSON.parse(
        (AsyncStorage.setItem as jest.Mock).mock.calls[0][1]
      );
      expect(savedData.currentSavings).toBe(10000);
    });

    it('should load budget data from AsyncStorage on init', async () => {
      const mockBudgetData: BudgetData = {
        id: 'test-id',
        userId: 'user-id',
        monthlyIncome: 5000,
        currentSavings: 10000,
        monthlyExpenses: 3000,
        severanceAmount: 5000,
        unemploymentBenefit: 450,
        unemploymentWeeks: 26,
        cobraCost: 750,
        state: 'CA',
        lastUpdated: new Date(),
        createdAt: new Date(),
      };

      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(
        JSON.stringify(mockBudgetData)
      );

      const { result } = renderHook(() => useBudgetStore());

      await act(async () => {
        await result.current.loadBudgetData();
      });

      expect(result.current.budgetData).toBeDefined();
      expect(result.current.budgetData?.currentSavings).toBe(10000);
      expect(result.current.runway).toBeDefined();
    });

    it('should handle AsyncStorage errors gracefully', async () => {
      (AsyncStorage.getItem as jest.Mock).mockRejectedValueOnce(
        new Error('Storage error')
      );

      const { result } = renderHook(() => useBudgetStore());

      await act(async () => {
        await result.current.loadBudgetData();
      });

      expect(result.current.error).toBe('Failed to load budget data');
      expect(result.current.budgetData).toBeNull();
    });
  });

  describe('Alert Management', () => {
    it('should dismiss alerts', async () => {
      const { result } = renderHook(() => useBudgetStore());
      
      // Create a low runway scenario to generate alerts
      const formData: BudgetFormData = {
        monthlyIncome: 2000,
        currentSavings: 3000,
        monthlyExpenses: 2500,
        severanceAmount: 0,
        state: 'CA',
        hasHealthInsurance: false,
        dependentsCount: 0,
      };

      await act(async () => {
        await result.current.updateBudget(formData);
      });

      const alertId = result.current.alerts[0]?.id;
      expect(alertId).toBeDefined();

      act(() => {
        result.current.dismissAlert(alertId);
      });

      expect(result.current.alerts.find(a => a.id === alertId)?.dismissed).toBe(true);
    });

    it('should clear dismissed alerts', async () => {
      const { result } = renderHook(() => useBudgetStore());
      
      // Create alerts
      const formData: BudgetFormData = {
        monthlyIncome: 2000,
        currentSavings: 3000,
        monthlyExpenses: 2500,
        severanceAmount: 0,
        state: 'CA',
        hasHealthInsurance: false,
        dependentsCount: 0,
      };

      await act(async () => {
        await result.current.updateBudget(formData);
      });

      // Dismiss all alerts
      act(() => {
        result.current.alerts.forEach(alert => {
          result.current.dismissAlert(alert.id);
        });
      });

      act(() => {
        result.current.clearDismissedAlerts();
      });

      expect(result.current.alerts.length).toBe(0);
    });
  });

  describe('Real-time Recalculation', () => {
    it('should recalculate runway when expenses change', async () => {
      const { result } = renderHook(() => useBudgetStore());
      
      const initialFormData: BudgetFormData = {
        monthlyIncome: 5000,
        currentSavings: 10000,
        monthlyExpenses: 2000,
        severanceAmount: 0,
        state: 'CA',
        hasHealthInsurance: false,
        dependentsCount: 0,
      };

      await act(async () => {
        await result.current.updateBudget(initialFormData);
      });

      const initialRunway = result.current.runway?.runwayInDays;

      // Update with higher expenses
      const updatedFormData: BudgetFormData = {
        ...initialFormData,
        monthlyExpenses: 4000,
      };

      await act(async () => {
        await result.current.updateBudget(updatedFormData);
      });

      const updatedRunway = result.current.runway?.runwayInDays;

      expect(updatedRunway).toBeLessThan(initialRunway!);
    });

    it('should update unemployment benefits when state changes', async () => {
      const { result } = renderHook(() => useBudgetStore());
      
      const caFormData: BudgetFormData = {
        monthlyIncome: 5000,
        currentSavings: 10000,
        monthlyExpenses: 3000,
        severanceAmount: 0,
        state: 'CA',
        hasHealthInsurance: false,
        dependentsCount: 0,
      };

      await act(async () => {
        await result.current.updateBudget(caFormData);
      });

      const caBenefit = result.current.budgetData?.unemploymentBenefit;

      // Change to Florida (lower benefits)
      const flFormData: BudgetFormData = {
        ...caFormData,
        state: 'FL',
      };

      await act(async () => {
        await result.current.updateBudget(flFormData);
      });

      const flBenefit = result.current.budgetData?.unemploymentBenefit;

      expect(flBenefit).toBeLessThan(caBenefit!);
    });
  });

  describe('Sync with Backend', () => {
    it('should sync budget data to backend when online', async () => {
      const mockSavedData = { id: 'server-id', ...({} as BudgetData) };
      (budgetService.saveBudgetData as jest.Mock).mockResolvedValueOnce(mockSavedData);

      const { result } = renderHook(() => useBudgetStore());
      
      const formData: BudgetFormData = {
        monthlyIncome: 5000,
        currentSavings: 10000,
        monthlyExpenses: 3000,
        severanceAmount: 5000,
        state: 'CA',
        hasHealthInsurance: true,
        dependentsCount: 0,
      };

      await act(async () => {
        await result.current.updateBudget(formData, true); // sync = true
      });

      expect(budgetService.saveBudgetData).toHaveBeenCalled();
      expect(result.current.budgetData?.id).toBe('server-id');
    });

    it('should handle sync errors gracefully', async () => {
      (budgetService.saveBudgetData as jest.Mock).mockRejectedValueOnce(
        new Error('Network error')
      );

      const { result } = renderHook(() => useBudgetStore());
      
      const formData: BudgetFormData = {
        monthlyIncome: 5000,
        currentSavings: 10000,
        monthlyExpenses: 3000,
        severanceAmount: 5000,
        state: 'CA',
        hasHealthInsurance: true,
        dependentsCount: 0,
      };

      await act(async () => {
        await result.current.updateBudget(formData, true);
      });

      // Should still save locally even if sync fails
      expect(result.current.budgetData).toBeDefined();
      expect(AsyncStorage.setItem).toHaveBeenCalled();
    });
  });

  describe('Reset', () => {
    it('should reset all budget data', async () => {
      const { result } = renderHook(() => useBudgetStore());
      
      const formData: BudgetFormData = {
        monthlyIncome: 5000,
        currentSavings: 10000,
        monthlyExpenses: 3000,
        severanceAmount: 5000,
        state: 'CA',
        hasHealthInsurance: true,
        dependentsCount: 0,
      };

      await act(async () => {
        await result.current.updateBudget(formData);
      });

      act(() => {
        result.current.reset();
      });

      expect(result.current.budgetData).toBeNull();
      expect(result.current.runway).toBeNull();
      expect(result.current.alerts).toEqual([]);
      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('@next_chapter/budget_data');
    });
  });
});