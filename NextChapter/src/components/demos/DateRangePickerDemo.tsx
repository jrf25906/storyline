import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
} from 'react-native';
import { useTheme } from '@theme';
import { DateRangePicker, DateRange, DateRangePreset } from '@/components/common/DateRangePicker';

export const DateRangePickerDemo: React.FC = () => {
  const theme = useTheme();
  const [basicRange, setBasicRange] = useState<DateRange>({ startDate: null, endDate: null });
  const [budgetRange, setBudgetRange] = useState<DateRange>({ 
    startDate: new Date('2025-01-01'), 
    endDate: new Date('2025-01-31') 
  });
  const [errorRange, setErrorRange] = useState<DateRange>({ startDate: null, endDate: null });
  const [customPresetsRange, setCustomPresetsRange] = useState<DateRange>({ startDate: null, endDate: null });
  const [constrainedRange, setConstrainedRange] = useState<DateRange>({ startDate: null, endDate: null });
  
  // Demo state
  const [disabled, setDisabled] = useState(false);
  const [required, setRequired] = useState(false);
  const [size, setSize] = useState<'small' | 'medium' | 'large'>('medium');
  const [variant, setVariant] = useState<'default' | 'success' | 'warning' | 'gentle'>('default');
  const [showError, setShowError] = useState(false);

  // Custom presets for budget planning
  const budgetPresets: DateRangePreset[] = [
    {
      label: 'This Quarter',
      value: 'this-quarter',
      getDates: () => {
        const now = new Date();
        const quarter = Math.floor(now.getMonth() / 3);
        const start = new Date(now.getFullYear(), quarter * 3, 1);
        const end = new Date(now.getFullYear(), quarter * 3 + 3, 0);
        return { startDate: start, endDate: end };
      },
      description: 'Current 3-month period',
    },
    {
      label: 'Next 6 Months',
      value: 'next-6-months',
      getDates: () => {
        const start = new Date();
        const end = new Date();
        end.setMonth(end.getMonth() + 6);
        return { startDate: start, endDate: end };
      },
      description: 'Planning period for budget goals',
    },
    {
      label: 'Emergency Fund Period',
      value: 'emergency-fund',
      getDates: () => {
        const start = new Date();
        const end = new Date();
        end.setMonth(end.getMonth() + 3);
        return { startDate: start, endDate: end };
      },
      description: '3-month emergency expenses',
    },
    {
      label: 'Job Search Period',
      value: 'job-search',
      getDates: () => {
        const start = new Date();
        const end = new Date();
        end.setDate(end.getDate() + 90);
        return { startDate: start, endDate: end };
      },
      description: '90-day job search timeline',
    },
  ];

  const formatRange = (range: DateRange) => {
    if (!range.startDate && !range.endDate) return 'None selected';
    
    const format = (date: Date) => date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });

    if (range.startDate && range.endDate) {
      return `${format(range.startDate)} - ${format(range.endDate)}`;
    }
    if (range.startDate) return `From ${format(range.startDate)}`;
    if (range.endDate) return `Until ${format(range.endDate)}`;
    return 'None selected';
  };

  const minDate = new Date();
  minDate.setDate(minDate.getDate() - 30);
  
  const maxDate = new Date();
  maxDate.setMonth(maxDate.getMonth() + 6);

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={styles.content}
    >
      <Text style={[styles.title, { color: theme.colors.text.primary }]}>
        DateRangePicker Component Demo
      </Text>
      
      <Text style={[styles.subtitle, { color: theme.colors.text.secondary }]}>
        Stress-friendly date range selection for budget planning and financial tracking
      </Text>

      {/* Controls */}
      <View style={[styles.section, { backgroundColor: theme.colors.surface.primary }]}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
          Demo Controls
        </Text>
        
        <View style={styles.controlRow}>
          <Text style={[styles.controlLabel, { color: theme.colors.text.primary }]}>
            Disabled
          </Text>
          <Switch value={disabled} onValueChange={setDisabled} />
        </View>
        
        <View style={styles.controlRow}>
          <Text style={[styles.controlLabel, { color: theme.colors.text.primary }]}>
            Required
          </Text>
          <Switch value={required} onValueChange={setRequired} />
        </View>
        
        <View style={styles.controlRow}>
          <Text style={[styles.controlLabel, { color: theme.colors.text.primary }]}>
            Show Error
          </Text>
          <Switch value={showError} onValueChange={setShowError} />
        </View>
      </View>

      {/* Basic Example */}
      <View style={[styles.section, { backgroundColor: theme.colors.surface.primary }]}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
          Basic Date Range Picker
        </Text>
        
        <DateRangePicker
          label="Select Period"
          startDate={basicRange.startDate}
          endDate={basicRange.endDate}
          onRangeChange={setBasicRange}
          placeholder="Choose any date range"
          hint="Select start and end dates for your period"
          disabled={disabled}
          required={required}
          size={size}
          variant={variant}
          error={showError ? 'Please select a valid date range' : undefined}
          testID="basic-date-picker"
        />
        
        <Text style={[styles.resultText, { color: theme.colors.text.secondary }]}>
          Selected: {formatRange(basicRange)}
        </Text>
      </View>

      {/* Budget Planning Example */}
      <View style={[styles.section, { backgroundColor: theme.colors.surface.primary }]}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
          Budget Planning (Pre-selected)
        </Text>
        
        <DateRangePicker
          label="Budget Period"
          startDate={budgetRange.startDate}
          endDate={budgetRange.endDate}
          onRangeChange={setBudgetRange}
          placeholder="Select budget tracking period"
          hint="Choose the timeframe for your budget analysis"
          variant="gentle"
          required
          testID="budget-date-picker"
        />
        
        <Text style={[styles.resultText, { color: theme.colors.text.secondary }]}>
          Budget Period: {formatRange(budgetRange)}
        </Text>
      </View>

      {/* Custom Presets Example */}
      <View style={[styles.section, { backgroundColor: theme.colors.surface.primary }]}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
          Financial Planning (Custom Presets)
        </Text>
        
        <DateRangePicker
          label="Planning Horizon"
          startDate={customPresetsRange.startDate}
          endDate={customPresetsRange.endDate}
          onRangeChange={setCustomPresetsRange}
          placeholder="Select financial planning period"
          hint="Choose from common financial planning periods"
          presets={budgetPresets}
          variant="success"
          testID="custom-presets-date-picker"
        />
        
        <Text style={[styles.resultText, { color: theme.colors.text.secondary }]}>
          Planning Period: {formatRange(customPresetsRange)}
        </Text>
      </View>

      {/* Constrained Example */}
      <View style={[styles.section, { backgroundColor: theme.colors.surface.primary }]}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
          Date Constraints (Recent Past to 6 Months Future)
        </Text>
        
        <DateRangePicker
          label="Expense Analysis Period"
          startDate={constrainedRange.startDate}
          endDate={constrainedRange.endDate}
          onRangeChange={setConstrainedRange}
          placeholder="Select analysis period"
          hint="Limited to recent past and near future"
          minDate={minDate}
          maxDate={maxDate}
          variant="warning"
          testID="constrained-date-picker"
        />
        
        <Text style={[styles.resultText, { color: theme.colors.text.secondary }]}>
          Analysis Period: {formatRange(constrainedRange)}
        </Text>
        
        <Text style={[styles.constraintText, { color: theme.colors.text.secondary }]}>
          Minimum: {minDate.toLocaleDateString()}
        </Text>
        <Text style={[styles.constraintText, { color: theme.colors.text.secondary }]}>
          Maximum: {maxDate.toLocaleDateString()}
        </Text>
      </View>

      {/* Error State Example */}
      <View style={[styles.section, { backgroundColor: theme.colors.surface.primary }]}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
          Error State Example
        </Text>
        
        <DateRangePicker
          label="Required Date Range"
          startDate={errorRange.startDate}
          endDate={errorRange.endDate}
          onRangeChange={setErrorRange}
          placeholder="This field is required"
          error="Please select a date range to continue"
          required
          testID="error-date-picker"
        />
        
        <Text style={[styles.resultText, { color: theme.colors.text.secondary }]}>
          Selected: {formatRange(errorRange)}
        </Text>
      </View>

      {/* Size Variants */}
      <View style={[styles.section, { backgroundColor: theme.colors.surface.primary }]}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
          Size Variants
        </Text>
        
        <View style={styles.variantContainer}>
          <Text style={[styles.variantLabel, { color: theme.colors.text.primary }]}>
            Small
          </Text>
          <DateRangePicker
            startDate={null}
            endDate={null}
            onRangeChange={() => {}}
            placeholder="Small size picker"
            size="small"
            testID="small-date-picker"
          />
        </View>
        
        <View style={styles.variantContainer}>
          <Text style={[styles.variantLabel, { color: theme.colors.text.primary }]}>
            Medium (Default)
          </Text>
          <DateRangePicker
            startDate={null}
            endDate={null}
            onRangeChange={() => {}}
            placeholder="Medium size picker"
            size="medium"
            testID="medium-date-picker"
          />
        </View>
        
        <View style={styles.variantContainer}>
          <Text style={[styles.variantLabel, { color: theme.colors.text.primary }]}>
            Large
          </Text>
          <DateRangePicker
            startDate={null}
            endDate={null}
            onRangeChange={() => {}}
            placeholder="Large size picker"
            size="large"
            testID="large-date-picker"
          />
        </View>
      </View>

      {/* Variant Colors */}
      <View style={[styles.section, { backgroundColor: theme.colors.surface.primary }]}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
          Color Variants
        </Text>
        
        <View style={styles.variantContainer}>
          <Text style={[styles.variantLabel, { color: theme.colors.text.primary }]}>
            Default
          </Text>
          <DateRangePicker
            startDate={null}
            endDate={null}
            onRangeChange={() => {}}
            placeholder="Default variant"
            variant="default"
            testID="default-variant-date-picker"
          />
        </View>
        
        <View style={styles.variantContainer}>
          <Text style={[styles.variantLabel, { color: theme.colors.text.primary }]}>
            Success
          </Text>
          <DateRangePicker
            startDate={null}
            endDate={null}
            onRangeChange={() => {}}
            placeholder="Success variant"
            variant="success"
            testID="success-variant-date-picker"
          />
        </View>
        
        <View style={styles.variantContainer}>
          <Text style={[styles.variantLabel, { color: theme.colors.text.primary }]}>
            Warning
          </Text>
          <DateRangePicker
            startDate={null}
            endDate={null}
            onRangeChange={() => {}}
            placeholder="Warning variant"
            variant="warning"
            testID="warning-variant-date-picker"
          />
        </View>
        
        <View style={styles.variantContainer}>
          <Text style={[styles.variantLabel, { color: theme.colors.text.primary }]}>
            Gentle
          </Text>
          <DateRangePicker
            startDate={null}
            endDate={null}
            onRangeChange={() => {}}
            placeholder="Gentle variant"
            variant="gentle"
            testID="gentle-variant-date-picker"
          />
        </View>
      </View>

      {/* Accessibility Example */}
      <View style={[styles.section, { backgroundColor: theme.colors.surface.primary }]}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
          Accessibility Features
        </Text>
        
        <DateRangePicker
          label="Financial Review Period"
          startDate={null}
          endDate={null}
          onRangeChange={() => {}}
          placeholder="Select review timeframe"
          hint="Choose dates for your financial review analysis"
          accessibilityLabel="Financial review period selector"
          accessibilityHint="Opens a calendar to select start and end dates for financial analysis"
          testID="accessibility-date-picker"
        />
        
        <Text style={[styles.noteText, { color: theme.colors.text.secondary }]}>
          This component includes full screen reader support, keyboard navigation,
          and announces state changes for users with visual impairments.
        </Text>
      </View>

      {/* Real-world Use Cases */}
      <View style={[styles.section, { backgroundColor: theme.colors.surface.primary }]}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
          NextChapter Use Cases
        </Text>
        
        <Text style={[styles.useCaseText, { color: theme.colors.text.secondary }]}>
          • Budget tracking periods for financial runway calculations
        </Text>
        <Text style={[styles.useCaseText, { color: theme.colors.text.secondary }]}>
          • Job search timeline planning (90-day bounce plan)
        </Text>
        <Text style={[styles.useCaseText, { color: theme.colors.text.secondary }]}>
          • Expense analysis for different time periods
        </Text>
        <Text style={[styles.useCaseText, { color: theme.colors.text.secondary }]}>
          • Mood tracking period selection for emotional insights
        </Text>
        <Text style={[styles.useCaseText, { color: theme.colors.text.secondary }]}>
          • Goal setting timeframes for career recovery milestones
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 32,
    fontStyle: 'italic',
  },
  section: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
  },
  controlRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  controlLabel: {
    fontSize: 16,
  },
  resultText: {
    marginTop: 8,
    fontSize: 14,
    fontStyle: 'italic',
  },
  constraintText: {
    fontSize: 12,
    marginTop: 4,
  },
  variantContainer: {
    marginBottom: 16,
  },
  variantLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  noteText: {
    fontSize: 14,
    fontStyle: 'italic',
    marginTop: 12,
    lineHeight: 20,
  },
  useCaseText: {
    fontSize: 14,
    marginVertical: 4,
    lineHeight: 20,
  },
});