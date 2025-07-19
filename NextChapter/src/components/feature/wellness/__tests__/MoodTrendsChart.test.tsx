import React from 'react';
import { render } from '@testing-library/react-native';
import { MoodTrendsChart } from '@components/feature/wellness/MoodTrendsChart';
import { MoodValue, MoodTrend } from '@types';
import { ThemeProvider } from '@context/ThemeContext';

// Helper to render with theme
const renderWithTheme = (component: React.ReactElement) => {
  return render(
    <ThemeProvider>
      {component}
    </ThemeProvider>
  );
};

describe('MoodTrendsChart', () => {
  const mockWeekTrend: MoodTrend = {
    period: 'week',
    average: 3.5,
    entries: [
      {
        id: '1',
        userId: 'user1',
        value: MoodValue.Good,
        createdAt: new Date('2025-01-09'),
        updatedAt: new Date('2025-01-09'),
        synced: true,
      },
      {
        id: '2',
        userId: 'user1',
        value: MoodValue.Neutral,
        createdAt: new Date('2025-01-08'),
        updatedAt: new Date('2025-01-08'),
        synced: true,
      },
      {
        id: '3',
        userId: 'user1',
        value: MoodValue.Low,
        createdAt: new Date('2025-01-07'),
        updatedAt: new Date('2025-01-07'),
        synced: true,
      },
    ],
    lowestDay: new Date('2025-01-07'),
    highestDay: new Date('2025-01-09'),
    improvementRate: 25,
  };

  describe('Rendering', () => {
    it('should render chart container', () => {
      const { getByTestId } = renderWithTheme(
        <MoodTrendsChart trend={mockWeekTrend} />
      );

      expect(getByTestId('mood-trends-chart')).toBeTruthy();
    });

    it('should display period label', () => {
      const { getByText } = renderWithTheme(
        <MoodTrendsChart trend={mockWeekTrend} />
      );

      expect(getByText('This Week')).toBeTruthy();
    });

    it('should display average mood', () => {
      const { getByText } = renderWithTheme(
        <MoodTrendsChart trend={mockWeekTrend} />
      );

      expect(getByText('Average: 3.5')).toBeTruthy();
    });

    it('should display improvement rate when positive', () => {
      const { getByText, getByTestId } = renderWithTheme(
        <MoodTrendsChart trend={mockWeekTrend} />
      );

      expect(getByText('25% improvement')).toBeTruthy();
      expect(getByTestId('improvement-indicator')).toBeTruthy();
    });

    it('should display decline rate when negative', () => {
      const declineTrend = { ...mockWeekTrend, improvementRate: -15 };
      
      const { getByText, getByTestId } = renderWithTheme(
        <MoodTrendsChart trend={declineTrend} />
      );

      expect(getByText('15% decline')).toBeTruthy();
      expect(getByTestId('decline-indicator')).toBeTruthy();
    });

    it('should render chart visualization', () => {
      const { getByTestId } = renderWithTheme(
        <MoodTrendsChart trend={mockWeekTrend} />
      );

      // Check for chart elements
      expect(getByTestId('mood-chart-line')).toBeTruthy();
      expect(getByTestId('mood-chart-points')).toBeTruthy();
    });
  });

  describe('Data Points', () => {
    it('should render correct number of data points', () => {
      const { getAllByTestId } = renderWithTheme(
        <MoodTrendsChart trend={mockWeekTrend} />
      );

      const dataPoints = getAllByTestId(/^mood-point-/);
      expect(dataPoints).toHaveLength(3);
    });

    it('should highlight highest and lowest points', () => {
      const { getByTestId } = renderWithTheme(
        <MoodTrendsChart trend={mockWeekTrend} />
      );

      const highestPoint = getByTestId('mood-point-highest');
      const lowestPoint = getByTestId('mood-point-lowest');

      expect(highestPoint).toBeTruthy();
      expect(lowestPoint).toBeTruthy();
    });
  });

  describe('Empty State', () => {
    it('should show empty state when no entries', () => {
      const emptyTrend: MoodTrend = {
        period: 'week',
        average: 0,
        entries: [],
        lowestDay: new Date(),
        highestDay: new Date(),
        improvementRate: 0,
      };

      const { getByText } = renderWithTheme(
        <MoodTrendsChart trend={emptyTrend} />
      );

      expect(getByText('No mood data for this period')).toBeTruthy();
    });
  });

  describe('Period Display', () => {
    it('should display month period correctly', () => {
      const monthTrend = { ...mockWeekTrend, period: 'month' as const };
      
      const { getByText } = renderWithTheme(
        <MoodTrendsChart trend={monthTrend} />
      );

      expect(getByText('This Month')).toBeTruthy();
    });

    it('should display quarter period correctly', () => {
      const quarterTrend = { ...mockWeekTrend, period: 'quarter' as const };
      
      const { getByText } = renderWithTheme(
        <MoodTrendsChart trend={quarterTrend} />
      );

      expect(getByText('This Quarter')).toBeTruthy();
    });
  });

  describe('Accessibility', () => {
    it('should have accessible chart description', () => {
      const { getByTestId } = renderWithTheme(
        <MoodTrendsChart trend={mockWeekTrend} />
      );

      const chart = getByTestId('mood-trends-chart');
      expect(chart.props.accessibilityLabel).toContain('Mood trend chart');
      expect(chart.props.accessibilityLabel).toContain('25% improvement');
    });

    it('should have accessible data points', () => {
      const { getByTestId } = renderWithTheme(
        <MoodTrendsChart trend={mockWeekTrend} />
      );

      const point = getByTestId('mood-point-0');
      expect(point.props.accessibilityLabel).toContain('Good mood');
      expect(point.props.accessibilityLabel).toContain('January 9');
    });
  });

  describe('Visual Indicators', () => {
    it('should use calming colors for positive trends', () => {
      const { getByTestId } = renderWithTheme(
        <MoodTrendsChart trend={mockWeekTrend} />
      );

      const improvementIndicator = getByTestId('improvement-indicator');
      expect(improvementIndicator.props.style.color).toContain('green');
    });

    it('should use supportive colors for negative trends', () => {
      const declineTrend = { ...mockWeekTrend, improvementRate: -15 };
      
      const { getByTestId } = renderWithTheme(
        <MoodTrendsChart trend={declineTrend} />
      );

      const declineIndicator = getByTestId('decline-indicator');
      // Using orange/amber instead of red for stress-friendly design
      expect(declineIndicator.props.style.color).not.toContain('red');
      expect(declineIndicator.props.style.color).toContain('orange');
    });
  });

  describe('Loading State', () => {
    it('should show loading skeleton when loading', () => {
      const { getByTestId } = renderWithTheme(
        <MoodTrendsChart trend={mockWeekTrend} isLoading={true} />
      );

      expect(getByTestId('chart-loading-skeleton')).toBeTruthy();
    });
  });
});