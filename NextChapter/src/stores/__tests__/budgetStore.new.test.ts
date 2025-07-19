import { renderHook, act } from '@testing-library/react-hooks';
import { useBudgetStore } from '@stores/budgetStore';
import { BudgetFormData } from '@types/budget';
import { 
  createMockStorageService, 
  createMockDataService,
  buildBudgetData,
  serviceErrors,
  ServiceResult,
} from '@test-utils';

// Mock the service container
jest.mock('../../services/ServiceContainer', () => ({
  ServiceContainer: {
    getInstance: jest.fn(() => ({
      storage: createMockStorageService(),
      budgetData: createMockDataService(),
    })),
  },
}));

describe('BudgetStore with New Patterns', () => {
  let mockStorage: ReturnType<typeof createMockStorageService>;
  let mockBudgetData: ReturnType<typeof createMockDataService>;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset service mocks
    const ServiceContainer = require('../../services/ServiceContainer').ServiceContainer;
    mockStorage = createMockStorageService();
    mockBudgetData = createMockDataService();
    
    ServiceContainer.getInstance.mockReturnValue({
      storage: mockStorage,
      budgetData: mockBudgetData,
    });
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

      const expectedBudget = buildBudgetData({
        ...formData,
        runway: 90,
      });

      mockBudgetData.create.mockResolvedValue(ServiceResult.success(expectedBudget));

      await act(async () => {
        await result.current.updateBudget(formData);
      });

      expect(result.current.budgetData).toEqual(expectedBudget);
      expect(result.current.runway).toBeDefined();
      expect(result.current.runway?.totalAvailableFunds).toBeGreaterThan(15000);
    });

    it('should handle service errors gracefully', async () => {
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

      mockBudgetData.create.mockResolvedValue(
        ServiceResult.failure(serviceErrors.network())
      );

      await act(async () => {
        await result.current.updateBudget(formData);
      });

      expect(result.current.error).toBe('Network request failed');
      expect(result.current.budgetData).toBeNull();
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

      const lowRunwayBudget = buildBudgetData({
        ...formData,
        runway: 30,
      });

      mockBudgetData.create.mockResolvedValue(ServiceResult.success(lowRunwayBudget));

      await act(async () => {
        await result.current.updateBudget(formData);
      });

      expect(result.current.alerts.length).toBeGreaterThan(0);
      expect(result.current.alerts.some(a => a.type === 'low_runway')).toBe(true);
    });
  });

  describe('Persistence', () => {
    it('should load budget data from storage on init', async () => {
      const savedBudget = buildBudgetData({
        currentSavings: 20000,
        monthlyExpenses: 2000,
      });

      mockStorage.get.mockResolvedValue(ServiceResult.success(savedBudget));

      const { result } = renderHook(() => useBudgetStore());

      await act(async () => {
        await result.current.loadBudgetData();
      });

      expect(mockStorage.get).toHaveBeenCalledWith('@next_chapter/budget_data');
      expect(result.current.budgetData).toEqual(savedBudget);
    });

    it('should save budget data to storage on update', async () => {
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

      const newBudget = buildBudgetData(formData);
      mockBudgetData.create.mockResolvedValue(ServiceResult.success(newBudget));

      await act(async () => {
        await result.current.updateBudget(formData);
      });

      expect(mockStorage.set).toHaveBeenCalledWith(
        '@next_chapter/budget_data',
        expect.objectContaining({
          currentSavings: 10000,
          monthlyExpenses: 3000,
        })
      );
    });

    it('should handle storage failures without crashing', async () => {
      mockStorage.get.mockResolvedValue(
        ServiceResult.failure(serviceErrors.unknown())
      );

      const { result } = renderHook(() => useBudgetStore());

      await act(async () => {
        await result.current.loadBudgetData();
      });

      // Should continue to work despite storage failure
      expect(result.current.budgetData).toBeNull();
      expect(result.current.error).toBeNull(); // Don't show storage errors to user
    });
  });

  describe('Budget Calculations', () => {
    it('should calculate correct runway with all income sources', async () => {
      const { result } = renderHook(() => useBudgetStore());
      
      const formData: BudgetFormData = {
        monthlyIncome: 2400, // Unemployment
        currentSavings: 10000,
        monthlyExpenses: 3000,
        severanceAmount: 8000,
        state: 'CA',
        hasHealthInsurance: true,
        dependentsCount: 0,
      };

      const budget = buildBudgetData({
        ...formData,
        runway: 120,
      });

      mockBudgetData.create.mockResolvedValue(ServiceResult.success(budget));

      await act(async () => {
        await result.current.updateBudget(formData);
      });

      const runway = result.current.runway;
      expect(runway).toBeDefined();
      expect(runway?.totalAvailableFunds).toBe(18000); // savings + severance
      expect(runway?.monthlyBurn).toBeLessThan(3000); // expenses - unemployment
      expect(runway?.runwayInDays).toBeGreaterThan(90);
    });

    it('should include COBRA costs when applicable', async () => {
      const { result } = renderHook(() => useBudgetStore());
      
      const formData: BudgetFormData = {
        monthlyIncome: 2400,
        currentSavings: 10000,
        monthlyExpenses: 3000,
        severanceAmount: 0,
        state: 'CA',
        hasHealthInsurance: false, // No insurance = needs COBRA
        dependentsCount: 2,
      };

      const budget = buildBudgetData(formData);
      mockBudgetData.create.mockResolvedValue(ServiceResult.success(budget));

      await act(async () => {
        await result.current.updateBudget(formData);
      });

      const runway = result.current.runway;
      expect(runway?.monthlyBurn).toBeGreaterThan(3000); // Should include COBRA
      expect(result.current.alerts.some(a => a.type === 'cobra_cost')).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero savings gracefully', async () => {
      const { result } = renderHook(() => useBudgetStore());
      
      const formData: BudgetFormData = {
        monthlyIncome: 0,
        currentSavings: 0,
        monthlyExpenses: 2000,
        severanceAmount: 0,
        state: 'CA',
        hasHealthInsurance: true,
        dependentsCount: 0,
      };

      const budget = buildBudgetData({
        ...formData,
        runway: 0,
      });

      mockBudgetData.create.mockResolvedValue(ServiceResult.success(budget));

      await act(async () => {
        await result.current.updateBudget(formData);
      });

      expect(result.current.runway?.runwayInDays).toBe(0);
      expect(result.current.alerts.some(a => a.type === 'critical_runway')).toBe(true);
    });

    it('should handle negative monthly burn (income exceeds expenses)', async () => {
      const { result } = renderHook(() => useBudgetStore());
      
      const formData: BudgetFormData = {
        monthlyIncome: 5000,
        currentSavings: 10000,
        monthlyExpenses: 2000,
        severanceAmount: 0,
        state: 'CA',
        hasHealthInsurance: true,
        dependentsCount: 0,
      };

      const budget = buildBudgetData({
        ...formData,
        runway: 999, // Infinite runway
      });

      mockBudgetData.create.mockResolvedValue(ServiceResult.success(budget));

      await act(async () => {
        await result.current.updateBudget(formData);
      });

      expect(result.current.runway?.runwayInDays).toBe(999);
      expect(result.current.alerts.length).toBe(0); // No alerts for positive cash flow
    });
  });
});