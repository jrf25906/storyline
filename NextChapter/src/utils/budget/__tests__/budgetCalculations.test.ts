import {
  calculateFinancialRunway,
  calculateUnemploymentBenefit,
  estimateCobraCost,
  generateBudgetAlerts,
  formatCurrency,
  calculateMonthlyBurn,
} from '@utils/budget/budgetCalculations';
import { 
  BudgetData, 
  BudgetFormData, 
  STATE_UNEMPLOYMENT_RATES 
} from '../../../types/budget';

describe('Budget Calculations', () => {
  describe('calculateFinancialRunway', () => {
    it('should calculate runway correctly with all income sources', () => {
      const budgetData: Partial<BudgetData> = {
        currentSavings: 10000,
        severanceAmount: 5000,
        monthlyExpenses: 3000,
        unemploymentBenefit: 400,
        unemploymentWeeks: 26,
        cobraCost: 650,
      };

      const runway = calculateFinancialRunway(budgetData as BudgetData);

      expect(runway.totalAvailableFunds).toBe(25400); // 10000 + 5000 + (400 * 26)
      expect(runway.monthlyBurn).toBe(3650); // 3000 + 650
      expect(runway.runwayInMonths).toBeCloseTo(6.96, 2);
      expect(runway.runwayInDays).toBe(209); // ~6.96 months * 30 days
      expect(runway.isLowRunway).toBe(false);
    });

    it('should flag low runway when less than 60 days', () => {
      const budgetData: Partial<BudgetData> = {
        currentSavings: 5000,
        severanceAmount: 0,
        monthlyExpenses: 3000,
        unemploymentBenefit: 0,
        unemploymentWeeks: 0,
        cobraCost: 0,
      };

      const runway = calculateFinancialRunway(budgetData as BudgetData);

      expect(runway.runwayInDays).toBe(50); // 5000 / 3000 * 30
      expect(runway.isLowRunway).toBe(true);
    });

    it('should handle zero monthly burn gracefully', () => {
      const budgetData: Partial<BudgetData> = {
        currentSavings: 5000,
        severanceAmount: 0,
        monthlyExpenses: 0,
        unemploymentBenefit: 0,
        unemploymentWeeks: 0,
        cobraCost: 0,
      };

      const runway = calculateFinancialRunway(budgetData as BudgetData);

      expect(runway.runwayInMonths).toBe(Infinity);
      expect(runway.runwayInDays).toBe(Infinity);
      expect(runway.isLowRunway).toBe(false);
    });

    it('should calculate projected end date correctly', () => {
      const budgetData: Partial<BudgetData> = {
        currentSavings: 9000,
        severanceAmount: 0,
        monthlyExpenses: 3000,
        unemploymentBenefit: 0,
        unemploymentWeeks: 0,
        cobraCost: 0,
      };

      const runway = calculateFinancialRunway(budgetData as BudgetData);
      const expectedEndDate = new Date();
      expectedEndDate.setDate(expectedEndDate.getDate() + 90); // 3 months

      expect(runway.projectedEndDate.toDateString()).toBe(expectedEndDate.toDateString());
    });
  });

  describe('calculateUnemploymentBenefit', () => {
    it('should calculate unemployment benefit based on state and income', () => {
      const formData: BudgetFormData = {
        monthlyIncome: 6000, // $72k/year
        currentSavings: 0,
        monthlyExpenses: 0,
        severanceAmount: 0,
        state: 'CA',
        hasHealthInsurance: false,
        dependentsCount: 0,
      };

      const benefit = calculateUnemploymentBenefit(formData);

      expect(benefit.state).toBe('CA');
      expect(benefit.weeklyAmount).toBe(450); // CA max is $450
      expect(benefit.maxWeeks).toBe(26);
      expect(benefit.totalBenefit).toBe(11700); // 450 * 26
    });

    it('should calculate partial benefit for lower income', () => {
      const formData: BudgetFormData = {
        monthlyIncome: 2000, // $24k/year
        currentSavings: 0,
        monthlyExpenses: 0,
        severanceAmount: 0,
        state: 'CA',
        hasHealthInsurance: false,
        dependentsCount: 0,
      };

      const benefit = calculateUnemploymentBenefit(formData);

      expect(benefit.weeklyAmount).toBeLessThan(450);
      expect(benefit.weeklyAmount).toBeGreaterThan(0);
    });

    it('should handle invalid state gracefully', () => {
      const formData: BudgetFormData = {
        monthlyIncome: 5000,
        currentSavings: 0,
        monthlyExpenses: 0,
        severanceAmount: 0,
        state: 'XX', // Invalid state
        hasHealthInsurance: false,
        dependentsCount: 0,
      };

      const benefit = calculateUnemploymentBenefit(formData);

      expect(benefit.weeklyAmount).toBe(0);
      expect(benefit.maxWeeks).toBe(0);
      expect(benefit.totalBenefit).toBe(0);
    });

    it('should handle states with different max weeks correctly', () => {
      const formData: BudgetFormData = {
        monthlyIncome: 5000,
        currentSavings: 0,
        monthlyExpenses: 0,
        severanceAmount: 0,
        state: 'FL', // FL has 12 weeks max
        hasHealthInsurance: false,
        dependentsCount: 0,
      };

      const benefit = calculateUnemploymentBenefit(formData);

      expect(benefit.maxWeeks).toBe(12);
      expect(benefit.totalBenefit).toBe(benefit.weeklyAmount * 12);
    });
  });

  describe('estimateCobraCost', () => {
    it('should estimate COBRA cost for single coverage', () => {
      const formData: BudgetFormData = {
        monthlyIncome: 5000,
        currentSavings: 0,
        monthlyExpenses: 0,
        severanceAmount: 0,
        state: 'CA',
        hasHealthInsurance: true,
        dependentsCount: 0,
      };

      const cobra = estimateCobraCost(formData);

      expect(cobra.monthlyPremium).toBe(750); // CA single rate
      expect(cobra.effectiveCost).toBe(750);
      expect(cobra.subsidyEligible).toBe(false);
    });

    it('should estimate COBRA cost for family coverage', () => {
      const formData: BudgetFormData = {
        monthlyIncome: 5000,
        currentSavings: 0,
        monthlyExpenses: 0,
        severanceAmount: 0,
        state: 'CA',
        hasHealthInsurance: true,
        dependentsCount: 2,
      };

      const cobra = estimateCobraCost(formData);

      expect(cobra.monthlyPremium).toBe(2100); // CA family rate
    });

    it('should return zero cost if no health insurance', () => {
      const formData: BudgetFormData = {
        monthlyIncome: 5000,
        currentSavings: 0,
        monthlyExpenses: 0,
        severanceAmount: 0,
        state: 'CA',
        hasHealthInsurance: false,
        dependentsCount: 0,
      };

      const cobra = estimateCobraCost(formData);

      expect(cobra.monthlyPremium).toBe(0);
      expect(cobra.effectiveCost).toBe(0);
    });

    it('should use default rates for unknown states', () => {
      const formData: BudgetFormData = {
        monthlyIncome: 5000,
        currentSavings: 0,
        monthlyExpenses: 0,
        severanceAmount: 0,
        state: 'WY', // Not in COBRA_COST_ESTIMATES
        hasHealthInsurance: true,
        dependentsCount: 0,
      };

      const cobra = estimateCobraCost(formData);

      expect(cobra.monthlyPremium).toBe(650); // default single rate
    });
  });

  describe('generateBudgetAlerts', () => {
    it('should generate critical runway alert for less than 30 days', () => {
      const budgetData: Partial<BudgetData> = {
        id: 'test-id',
        currentSavings: 2000,
        monthlyExpenses: 3000,
        severanceAmount: 0,
        unemploymentBenefit: 0,
        unemploymentWeeks: 0,
        cobraCost: 0,
      };

      const alerts = generateBudgetAlerts(budgetData as BudgetData);

      expect(alerts).toHaveLength(1);
      expect(alerts[0].type).toBe('critical_runway');
      expect(alerts[0].severity).toBe('critical');
      expect(alerts[0].title).toContain('Critical');
    });

    it('should generate low runway alert for less than 60 days', () => {
      const budgetData: Partial<BudgetData> = {
        id: 'test-id',
        currentSavings: 5000,
        monthlyExpenses: 3000,
        severanceAmount: 0,
        unemploymentBenefit: 0,
        unemploymentWeeks: 0,
        cobraCost: 0,
      };

      const alerts = generateBudgetAlerts(budgetData as BudgetData);

      expect(alerts).toHaveLength(1);
      expect(alerts[0].type).toBe('low_runway');
      expect(alerts[0].severity).toBe('warning');
    });

    it('should generate benefit expiring alert', () => {
      const budgetData: Partial<BudgetData> = {
        id: 'test-id',
        currentSavings: 10000,
        monthlyExpenses: 2000,
        severanceAmount: 0,
        unemploymentBenefit: 400,
        unemploymentWeeks: 4, // Only 4 weeks left
        cobraCost: 0,
      };

      const alerts = generateBudgetAlerts(budgetData as BudgetData);

      const benefitAlert = alerts.find(a => a.type === 'benefit_expiring');
      expect(benefitAlert).toBeDefined();
      expect(benefitAlert?.severity).toBe('warning');
    });

    it('should not generate alerts for healthy runway', () => {
      const budgetData: Partial<BudgetData> = {
        id: 'test-id',
        currentSavings: 20000,
        monthlyExpenses: 2000,
        severanceAmount: 5000,
        unemploymentBenefit: 400,
        unemploymentWeeks: 26,
        cobraCost: 0,
      };

      const alerts = generateBudgetAlerts(budgetData as BudgetData);

      expect(alerts).toHaveLength(0);
    });
  });

  describe('formatCurrency', () => {
    it('should format positive numbers correctly', () => {
      expect(formatCurrency(1234.56)).toBe('$1,234.56');
      expect(formatCurrency(1000000)).toBe('$1,000,000.00');
      expect(formatCurrency(0.99)).toBe('$0.99');
    });

    it('should format negative numbers correctly', () => {
      expect(formatCurrency(-1234.56)).toBe('-$1,234.56');
      expect(formatCurrency(-1000)).toBe('-$1,000.00');
    });

    it('should handle zero', () => {
      expect(formatCurrency(0)).toBe('$0.00');
    });

    it('should round to 2 decimal places', () => {
      expect(formatCurrency(123.456)).toBe('$123.46');
      expect(formatCurrency(123.454)).toBe('$123.45');
    });
  });

  describe('calculateMonthlyBurn', () => {
    it('should calculate total monthly burn correctly', () => {
      const budgetData: Partial<BudgetData> = {
        monthlyExpenses: 3000,
        cobraCost: 650,
      };

      const burn = calculateMonthlyBurn(budgetData as BudgetData);

      expect(burn).toBe(3650);
    });

    it('should handle missing values', () => {
      const budgetData: Partial<BudgetData> = {
        monthlyExpenses: 2000,
        // cobraCost is undefined
      };

      const burn = calculateMonthlyBurn(budgetData as BudgetData);

      expect(burn).toBe(2000);
    });

    it('should handle all zeros', () => {
      const budgetData: Partial<BudgetData> = {
        monthlyExpenses: 0,
        cobraCost: 0,
      };

      const burn = calculateMonthlyBurn(budgetData as BudgetData);

      expect(burn).toBe(0);
    });
  });
});