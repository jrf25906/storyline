import { StateCreator } from 'zustand';
import { BudgetStore, BudgetStoreState } from '@stores/interfaces/budgetStore';
import { createStore, createInitialState, handleAsyncOperation } from '@stores/factory/createStore';
import { 
  saveBudgetData, 
  loadBudgetData, 
  deleteBudgetData 
} from '@services/budget/budgetService';
import { supabase } from '@services/api/supabase';
import { 
  BudgetData, 
  FinancialRunway, 
  UnemploymentBenefit,
  CobraEstimate,
  BudgetAlert,
  STATE_UNEMPLOYMENT_RATES,
  COBRA_COST_ESTIMATES 
} from '@types';
import { BudgetEntry } from '@types';

/**
 * Initial state for budget store
 * Following Single Responsibility Principle - only defines state
 */
const initialState = createInitialState<Omit<BudgetStoreState, 'isLoading' | 'error'>>({
  budgetData: null,
  budgetEntries: [],
  runway: null,
  unemploymentBenefit: null,
  cobraEstimate: null,
  alerts: [],
  isSaving: false,
});

/**
 * Budget calculations implementation
 * Separated from state management for clarity
 */
const createBudgetCalculations: StateCreator<BudgetStore, [], [], Pick<BudgetStore, 
  'getTotalMonthlyIncome' | 
  'getTotalMonthlyExpenses' | 
  'getMonthlyBurn' | 
  'getDaysUntilCritical' | 
  'hasLowRunway'
>> = (set, get) => ({
  getTotalMonthlyIncome: () => {
    const budgetData = get().budgetData;
    const entries = get().budgetEntries.filter(e => e.is_active && e.type === 'income');
    
    let total = budgetData?.monthlyIncome || 0;
    
    entries.forEach(entry => {
      switch (entry.frequency) {
        case 'daily':
          total += entry.amount * 30;
          break;
        case 'weekly':
          total += entry.amount * 4.33;
          break;
        case 'monthly':
          total += entry.amount;
          break;
        case 'one-time':
          // One-time income is not included in monthly calculation
          break;
      }
    });
    
    return total;
  },

  getTotalMonthlyExpenses: () => {
    const budgetData = get().budgetData;
    const entries = get().budgetEntries.filter(e => e.is_active && e.type === 'expense');
    
    let total = budgetData?.monthlyExpenses || 0;
    
    entries.forEach(entry => {
      switch (entry.frequency) {
        case 'daily':
          total += entry.amount * 30;
          break;
        case 'weekly':
          total += entry.amount * 4.33;
          break;
        case 'monthly':
          total += entry.amount;
          break;
        case 'one-time':
          // One-time expenses are included in the first month
          total += entry.amount;
          break;
      }
    });
    
    // Add COBRA cost if applicable
    const cobraEstimate = get().cobraEstimate;
    if (cobraEstimate) {
      total += cobraEstimate.effectiveCost;
    }
    
    return total;
  },

  getMonthlyBurn: () => {
    const income = get().getTotalMonthlyIncome();
    const expenses = get().getTotalMonthlyExpenses();
    const unemploymentBenefit = get().unemploymentBenefit;
    
    const totalIncome = income + (unemploymentBenefit?.weeklyAmount || 0) * 4.33;
    
    return Math.max(0, expenses - totalIncome);
  },

  getDaysUntilCritical: () => {
    const runway = get().runway;
    return runway ? Math.max(0, runway.runwayInDays) : 0;
  },

  hasLowRunway: () => {
    const runway = get().runway;
    return runway ? runway.isLowRunway : false;
  },
});

/**
 * Budget data operations implementation
 * Handles CRUD operations for budget data
 */
const createBudgetDataOperations: StateCreator<BudgetStore, [], [], Pick<BudgetStore,
  'loadBudget' | 'saveBudget' | 'updateBudget' | 'deleteBudget'
>> = (set, get) => ({
  loadBudget: async () => {
    await handleAsyncOperation(
      set,
      async () => {
        const data = await loadBudgetData();
        
        if (data) {
          set({ budgetData: data });
          
          // Calculate related values
          get().calculateRunway();
          get().calculateUnemploymentBenefit(data.state);
          get().calculateCobraEstimate(data.state, 1); // Default to single coverage
          get().checkAlerts();
        }
        
        return data;
      },
      {
        onError: (error) => {
          console.error('Error loading budget:', error);
        }
      }
    );
  },

  saveBudget: async (data) => {
    await handleAsyncOperation(
      set,
      async () => {
        const existingData = get().budgetData;
        const budgetData: BudgetData = {
          id: existingData?.id || `local-${Date.now()}`,
          userId: '', // Will be set by service
          monthlyIncome: data.monthlyIncome || 0,
          currentSavings: data.currentSavings || 0,
          monthlyExpenses: data.monthlyExpenses || 0,
          severanceAmount: data.severanceAmount || 0,
          unemploymentBenefit: data.unemploymentBenefit || 0,
          unemploymentWeeks: data.unemploymentWeeks || 0,
          cobraCost: data.cobraCost || 0,
          state: data.state || 'CA',
          lastUpdated: new Date(),
          createdAt: existingData?.createdAt || new Date(),
        };
        
        const savedData = await saveBudgetData(budgetData);
        set({ budgetData: savedData });
        
        // Recalculate everything
        get().calculateRunway();
        get().calculateUnemploymentBenefit(savedData.state);
        get().checkAlerts();
        
        return savedData;
      },
      {
        loadingKey: 'isSaving',
        onError: (error) => {
          console.error('Error saving budget:', error);
          throw error;
        }
      }
    );
  },

  updateBudget: async (updates) => {
    const currentData = get().budgetData;
    if (!currentData) {
      await get().saveBudget(updates);
      return;
    }
    
    const updatedData = { ...currentData, ...updates };
    await get().saveBudget(updatedData);
  },

  deleteBudget: async () => {
    await handleAsyncOperation(
      set,
      async () => {
        await deleteBudgetData();
        set({ 
          budgetData: null,
          runway: null,
          unemploymentBenefit: null,
          cobraEstimate: null,
          alerts: [],
        });
      },
      {
        onError: (error) => {
          console.error('Error deleting budget:', error);
          throw error;
        }
      }
    );
  },
});

/**
 * Budget entries operations implementation
 * Handles CRUD operations for budget entries
 */
const createBudgetEntriesOperations: StateCreator<BudgetStore, [], [], Pick<BudgetStore,
  'loadBudgetEntries' | 'addBudgetEntry' | 'updateBudgetEntry' | 'deleteBudgetEntry' | 'toggleBudgetEntry'
>> = (set, get) => ({
  loadBudgetEntries: async (userId) => {
    try {
      const { data, error } = await supabase
        .from('budget_entries')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      set({ budgetEntries: data || [] });
      
      // Recalculate runway with new entries
      get().calculateRunway();
    } catch (error) {
      console.error('Error loading budget entries:', error);
      set({ error: error instanceof Error ? error.message : 'Failed to load budget entries' });
    }
  },

  addBudgetEntry: async (userId, entry) => {
    await handleAsyncOperation(
      set,
      async () => {
        const { data, error } = await supabase
          .from('budget_entries')
          .insert({
            ...entry,
            user_id: userId,
          })
          .select()
          .single();

        if (error) throw error;

        set((state) => ({
          budgetEntries: [data, ...state.budgetEntries],
        }));
        
        // Recalculate runway
        get().calculateRunway();
        get().checkAlerts();
        
        return data;
      },
      {
        onError: (error) => {
          console.error('Error adding budget entry:', error);
          throw error;
        }
      }
    );
  },

  updateBudgetEntry: async (id, updates) => {
    await handleAsyncOperation(
      set,
      async () => {
        const { data, error } = await supabase
          .from('budget_entries')
          .update(updates)
          .eq('id', id)
          .select()
          .single();

        if (error) throw error;

        set((state) => ({
          budgetEntries: state.budgetEntries.map(entry =>
            entry.id === id ? data : entry
          ),
        }));
        
        // Recalculate runway
        get().calculateRunway();
        get().checkAlerts();
        
        return data;
      },
      {
        onError: (error) => {
          console.error('Error updating budget entry:', error);
          throw error;
        }
      }
    );
  },

  deleteBudgetEntry: async (id) => {
    await handleAsyncOperation(
      set,
      async () => {
        const { error } = await supabase
          .from('budget_entries')
          .delete()
          .eq('id', id);

        if (error) throw error;

        set((state) => ({
          budgetEntries: state.budgetEntries.filter(entry => entry.id !== id),
        }));
        
        // Recalculate runway
        get().calculateRunway();
        get().checkAlerts();
      },
      {
        onError: (error) => {
          console.error('Error deleting budget entry:', error);
          throw error;
        }
      }
    );
  },

  toggleBudgetEntry: async (id) => {
    const entry = get().budgetEntries.find(e => e.id === id);
    if (!entry) return;
    
    await get().updateBudgetEntry(id, { is_active: !entry.is_active });
  },
});

/**
 * Budget calculation operations implementation
 * Handles financial calculations
 */
const createBudgetCalculationOperations: StateCreator<BudgetStore, [], [], Pick<BudgetStore,
  'calculateRunway' | 'calculateUnemploymentBenefit' | 'calculateCobraEstimate'
>> = (set, get) => ({
  calculateRunway: () => {
    const budgetData = get().budgetData;
    if (!budgetData) return;
    
    const totalIncome = get().getTotalMonthlyIncome();
    const totalExpenses = get().getTotalMonthlyExpenses();
    const unemploymentBenefit = get().unemploymentBenefit;
    
    // Calculate total available funds
    const totalAvailableFunds = 
      budgetData.currentSavings + 
      budgetData.severanceAmount +
      (unemploymentBenefit?.totalBenefit || 0);
    
    // Calculate monthly burn rate
    const monthlyBurn = totalExpenses - totalIncome;
    
    // Calculate runway
    const runwayInMonths = monthlyBurn > 0 
      ? totalAvailableFunds / monthlyBurn 
      : Infinity;
    
    const runwayInDays = runwayInMonths * 30;
    
    const projectedEndDate = new Date();
    projectedEndDate.setDate(projectedEndDate.getDate() + runwayInDays);
    
    const runway: FinancialRunway = {
      totalAvailableFunds,
      monthlyBurn,
      runwayInDays: Math.floor(runwayInDays),
      runwayInMonths: parseFloat(runwayInMonths.toFixed(1)),
      totalMonths: parseFloat(runwayInMonths.toFixed(1)),
      isLowRunway: runwayInDays < 60,
      projectedEndDate,
    };
    
    set({ runway });
  },

  calculateUnemploymentBenefit: (state, weeklyIncome) => {
    const stateData = STATE_UNEMPLOYMENT_RATES[state];
    if (!stateData) return;
    
    // Calculate weekly benefit (simplified - actual calculation varies by state)
    const weeklyBenefit = weeklyIncome 
      ? Math.min(weeklyIncome * 0.5, stateData.maxWeeklyBenefit)
      : stateData.maxWeeklyBenefit * 0.7; // Estimate at 70% of max if no income provided
    
    const unemploymentBenefit: UnemploymentBenefit = {
      weeklyAmount: Math.floor(weeklyBenefit),
      maxWeeks: stateData.maxWeeks,
      totalBenefit: Math.floor(weeklyBenefit * stateData.maxWeeks),
      state,
    };
    
    set({ unemploymentBenefit });
    
    // Update budget data with unemployment info
    const budgetData = get().budgetData;
    if (budgetData) {
      get().updateBudget({
        unemploymentBenefit: unemploymentBenefit.weeklyAmount,
        unemploymentWeeks: unemploymentBenefit.maxWeeks,
      });
    }
  },

  calculateCobraEstimate: (state, dependentsCount) => {
    const stateCosts = COBRA_COST_ESTIMATES[state] || COBRA_COST_ESTIMATES.default;
    const isFamily = dependentsCount > 0;
    const monthlyPremium = isFamily ? stateCosts.family : stateCosts.single;
    
    // Check for subsidy eligibility (simplified)
    const subsidyEligible = true; // In reality, this would check income levels
    const subsidyAmount = subsidyEligible ? monthlyPremium * 0.65 : 0;
    
    const cobraEstimate: CobraEstimate = {
      monthlyPremium,
      subsidyEligible,
      subsidyAmount,
      effectiveCost: monthlyPremium - subsidyAmount,
    };
    
    set({ cobraEstimate });
    
    // Update budget data with COBRA cost
    const budgetData = get().budgetData;
    if (budgetData) {
      get().updateBudget({
        cobraCost: cobraEstimate.effectiveCost,
      });
    }
  },
});

/**
 * Budget alert operations implementation
 * Handles alert management
 */
const createBudgetAlertOperations: StateCreator<BudgetStore, [], [], Pick<BudgetStore,
  'checkAlerts' | 'dismissAlert' | 'clearAlerts'
>> = (set, get) => ({
  checkAlerts: () => {
    const runway = get().runway;
    const unemploymentBenefit = get().unemploymentBenefit;
    const alerts: BudgetAlert[] = [];
    
    if (runway) {
      // Critical runway alert (less than 30 days)
      if (runway.runwayInDays < 30) {
        alerts.push({
          id: 'critical_runway',
          type: 'critical_runway',
          title: 'Critical Financial Runway',
          message: `You have less than ${Math.floor(runway.runwayInDays)} days of runway remaining. Consider immediate action.`,
          severity: 'critical',
          createdAt: new Date(),
          dismissed: false,
        });
      }
      // Low runway alert (less than 60 days)
      else if (runway.runwayInDays < 60) {
        alerts.push({
          id: 'low_runway',
          type: 'low_runway',
          title: 'Low Financial Runway',
          message: `You have approximately ${Math.floor(runway.runwayInMonths)} months of runway. Time to review your budget.`,
          severity: 'warning',
          createdAt: new Date(),
          dismissed: false,
        });
      }
    }
    
    // Unemployment benefit expiring
    if (unemploymentBenefit && unemploymentBenefit.maxWeeks <= 4) {
      alerts.push({
        id: 'benefit_expiring',
        type: 'benefit_expiring',
        title: 'Unemployment Benefits Expiring Soon',
        message: `Your unemployment benefits will expire in ${unemploymentBenefit.maxWeeks} weeks.`,
        severity: 'warning',
        createdAt: new Date(),
        dismissed: false,
      });
    }
    
    set({ alerts });
  },

  dismissAlert: (alertId) => {
    set((state) => ({
      alerts: state.alerts.map(alert =>
        alert.id === alertId ? { ...alert, dismissed: true } : alert
      ),
    }));
  },

  clearAlerts: () => {
    set({ alerts: [] });
  },
});

/**
 * Complete budget store creator
 * Combines all budget functionality using composition
 */
const budgetStoreCreator: StateCreator<BudgetStore, [], [], BudgetStore> = (set, get) => ({
  ...initialState,
  ...createBudgetCalculations(set, get, {} as any),
  ...createBudgetDataOperations(set, get, {} as any),
  ...createBudgetEntriesOperations(set, get, {} as any),
  ...createBudgetCalculationOperations(set, get, {} as any),
  ...createBudgetAlertOperations(set, get, {} as any),
  
  // Reset function
  reset: () => {
    set(initialState);
  },
});

/**
 * Create and export the budget store
 * Using factory pattern for consistent configuration
 */
export const useBudgetStore = createStore<BudgetStore>(
  budgetStoreCreator,
  {
    name: 'budget-store',
    persist: true,
    partialize: (state) => ({
      alerts: state.alerts.filter(a => !a.dismissed),
    }),
  }
);