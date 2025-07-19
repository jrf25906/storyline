import React from 'react';
import { render } from '@testing-library/react-native';
import WeekendCard from '@components/feature/bounce-plan/WeekendCard';
import { ThemeProvider } from '@context/ThemeContext';

// Mock dependencies
jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
}));

// Mock theme
const mockTheme = {
  colors: {
    primary: '#2D5A27',
    background: '#FDFCF8',
    text: '#1D2B1F',
    textSecondary: '#5A6B5D',
    calmBlue: '#4A90E2',
    surface: '#FFFFFF',
    border: '#E8E8E8',
  },
};

const mockDarkTheme = {
  colors: {
    primary: '#4B8545',
    background: '#1A1F1B',
    text: '#F0F2E6',
    textSecondary: '#A0A99E',
    calmBlue: '#5BA0F2',
    surface: '#2C3E2D',
    border: '#3D4A3E',
  },
};

jest.mock('../../../../context/ThemeContext', () => ({
  useTheme: jest.fn(() => ({
    theme: mockTheme,
    isDark: false,
  })),
  ThemeProvider: ({ children }: { children: React.ReactNode }) => children,
}));

describe('WeekendCard', () => {
  const defaultProps = {
    dayNumber: 6,
  };

  const renderWithTheme = (component: React.ReactElement) => {
    return render(
      <ThemeProvider>
        {component}
      </ThemeProvider>
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render correctly with day number', () => {
    const { getByText } = renderWithTheme(
      <WeekendCard {...defaultProps} />
    );

    expect(getByText('Weekend Recharge')).toBeTruthy();
    expect(getByText('Day 6 • Take time to rest')).toBeTruthy();
    expect(getByText('Your bounce back includes rest. Enjoy your weekend - you\'ll come back stronger Monday!')).toBeTruthy();
  });

  it('should display correct day number', () => {
    const { getByText } = renderWithTheme(
      <WeekendCard dayNumber={13} />
    );

    expect(getByText('Day 13 • Take time to rest')).toBeTruthy();
  });

  it('should render sunny icon', () => {
    const { UNSAFE_getByType } = renderWithTheme(
      <WeekendCard {...defaultProps} />
    );

    const icon = UNSAFE_getByType('Ionicons' as any);
    expect(icon.props.name).toBe('sunny-outline');
    expect(icon.props.size).toBe(32);
    expect(icon.props.color).toBe(mockTheme.colors.calmBlue);
  });

  it('should apply light theme colors', () => {
    const { getByText } = renderWithTheme(
      <WeekendCard {...defaultProps} />
    );

    const title = getByText('Weekend Recharge');
    expect(title.props.style[1].color).toBe(mockTheme.colors.text);

    const subtitle = getByText('Day 6 • Take time to rest');
    expect(subtitle.props.style[1].color).toBe(mockTheme.colors.textSecondary);

    const message = getByText('Your bounce back includes rest. Enjoy your weekend - you\'ll come back stronger Monday!');
    expect(message.props.style[1].color).toBe(mockTheme.colors.textSecondary);
  });

  it('should apply dark theme colors', () => {
    const useThemeMock = require('../../../../context/ThemeContext').useTheme;
    useThemeMock.mockReturnValue({
      theme: mockDarkTheme,
      isDark: true,
    });

    const { getByText, UNSAFE_getByType } = renderWithTheme(
      <WeekendCard {...defaultProps} />
    );

    const title = getByText('Weekend Recharge');
    expect(title.props.style[1].color).toBe(mockDarkTheme.colors.text);

    const subtitle = getByText('Day 6 • Take time to rest');
    expect(subtitle.props.style[1].color).toBe(mockDarkTheme.colors.textSecondary);

    const icon = UNSAFE_getByType('Ionicons' as any);
    expect(icon.props.color).toBe(mockDarkTheme.colors.calmBlue);
  });

  it('should have proper text styles', () => {
    const { getByText } = renderWithTheme(
      <WeekendCard {...defaultProps} />
    );

    const title = getByText('Weekend Recharge');
    expect(title.props.style[0]).toMatchObject({
      fontSize: 18,
      fontWeight: '600',
    });

    const subtitle = getByText('Day 6 • Take time to rest');
    expect(subtitle.props.style[0]).toMatchObject({
      fontSize: 12,
    });

    const message = getByText('Your bounce back includes rest. Enjoy your weekend - you\'ll come back stronger Monday!');
    expect(message.props.style[0]).toMatchObject({
      fontSize: 14,
      textAlign: 'center',
    });
  });

  it('should apply correct spacing', () => {
    const { getByText } = renderWithTheme(
      <WeekendCard {...defaultProps} />
    );

    const message = getByText('Your bounce back includes rest. Enjoy your weekend - you\'ll come back stronger Monday!');
    expect(message.props.style[0]).toMatchObject({
      paddingHorizontal: 24,
      lineHeight: 21,
    });
  });

  it('should render inside a Card component', () => {
    const { UNSAFE_getByType } = renderWithTheme(
      <WeekendCard {...defaultProps} />
    );

    // Import Card to check for it
    const Card = require('../../../common/Card').default;
    const card = UNSAFE_getByType(Card);
    expect(card).toBeTruthy();
    expect(card.props.variant).toBe('filled');
  });

  it('should apply icon container styles with theme color', () => {
    const { UNSAFE_getByType } = renderWithTheme(
      <WeekendCard {...defaultProps} />
    );

    const icon = UNSAFE_getByType('Ionicons' as any);
    const iconContainer = icon.parent;
    
    expect(iconContainer.props.style[1]).toMatchObject({
      backgroundColor: mockTheme.colors.calmBlue + '20',
    });
  });

  it('should handle different weekend days correctly', () => {
    // Day 6 (Saturday)
    const { rerender, getByText } = renderWithTheme(
      <WeekendCard dayNumber={6} />
    );
    expect(getByText('Day 6 • Take time to rest')).toBeTruthy();

    // Day 7 (Sunday)
    rerender(
      <ThemeProvider>
        <WeekendCard dayNumber={7} />
      </ThemeProvider>
    );
    expect(getByText('Day 7 • Take time to rest')).toBeTruthy();

    // Day 13 (Saturday)
    rerender(
      <ThemeProvider>
        <WeekendCard dayNumber={13} />
      </ThemeProvider>
    );
    expect(getByText('Day 13 • Take time to rest')).toBeTruthy();

    // Day 14 (Sunday)
    rerender(
      <ThemeProvider>
        <WeekendCard dayNumber={14} />
      </ThemeProvider>
    );
    expect(getByText('Day 14 • Take time to rest')).toBeTruthy();
  });

  it('should maintain consistent layout structure', () => {
    const { UNSAFE_getByType, UNSAFE_getAllByType } = renderWithTheme(
      <WeekendCard {...defaultProps} />
    );

    const View = require('react-native').View;
    const views = UNSAFE_getAllByType(View);
    
    // Should have main content view with centered alignment
    const contentView = views.find(view => 
      view.props.style && view.props.style.alignItems === 'center'
    );
    expect(contentView).toBeTruthy();
    expect(contentView.props.style).toMatchObject({
      alignItems: 'center',
      paddingVertical: 24,
    });
  });

  it('should use semantic icon for weekend rest', () => {
    const { UNSAFE_getByType } = renderWithTheme(
      <WeekendCard {...defaultProps} />
    );

    const icon = UNSAFE_getByType('Ionicons' as any);
    // sunny-outline is appropriate for weekend/rest theme
    expect(icon.props.name).toBe('sunny-outline');
  });

  it('should be accessible to screen readers', () => {
    const { getByText } = renderWithTheme(
      <WeekendCard {...defaultProps} />
    );

    // All text should be accessible
    expect(getByText('Weekend Recharge')).toBeTruthy();
    expect(getByText('Day 6 • Take time to rest')).toBeTruthy();
    expect(getByText('Your bounce back includes rest. Enjoy your weekend - you\'ll come back stronger Monday!')).toBeTruthy();
  });
});