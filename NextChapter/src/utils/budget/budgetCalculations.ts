import {
  BudgetData,
  BudgetFormData,
  FinancialRunway,
  UnemploymentBenefit,
  CobraEstimate,
  BudgetAlert,
  STATE_UNEMPLOYMENT_RATES,
  COBRA_COST_ESTIMATES,
} from '../../types/budget';

/**
 * Calculate financial runway based on current budget data
 */
export function calculateFinancialRunway(budgetData: BudgetData): FinancialRunway {
  const totalAvailableFunds =
    (budgetData.currentSavings || 0) +
    (budgetData.severanceAmount || 0) +
    (budgetData.unemploymentBenefit || 0) * (budgetData.unemploymentWeeks || 0);

  const monthlyBurn = calculateMonthlyBurn(budgetData);

  let runwayInMonths = 0;
  let runwayInDays = 0;
  let projectedEndDate = new Date();

  if (monthlyBurn > 0) {
    runwayInMonths = totalAvailableFunds / monthlyBurn;
    runwayInDays = Math.floor(runwayInMonths * 30);
    projectedEndDate = new Date();
    projectedEndDate.setDate(projectedEndDate.getDate() + runwayInDays);
  } else {
    runwayInMonths = Infinity;
    runwayInDays = Infinity;
    projectedEndDate = new Date('2099-12-31');
  }

  const isLowRunway = runwayInDays < 60 && runwayInDays !== Infinity;

  const roundedRunwayInMonths = Math.round(runwayInMonths * 10) / 10; // Round to 1 decimal
  
  return {
    totalAvailableFunds,
    monthlyBurn,
    runwayInDays,
    runwayInMonths: roundedRunwayInMonths,
    totalMonths: roundedRunwayInMonths, // For backward compatibility
    isLowRunway,
    projectedEndDate,
  };
}

/**
 * Calculate monthly burn rate including all expenses
 */
export function calculateMonthlyBurn(budgetData: BudgetData): number {
  return (budgetData.monthlyExpenses || 0) + (budgetData.cobraCost || 0);
}

/**
 * Calculate unemployment benefit based on state and previous income
 */
export function calculateUnemploymentBenefit(formData: BudgetFormData): UnemploymentBenefit {
  const stateData = STATE_UNEMPLOYMENT_RATES[formData.state];
  
  if (!stateData) {
    return {
      weeklyAmount: 0,
      maxWeeks: 0,
      totalBenefit: 0,
      state: formData.state,
    };
  }

  // Calculate weekly benefit (typically 50% of weekly wage, up to state max)
  const weeklyWage = formData.monthlyIncome / 4.33; // Average weeks per month
  const calculatedBenefit = weeklyWage * 0.5;
  const weeklyAmount = Math.min(calculatedBenefit, stateData.maxWeeklyBenefit);

  return {
    weeklyAmount: Math.round(weeklyAmount),
    maxWeeks: stateData.maxWeeks,
    totalBenefit: Math.round(weeklyAmount * stateData.maxWeeks),
    state: formData.state,
  };
}

/**
 * Estimate COBRA cost based on state and family size
 */
export function estimateCobraCost(formData: BudgetFormData): CobraEstimate {
  if (!formData.hasHealthInsurance) {
    return {
      monthlyPremium: 0,
      subsidyEligible: false,
      subsidyAmount: 0,
      effectiveCost: 0,
    };
  }

  const stateRates = COBRA_COST_ESTIMATES[formData.state] || COBRA_COST_ESTIMATES.default;
  const isFamily = formData.dependentsCount > 0;
  const monthlyPremium = isFamily ? stateRates.family : stateRates.single;

  // Check for potential subsidies (simplified logic)
  const subsidyEligible = formData.monthlyIncome < 4000 && formData.dependentsCount > 1;
  const subsidyAmount = subsidyEligible ? monthlyPremium * 0.3 : 0;

  return {
    monthlyPremium,
    subsidyEligible,
    subsidyAmount,
    effectiveCost: monthlyPremium - subsidyAmount,
  };
}

/**
 * Generate budget alerts based on current financial situation
 */
export function generateBudgetAlerts(budgetData: BudgetData): BudgetAlert[] {
  const alerts: BudgetAlert[] = [];
  const runway = calculateFinancialRunway(budgetData);

  // Critical runway alert (less than 30 days)
  if (runway.runwayInDays < 30 && runway.runwayInDays !== Infinity) {
    alerts.push({
      id: `critical-runway-${Date.now()}`,
      type: 'critical_runway',
      title: 'Critical Financial Runway',
      message: `You have less than 30 days of runway remaining. Immediate action needed.`,
      severity: 'critical',
      createdAt: new Date(),
      dismissed: false,
    });
  }
  // Low runway alert (less than 60 days)
  else if (runway.runwayInDays < 60 && runway.runwayInDays !== Infinity) {
    alerts.push({
      id: `low-runway-${Date.now()}`,
      type: 'low_runway',
      title: 'Low Financial Runway',
      message: `You have less than 60 days of runway remaining. Consider reducing expenses.`,
      severity: 'warning',
      createdAt: new Date(),
      dismissed: false,
    });
  }

  // Benefit expiring alert
  if (budgetData.unemploymentWeeks && budgetData.unemploymentWeeks <= 4 && budgetData.unemploymentWeeks > 0) {
    alerts.push({
      id: `benefit-expiring-${Date.now()}`,
      type: 'benefit_expiring',
      title: 'Unemployment Benefits Expiring Soon',
      message: `Your unemployment benefits will expire in ${budgetData.unemploymentWeeks} weeks.`,
      severity: 'warning',
      createdAt: new Date(),
      dismissed: false,
    });
  }

  return alerts;
}

/**
 * Format currency for display
 */
export function formatCurrency(amount: number): string {
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return formatter.format(amount);
}

/**
 * Parse currency string to number
 */
export function parseCurrency(value: string): number {
  const cleaned = value.replace(/[^0-9.-]+/g, '');
  return parseFloat(cleaned) || 0;
}

/**
 * Format date for display
 */
export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
}

/**
 * Format relative time (e.g., "2 hours ago")
 */
export function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays < 30) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  
  return formatDate(date);
}