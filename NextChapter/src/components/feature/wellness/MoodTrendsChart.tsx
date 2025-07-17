import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import Svg, { Path, Circle, Line, Text as SvgText } from 'react-native-svg';
import { MoodTrend, MOOD_DESCRIPTORS } from '../../../types';
import { useTheme } from '../../../context/ThemeContext';

interface MoodTrendsChartProps {
  trend: MoodTrend;
  isLoading?: boolean;
}

const { width: screenWidth } = Dimensions.get('window');
const chartWidth = screenWidth - 32;
const chartHeight = 200;
const chartPadding = 20;

export const MoodTrendsChart: React.FC<MoodTrendsChartProps> = ({
  trend,
  isLoading = false,
}) => {
  const { theme } = useTheme();

  if (isLoading) {
    return (
      <View
        style={[styles.container, { backgroundColor: theme.colors.surface }]}
        testID="chart-loading-skeleton"
      >
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (trend.entries.length === 0) {
    return (
      <View
        style={[styles.container, { backgroundColor: theme.colors.surface }]}
        testID="mood-trends-chart"
      >
        <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
          No mood data for this period
        </Text>
      </View>
    );
  }

  const periodLabel = trend.period === 'week' ? 'This Week' : 
                     trend.period === 'month' ? 'This Month' : 'This Quarter';

  const improvementColor = trend.improvementRate >= 0 ? '#4CAF50' : '#FF9800';
  const improvementText = trend.improvementRate >= 0 
    ? `${Math.abs(trend.improvementRate)}% improvement`
    : `${Math.abs(trend.improvementRate)}% decline`;

  // Prepare chart data
  const maxValue = 5;
  const minValue = 1;
  const valueRange = maxValue - minValue;
  const chartInnerWidth = chartWidth - chartPadding * 2;
  const chartInnerHeight = chartHeight - chartPadding * 2;

  const points = trend.entries.map((entry, index) => {
    const x = (index / (trend.entries.length - 1)) * chartInnerWidth + chartPadding;
    const y = chartHeight - ((entry.value - minValue) / valueRange) * chartInnerHeight - chartPadding;
    return { x, y, value: entry.value, date: entry.createdAt };
  });

  // Create path for line
  const pathData = points.reduce((acc, point, index) => {
    if (index === 0) return `M ${point.x} ${point.y}`;
    return `${acc} L ${point.x} ${point.y}`;
  }, '');

  // Find highest and lowest points
  const highestIndex = trend.entries.findIndex(e => e.createdAt === trend.highestDay);
  const lowestIndex = trend.entries.findIndex(e => e.createdAt === trend.lowestDay);

  const accessibilityLabel = `Mood trend chart for ${periodLabel}. Average mood: ${trend.average}. ${improvementText}. Lowest on ${trend.lowestDay.toLocaleDateString()}, highest on ${trend.highestDay.toLocaleDateString()}.`;

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.surface }]}
      testID="mood-trends-chart"
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="image"
    >
      <View style={styles.header}>
        <Text style={[styles.periodLabel, { color: theme.colors.text }]}>
          {periodLabel}
        </Text>
        <Text style={[styles.averageText, { color: theme.colors.textSecondary }]}>
          Average: {trend.average}
        </Text>
      </View>

      <View testID="mood-chart-container">
        <View testID="mood-chart-points" />
        <Svg width={chartWidth} height={chartHeight}>
          {/* Grid lines */}
          {[1, 2, 3, 4, 5].map((value) => {
            const y = chartHeight - ((value - minValue) / valueRange) * chartInnerHeight - chartPadding;
            return (
              <Line
                key={`grid-${value}`}
                x1={chartPadding}
                y1={y}
                x2={chartWidth - chartPadding}
                y2={y}
                stroke={theme.colors.border}
                strokeWidth="1"
                strokeDasharray="5,5"
                opacity="0.3"
              />
            );
          })}

          {/* Line */}
          <Path
            d={pathData}
            stroke={theme.colors.primary}
            strokeWidth="3"
            fill="none"
            testID="mood-chart-line"
          />

          {/* Points */}
          {points.map((point, index) => {
            const isHighest = index === highestIndex;
            const isLowest = index === lowestIndex;
            const testId = isHighest ? 'mood-point-highest' : 
                          isLowest ? 'mood-point-lowest' : 
                          `mood-point-${index}`;
            
            return (
              <Circle
                key={index}
                cx={point.x}
                cy={point.y}
                r={isHighest || isLowest ? 6 : 4}
                fill={isHighest ? '#4CAF50' : isLowest ? '#FF9800' : theme.colors.primary}
                testID={testId}
                accessibilityLabel={`${MOOD_DESCRIPTORS[point.value]} mood on ${point.date.toLocaleDateString()}`}
              />
            );
          })}
        </Svg>
      </View>

      <View style={styles.footer}>
        <View 
          style={styles.improvementContainer}
          testID={trend.improvementRate >= 0 ? 'improvement-indicator' : 'decline-indicator'}
        >
          <Text style={[styles.improvementText, { color: improvementColor }]}>
            {improvementText}
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  periodLabel: {
    fontSize: 18,
    fontWeight: '600',
  },
  averageText: {
    fontSize: 14,
  },
  footer: {
    marginTop: 16,
    alignItems: 'center',
  },
  improvementContainer: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  improvementText: {
    fontSize: 14,
    fontWeight: '600',
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 16,
    paddingVertical: 40,
  },
});