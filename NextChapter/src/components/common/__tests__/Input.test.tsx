import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import Input from '../Input';

// Mock the ThemeContext
jest.mock('../../../context/ThemeContext', () => ({
  useTheme: () => ({
    theme: {
      colors: {
        text: '#000000',
        surface: '#FFFFFF',
        error: '#FF3B30',
        placeholder: '#999999',
      },
    },
  }),
}));

describe('Input', () => {
  describe('Basic Functionality', () => {
    it('should render without label', () => {
      const { getByRole } = render(<Input placeholder="Enter text" />);
      const input = getByRole('text');
      
      expect(input).toBeTruthy();
      expect(input.props.placeholder).toBe('Enter text');
    });

    it('should render with label', () => {
      const { getByText, getAllByRole } = render(
        <Input label="Email" placeholder="Enter email" />
      );
      
      expect(getByText('Email')).toBeTruthy();
      // When label is present, both label and input have role="text"
      const textElements = getAllByRole('text');
      expect(textElements).toHaveLength(2); // label and input
    });

    it('should handle text input changes', () => {
      const onChangeText = jest.fn();
      const { getByRole } = render(
        <Input onChangeText={onChangeText} />
      );
      
      const input = getByRole('text');
      fireEvent.changeText(input, 'New text');
      
      expect(onChangeText).toHaveBeenCalledWith('New text');
    });

    it('should pass through TextInput props', () => {
      const { getByRole } = render(
        <Input
          keyboardType="email-address"
          autoCapitalize="none"
          maxLength={50}
        />
      );
      
      const input = getByRole('text');
      expect(input.props.keyboardType).toBe('email-address');
      expect(input.props.autoCapitalize).toBe('none');
      expect(input.props.maxLength).toBe(50);
    });
  });

  describe('Error Handling', () => {
    it('should display error message when provided', () => {
      const { getByRole } = render(
        <Input error="Email is required" />
      );
      
      const errorText = getByRole('alert');
      expect(errorText.props.children).toBe('Email is required');
    });

    it('should style input with error color when error exists', () => {
      const { getByRole } = render(
        <Input error="Invalid input" />
      );
      
      const input = getByRole('text');
      expect(input.props.style).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ borderColor: '#FF3B30' }),
        ])
      );
    });

    it('should not show error border when no error', () => {
      const { getByRole } = render(<Input />);
      
      const input = getByRole('text');
      expect(input.props.style).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ borderColor: '#FFFFFF' }),
        ])
      );
    });
  });

  describe('Styling', () => {
    it('should apply default styles', () => {
      const { getByRole } = render(<Input />);
      const input = getByRole('text');
      
      expect(input.props.style).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            height: 48,
            borderRadius: 8,
            paddingHorizontal: 16,
            fontSize: 16,
            borderWidth: 1,
          }),
        ])
      );
    });

    it('should apply custom styles', () => {
      const customStyle = { fontSize: 18, height: 56 };
      const { getByRole } = render(<Input style={customStyle} />);
      const input = getByRole('text');
      
      expect(input.props.style).toEqual(
        expect.arrayContaining([customStyle])
      );
    });

    it('should apply container styles', () => {
      // Since we can't directly access the container, we verify it renders
      expect(() => render(
        <Input containerStyle={{ marginTop: 20 }} />
      )).not.toThrow();
    });

    it('should use theme colors', () => {
      const { getByRole } = render(<Input />);
      const input = getByRole('text');
      
      expect(input.props.style).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            backgroundColor: '#FFFFFF',
            color: '#000000',
          }),
        ])
      );
      expect(input.props.placeholderTextColor).toBe('#999999');
    });
  });

  describe('Accessibility', () => {
    it('should have text role', () => {
      const { getByRole } = render(<Input />);
      expect(getByRole('text')).toBeTruthy();
    });

    it('should use label as accessibility label', () => {
      const { getAllByRole } = render(
        <Input label="Password" />
      );
      
      // When label is present, both label and input have role="text"
      const textElements = getAllByRole('text');
      const input = textElements.find(el => el.type === 'TextInput');
      expect(input.props.accessibilityLabel).toBe('Password');
    });

    it('should use custom accessibility label over label prop', () => {
      const { getAllByRole } = render(
        <Input label="Password" accessibilityLabel="Enter your password" />
      );
      
      // When label is present, both label and input have role="text"
      const textElements = getAllByRole('text');
      const input = textElements.find(el => el.type === 'TextInput');
      expect(input.props.accessibilityLabel).toBe('Enter your password');
    });

    it('should pass accessibility hint', () => {
      const { getByRole } = render(
        <Input accessibilityHint="Must be at least 8 characters" />
      );
      
      const input = getByRole('text');
      expect(input.props.accessibilityHint).toBe('Must be at least 8 characters');
    });

    it('should set disabled state when not editable', () => {
      const { getByRole } = render(
        <Input editable={false} />
      );
      
      const input = getByRole('text');
      expect(input.props.accessibilityState).toEqual({
        disabled: true,
        selected: false,
      });
    });

    it('should set enabled state when editable', () => {
      const { getByRole } = render(
        <Input editable={true} />
      );
      
      const input = getByRole('text');
      expect(input.props.accessibilityState).toEqual({
        disabled: false,
        selected: false,
      });
    });

    it('should announce errors with alert role', () => {
      const { getByRole } = render(
        <Input error="Invalid email format" />
      );
      
      const errorText = getByRole('alert');
      expect(errorText).toBeTruthy();
      expect(errorText.props.accessibilityLiveRegion).toBe('polite');
    });

    it('should have minimum height for touch targets', () => {
      const { getByRole } = render(<Input />);
      const input = getByRole('text');
      
      // 48dp minimum height for accessibility
      expect(input.props.style).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ height: 48 }),
        ])
      );
    });
  });

  describe('Label', () => {
    it('should style label with theme color', () => {
      const { getByText } = render(
        <Input label="Username" />
      );
      
      const label = getByText('Username');
      expect(label.props.style).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ color: '#000000' }),
        ])
      );
    });

    it('should have proper label styling', () => {
      const { getByText } = render(
        <Input label="Username" />
      );
      
      const label = getByText('Username');
      expect(label.props.style).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            fontSize: 16,
            fontWeight: '500',
            marginBottom: 8,
          }),
        ])
      );
    });
  });

  describe('Stress-Friendly Design', () => {
    it('should have rounded corners for softer appearance', () => {
      const { getByRole } = render(<Input />);
      const input = getByRole('text');
      
      expect(input.props.style).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ borderRadius: 8 }),
        ])
      );
    });

    it('should use non-aggressive error color', () => {
      const { getByRole } = render(
        <Input error="Required field" />
      );
      
      const errorText = getByRole('alert');
      expect(errorText.props.style).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ color: '#FF3B30' }),
        ])
      );
    });

    it('should have comfortable padding', () => {
      const { getByRole } = render(<Input />);
      const input = getByRole('text');
      
      expect(input.props.style).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ paddingHorizontal: 16 }),
        ])
      );
    });
  });

  describe('Edge Cases', () => {
    it('should handle undefined props gracefully', () => {
      const { getByRole } = render(
        <Input
          label={undefined}
          error={undefined}
          value={undefined}
        />
      );
      
      expect(getByRole('text')).toBeTruthy();
    });

    it('should handle empty string label', () => {
      const { queryByText } = render(<Input label="" />);
      expect(queryByText('')).toBeNull();
    });

    it('should handle empty string error', () => {
      const { queryByRole } = render(<Input error="" />);
      expect(queryByRole('alert')).toBeNull();
    });
  });
});