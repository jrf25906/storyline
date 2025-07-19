import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { BudgetOverviewScreen } from '@screens/budget/BudgetOverviewScreen';
import { useBudgetStore } from '@stores/budgetStore';
import { useAuthStore } from '@stores/authStore';
import { SafeThemeProvider } from '@components/common/SafeThemeProvider';

// Mock the stores
jest.mock('../../../stores/budgetStore');
jest.mock('../../../stores/authStore');

// Mock navigation
const mockNavigate = jest.fn();
jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({
    navigate: mockNavigate,
  }),
}));

describe('BudgetOverviewScreen', () => {
  const mockBudgetStore = {
    budgetData: {
      currentSavings: 15000,
      monthlyIncome: 5000,
      monthlyExpenses: 3500,
      severanceAmount: 10000,
      unemploymentBenefit: 450,
      unemploymentWeeks: 26,
      cobraCost: 800,
      state: 'CA',
    },
    runway: {
      runwayInMonths: 4.3,
      runwayInDays: 129,
      isLowRunway: false,
      totalAvailableFunds: 25000,
      monthlyBurn: 3500,
    },
    unemploymentBenefit: {
      weeklyAmount: 450,
      maxWeeks: 26,
      totalBenefit: 11700,
      state: 'CA',
    },
    alerts: [],
    isLoading: false,
    error: null,
    loadBudget: jest.fn(),
    loadBudgetEntries: jest.fn(),
    getTotalMonthlyExpenses: jest.fn(() => 3500),
    dismissAlert: jest.fn(),
  };

  const mockAuthStore = {
    user: { id: 'test-user-id', email: 'test@example.com' },
    isAuthenticated: true,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useBudgetStore as jest.Mock).mockReturnValue(mockBudgetStore);
    (useAuthStore as jest.Mock).mockReturnValue(mockAuthStore);
  });

  const renderScreen = () => {
    return render(
      <SafeThemeProvider>
        <NavigationContainer>
          <BudgetOverviewScreen navigation={mockNavigate as any} route={{} as any} />
        </NavigationContainer>
      </SafeThemeProvider>
    );
  };

  it('should render budget overview with data', () => {
    const { getByText } = renderScreen();

    expect(getByText('Financial Runway')).toBeTruthy();
    expect(getByText('4.3 months')).toBeTruthy();
    expect(getByText('129 days remaining')).toBeTruthy();
  });

  it('should display financial summary correctly', () => {
    const { getByDisplayValue } = renderScreen();

    expect(getByDisplayValue('$15,000')).toBeTruthy(); // Current savings
    expect(getByDisplayValue('$3,500')).toBeTruthy(); // Monthly expenses
    expect(getByDisplayValue('$450')).toBeTruthy(); // Weekly unemployment benefits
  });

  it('should display severance amount when available', () => {
    const { getByDisplayValue } = renderScreen();

    expect(getByDisplayValue('$10,000')).toBeTruthy(); // Severance package
  });

  it('should load budget data on mount', () => {
    renderScreen();

    expect(mockBudgetStore.loadBudget).toHaveBeenCalled();
    expect(mockBudgetStore.loadBudgetEntries).toHaveBeenCalledWith('test-user-id');
  });

  it('should show loading state when data is loading', () => {
    (useBudgetStore as jest.Mock).mockReturnValue({
      ...mockBudgetStore,
      isLoading: true,
      budgetData: null,
    });

    const { getByText } = renderScreen();

    expect(getByText('Loading your financial data...')).toBeTruthy();
  });

  it('should show error state when there is an error', () => {
    (useBudgetStore as jest.Mock).mockReturnValue({
      ...mockBudgetStore,
      error: 'Failed to load budget data',
      budgetData: null,
    });

    const { getByText } = renderScreen();

    expect(getByText('Failed to load budget data')).toBeTruthy();
    expect(getByText('Retry')).toBeTruthy();
  });

  it('should handle refresh', async () => {
    const { getByTestId } = renderScreen();

    const scrollView = getByTestId('budget-scroll-view');
    fireEvent.scroll(scrollView, {
      nativeEvent: {
        contentOffset: { y: -100 },
      },
    });

    await waitFor(() => {
      expect(mockBudgetStore.loadBudget).toHaveBeenCalledTimes(2);
      expect(mockBudgetStore.loadBudgetEntries).toHaveBeenCalledTimes(2);
    });
  });

  it('should display alerts when present', () => {
    (useBudgetStore as jest.Mock).mockReturnValue({
      ...mockBudgetStore,
      alerts: [
        {
          id: 'low_runway',
          type: 'low_runway',
          title: 'Low Financial Runway',
          message: 'You have less than 2 months of runway.',
          severity: 'warning',
          dismissed: false,
        },
      ],
    });

    const { getByText } = renderScreen();

    expect(getByText('Low Financial Runway')).toBeTruthy();
    expect(getByText('You have less than 2 months of runway.')).toBeTruthy();
  });

  it('should dismiss alerts', () => {
    (useBudgetStore as jest.Mock).mockReturnValue({
      ...mockBudgetStore,
      alerts: [
        {
          id: 'test-alert',
          type: 'low_runway',
          title: 'Test Alert',
          message: 'Test message',
          severity: 'warning',
          dismissed: false,
        },
      ],
    });

    const { getByText } = renderScreen();
    
    fireEvent.press(getByText('✕'));
    
    expect(mockBudgetStore.dismissAlert).toHaveBeenCalledWith('test-alert');
  });

  it('should navigate to expense tracking', () => {
    const { getByText } = renderScreen();

    fireEvent.press(getByText('Track Expenses'));

    expect(mockNavigate).toHaveBeenCalledWith('AddExpense');
  });

  it('should navigate to benefits calculator', () => {
    const { getByText } = renderScreen();

    fireEvent.press(getByText('Calculate Benefits'));

    expect(mockNavigate).toHaveBeenCalledWith('BenefitsCalculator');
  });

  it('should show low runway warning when runway is below 3 months', () => {
    (useBudgetStore as jest.Mock).mockReturnValue({
      ...mockBudgetStore,
      runway: {
        ...mockBudgetStore.runway,
        runwayInMonths: 2.5,
        runwayInDays: 75,
        isLowRunway: true,
      },
    });

    const { getByText } = renderScreen();

    expect(getByText(/Your runway is below 2 months/)).toBeTruthy();
  });

  it('should handle no budget data gracefully', () => {
    (useBudgetStore as jest.Mock).mockReturnValue({
      ...mockBudgetStore,
      budgetData: null,
      runway: null,
      unemploymentBenefit: null,
    });

    const { getByText } = renderScreen();

    expect(getByText('-- months')).toBeTruthy();
    expect(getByText('Set up your budget to calculate runway')).toBeTruthy();
  });
});