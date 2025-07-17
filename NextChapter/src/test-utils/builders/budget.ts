import { BudgetData, BudgetFormData, FinancialRunway, BudgetAlert } from '../../types/budget';

export const buildBudgetFormData = (overrides?: Partial<BudgetFormData>): BudgetFormData => ({
  monthlyIncome: 5000,
  currentSavings: 10000,
  monthlyExpenses: 3000,
  severanceAmount: 5000,
  state: 'CA',
  hasHealthInsurance: true,
  dependentsCount: 0,
  ...overrides,
});

export const buildBudgetData = (overrides?: Partial<BudgetData>): BudgetData => ({
  id: 'test-budget-id',
  userId: 'test-user-id',
  monthlyIncome: 5000,
  currentSavings: 10000,
  monthlyExpenses: 3000,
  severanceAmount: 5000,
  unemploymentBenefit: 450,
  unemploymentWeeks: 26,
  cobraCost: 650,
  state: 'CA',
  lastUpdated: new Date(),
  createdAt: new Date(),
  ...overrides,
});

export const buildFinancialRunway = (overrides?: Partial<FinancialRunway>): FinancialRunway => ({
  totalAvailableFunds: 26700,
  monthlyBurn: 3650,
  runwayInDays: 219,
  runwayInMonths: 7.3,
  totalMonths: 7.3,
  isLowRunway: false,
  projectedEndDate: new Date(Date.now() + 219 * 24 * 60 * 60 * 1000),
  ...overrides,
});

export const buildBudgetAlert = (overrides?: Partial<BudgetAlert>): BudgetAlert => ({
  id: 'test-alert-id',
  type: 'low_runway',
  title: 'Low Financial Runway',
  message: 'You have less than 60 days of runway remaining.',
  severity: 'warning',
  createdAt: new Date(),
  dismissed: false,
  ...overrides,
});