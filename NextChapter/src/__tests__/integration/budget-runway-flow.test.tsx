import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { Alert } from 'react-native';

// Components
import BudgetOverviewScreen from '../../screens/budget/BudgetOverviewScreen';
import BudgetScreen from '../../screens/main/BudgetScreen';
import { ThemeProvider } from '../../context/ThemeContext';

// Mock stores - create fresh instances for each test
const createMockBudgetStore = () => ({
  budgetData: null,
  runway: null,
  isLoading: false,
  saveBudgetData: jest.fn(),
  calculateRunway: jest.fn(),
  updateBudgetItem: jest.fn(),
  deleteBudgetData: jest.fn(),
  loadBudgetData: jest.fn(),
});

let mockBudgetStore = createMockBudgetStore();

// Mock the stores
jest.mock('../../stores/budgetStore', () => ({
  useBudgetStore: () => mockBudgetStore,
}));

// Mock budget service
const mockBudgetService = {
  calculateFinancialRunway: jest.fn(),
  saveBudgetData: jest.fn(),
  loadBudgetData: jest.fn(),
  validateBudgetData: jest.fn(),
};

jest.mock('../../services/budget/budgetService', () => ({
  budgetService: mockBudgetService,
}));

// Mock navigation
const mockNavigate = jest.fn();
jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({
    navigate: mockNavigate,
    goBack: jest.fn(),
  }),
  useRoute: () => ({
    params: {},
    name: 'BudgetCalculator',
  }),
}));

// Mock auth context
const mockAuth = {
  user: { id: 'test-user', email: 'test@example.com' },
  isAuthenticated: true,
  isLoading: false,
  signIn: jest.fn(),
  signUp: jest.fn(),
  signOut: jest.fn(),
  resetPassword: jest.fn(),
  updateProfile: jest.fn(),
  resendVerificationEmail: jest.fn(),
  refreshSession: jest.fn(),
  checkEmailVerification: jest.fn(),
};

jest.mock('../../context/AuthContext', () => ({
  useAuth: () => mockAuth,
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
}));

// Mock offline context
const mockOffline = {
  isConnected: true,
  isOnline: true,
  syncQueue: [],
  addToQueue: jest.fn(),
  processSyncQueue: jest.fn(),
  clearQueue: jest.fn(),
};

jest.mock('../../context/OfflineContext', () => ({
  useOffline: () => mockOffline,
  OfflineProvider: ({ children }: { children: React.ReactNode }) => children,
}));

// Test wrapper
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ThemeProvider>
    {children}
  </ThemeProvider>
);

describe('Integration: Budget Entry → Runway Calculation Flow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset store state with fresh instance
    mockBudgetStore = createMockBudgetStore();
    
    // Reset service mocks
    mockBudgetService.validateBudgetData.mockReturnValue({ isValid: true, errors: [] });
  });

  it('should complete full budget entry and runway calculation flow', async () => {
    const { getByPlaceholderText, getByText, queryByText } = render(
      <TestWrapper>
        <BudgetScreen />
      </TestWrapper>
    );

    // Step 1: User enters income information
    const salaryInput = getByPlaceholderText('Enter your monthly salary');
    const savingsInput = getByPlaceholderText('Enter your total savings');
    const unemploymentInput = getByPlaceholderText('Enter weekly unemployment benefit');

    await act(async () => {
      fireEvent.changeText(salaryInput, '5000');
      fireEvent.changeText(savingsInput, '15000');
      fireEvent.changeText(unemploymentInput, '400');
    });

    // Step 2: User enters expense information
    const rentInput = getByPlaceholderText('Enter monthly rent/mortgage');
    const utilitiesInput = getByPlaceholderText('Enter monthly utilities');
    const groceriesInput = getByPlaceholderText('Enter monthly groceries');
    const transportationInput = getByPlaceholderText('Enter monthly transportation');

    await act(async () => {
      fireEvent.changeText(rentInput, '1800');
      fireEvent.changeText(utilitiesInput, '200');
      fireEvent.changeText(groceriesInput, '400');
      fireEvent.changeText(transportationInput, '300');
    });

    // Step 3: User adds additional expenses
    const addExpenseButton = getByText('Add Expense');
    fireEvent.press(addExpenseButton);

    const customExpenseInput = getByPlaceholderText('Enter expense name');
    const customAmountInput = getByPlaceholderText('Enter amount');

    await act(async () => {
      fireEvent.changeText(customExpenseInput, 'Insurance');
      fireEvent.changeText(customAmountInput, '250');
    });

    // Step 4: User calculates runway
    const calculateButton = getByText('Calculate Runway');
    
    await act(async () => {
      // Mock successful calculation
      const budgetData = {
        income: {
          salary: 5000,
          unemployment: 400 * 4.33, // Weekly to monthly
          savings: 15000,
        },
        expenses: {
          rent: 1800,
          utilities: 200,
          groceries: 400,
          transportation: 300,
          insurance: 250,
        },
        totalIncome: 5000 + (400 * 4.33),
        totalExpenses: 1800 + 200 + 400 + 300 + 250,
      };

      const runwayResult = {
        totalAvailableFunds: 15000 + (400 * 4.33 * 6), // Savings + 6 months unemployment
        monthlyBurn: 2950, // Total expenses
        runwayInMonths: 6.8,
        runwayInDays: 204,
        isLowRunway: false,
        breakdownByCategory: {
          housing: 1800,
          utilities: 200,
          food: 400,
          transportation: 300,
          insurance: 250,
        },
      };

      mockBudgetService.calculateFinancialRunway.mockResolvedValue(runwayResult);
      mockBudgetStore.calculateRunway.mockResolvedValue(runwayResult);
      
      fireEvent.press(calculateButton);
    });

    // Step 5: Verify calculation was performed
    await waitFor(() => {
      expect(mockBudgetService.calculateFinancialRunway).toHaveBeenCalledWith({
        income: expect.objectContaining({
          salary: 5000,
          unemployment: expect.any(Number),
          savings: 15000,
        }),
        expenses: expect.objectContaining({
          rent: 1800,
          utilities: 200,
          groceries: 400,
          transportation: 300,
          insurance: 250,
        }),
      });
    });

    // Step 6: Mock updated store state with results
    await act(async () => {
      mockBudgetStore.runway = {
        totalAvailableFunds: 25398,
        monthlyBurn: 2950,
        runwayInMonths: 6.8,
        runwayInDays: 204,
        isLowRunway: false,
      };
      
      mockBudgetStore.budgetData = {
        income: { salary: 5000, unemployment: 1732, savings: 15000 },
        expenses: { rent: 1800, utilities: 200, groceries: 400, transportation: 300, insurance: 250 },
        totalIncome: 6732,
        totalExpenses: 2950,
      };
    });

    // Step 7: Verify results are displayed
    await waitFor(() => {
      expect(queryByText('6.8 months')).toBeTruthy();
      expect(queryByText('204 days')).toBeTruthy();
      expect(queryByText('$25,398')).toBeTruthy(); // Total available funds
      expect(queryByText('$2,950')).toBeTruthy(); // Monthly burn
    });

    // Step 8: User saves budget data
    const saveButton = getByText('Save Budget');
    
    await act(async () => {
      mockBudgetStore.saveBudgetData.mockResolvedValue({ success: true });
      fireEvent.press(saveButton);
    });

    // Step 9: Verify data was saved
    await waitFor(() => {
      expect(mockBudgetStore.saveBudgetData).toHaveBeenCalledWith(
        expect.objectContaining({
          income: expect.any(Object),
          expenses: expect.any(Object),
          runway: expect.any(Object),
        })
      );
    });

    // Step 10: Navigate to overview screen
    expect(mockNavigate).toHaveBeenCalledWith('BudgetOverview');
  });

  it('should show low runway warning for critical financial situation', async () => {
    const { getByPlaceholderText, getByText, queryByText } = render(
      <TestWrapper>
        <BudgetScreen />
      </TestWrapper>
    );

    // Enter data that results in low runway
    await act(async () => {
      fireEvent.changeText(getByPlaceholderText('Enter your total savings'), '2000');
      fireEvent.changeText(getByPlaceholderText('Enter monthly rent/mortgage'), '1500');
      fireEvent.changeText(getByPlaceholderText('Enter monthly groceries'), '600');
      fireEvent.changeText(getByPlaceholderText('Enter monthly utilities'), '300');
    });

    const calculateButton = getByText('Calculate Runway');
    
    await act(async () => {
      // Mock low runway result
      const lowRunwayResult = {
        totalAvailableFunds: 2000,
        monthlyBurn: 2400,
        runwayInMonths: 0.8,
        runwayInDays: 25,
        isLowRunway: true,
        criticalLevel: 'severe',
      };

      mockBudgetService.calculateFinancialRunway.mockResolvedValue(lowRunwayResult);
      mockBudgetStore.calculateRunway.mockResolvedValue(lowRunwayResult);
      
      fireEvent.press(calculateButton);
    });

    // Should show critical warning
    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        'Critical Financial Situation',
        expect.stringContaining('less than 1 month'),
        expect.any(Array)
      );
    });

    // Should display warning UI
    await waitFor(() => {
      expect(queryByText('⚠️ Critical: Less than 1 month runway')).toBeTruthy();
      expect(queryByText('Immediate action needed')).toBeTruthy();
    });
  });

  it('should provide budget optimization suggestions', async () => {
    const { getByText, queryByText } = render(
      <TestWrapper>
        <BudgetOverviewScreen />
      </TestWrapper>
    );

    // Mock budget data with optimization opportunities
    await act(async () => {
      mockBudgetStore.budgetData = {
        income: { salary: 4000, savings: 8000 },
        expenses: { 
          rent: 2000, // 50% of income - too high
          groceries: 800, // High grocery spending
          utilities: 300,
          transportation: 400,
        },
        totalIncome: 4000,
        totalExpenses: 3500,
      };
      
      mockBudgetStore.runway = {
        runwayInMonths: 3.2,
        isLowRunway: true,
        suggestions: [
          {
            category: 'housing',
            currentAmount: 2000,
            suggestedAmount: 1600,
            potentialSavings: 400,
            priority: 'high',
            description: 'Housing costs exceed 50% of income',
          },
          {
            category: 'food',
            currentAmount: 800,
            suggestedAmount: 600,
            potentialSavings: 200,
            priority: 'medium',
            description: 'Grocery spending is above average',
          },
        ],
      };
    });

    // Should show optimization suggestions
    await waitFor(() => {
      expect(queryByText('Budget Optimization')).toBeTruthy();
      expect(queryByText('Save $400/month on housing')).toBeTruthy();
      expect(queryByText('Save $200/month on groceries')).toBeTruthy();
      expect(queryByText('Total potential savings: $600/month')).toBeTruthy();
    });

    // User can apply suggestions
    const applySuggestionButton = getByText('Apply Housing Suggestion');
    
    await act(async () => {
      fireEvent.press(applySuggestionButton);
    });

    // Should update budget with suggestion
    await waitFor(() => {
      expect(mockBudgetStore.updateBudgetItem).toHaveBeenCalledWith('expenses.rent', 1600);
    });
  });

  it('should handle budget validation errors', async () => {
    const { getByPlaceholderText, getByText } = render(
      <TestWrapper>
        <BudgetScreen />
      </TestWrapper>
    );

    // Enter invalid data
    await act(async () => {
      fireEvent.changeText(getByPlaceholderText('Enter your monthly salary'), '-1000');
      fireEvent.changeText(getByPlaceholderText('Enter your total savings'), 'invalid');
    });

    // Mock validation errors
    mockBudgetService.validateBudgetData.mockReturnValue({
      isValid: false,
      errors: [
        { field: 'income.salary', message: 'Salary cannot be negative' },
        { field: 'income.savings', message: 'Savings must be a valid number' },
      ],
    });

    const calculateButton = getByText('Calculate Runway');
    fireEvent.press(calculateButton);

    // Should show validation errors
    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        'Invalid Budget Data',
        expect.stringContaining('Salary cannot be negative'),
        expect.any(Array)
      );
    });
  });

  it('should track budget changes over time', async () => {
    // Mock existing budget data
    await act(async () => {
      mockBudgetStore.budgetData = {
        income: { salary: 4000, savings: 10000 },
        expenses: { rent: 1500, groceries: 500 },
        lastUpdated: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days ago
      };
    });

    const { getByPlaceholderText, getByText, queryByText } = render(
      <TestWrapper>
        <BudgetScreen />
      </TestWrapper>
    );

    // User updates budget
    await act(async () => {
      fireEvent.changeText(getByPlaceholderText('Enter your monthly salary'), '4500'); // Increased
      fireEvent.changeText(getByPlaceholderText('Enter monthly rent/mortgage'), '1600'); // Increased
    });

    const calculateButton = getByText('Calculate Runway');
    fireEvent.press(calculateButton);

    // Should show budget change summary
    await waitFor(() => {
      expect(queryByText('Budget Changes')).toBeTruthy();
      expect(queryByText('Income: +$500')).toBeTruthy();
      expect(queryByText('Rent: +$100')).toBeTruthy();
      expect(queryByText('Net change: +$400/month')).toBeTruthy();
    });
  });

  it('should provide emergency fund recommendations', async () => {
    const { queryByText } = render(
      <TestWrapper>
        <BudgetOverviewScreen />
      </TestWrapper>
    );

    // Mock budget with insufficient emergency fund
    await act(async () => {
      mockBudgetStore.budgetData = {
        income: { salary: 5000 },
        expenses: { total: 3000 },
        savings: 5000, // Less than 3 months of expenses
      };
      
      mockBudgetStore.runway = {
        runwayInMonths: 1.7,
        emergencyFundRecommendation: {
          current: 5000,
          recommended: 9000, // 3 months of expenses
          shortfall: 4000,
        },
      };
    });

    // Should show emergency fund guidance
    await waitFor(() => {
      expect(queryByText('Emergency Fund')).toBeTruthy();
      expect(queryByText('Current: $5,000')).toBeTruthy();
      expect(queryByText('Recommended: $9,000')).toBeTruthy();
      expect(queryByText('You need $4,000 more')).toBeTruthy();
    });
  });
});