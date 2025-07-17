export interface BudgetData {
  id: string;
  userId: string;
  monthlyIncome: number;
  currentSavings: number;
  monthlyExpenses: number;
  severanceAmount: number;
  unemploymentBenefit: number;
  unemploymentWeeks: number;
  cobraCost: number;
  state: string;
  lastUpdated: Date;
  createdAt: Date;
}

export interface FinancialRunway {
  totalAvailableFunds: number;
  monthlyBurn: number;
  runwayInDays: number;
  runwayInMonths: number;
  totalMonths: number; // Total months of runway (same as runwayInMonths, for backward compatibility)
  isLowRunway: boolean;
  projectedEndDate: Date;
}

export interface UnemploymentBenefit {
  weeklyAmount: number;
  maxWeeks: number;
  totalBenefit: number;
  state: string;
}

export interface BudgetFormData {
  monthlyIncome: number;
  currentSavings: number;
  monthlyExpenses: number;
  severanceAmount: number;
  state: string;
  hasHealthInsurance: boolean;
  dependentsCount: number;
}

export interface CobraEstimate {
  monthlyPremium: number;
  subsidyEligible: boolean;
  subsidyAmount: number;
  effectiveCost: number;
}

export type BudgetAlertType = 'low_runway' | 'critical_runway' | 'expense_increase' | 'benefit_expiring';

export interface BudgetAlert {
  id: string;
  type: BudgetAlertType;
  title: string;
  message: string;
  severity: 'info' | 'warning' | 'critical';
  createdAt: Date;
  dismissed: boolean;
}

// State unemployment benefit rates (2024 data)
export const STATE_UNEMPLOYMENT_RATES: Record<string, { maxWeeklyBenefit: number; maxWeeks: number }> = {
  'AL': { maxWeeklyBenefit: 275, maxWeeks: 14 },
  'AK': { maxWeeklyBenefit: 370, maxWeeks: 26 },
  'AZ': { maxWeeklyBenefit: 320, maxWeeks: 24 },
  'AR': { maxWeeklyBenefit: 451, maxWeeks: 16 },
  'CA': { maxWeeklyBenefit: 450, maxWeeks: 26 },
  'CO': { maxWeeklyBenefit: 781, maxWeeks: 26 },
  'CT': { maxWeeklyBenefit: 703, maxWeeks: 26 },
  'DE': { maxWeeklyBenefit: 450, maxWeeks: 26 },
  'FL': { maxWeeklyBenefit: 275, maxWeeks: 12 },
  'GA': { maxWeeklyBenefit: 365, maxWeeks: 14 },
  'HI': { maxWeeklyBenefit: 763, maxWeeks: 26 },
  'ID': { maxWeeklyBenefit: 505, maxWeeks: 21 },
  'IL': { maxWeeklyBenefit: 541, maxWeeks: 26 },
  'IN': { maxWeeklyBenefit: 390, maxWeeks: 26 },
  'IA': { maxWeeklyBenefit: 591, maxWeeks: 26 },
  'KS': { maxWeeklyBenefit: 540, maxWeeks: 16 },
  'KY': { maxWeeklyBenefit: 626, maxWeeks: 26 },
  'LA': { maxWeeklyBenefit: 275, maxWeeks: 26 },
  'ME': { maxWeeklyBenefit: 498, maxWeeks: 26 },
  'MD': { maxWeeklyBenefit: 430, maxWeeks: 26 },
  'MA': { maxWeeklyBenefit: 1033, maxWeeks: 26 },
  'MI': { maxWeeklyBenefit: 362, maxWeeks: 20 },
  'MN': { maxWeeklyBenefit: 857, maxWeeks: 26 },
  'MS': { maxWeeklyBenefit: 235, maxWeeks: 26 },
  'MO': { maxWeeklyBenefit: 320, maxWeeks: 20 },
  'MT': { maxWeeklyBenefit: 643, maxWeeks: 28 },
  'NE': { maxWeeklyBenefit: 532, maxWeeks: 26 },
  'NV': { maxWeeklyBenefit: 522, maxWeeks: 26 },
  'NH': { maxWeeklyBenefit: 427, maxWeeks: 26 },
  'NJ': { maxWeeklyBenefit: 830, maxWeeks: 26 },
  'NM': { maxWeeklyBenefit: 595, maxWeeks: 26 },
  'NY': { maxWeeklyBenefit: 504, maxWeeks: 26 },
  'NC': { maxWeeklyBenefit: 350, maxWeeks: 12 },
  'ND': { maxWeeklyBenefit: 701, maxWeeks: 26 },
  'OH': { maxWeeklyBenefit: 598, maxWeeks: 26 },
  'OK': { maxWeeklyBenefit: 620, maxWeeks: 26 },
  'OR': { maxWeeklyBenefit: 877, maxWeeks: 26 },
  'PA': { maxWeeklyBenefit: 605, maxWeeks: 26 },
  'RI': { maxWeeklyBenefit: 753, maxWeeks: 26 },
  'SC': { maxWeeklyBenefit: 326, maxWeeks: 20 },
  'SD': { maxWeeklyBenefit: 528, maxWeeks: 26 },
  'TN': { maxWeeklyBenefit: 275, maxWeeks: 26 },
  'TX': { maxWeeklyBenefit: 577, maxWeeks: 26 },
  'UT': { maxWeeklyBenefit: 709, maxWeeks: 26 },
  'VT': { maxWeeklyBenefit: 705, maxWeeks: 26 },
  'VA': { maxWeeklyBenefit: 378, maxWeeks: 26 },
  'WA': { maxWeeklyBenefit: 1019, maxWeeks: 26 },
  'WV': { maxWeeklyBenefit: 586, maxWeeks: 26 },
  'WI': { maxWeeklyBenefit: 370, maxWeeks: 26 },
  'WY': { maxWeeklyBenefit: 665, maxWeeks: 26 },
};

// Average COBRA costs by state (2024 estimates)
export const COBRA_COST_ESTIMATES: Record<string, { single: number; family: number }> = {
  'default': { single: 650, family: 1850 },
  'CA': { single: 750, family: 2100 },
  'NY': { single: 780, family: 2200 },
  'TX': { single: 620, family: 1750 },
  'FL': { single: 680, family: 1900 },
  // Add more states as needed
};