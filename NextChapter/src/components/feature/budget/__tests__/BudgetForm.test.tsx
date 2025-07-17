import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { BudgetForm } from '../BudgetForm';
import { BudgetFormData } from '../../../../types/budget';
import { ThemeProvider } from '../../../../context/ThemeContext';

// Mock Alert
const alertMock = jest.fn();
Alert.alert = alertMock;

const mockTheme = {
  colors: {
    primary: '#2563EB',
    text: '#111827',
    textMuted: '#6B7280',
    background: '#FFFFFF',
    surface: '#F9FAFB',
    border: '#E5E7EB',
    error: '#DC2626',
  },
  typography: {
    sizes: {
      body: 16,
      bodySmall: 14,
    },
    weights: {
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
};

const renderWithTheme = (component: React.ReactElement) => {
  return render(
    <ThemeProvider value={{ theme: mockTheme, toggleTheme: jest.fn() }}>
      {component}
    </ThemeProvider>
  );
};

describe('BudgetForm', () => {
  const mockOnSubmit = jest.fn();
  
  const defaultInitialData: BudgetFormData = {
    monthlyIncome: 5000,
    currentSavings: 10000,
    monthlyExpenses: 3000,
    severanceAmount: 0,
    state: 'CA',
    hasHealthInsurance: true,
    dependentsCount: 0,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    alertMock.mockClear();
  });

  it('should render all form fields', () => {
    const { getByTestId, getByText } = renderWithTheme(
      <BudgetForm onSubmit={mockOnSubmit} />
    );

    expect(getByTestId('monthly-income-input')).toBeTruthy();
    expect(getByText('Monthly Income (pre-layoff)')).toBeTruthy();
    expect(getByText('Current Savings')).toBeTruthy();
    expect(getByText('Monthly Expenses')).toBeTruthy();
    expect(getByText('Severance Amount')).toBeTruthy();
    expect(getByText('State')).toBeTruthy();
    expect(getByText('Had employer health insurance?')).toBeTruthy();
    expect(getByText('Number of dependents')).toBeTruthy();
  });

  it('should populate form with initial data', () => {
    const { getByTestId } = renderWithTheme(
      <BudgetForm initialData={defaultInitialData} onSubmit={mockOnSubmit} />
    );

    expect(getByTestId('monthly-income-input').props.value).toBe('$5,000.00');
    expect(getByTestId('current-savings-input').props.value).toBe('$10,000.00');
    expect(getByTestId('monthly-expenses-input').props.value).toBe('$3,000.00');
    expect(getByTestId('severance-amount-input').props.value).toBe(''); // 0 shows as empty
    expect(getByTestId('state-picker').props.selectedValue).toBe('CA');
    expect(getByTestId('dependents-value').props.children).toBe(0);
  });

  it('should format currency inputs correctly', () => {
    const { getByTestId } = renderWithTheme(
      <BudgetForm onSubmit={mockOnSubmit} />
    );

    const incomeInput = getByTestId('monthly-income-input');
    
    fireEvent.changeText(incomeInput, '5000.50');
    fireEvent(incomeInput, 'blur');
    expect(incomeInput.props.value).toBe('$5,000.50');

    fireEvent.changeText(incomeInput, '1234567.89');
    fireEvent(incomeInput, 'blur');
    expect(incomeInput.props.value).toBe('$1,234,567.89');
  });

  it('should validate required fields', async () => {
    const { getByText, getByTestId } = renderWithTheme(
      <BudgetForm onSubmit={mockOnSubmit} />
    );

    const submitButton = getByTestId('submit-button');
    fireEvent.press(submitButton);

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        'Missing Information',
        'Please select your state.'
      );
    });

    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('should validate numeric inputs', async () => {
    const { getByTestId } = renderWithTheme(
      <BudgetForm onSubmit={mockOnSubmit} />
    );

    // Set state to pass state validation
    const statePicker = getByTestId('state-picker');
    fireEvent(statePicker, 'valueChange', 'CA');
    
    // Set valid expenses 
    const expensesInput = getByTestId('monthly-expenses-input');
    fireEvent.changeText(expensesInput, '1000');
    fireEvent(expensesInput, 'blur');
    
    // Set non-numeric income - parseCurrency returns NaN for 'abc'
    const incomeInput = getByTestId('monthly-income-input');
    fireEvent.changeText(incomeInput, 'abc');
    fireEvent(incomeInput, 'blur');

    const submitButton = getByTestId('submit-button');
    fireEvent.press(submitButton);

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        'Invalid Input',
        'Please enter valid numbers for all financial fields.'
      );
    });

    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('should toggle health insurance switch', () => {
    const { getByTestId } = renderWithTheme(
      <BudgetForm onSubmit={mockOnSubmit} />
    );

    const healthSwitch = getByTestId('health-insurance-switch');
    
    expect(healthSwitch.props.value).toBe(false);
    
    fireEvent(healthSwitch, 'onValueChange', true);
    expect(healthSwitch.props.value).toBe(true);
  });

  it('should update dependents count with stepper', () => {
    const { getByTestId, getByText } = renderWithTheme(
      <BudgetForm onSubmit={mockOnSubmit} />
    );

    const decreaseButton = getByTestId('dependents-decrease');
    const increaseButton = getByTestId('dependents-increase');
    const dependentsValue = getByTestId('dependents-value');

    expect(dependentsValue.props.children).toBe(0);

    fireEvent.press(increaseButton);
    expect(dependentsValue.props.children).toBe(1);

    fireEvent.press(increaseButton);
    fireEvent.press(increaseButton);
    expect(dependentsValue.props.children).toBe(3);

    fireEvent.press(decreaseButton);
    expect(dependentsValue.props.children).toBe(2);

    // Should not go below 0
    fireEvent.press(decreaseButton);
    fireEvent.press(decreaseButton);
    fireEvent.press(decreaseButton);
    expect(dependentsValue.props.children).toBe(0);
  });

  it('should submit form with valid data', async () => {
    const { getByTestId } = renderWithTheme(
      <BudgetForm initialData={defaultInitialData} onSubmit={mockOnSubmit} />
    );

    const submitButton = getByTestId('submit-button');
    fireEvent.press(submitButton);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith(defaultInitialData);
    });
  });

  it('should show loading state while submitting', async () => {
    const slowSubmit = jest.fn().mockImplementation(
      () => new Promise(resolve => setTimeout(resolve, 100))
    );

    const { getByTestId } = renderWithTheme(
      <BudgetForm initialData={defaultInitialData} onSubmit={slowSubmit} />
    );

    const submitButton = getByTestId('submit-button');
    fireEvent.press(submitButton);

    // Should show loading indicator (ActivityIndicator replaces text)
    await waitFor(() => {
      expect(getByTestId('submit-button').props.accessibilityState.disabled).toBe(true);
      expect(getByTestId('submit-button').children).toBeTruthy(); // Has content (ActivityIndicator)
    });

    // Wait for submission to complete
    await waitFor(() => {
      expect(slowSubmit).toHaveBeenCalled();
    });
  });

  it('should call onChange callback when form values change', () => {
    const mockOnChange = jest.fn();
    
    const { getByTestId } = renderWithTheme(
      <BudgetForm 
        onSubmit={mockOnSubmit} 
        onChange={mockOnChange}
      />
    );

    const incomeInput = getByTestId('monthly-income-input');
    fireEvent.changeText(incomeInput, '6000');

    expect(mockOnChange).toHaveBeenCalledWith(
      expect.objectContaining({
        monthlyIncome: 6000,
      })
    );
  });

  it('should render state picker with all US states', () => {
    const { getByTestId, getAllByText } = renderWithTheme(
      <BudgetForm onSubmit={mockOnSubmit} />
    );

    const statePicker = getByTestId('state-picker');
    
    // Check that picker is rendered
    expect(statePicker).toBeTruthy();
    
    // Should have 51 items (50 states + default selection)
    expect(statePicker.props.children.length).toBe(51);
  });

  it('should show helper text for form fields', () => {
    const { getByText } = renderWithTheme(
      <BudgetForm onSubmit={mockOnSubmit} />
    );

    expect(getByText('Your salary before being laid off')).toBeTruthy();
    expect(getByText('Total amount in savings, checking, etc.')).toBeTruthy();
    expect(getByText('Rent, utilities, food, etc.')).toBeTruthy();
    expect(getByText('If applicable')).toBeTruthy();
    expect(getByText('For unemployment benefit calculation')).toBeTruthy();
  });

  it('should be accessible with proper labels', () => {
    const { getByLabelText } = renderWithTheme(
      <BudgetForm onSubmit={mockOnSubmit} />
    );

    expect(getByLabelText('Monthly income before layoff')).toBeTruthy();
    expect(getByLabelText('Current total savings')).toBeTruthy();
    expect(getByLabelText('Monthly expenses')).toBeTruthy();
    expect(getByLabelText('Severance amount received')).toBeTruthy();
    expect(getByLabelText('Select your state')).toBeTruthy();
    expect(getByLabelText('Had employer health insurance')).toBeTruthy();
    expect(getByLabelText('Number of dependents')).toBeTruthy();
  });
});