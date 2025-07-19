import { BaseStore, BaseState, AsyncResult } from '@stores/interfaces/base';
import { BudgetEntry } from '@types/database';
import { 
  BudgetData, 
  FinancialRunway, 
  UnemploymentBenefit,
  CobraEstimate,
  BudgetAlert
} from '@types/budget';

/**
 * Budget calculations interface
 * Separates calculation logic from state management
 */
export interface BudgetCalculations {
  getTotalMonthlyIncome: () => number;
  getTotalMonthlyExpenses: () => number;
  getMonthlyBurn: () => number;
  getDaysUntilCritical: () => number;
  hasLowRunway: () => boolean;
}

/**
 * Budget data operations interface
 * Handles CRUD operations for budget data
 */
export interface BudgetDataOperations {
  loadBudget: () => AsyncResult;
  saveBudget: (data: Partial<BudgetData>) => AsyncResult;
  updateBudget: (updates: Partial<BudgetData>) => AsyncResult;
  deleteBudget: () => AsyncResult;
}

/**
 * Budget entries operations interface
 * Handles CRUD operations for budget entries
 */
export interface BudgetEntriesOperations {
  loadBudgetEntries: (userId: string) => AsyncResult;
  addBudgetEntry: (
    userId: string, 
    entry: Omit<BudgetEntry, 'id' | 'user_id' | 'created_at' | 'updated_at'>
  ) => AsyncResult;
  updateBudgetEntry: (id: string, updates: Partial<BudgetEntry>) => AsyncResult;
  deleteBudgetEntry: (id: string) => AsyncResult;
  toggleBudgetEntry: (id: string) => AsyncResult;
}

/**
 * Budget calculations operations interface
 * Handles financial calculations
 */
export interface BudgetCalculationOperations {
  calculateRunway: () => void;
  calculateUnemploymentBenefit: (state: string, weeklyIncome?: number) => void;
  calculateCobraEstimate: (state: string, dependentsCount: number) => void;
}

/**
 * Budget alerts operations interface
 * Handles alert management
 */
export interface BudgetAlertOperations {
  checkAlerts: () => void;
  dismissAlert: (alertId: string) => void;
  clearAlerts: () => void;
}

/**
 * Budget store state interface
 */
export interface BudgetStoreState extends BaseState {
  // Core data
  budgetData: BudgetData | null;
  budgetEntries: BudgetEntry[];
  
  // Calculated values
  runway: FinancialRunway | null;
  unemploymentBenefit: UnemploymentBenefit | null;
  cobraEstimate: CobraEstimate | null;
  
  // UI state
  alerts: BudgetAlert[];
  isSaving: boolean;
}

/**
 * Complete budget store interface
 * Combines all budget-related functionality
 */
export interface BudgetStore extends 
  BaseStore,
  BudgetStoreState,
  BudgetCalculations,
  BudgetDataOperations,
  BudgetEntriesOperations,
  BudgetCalculationOperations,
  BudgetAlertOperations {}