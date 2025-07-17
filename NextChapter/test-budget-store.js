// Simple test to isolate the budget store issue
const { renderHook } = require('@testing-library/react-hooks');

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

// Mock budget service
jest.mock('./src/services/budget/budgetService', () => ({
  saveBudgetData: jest.fn().mockResolvedValue({
    id: '1',
    monthlyIncome: 5000,
    currentSavings: 10000,
    monthlyExpenses: 3000,
    severanceAmount: 5000,
    state: 'CA',
    hasHealthInsurance: true,
    dependentsCount: 0,
    lastUpdated: new Date(),
    createdAt: new Date(),
  }),
  loadBudgetData: jest.fn().mockResolvedValue(null),
  deleteBudgetData: jest.fn().mockResolvedValue(true),
}));

// Mock supabase
jest.mock('./src/services/api/supabase', () => ({
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

// Try to import the store
try {
  const { useBudgetStore } = require('./src/stores/budgetStore');
  console.log('Store imported successfully');
  
  // Try to use it
  const { result } = renderHook(() => useBudgetStore());
  console.log('Store initialized:', !!result.current);
} catch (error) {
  console.error('Error:', error.message);
  console.error(error.stack);
}