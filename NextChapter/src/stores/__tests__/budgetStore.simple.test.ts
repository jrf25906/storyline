import { renderHook, act } from '@testing-library/react-hooks';
import { useBudgetStore } from '../budgetStore';
import * as budgetService from '../../services/budget/budgetService';

// Mock dependencies
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

jest.mock('../../services/api/supabase', () => ({
  supabase: {
    auth: {
      getUser: jest.fn().mockResolvedValue({ data: { user: null }, error: null }),
    },
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: null, error: null }),
      insert: jest.fn().mockResolvedValue({ data: null, error: null }),
      update: jest.fn().mockResolvedValue({ data: null, error: null }),
      delete: jest.fn().mockResolvedValue({ data: null, error: null }),
    })),
  },
}));

const mockBudgetService = budgetService as jest.Mocked<typeof budgetService>;

describe('BudgetStore - Simple Test', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Set up simple mock
    mockBudgetService.saveBudgetData.mockImplementation(async (data) => ({
      ...data,
      id: '1',
      lastUpdated: new Date(),
      createdAt: new Date(),
    }));
  });

  it('should initialize with default state', () => {
    const { result } = renderHook(() => useBudgetStore());
    
    expect(result.current.budgetData).toBeNull();
    expect(result.current.runway).toBeNull();
    expect(result.current.alerts).toEqual([]);
  });

  it('should save budget data', async () => {
    const { result } = renderHook(() => useBudgetStore());
    
    const budgetData = {
      monthlyIncome: 5000,
      currentSavings: 10000,
      monthlyExpenses: 3000,
      severanceAmount: 5000,
      state: 'CA',
      hasHealthInsurance: true,
      dependentsCount: 0,
    };

    await act(async () => {
      await result.current.saveBudget(budgetData);
    });

    expect(mockBudgetService.saveBudgetData).toHaveBeenCalledWith(
      expect.objectContaining(budgetData)
    );
  });
});