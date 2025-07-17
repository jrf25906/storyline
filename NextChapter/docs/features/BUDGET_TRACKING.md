# Budget Tracking Feature

## Overview
The Budget Tracking feature helps users understand their financial runway during their career transition. It provides real-time calculations, alerts, and insights to help users make informed financial decisions.

## Key Components

### BudgetOverviewScreen
The main interface for financial tracking, located at `src/screens/budget/BudgetOverviewScreen.tsx`.

#### Features
- **Financial Runway Display**: Shows months and days of financial coverage
- **Real-time Calculations**: Updates based on income, expenses, and savings
- **Alert System**: Warnings for low runway (< 60 days) and critical runway (< 30 days)
- **Financial Summary**: Displays key metrics including:
  - Total savings
  - Monthly expenses
  - Weekly unemployment benefits
  - Severance package (if applicable)
- **Pull-to-Refresh**: Update data with swipe gesture
- **Budget Tips**: Actionable advice for extending runway

#### Visual Indicators
- **Green** (≥ 6 months): Healthy runway
- **Yellow** (3-6 months): Caution needed
- **Red** (< 3 months): Critical - immediate action required

### BudgetStore Integration
The screen is fully integrated with `budgetStore` (Zustand state management):

```typescript
// Key store methods used:
- loadBudget(): Fetches user's budget data
- loadBudgetEntries(): Loads individual income/expense entries
- getTotalMonthlyExpenses(): Calculates total monthly burn
- dismissAlert(): Handles alert dismissal
```

#### Data Flow
1. Component mounts → loads budget data
2. Store calculates runway based on:
   - Current savings + severance
   - Monthly income (including unemployment benefits)
   - Monthly expenses (including COBRA costs)
3. Alerts generated based on runway calculations
4. UI updates with real-time data

### Alert System

#### Alert Types
1. **Critical Runway** (< 30 days)
   - Severity: Critical
   - Message: Immediate action needed
   - Color: Red background

2. **Low Runway** (< 60 days)
   - Severity: Warning
   - Message: Review budget recommended
   - Color: Yellow background

3. **Benefit Expiring** (≤ 4 weeks remaining)
   - Severity: Warning
   - Message: Unemployment benefits ending soon
   - Color: Yellow background

#### Alert Management
- Dismissible with X button
- Persisted in store until dismissed
- Re-evaluated on data changes

### State Management

#### Loading States
- Initial load: Full-screen loading indicator
- Refresh: Pull-to-refresh indicator
- Error state: Retry button with error message

#### Empty States
- No budget data: Prompts to set up budget
- No runway data: Shows placeholder with setup message

### Calculations

#### Financial Runway Formula
```
Monthly Burn = Total Monthly Expenses - Total Monthly Income
Available Funds = Current Savings + Severance + (Unemployment Benefits × Weeks)
Runway (months) = Available Funds ÷ Monthly Burn
Runway (days) = Runway (months) × 30
```

#### Unemployment Benefits
- State-specific calculations
- Weekly amount × 4.33 for monthly equivalent
- Maximum weeks varies by state

#### COBRA Estimates
- State-based premium estimates
- Single vs. family coverage
- Subsidy eligibility calculations

## Navigation Actions

### Track Expenses
- Navigates to expense entry screen
- Allows adding individual transactions
- Updates runway in real-time

### Calculate Benefits
- Opens benefits calculator
- Estimates unemployment benefits by state
- Calculates COBRA costs

## Testing

### Test Coverage
Comprehensive test suite at `src/screens/budget/__tests__/BudgetOverviewScreen.test.tsx`:

- Data loading and display
- Alert rendering and dismissal
- Navigation actions
- Loading and error states
- Pull-to-refresh functionality
- Empty state handling
- Financial calculations

### Mock Data Structure
```typescript
const mockBudgetData = {
  currentSavings: 15000,
  monthlyIncome: 5000,
  monthlyExpenses: 3500,
  severanceAmount: 10000,
  unemploymentBenefit: 450,
  unemploymentWeeks: 26,
  cobraCost: 800,
  state: 'CA'
};
```

## Accessibility

- **Screen Reader Support**: All financial values have descriptive labels
- **Color Independence**: Status indicated by text, not just color
- **Touch Targets**: Minimum 48x48dp for all interactive elements
- **Semantic HTML**: Proper roles and labels for all UI elements

## Best Practices

### For Users
1. Update budget weekly for accurate runway
2. Include all sources of income and expenses
3. Review alerts promptly
4. Use budget tips to extend runway

### For Developers
1. Always handle loading/error states
2. Format currency consistently ($X,XXX)
3. Test with various financial scenarios
4. Ensure calculations match business logic
5. Keep alert thresholds configurable

## Future Enhancements
- [ ] Budget history and trends
- [ ] Expense categorization
- [ ] Budget goals and milestones
- [ ] Export financial reports
- [ ] Integration with banking APIs
- [ ] Predictive runway modeling