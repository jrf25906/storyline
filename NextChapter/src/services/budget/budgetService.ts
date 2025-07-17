import { supabase } from '../api/supabase';
import { BudgetData } from '../../types/budget';
import CryptoJS from 'crypto-js';

// Encryption key - in production, this should be stored securely
const ENCRYPTION_KEY = process.env.EXPO_PUBLIC_ENCRYPTION_KEY || 'next-chapter-budget-key';

/**
 * Encrypt sensitive financial data
 */
function encryptData(data: string | number): string {
  return CryptoJS.AES.encrypt(data.toString(), ENCRYPTION_KEY).toString();
}

/**
 * Decrypt sensitive financial data
 */
function decryptData(encryptedData: string): string {
  const bytes = CryptoJS.AES.decrypt(encryptedData, ENCRYPTION_KEY);
  return bytes.toString(CryptoJS.enc.Utf8);
}

/**
 * Convert BudgetData to database format with encryption
 */
function toDbFormat(budgetData: BudgetData): any {
  return {
    id: budgetData.id.startsWith('local-') ? undefined : budgetData.id,
    user_id: budgetData.userId,
    // Encrypt sensitive financial data
    monthly_income: encryptData(budgetData.monthlyIncome),
    current_savings: encryptData(budgetData.currentSavings),
    severance_amount: encryptData(budgetData.severanceAmount),
    // Non-sensitive data stored as-is
    monthly_expenses: budgetData.monthlyExpenses,
    unemployment_benefit: budgetData.unemploymentBenefit,
    unemployment_weeks: budgetData.unemploymentWeeks,
    cobra_cost: budgetData.cobraCost,
    state: budgetData.state,
    last_updated: budgetData.lastUpdated.toISOString(),
    created_at: budgetData.createdAt.toISOString(),
  };
}

/**
 * Convert database format to BudgetData with decryption
 */
function fromDbFormat(dbData: any): BudgetData {
  return {
    id: dbData.id,
    userId: dbData.user_id,
    // Decrypt sensitive financial data
    monthlyIncome: parseFloat(decryptData(dbData.monthly_income)),
    currentSavings: parseFloat(decryptData(dbData.current_savings)),
    severanceAmount: parseFloat(decryptData(dbData.severance_amount)),
    // Non-sensitive data
    monthlyExpenses: dbData.monthly_expenses,
    unemploymentBenefit: dbData.unemployment_benefit,
    unemploymentWeeks: dbData.unemployment_weeks,
    cobraCost: dbData.cobra_cost,
    state: dbData.state,
    lastUpdated: new Date(dbData.last_updated),
    createdAt: new Date(dbData.created_at),
  };
}

/**
 * Save budget data to Supabase
 */
export async function saveBudgetData(budgetData: BudgetData): Promise<BudgetData> {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('User not authenticated');
  }

  const dbData = toDbFormat({ ...budgetData, userId: user.id });

  let result;
  
  if (budgetData.id && !budgetData.id.startsWith('local-')) {
    // Update existing record
    const { data, error } = await supabase
      .from('budget_data')
      .update(dbData)
      .eq('id', budgetData.id)
      .select()
      .single();

    if (error) throw error;
    result = data;
  } else {
    // Insert new record
    const { data, error } = await supabase
      .from('budget_data')
      .insert([dbData])
      .select()
      .single();

    if (error) throw error;
    result = data;
  }

  return fromDbFormat(result);
}

/**
 * Load budget data from Supabase
 */
export async function loadBudgetData(): Promise<BudgetData | null> {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('User not authenticated');
  }

  const { data, error } = await supabase
    .from('budget_data')
    .select('*')
    .eq('user_id', user.id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // No rows found
      return null;
    }
    throw error;
  }

  return fromDbFormat(data);
}

/**
 * Delete budget data from Supabase
 */
export async function deleteBudgetData(): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('User not authenticated');
  }

  const { error } = await supabase
    .from('budget_data')
    .delete()
    .eq('user_id', user.id);

  if (error) throw error;
}