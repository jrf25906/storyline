import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { MoodSelector } from '../MoodSelector';
import { MoodValue, MOOD_EMOJIS, MOOD_DESCRIPTORS } from '../../../../types';
import { ThemeProvider } from '../../../../context/ThemeContext';

// Helper to render with theme
const renderWithTheme = (component: React.ReactElement) => {
  return render(
    <ThemeProvider>
      {component}
    </ThemeProvider>
  );
};

describe('MoodSelector', () => {
  const mockOnSelect = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render all mood options', () => {
      const { getByTestId } = renderWithTheme(
        <MoodSelector onSelect={mockOnSelect} />
      );

      Object.values(MoodValue).forEach((value) => {
        if (typeof value === 'number') {
          expect(getByTestId(`mood-option-${value}`)).toBeTruthy();
        }
      });
    });

    it('should display correct emojis for each mood', () => {
      const { getByText } = renderWithTheme(
        <MoodSelector onSelect={mockOnSelect} />
      );

      Object.entries(MOOD_EMOJIS).forEach(([_, emoji]) => {
        expect(getByText(emoji)).toBeTruthy();
      });
    });

    it('should display correct labels for each mood', () => {
      const { getByText } = renderWithTheme(
        <MoodSelector onSelect={mockOnSelect} />
      );

      Object.values(MOOD_DESCRIPTORS).forEach((descriptor) => {
        expect(getByText(descriptor)).toBeTruthy();
      });
    });
  });

  describe('Selection', () => {
    it('should highlight selected mood', () => {
      const { getByTestId } = renderWithTheme(
        <MoodSelector 
          selectedMood={MoodValue.Good}
          onSelect={mockOnSelect} 
        />
      );

      const selectedOption = getByTestId('mood-option-4');
      expect(selectedOption.props.accessibilityState.selected).toBe(true);
    });

    it('should call onSelect when mood is tapped', () => {
      const { getByTestId } = renderWithTheme(
        <MoodSelector onSelect={mockOnSelect} />
      );

      fireEvent.press(getByTestId('mood-option-3'));
      expect(mockOnSelect).toHaveBeenCalledWith(MoodValue.Neutral);
    });

    it('should update selection when different mood is tapped', () => {
      const { getByTestId, rerender } = renderWithTheme(
        <MoodSelector 
          selectedMood={MoodValue.Good}
          onSelect={mockOnSelect} 
        />
      );

      fireEvent.press(getByTestId('mood-option-2'));
      expect(mockOnSelect).toHaveBeenCalledWith(MoodValue.Low);
    });
  });

  describe('Accessibility', () => {
    it('should have correct accessibility labels', () => {
      const { getByTestId } = renderWithTheme(
        <MoodSelector onSelect={mockOnSelect} />
      );

      const veryLowOption = getByTestId('mood-option-1');
      expect(veryLowOption.props.accessibilityLabel).toBe('Select Very Low mood');
      expect(veryLowOption.props.accessibilityRole).toBe('button');
    });

    it('should have accessibility hints for selected state', () => {
      const { getByTestId } = renderWithTheme(
        <MoodSelector 
          selectedMood={MoodValue.Good}
          onSelect={mockOnSelect} 
        />
      );

      const selectedOption = getByTestId('mood-option-4');
      expect(selectedOption.props.accessibilityHint).toBe('Selected Good mood');
    });

    it('should have minimum touch target size', () => {
      const { getByTestId } = renderWithTheme(
        <MoodSelector onSelect={mockOnSelect} />
      );

      const option = getByTestId('mood-option-1');
      const { width, height } = option.props.style;
      
      expect(width).toBeGreaterThanOrEqual(48);
      expect(height).toBeGreaterThanOrEqual(48);
    });
  });

  describe('Visual Feedback', () => {
    it.skip('should show pressed state', () => {
      // Skipping - fireEvent.pressIn/pressOut not available in React Native Testing Library
      const { getByTestId } = renderWithTheme(
        <MoodSelector onSelect={mockOnSelect} />
      );

      // Would test pressed state visual feedback
      // but pressIn/pressOut events not supported in test environment
    });

    it.skip('should scale on press for haptic feedback', () => {
      // Skipping - fireEvent.pressIn/pressOut not available in React Native Testing Library
      const { getByTestId } = renderWithTheme(
        <MoodSelector onSelect={mockOnSelect} />
      );

      // Would test scale transform on press
      // but pressIn/pressOut events not supported in test environment
    });
  });

  describe('Disabled State', () => {
    it('should disable all options when disabled prop is true', () => {
      const { getByTestId } = renderWithTheme(
        <MoodSelector 
          onSelect={mockOnSelect}
          disabled={true}
        />
      );

      Object.values(MoodValue).forEach((value) => {
        if (typeof value === 'number') {
          const option = getByTestId(`mood-option-${value}`);
          expect(option.props.accessibilityState.disabled).toBe(true);
        }
      });
    });

    it('should not call onSelect when disabled', () => {
      const { getByTestId } = renderWithTheme(
        <MoodSelector 
          onSelect={mockOnSelect}
          disabled={true}
        />
      );

      fireEvent.press(getByTestId('mood-option-3'));
      expect(mockOnSelect).not.toHaveBeenCalled();
    });

    it('should show disabled visual state', () => {
      const { getByTestId } = renderWithTheme(
        <MoodSelector 
          onSelect={mockOnSelect}
          disabled={true}
        />
      );

      const option = getByTestId('mood-option-3');
      expect(option.props.style.opacity).toBe(0.5);
    });
  });
});