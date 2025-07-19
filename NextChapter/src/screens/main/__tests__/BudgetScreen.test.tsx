import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import BudgetScreen from '@screens/main/BudgetScreen';
import { ThemeProvider } from '@context/ThemeContext';
import { useBudgetStore } from '@stores/budgetStore';
import { Alert } from 'react-native';

// Mock the budget store
jest.mock('../../../stores/budgetStore');

jest.mock('react-native/Libraries/Alert/Alert', () => ({
  alert: jest.fn(),
}));

const mockTheme = {
  colors: {
    primary: '#2563EB',
    text: '#111827',
    textMuted: '#6B7280',
    background: '#FFFFFF',
    surface: '#F9FAFB',
    border: '#E5E7EB',
    error: '#DC2626',
    success: '#10B981',
    warning: '#F59E0B',
  },
  typography: {
    sizes: {
      h1: 32,
      h2: 28,
      h3: 24,
      body: 16,
      bodySmall: 14,
    },
    weights: {
      bold: '700',
      semibold: '600',
      medium: '500',
      regular: '400',
    },
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
  borderRadius: {
    md: 8,
    lg: 16,
  },
  shadows: {
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 2,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 6,
      elevation: 5,
    },
  },
};

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <NavigationContainer>
      <ThemeProvider value={{ theme: mockTheme, toggleTheme: jest.fn() }}>
        {component}
      </ThemeProvider>
    </NavigationContainer>
  );
};

describe('BudgetScreen', () => {
  const mockUpdateBudget = jest.fn();
  const mockLoadBudgetData = jest.fn();
  const mockDismissAlert = jest.fn();
  const mockClearDismissedAlerts = jest.fn();

  const defaultMockStore = {
    budgetData: null,
    runway: null,
    alerts: [],
    isLoading: false,
    error: null,
    updateBudget: mockUpdateBudget,
    loadBudgetData: mockLoadBudgetData,
    dismissAlert: mockDismissAlert,
    clearDismissedAlerts: mockClearDismissedAlerts,
    reset: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useBudgetStore as unknown as jest.Mock).mockReturnValue(defaultMockStore);
  });

  it('should render budget form when no data exists', () => {
    const { getByText, getByTestId } = renderWithProviders(<BudgetScreen />);

    expect(getByText('Budget Calculator')).toBeTruthy();
    expect(getByText('Financial Planning')).toBeTruthy();
    expect(getByTestId('budget-form')).toBeTruthy();
  });

  it('should load budget data on mount', async () => {
    renderWithProviders(<BudgetScreen />);

    await waitFor(() => {
      expect(mockLoadBudgetData).toHaveBeenCalled();
    });
  });

  it('should display runway indicator when budget data exists', () => {
    const mockStoreWithData = {
      ...defaultMockStore,
      budgetData: {
        id: 'test-id',
        currentSavings: 10000,
        monthlyExpenses: 3000,
        severanceAmount: 5000,
        unemploymentBenefit: 450,
        unemploymentWeeks: 26,
        cobraCost: 650,
        state: 'CA',
      },
      runway: {
        totalAvailableFunds: 26700,
        monthlyBurn: 3650,
        runwayInDays: 219,
        runwayInMonths: 7.3,
        isLowRunway: false,
        projectedEndDate: new Date('2025-08-15'),
      },
    };

    (useBudgetStore as unknown as jest.Mock).mockReturnValue(mockStoreWithData);

    const { getByText, getByTestId } = renderWithProviders(<BudgetScreen />);

    expect(getByTestId('runway-indicator')).toBeTruthy();
    expect(getByText('7.3 months')).toBeTruthy();
    expect(getByText('(219 days)')).toBeTruthy();
  });

  it('should display alerts when present', () => {
    const mockStoreWithAlerts = {
      ...defaultMockStore,
      alerts: [
        {
          id: 'alert-1',
          type: 'low_runway',
          title: 'Low Financial Runway',
          message: 'You have less than 60 days of runway remaining.',
          severity: 'warning',
          createdAt: new Date(),
          dismissed: false,
        },
      ],
    };

    (useBudgetStore as unknown as jest.Mock).mockReturnValue(mockStoreWithAlerts);

    const { getByText, getByTestId } = renderWithProviders(<BudgetScreen />);

    expect(getByText('Alerts')).toBeTruthy();
    expect(getByText('Low Financial Runway')).toBeTruthy();
    expect(getByText('You have less than 60 days of runway remaining.')).toBeTruthy();
    expect(getByTestId('alert-warning')).toBeTruthy();
  });

  it('should dismiss alerts when dismiss button is pressed', () => {
    const mockStoreWithAlerts = {
      ...defaultMockStore,
      alerts: [
        {
          id: 'alert-1',
          type: 'low_runway',
          title: 'Low Financial Runway',
          message: 'You have less than 60 days of runway remaining.',
          severity: 'warning',
          createdAt: new Date(),
          dismissed: false,
        },
      ],
    };

    (useBudgetStore as unknown as jest.Mock).mockReturnValue(mockStoreWithAlerts);

    const { getByTestId } = renderWithProviders(<BudgetScreen />);

    const dismissButton = getByTestId('dismiss-alert-alert-1');
    fireEvent.press(dismissButton);

    expect(mockDismissAlert).toHaveBeenCalledWith('alert-1');
  });

  it('should update budget when form is submitted', async () => {
    const { getByTestId, getByText } = renderWithProviders(<BudgetScreen />);

    // Fill in form
    fireEvent.changeText(getByTestId('monthly-income-input'), '5000');
    fireEvent.changeText(getByTestId('current-savings-input'), '10000');
    fireEvent.changeText(getByTestId('monthly-expenses-input'), '3000');
    fireEvent.changeText(getByTestId('severance-amount-input'), '5000');

    const submitButton = getByText('Calculate Runway');
    fireEvent.press(submitButton);

    await waitFor(() => {
      expect(mockUpdateBudget).toHaveBeenCalledWith(
        expect.objectContaining({
          monthlyIncome: 5000,
          currentSavings: 10000,
          monthlyExpenses: 3000,
          severanceAmount: 5000,
        }),
        true // sync enabled
      );
    });
  });

  it('should show edit button when viewing existing budget', () => {
    const mockStoreWithData = {
      ...defaultMockStore,
      budgetData: {
        id: 'test-id',
        currentSavings: 10000,
        monthlyExpenses: 3000,
      },
      runway: {
        totalAvailableFunds: 10000,
        monthlyBurn: 3000,
        runwayInDays: 100,
        runwayInMonths: 3.3,
        isLowRunway: false,
        projectedEndDate: new Date(),
      },
    };

    (useBudgetStore as unknown as jest.Mock).mockReturnValue(mockStoreWithData);

    const { getByText } = renderWithProviders(<BudgetScreen />);

    expect(getByText('Edit Budget')).toBeTruthy();
  });

  it('should switch to edit mode when edit button is pressed', () => {
    const mockStoreWithData = {
      ...defaultMockStore,
      budgetData: {
        id: 'test-id',
        monthlyIncome: 5000,
        currentSavings: 10000,
        monthlyExpenses: 3000,
        severanceAmount: 5000,
        state: 'CA',
        hasHealthInsurance: true,
        dependentsCount: 0,
      },
      runway: {
        totalAvailableFunds: 10000,
        monthlyBurn: 3000,
        runwayInDays: 100,
        runwayInMonths: 3.3,
        isLowRunway: false,
        projectedEndDate: new Date(),
      },
    };

    (useBudgetStore as unknown as jest.Mock).mockReturnValue(mockStoreWithData);

    const { getByText, getByTestId } = renderWithProviders(<BudgetScreen />);

    const editButton = getByText('Edit Budget');
    fireEvent.press(editButton);

    expect(getByTestId('budget-form')).toBeTruthy();
    expect(getByText('Update Budget')).toBeTruthy();
  });

  it('should display breakdown of funds and expenses', () => {
    const mockStoreWithData = {
      ...defaultMockStore,
      budgetData: {
        currentSavings: 10000,
        severanceAmount: 5000,
        unemploymentBenefit: 450,
        unemploymentWeeks: 26,
        monthlyExpenses: 3000,
        cobraCost: 650,
      },
      runway: {
        totalAvailableFunds: 26700,
        monthlyBurn: 3650,
        runwayInDays: 219,
        runwayInMonths: 7.3,
        isLowRunway: false,
        projectedEndDate: new Date(),
      },
    };

    (useBudgetStore as unknown as jest.Mock).mockReturnValue(mockStoreWithData);

    const { getByText } = renderWithProviders(<BudgetScreen />);

    expect(getByText('Financial Breakdown')).toBeTruthy();
    expect(getByText('Available Funds')).toBeTruthy();
    expect(getByText('Current Savings')).toBeTruthy();
    expect(getByText('$10,000.00')).toBeTruthy();
    expect(getByText('Severance')).toBeTruthy();
    expect(getByText('$5,000.00')).toBeTruthy();
    expect(getByText('Unemployment Benefits')).toBeTruthy();
    expect(getByText('$11,700.00')).toBeTruthy();
    
    expect(getByText('Monthly Expenses')).toBeTruthy();
    expect(getByText('Living Expenses')).toBeTruthy();
    expect(getByText('$3,000.00')).toBeTruthy();
    expect(getByText('COBRA Insurance')).toBeTruthy();
    expect(getByText('$650.00')).toBeTruthy();
  });

  it('should handle loading state', () => {
    const mockLoadingStore = {
      ...defaultMockStore,
      isLoading: true,
    };

    (useBudgetStore as unknown as jest.Mock).mockReturnValue(mockLoadingStore);

    const { getByTestId } = renderWithProviders(<BudgetScreen />);

    expect(getByTestId('loading-indicator')).toBeTruthy();
  });

  it('should handle error state', () => {
    const mockErrorStore = {
      ...defaultMockStore,
      error: 'Failed to load budget data',
    };

    (useBudgetStore as unknown as jest.Mock).mockReturnValue(mockErrorStore);

    const { getByText } = renderWithProviders(<BudgetScreen />);

    expect(getByText('Failed to load budget data')).toBeTruthy();
    expect(getByText('Try Again')).toBeTruthy();
  });

  it('should retry loading on error', () => {
    const mockErrorStore = {
      ...defaultMockStore,
      error: 'Failed to load budget data',
    };

    (useBudgetStore as unknown as jest.Mock).mockReturnValue(mockErrorStore);

    const { getByText } = renderWithProviders(<BudgetScreen />);

    const retryButton = getByText('Try Again');
    fireEvent.press(retryButton);

    expect(mockLoadBudgetData).toHaveBeenCalled();
  });

  it('should be accessible with proper labels', () => {
    const { getByLabelText } = renderWithProviders(<BudgetScreen />);

    expect(getByLabelText('Budget Calculator Screen')).toBeTruthy();
  });

  it('should show tips section', () => {
    const mockStoreWithData = {
      ...defaultMockStore,
      budgetData: {
        currentSavings: 10000,
        monthlyExpenses: 3000,
      },
      runway: {
        totalAvailableFunds: 10000,
        monthlyBurn: 3000,
        runwayInDays: 100,
        runwayInMonths: 3.3,
        isLowRunway: false,
        projectedEndDate: new Date(),
      },
    };

    (useBudgetStore as unknown as jest.Mock).mockReturnValue(mockStoreWithData);

    const { getByText } = renderWithProviders(<BudgetScreen />);

    expect(getByText('Budget Tips')).toBeTruthy();
    expect(getByText(/Review your expenses monthly/)).toBeTruthy();
    expect(getByText(/Apply for unemployment benefits/)).toBeTruthy();
    expect(getByText(/Consider COBRA alternatives/)).toBeTruthy();
  });
});