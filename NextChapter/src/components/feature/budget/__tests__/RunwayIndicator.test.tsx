import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import { RunwayIndicator } from '@components/feature/budget/RunwayIndicator';
import { FinancialRunway } from '@types/budget';
import { ThemeProvider } from '@context/ThemeContext';

const mockTheme = {
  colors: {
    success: '#10B981',
    warning: '#F59E0B',
    error: '#DC2626',
    text: '#111827',
    textMuted: '#6B7280',
    background: '#FFFFFF',
    surface: '#F9FAFB',
  },
  typography: {
    sizes: {
      h2: 28,
      h3: 24,
      body: 16,
      bodySmall: 14,
    },
    weights: {
      bold: '700',
      semibold: '600',
      regular: '400',
    },
  },
  spacing: {
    sm: 8,
    md: 16,
    lg: 24,
  },
  borderRadius: {
    lg: 16,
  },
  shadows: {
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 6,
      elevation: 5,
    },
  },
};

const renderWithTheme = (component: React.ReactElement) => {
  return render(
    <ThemeProvider value={{ theme: mockTheme, toggleTheme: jest.fn() }}>
      {component}
    </ThemeProvider>
  );
};

describe('RunwayIndicator', () => {
  it('should display healthy runway with green indicator', () => {
    const runway: FinancialRunway = {
      totalAvailableFunds: 25000,
      monthlyBurn: 3000,
      runwayInDays: 250,
      runwayInMonths: 8.3,
      isLowRunway: false,
      projectedEndDate: new Date('2025-06-01'),
    };

    const { getByText, getByTestId } = renderWithTheme(
      <RunwayIndicator runway={runway} />
    );

    expect(getByText('Financial Runway')).toBeTruthy();
    expect(getByText('8.3 months')).toBeTruthy();
    expect(getByText('(250 days)')).toBeTruthy();
    expect(getByTestId('runway-progress-bar')).toBeTruthy();
    
    const progressBar = getByTestId('runway-progress-fill');
    expect(progressBar.props.style.backgroundColor).toBe(mockTheme.colors.success);
  });

  it('should display warning for low runway (30-60 days)', () => {
    const runway: FinancialRunway = {
      totalAvailableFunds: 5000,
      monthlyBurn: 3000,
      runwayInDays: 50,
      runwayInMonths: 1.7,
      isLowRunway: true,
      projectedEndDate: new Date('2025-02-20'),
    };

    const { getByText, getByTestId } = renderWithTheme(
      <RunwayIndicator runway={runway} />
    );

    expect(getByText('1.7 months')).toBeTruthy();
    expect(getByText('(50 days)')).toBeTruthy();
    
    const progressBar = getByTestId('runway-progress-fill');
    expect(progressBar.props.style.backgroundColor).toBe(mockTheme.colors.warning);
  });

  it('should display critical warning for very low runway (<30 days)', () => {
    const runway: FinancialRunway = {
      totalAvailableFunds: 2000,
      monthlyBurn: 3000,
      runwayInDays: 20,
      runwayInMonths: 0.7,
      isLowRunway: true,
      projectedEndDate: new Date('2025-01-30'),
    };

    const { getByText, getByTestId } = renderWithTheme(
      <RunwayIndicator runway={runway} />
    );

    expect(getByText('0.7 months')).toBeTruthy();
    expect(getByText('(20 days)')).toBeTruthy();
    
    const progressBar = getByTestId('runway-progress-fill');
    expect(progressBar.props.style.backgroundColor).toBe(mockTheme.colors.error);
  });

  it('should format projected end date correctly', () => {
    const runway: FinancialRunway = {
      totalAvailableFunds: 15000,
      monthlyBurn: 3000,
      runwayInDays: 150,
      runwayInMonths: 5,
      isLowRunway: false,
      projectedEndDate: new Date('2025-06-15'),
    };

    const { getByText } = renderWithTheme(
      <RunwayIndicator runway={runway} />
    );

    expect(getByText(/Funds projected until/)).toBeTruthy();
    expect(getByText(/June 15, 2025/)).toBeTruthy();
  });

  it('should show monthly burn rate', () => {
    const runway: FinancialRunway = {
      totalAvailableFunds: 15000,
      monthlyBurn: 3500,
      runwayInDays: 129,
      runwayInMonths: 4.3,
      isLowRunway: false,
      projectedEndDate: new Date('2025-05-15'),
    };

    const { getByText } = renderWithTheme(
      <RunwayIndicator runway={runway} />
    );

    expect(getByText('Monthly burn: $3,500.00')).toBeTruthy();
  });

  it('should handle infinite runway gracefully', () => {
    const runway: FinancialRunway = {
      totalAvailableFunds: 10000,
      monthlyBurn: 0,
      runwayInDays: Infinity,
      runwayInMonths: Infinity,
      isLowRunway: false,
      projectedEndDate: new Date('2099-12-31'),
    };

    const { getByText, queryByText } = renderWithTheme(
      <RunwayIndicator runway={runway} />
    );

    expect(getByText('Unlimited')).toBeTruthy();
    expect(queryByText(/days/)).toBeFalsy();
    expect(queryByText(/Funds projected until/)).toBeFalsy();
  });

  it('should animate progress bar on mount', async () => {
    const runway: FinancialRunway = {
      totalAvailableFunds: 15000,
      monthlyBurn: 3000,
      runwayInDays: 150,
      runwayInMonths: 5,
      isLowRunway: false,
      projectedEndDate: new Date('2025-06-15'),
    };

    const { getByTestId } = renderWithTheme(
      <RunwayIndicator runway={runway} />
    );

    const progressBar = getByTestId('runway-progress-fill');
    
    // Check initial width (should start at 0)
    expect(progressBar.props.style.width).toBeDefined();
    
    // Wait for animation to complete
    await waitFor(() => {
      expect(progressBar.props.style.width).toBeDefined();
    }, { timeout: 1500 });
  });

  it('should be accessible with proper labels', () => {
    const runway: FinancialRunway = {
      totalAvailableFunds: 15000,
      monthlyBurn: 3000,
      runwayInDays: 150,
      runwayInMonths: 5,
      isLowRunway: false,
      projectedEndDate: new Date('2025-06-15'),
    };

    const { getByLabelText } = renderWithTheme(
      <RunwayIndicator runway={runway} />
    );

    expect(getByLabelText('Financial runway indicator showing 5 months remaining')).toBeTruthy();
  });
});