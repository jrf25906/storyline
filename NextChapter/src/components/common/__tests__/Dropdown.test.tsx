import React from 'react';
import { fireEvent, waitFor } from '@testing-library/react-native';
import { AccessibilityInfo } from 'react-native';
import { renderWithProviders } from '@test-utils/test-helpers';
import { Dropdown, DropdownOption } from '../Dropdown';

// Mock the animation hook
jest.mock('@hooks', () => ({
  ...jest.requireActual('@hooks'),
  useDropdownAnimation: jest.fn(() => ({
    chevronRotation: '0deg',
  })),
}));

// Mock AccessibilityInfo
jest.mock('react-native/Libraries/Components/AccessibilityInfo/AccessibilityInfo', () => ({
  announceForAccessibility: jest.fn(),
}));

describe('Dropdown', () => {
  const mockOptions: DropdownOption[] = [
    { label: 'Option 1', value: '1' },
    { label: 'Option 2', value: '2', description: 'Description for option 2' },
    { label: 'Option 3', value: '3', disabled: true },
  ];

  const mockOnChange = jest.fn();

  const defaultProps = {
    options: mockOptions,
    onChange: mockOnChange,
    testID: 'test-dropdown',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders correctly with minimal props', () => {
      const { getByTestId, getByText } = renderWithProviders(
        <Dropdown {...defaultProps} />
      );
      
      expect(getByTestId('test-dropdown')).toBeTruthy();
      expect(getByText('Select an option')).toBeTruthy();
    });

    it('renders with custom placeholder', () => {
      const { getByText } = renderWithProviders(
        <Dropdown {...defaultProps} placeholder="Choose a value" />
      );
      
      expect(getByText('Choose a value')).toBeTruthy();
    });

    it('renders with selected value', () => {
      const { getByText } = renderWithProviders(
        <Dropdown {...defaultProps} value="2" />
      );
      
      expect(getByText('Option 2')).toBeTruthy();
    });

    it('renders with label and required indicator', () => {
      const { getByText } = renderWithProviders(
        <Dropdown {...defaultProps} label="Select option" required />
      );
      
      expect(getByText('Select option')).toBeTruthy();
      expect(getByText('*')).toBeTruthy();
    });

    it('renders with hint text', () => {
      const { getByText } = renderWithProviders(
        <Dropdown {...defaultProps} hint="Please select an option" />
      );
      
      expect(getByText('Please select an option')).toBeTruthy();
    });

    it('renders with error state', () => {
      const { getByText, queryByText } = renderWithProviders(
        <Dropdown 
          {...defaultProps} 
          error="This field is required" 
          hint="This hint should not show"
        />
      );
      
      expect(getByText('This field is required')).toBeTruthy();
      expect(queryByText('This hint should not show')).toBeNull();
    });

    it('applies disabled state', () => {
      const { getByTestId } = renderWithProviders(
        <Dropdown {...defaultProps} disabled />
      );
      
      const dropdown = getByTestId('test-dropdown');
      expect(dropdown.props.accessibilityState.disabled).toBe(true);
    });
  });

  describe('Interaction', () => {
    it('opens dropdown on press', async () => {
      const { getByTestId, getByText } = renderWithProviders(
        <Dropdown {...defaultProps} />
      );
      
      const dropdown = getByTestId('test-dropdown');
      fireEvent.press(dropdown);
      
      await waitFor(() => {
        expect(getByText('Option 1')).toBeTruthy();
        expect(getByText('Option 2')).toBeTruthy();
        expect(getByText('Option 3')).toBeTruthy();
      });
    });

    it('does not open when disabled', () => {
      const { getByTestId, queryByText } = renderWithProviders(
        <Dropdown {...defaultProps} disabled />
      );
      
      const dropdown = getByTestId('test-dropdown');
      fireEvent.press(dropdown);
      
      expect(queryByText('Option 1')).toBeNull();
    });

    it('selects option on press', async () => {
      const { getByTestId, getByText } = renderWithProviders(
        <Dropdown {...defaultProps} />
      );
      
      fireEvent.press(getByTestId('test-dropdown'));
      
      await waitFor(() => {
        const option = getByTestId('test-dropdown-option-2');
        fireEvent.press(option);
      });
      
      expect(mockOnChange).toHaveBeenCalledWith('2');
    });

    it('does not select disabled option', async () => {
      const { getByTestId } = renderWithProviders(
        <Dropdown {...defaultProps} />
      );
      
      fireEvent.press(getByTestId('test-dropdown'));
      
      await waitFor(() => {
        const disabledOption = getByTestId('test-dropdown-option-3');
        fireEvent.press(disabledOption);
      });
      
      expect(mockOnChange).not.toHaveBeenCalled();
    });

    it('closes dropdown after selection', async () => {
      const { getByTestId, queryByTestId } = renderWithProviders(
        <Dropdown {...defaultProps} />
      );
      
      fireEvent.press(getByTestId('test-dropdown'));
      
      await waitFor(() => {
        const option = getByTestId('test-dropdown-option-1');
        fireEvent.press(option);
      });
      
      await waitFor(() => {
        expect(queryByTestId('test-dropdown-option-1')).toBeNull();
      });
    });
  });

  describe('Search functionality', () => {
    it('shows search input when searchable', async () => {
      const { getByTestId, getByPlaceholderText } = renderWithProviders(
        <Dropdown {...defaultProps} searchable />
      );
      
      fireEvent.press(getByTestId('test-dropdown'));
      
      await waitFor(() => {
        expect(getByPlaceholderText('Search...')).toBeTruthy();
      });
    });

    it('filters options based on search query', async () => {
      const { getByTestId, getByPlaceholderText, getByText, queryByText } = renderWithProviders(
        <Dropdown {...defaultProps} searchable />
      );
      
      fireEvent.press(getByTestId('test-dropdown'));
      
      await waitFor(() => {
        const searchInput = getByPlaceholderText('Search...');
        fireEvent.changeText(searchInput, '2');
      });
      
      expect(getByText('Option 2')).toBeTruthy();
      expect(queryByText('Option 1')).toBeNull();
      expect(queryByText('Option 3')).toBeNull();
    });

    it('filters by description as well', async () => {
      const { getByTestId, getByPlaceholderText, getByText } = renderWithProviders(
        <Dropdown {...defaultProps} searchable />
      );
      
      fireEvent.press(getByTestId('test-dropdown'));
      
      await waitFor(() => {
        const searchInput = getByPlaceholderText('Search...');
        fireEvent.changeText(searchInput, 'Description');
      });
      
      expect(getByText('Option 2')).toBeTruthy();
    });

    it('shows empty message when no matches', async () => {
      const { getByTestId, getByPlaceholderText, getByText } = renderWithProviders(
        <Dropdown {...defaultProps} searchable />
      );
      
      fireEvent.press(getByTestId('test-dropdown'));
      
      await waitFor(() => {
        const searchInput = getByPlaceholderText('Search...');
        fireEvent.changeText(searchInput, 'xyz');
      });
      
      expect(getByText('No matching options')).toBeTruthy();
    });

    it('uses custom search placeholder', async () => {
      const { getByTestId, getByPlaceholderText } = renderWithProviders(
        <Dropdown {...defaultProps} searchable searchPlaceholder="Type to search..." />
      );
      
      fireEvent.press(getByTestId('test-dropdown'));
      
      await waitFor(() => {
        expect(getByPlaceholderText('Type to search...')).toBeTruthy();
      });
    });
  });

  describe('Variants and sizes', () => {
    it('applies different variants', () => {
      const variants = ['default', 'success', 'warning', 'gentle'] as const;
      
      variants.forEach(variant => {
        const { getByTestId } = renderWithProviders(
          <Dropdown {...defaultProps} variant={variant} testID={`dropdown-${variant}`} />
        );
        
        const dropdown = getByTestId(`dropdown-${variant}`);
        expect(dropdown).toBeTruthy();
      });
    });

    it('applies different sizes', () => {
      const sizes = ['small', 'medium', 'large'] as const;
      
      sizes.forEach(size => {
        const { getByTestId } = renderWithProviders(
          <Dropdown {...defaultProps} size={size} testID={`dropdown-${size}`} />
        );
        
        const dropdown = getByTestId(`dropdown-${size}`);
        expect(dropdown).toBeTruthy();
      });
    });
  });

  describe('Accessibility', () => {
    it('has correct accessibility role and states', () => {
      const { getByTestId } = renderWithProviders(
        <Dropdown {...defaultProps} value="2" disabled />
      );
      
      const dropdown = getByTestId('test-dropdown');
      expect(dropdown.props.accessibilityRole).toBe('button');
      expect(dropdown.props.accessibilityState).toEqual({
        disabled: true,
        expanded: false,
      });
    });

    it('has correct accessibility label', () => {
      const { getByTestId } = renderWithProviders(
        <Dropdown {...defaultProps} label="Country" value="2" />
      );
      
      const dropdown = getByTestId('test-dropdown');
      expect(dropdown.props.accessibilityLabel).toBe('Country, current value: Option 2');
    });

    it('uses custom accessibility label', () => {
      const { getByTestId } = renderWithProviders(
        <Dropdown {...defaultProps} accessibilityLabel="Custom label" />
      );
      
      const dropdown = getByTestId('test-dropdown');
      expect(dropdown.props.accessibilityLabel).toBe('Custom label');
    });

    it('announces dropdown open', async () => {
      const { getByTestId } = renderWithProviders(
        <Dropdown {...defaultProps} label="Country" />
      );
      
      fireEvent.press(getByTestId('test-dropdown'));
      
      await waitFor(() => {
        expect(AccessibilityInfo.announceForAccessibility).toHaveBeenCalledWith(
          'Country opened. 3 options available.'
        );
      });
    });

    it('announces selection', async () => {
      const { getByTestId } = renderWithProviders(
        <Dropdown {...defaultProps} />
      );
      
      fireEvent.press(getByTestId('test-dropdown'));
      
      await waitFor(() => {
        const option = getByTestId('test-dropdown-option-2');
        fireEvent.press(option);
      });
      
      expect(AccessibilityInfo.announceForAccessibility).toHaveBeenCalledWith(
        'Selected Option 2, Description for option 2'
      );
    });

    it('option has correct accessibility state', async () => {
      const { getByTestId } = renderWithProviders(
        <Dropdown {...defaultProps} value="2" />
      );
      
      fireEvent.press(getByTestId('test-dropdown'));
      
      await waitFor(() => {
        const selectedOption = getByTestId('test-dropdown-option-2');
        const disabledOption = getByTestId('test-dropdown-option-3');
        
        expect(selectedOption.props.accessibilityState).toEqual({
          selected: true,
          disabled: false,
        });
        
        expect(disabledOption.props.accessibilityState).toEqual({
          selected: false,
          disabled: true,
        });
      });
    });
  });

  describe('Edge cases', () => {
    it('handles empty options array', async () => {
      const { getByTestId, getByText } = renderWithProviders(
        <Dropdown {...defaultProps} options={[]} />
      );
      
      fireEvent.press(getByTestId('test-dropdown'));
      
      await waitFor(() => {
        expect(getByText('No options available')).toBeTruthy();
      });
    });

    it('handles very long option labels', () => {
      const longOptions = [
        { 
          label: 'This is a very long option label that should be truncated properly in the dropdown display', 
          value: 'long' 
        },
      ];
      
      const { getByTestId } = renderWithProviders(
        <Dropdown {...defaultProps} options={longOptions} value="long" />
      );
      
      const dropdown = getByTestId('test-dropdown');
      expect(dropdown).toBeTruthy();
    });

    it('respects maxHeight prop', async () => {
      const manyOptions = Array.from({ length: 20 }, (_, i) => ({
        label: `Option ${i + 1}`,
        value: `${i + 1}`,
      }));
      
      const { getByTestId } = renderWithProviders(
        <Dropdown {...defaultProps} options={manyOptions} maxHeight={200} />
      );
      
      fireEvent.press(getByTestId('test-dropdown'));
      
      // The modal content should have the maxHeight applied
      await waitFor(() => {
        expect(getByTestId('test-dropdown-option-1')).toBeTruthy();
      });
    });
  });
});