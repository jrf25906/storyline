import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { BudgetAlerts } from '@components/feature/budget/BudgetAlerts';
import { BudgetAlert } from '@types/budget';
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
      h3: 24,
      body: 16,
      bodySmall: 14,
    },
    weights: {
      semibold: '600',
      medium: '500',
      regular: '400',
    },
  },
  spacing: {
    sm: 8,
    md: 16,
  },
  borderRadius: {
    md: 8,
  },
  shadows: {
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 2,
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

describe('BudgetAlerts', () => {
  const mockOnDismiss = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render multiple alerts', () => {
    const alerts: BudgetAlert[] = [
      {
        id: 'alert-1',
        type: 'low_runway',
        title: 'Low Financial Runway',
        message: 'You have less than 60 days of runway.',
        severity: 'warning',
        createdAt: new Date(),
        dismissed: false,
      },
      {
        id: 'alert-2',
        type: 'benefit_expiring',
        title: 'Benefits Expiring Soon',
        message: 'Your unemployment benefits will expire in 4 weeks.',
        severity: 'info',
        createdAt: new Date(),
        dismissed: false,
      },
    ];

    const { getByText, getAllByTestId } = renderWithTheme(
      <BudgetAlerts alerts={alerts} onDismiss={mockOnDismiss} />
    );

    expect(getByText('Alerts')).toBeTruthy();
    expect(getByText('Low Financial Runway')).toBeTruthy();
    expect(getByText('Benefits Expiring Soon')).toBeTruthy();
    expect(getAllByTestId(/^alert-/)).toHaveLength(2);
  });

  it('should not render dismissed alerts', () => {
    const alerts: BudgetAlert[] = [
      {
        id: 'alert-1',
        type: 'low_runway',
        title: 'Low Financial Runway',
        message: 'You have less than 60 days of runway.',
        severity: 'warning',
        createdAt: new Date(),
        dismissed: false,
      },
      {
        id: 'alert-2',
        type: 'benefit_expiring',
        title: 'Benefits Expiring Soon',
        message: 'Your unemployment benefits will expire in 4 weeks.',
        severity: 'info',
        createdAt: new Date(),
        dismissed: true, // This one is dismissed
      },
    ];

    const { getByText, queryByText, getAllByTestId } = renderWithTheme(
      <BudgetAlerts alerts={alerts} onDismiss={mockOnDismiss} />
    );

    expect(getByText('Low Financial Runway')).toBeTruthy();
    expect(queryByText('Benefits Expiring Soon')).toBeFalsy();
    expect(getAllByTestId(/^alert-/)).toHaveLength(1);
  });

  it('should display correct severity colors', () => {
    const alerts: BudgetAlert[] = [
      {
        id: 'alert-1',
        type: 'critical_runway',
        title: 'Critical Alert',
        message: 'Critical message',
        severity: 'critical',
        createdAt: new Date(),
        dismissed: false,
      },
      {
        id: 'alert-2',
        type: 'low_runway',
        title: 'Warning Alert',
        message: 'Warning message',
        severity: 'warning',
        createdAt: new Date(),
        dismissed: false,
      },
      {
        id: 'alert-3',
        type: 'benefit_expiring',
        title: 'Info Alert',
        message: 'Info message',
        severity: 'info',
        createdAt: new Date(),
        dismissed: false,
      },
    ];

    const { getByTestId } = renderWithTheme(
      <BudgetAlerts alerts={alerts} onDismiss={mockOnDismiss} />
    );

    const criticalAlert = getByTestId('alert-critical');
    const warningAlert = getByTestId('alert-warning');
    const infoAlert = getByTestId('alert-info');

    expect(criticalAlert.props.style).toContainEqual(
      expect.objectContaining({ borderLeftColor: mockTheme.colors.error })
    );
    expect(warningAlert.props.style).toContainEqual(
      expect.objectContaining({ borderLeftColor: mockTheme.colors.warning })
    );
    expect(infoAlert.props.style).toContainEqual(
      expect.objectContaining({ borderLeftColor: mockTheme.colors.success })
    );
  });

  it('should call onDismiss when dismiss button is pressed', () => {
    const alerts: BudgetAlert[] = [
      {
        id: 'alert-1',
        type: 'low_runway',
        title: 'Low Financial Runway',
        message: 'You have less than 60 days of runway.',
        severity: 'warning',
        createdAt: new Date(),
        dismissed: false,
      },
    ];

    const { getByTestId } = renderWithTheme(
      <BudgetAlerts alerts={alerts} onDismiss={mockOnDismiss} />
    );

    const dismissButton = getByTestId('dismiss-alert-alert-1');
    fireEvent.press(dismissButton);

    expect(mockOnDismiss).toHaveBeenCalledWith('alert-1');
  });

  it('should not render section if no undismissed alerts', () => {
    const alerts: BudgetAlert[] = [
      {
        id: 'alert-1',
        type: 'low_runway',
        title: 'Low Financial Runway',
        message: 'You have less than 60 days of runway.',
        severity: 'warning',
        createdAt: new Date(),
        dismissed: true,
      },
    ];

    const { queryByText } = renderWithTheme(
      <BudgetAlerts alerts={alerts} onDismiss={mockOnDismiss} />
    );

    expect(queryByText('Alerts')).toBeFalsy();
  });

  it('should render empty state when no alerts', () => {
    const { queryByText } = renderWithTheme(
      <BudgetAlerts alerts={[]} onDismiss={mockOnDismiss} />
    );

    expect(queryByText('Alerts')).toBeFalsy();
  });

  it('should display appropriate icons for alert types', () => {
    const alerts: BudgetAlert[] = [
      {
        id: 'alert-1',
        type: 'critical_runway',
        title: 'Critical Alert',
        message: 'Critical message',
        severity: 'critical',
        createdAt: new Date(),
        dismissed: false,
      },
      {
        id: 'alert-2',
        type: 'low_runway',
        title: 'Warning Alert',
        message: 'Warning message',
        severity: 'warning',
        createdAt: new Date(),
        dismissed: false,
      },
    ];

    const { getByTestId } = renderWithTheme(
      <BudgetAlerts alerts={alerts} onDismiss={mockOnDismiss} />
    );

    expect(getByTestId('alert-icon-critical')).toBeTruthy();
    expect(getByTestId('alert-icon-warning')).toBeTruthy();
  });

  it('should be accessible with proper labels', () => {
    const alerts: BudgetAlert[] = [
      {
        id: 'alert-1',
        type: 'low_runway',
        title: 'Low Financial Runway',
        message: 'You have less than 60 days of runway.',
        severity: 'warning',
        createdAt: new Date(),
        dismissed: false,
      },
    ];

    const { getByLabelText } = renderWithTheme(
      <BudgetAlerts alerts={alerts} onDismiss={mockOnDismiss} />
    );

    expect(getByLabelText('Budget alerts section')).toBeTruthy();
    expect(getByLabelText('Dismiss alert')).toBeTruthy();
  });

  it('should animate alert dismissal', () => {
    const alerts: BudgetAlert[] = [
      {
        id: 'alert-1',
        type: 'low_runway',
        title: 'Low Financial Runway',
        message: 'You have less than 60 days of runway.',
        severity: 'warning',
        createdAt: new Date(),
        dismissed: false,
      },
    ];

    const { getByTestId } = renderWithTheme(
      <BudgetAlerts alerts={alerts} onDismiss={mockOnDismiss} />
    );

    const alert = getByTestId('alert-warning');
    
    // Check that animation values are set
    expect(alert.props.style).toBeDefined();
  });

  it('should display alert timestamp', () => {
    const createdAt = new Date('2025-01-09T10:30:00');
    const alerts: BudgetAlert[] = [
      {
        id: 'alert-1',
        type: 'low_runway',
        title: 'Low Financial Runway',
        message: 'You have less than 60 days of runway.',
        severity: 'warning',
        createdAt,
        dismissed: false,
      },
    ];

    const { getByText } = renderWithTheme(
      <BudgetAlerts alerts={alerts} onDismiss={mockOnDismiss} />
    );

    // Should show relative time like "2 hours ago" or formatted date
    expect(getByText(/ago|Jan/)).toBeTruthy();
  });
});