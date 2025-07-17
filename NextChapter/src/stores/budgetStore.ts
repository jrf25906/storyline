import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BudgetEntry, BudgetType, BudgetFrequency } from '../types/database';
import { 
  BudgetData, 
  FinancialRunway, 
  UnemploymentBenefit,
  CobraEstimate,
  BudgetAlert,
  BudgetAlertType,
  STATE_UNEMPLOYMENT_RATES,
  COBRA_COST_ESTIMATES 
} from '../types/budget';
import { saveBudgetData, loadBudgetData, deleteBudgetData } from '../services/budget/budgetService';
import { supabase } from '../services/api/supabase';

interface BudgetStore {
  // State
  budgetData: BudgetData | null;
  budgetEntries: BudgetEntry[];
  runway: FinancialRunway | null;
  unemploymentBenefit: UnemploymentBenefit | null;
  cobraEstimate: CobraEstimate | null;
  alerts: BudgetAlert[];
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;

  // Computed values
  getTotalMonthlyIncome: () => number;
  getTotalMonthlyExpenses: () => number;
  getMonthlyBurn: () => number;
  getDaysUntilCritical: () => number;
  hasLowRunway: () => boolean;

  // Budget data actions
  loadBudget: () => Promise<void>;
  saveBudget: (data: Partial<BudgetData>) => Promise<void>;
  updateBudget: (updates: Partial<BudgetData>) => Promise<void>;
  deleteBudget: () => Promise<void>;

  // Budget entries actions
  loadBudgetEntries: (userId: string) => Promise<void>;
  addBudgetEntry: (userId: string, entry: Omit<BudgetEntry, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => Promise<void>;
  updateBudgetEntry: (id: string, updates: Partial<BudgetEntry>) => Promise<void>;
  deleteBudgetEntry: (id: string) => Promise<void>;
  toggleBudgetEntry: (id: string) => Promise<void>;

  // Calculations
  calculateRunway: () => void;
  calculateUnemploymentBenefit: (state: string, weeklyIncome?: number) => void;
  calculateCobraEstimate: (state: string, dependentsCount: number) => void;

  // Alerts
  checkAlerts: () => void;
  dismissAlert: (alertId: string) => void;
  clearAlerts: () => void;

  // Utility
  reset: () => void;
}

const initialState = {
  budgetData: null,
  budgetEntries: [],
  runway: null,
  unemploymentBenefit: null,
  cobraEstimate: null,
  alerts: [],
  isLoading: false,
  isSaving: false,
  error: null,
};

export const useBudgetStore = create<BudgetStore>()(
  devtools(
    persist(
      (set, get) => ({
        ...initialState,

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

        loadBudget: async () => {
          set({ isLoading: true, error: null });
          try {
            const data = await loadBudgetData();
            
            if (data) {
              set({ budgetData: data });
              
              // Calculate related values
              get().calculateRunway();
              get().calculateUnemploymentBenefit(data.state);
              get().calculateCobraEstimate(data.state, 1); // Default to single coverage
              get().checkAlerts();
            }
            
            set({ isLoading: false });
          } catch (error) {
            console.error('Error loading budget:', error);
            set({ 
              error: error instanceof Error ? error.message : 'Failed to load budget',
              isLoading: false 
            });
          }
        },

        saveBudget: async (data) => {
          set({ isSaving: true, error: null });
          try {
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
            set({ budgetData: savedData, isSaving: false });
            
            // Recalculate everything
            get().calculateRunway();
            get().calculateUnemploymentBenefit(savedData.state);
            get().checkAlerts();
          } catch (error) {
            console.error('Error saving budget:', error);
            set({ 
              error: error instanceof Error ? error.message : 'Failed to save budget',
              isSaving: false 
            });
            throw error;
          }
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
          set({ isLoading: true, error: null });
          try {
            await deleteBudgetData();
            set({ 
              budgetData: null,
              runway: null,
              unemploymentBenefit: null,
              cobraEstimate: null,
              alerts: [],
              isLoading: false 
            });
          } catch (error) {
            console.error('Error deleting budget:', error);
            set({ 
              error: error instanceof Error ? error.message : 'Failed to delete budget',
              isLoading: false 
            });
            throw error;
          }
        },

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
          set({ isLoading: true, error: null });
          try {
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
              isLoading: false,
            }));
            
            // Recalculate runway
            get().calculateRunway();
            get().checkAlerts();
          } catch (error) {
            console.error('Error adding budget entry:', error);
            set({ 
              error: error instanceof Error ? error.message : 'Failed to add budget entry',
              isLoading: false 
            });
            throw error;
          }
        },

        updateBudgetEntry: async (id, updates) => {
          set({ isLoading: true, error: null });
          try {
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
              isLoading: false,
            }));
            
            // Recalculate runway
            get().calculateRunway();
            get().checkAlerts();
          } catch (error) {
            console.error('Error updating budget entry:', error);
            set({ 
              error: error instanceof Error ? error.message : 'Failed to update budget entry',
              isLoading: false 
            });
            throw error;
          }
        },

        deleteBudgetEntry: async (id) => {
          set({ isLoading: true, error: null });
          try {
            const { error } = await supabase
              .from('budget_entries')
              .delete()
              .eq('id', id);

            if (error) throw error;

            set((state) => ({
              budgetEntries: state.budgetEntries.filter(entry => entry.id !== id),
              isLoading: false,
            }));
            
            // Recalculate runway
            get().calculateRunway();
            get().checkAlerts();
          } catch (error) {
            console.error('Error deleting budget entry:', error);
            set({ 
              error: error instanceof Error ? error.message : 'Failed to delete budget entry',
              isLoading: false 
            });
            throw error;
          }
        },

        toggleBudgetEntry: async (id) => {
          const entry = get().budgetEntries.find(e => e.id === id);
          if (!entry) return;
          
          await get().updateBudgetEntry(id, { is_active: !entry.is_active });
        },

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

        reset: () => {
          set(initialState);
        },
      }),
      {
        name: 'budget-store',
        storage: {
          getItem: async (name) => {
            const value = await AsyncStorage.getItem(name);
            return value ? JSON.parse(value) : null;
          },
          setItem: async (name, value) => {
            await AsyncStorage.setItem(name, JSON.stringify(value));
          },
          removeItem: async (name) => {
            await AsyncStorage.removeItem(name);
          },
        },
        partialize: (state) => ({
          alerts: state.alerts.filter(a => !a.dismissed),
        }),
      }
    ),
    {
      name: 'BudgetStore',
    }
  )
);