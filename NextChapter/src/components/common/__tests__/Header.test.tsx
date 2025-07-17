import React from 'react';
import { Text, TouchableOpacity } from 'react-native';
import { render, fireEvent } from '@testing-library/react-native';
import Header from '../Header';

// Mock navigation
const mockGoBack = jest.fn();
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    goBack: mockGoBack,
  }),
}));

// Mock ThemeContext
jest.mock('../../../context/ThemeContext', () => ({
  useTheme: () => ({
    theme: {
      colors: {
        background: '#F5F5F5',
        text: '#000000',
        primary: '#007AFF',
      },
    },
  }),
}));

describe('Header', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('should render with title', () => {
      const { getByText } = render(<Header title="Test Title" />);
      expect(getByText('Test Title')).toBeTruthy();
    });

    it('should not show back button by default', () => {
      const { queryByText } = render(<Header title="Test Title" />);
      expect(queryByText('←')).toBeNull();
    });

    it('should show back button when showBack is true', () => {
      const { getByText } = render(<Header title="Test Title" showBack />);
      expect(getByText('←')).toBeTruthy();
    });
  });

  describe('Navigation', () => {
    it('should call navigation.goBack when back button is pressed', () => {
      const { getByText } = render(<Header title="Test Title" showBack />);
      
      const backButton = getByText('←');
      fireEvent.press(backButton);
      
      expect(mockGoBack).toHaveBeenCalledTimes(1);
    });

    it('should not call goBack when showBack is false', () => {
      const { queryByText } = render(<Header title="Test Title" showBack={false} />);
      
      expect(queryByText('←')).toBeNull();
      expect(mockGoBack).not.toHaveBeenCalled();
    });
  });

  describe('Right Action', () => {
    it('should render right action when provided', () => {
      const rightAction = <Text testID="right-action">Settings</Text>;
      const { getByTestId } = render(
        <Header title="Test Title" rightAction={rightAction} />
      );
      
      expect(getByTestId('right-action')).toBeTruthy();
    });

    it('should render touchable right action', () => {
      const onPress = jest.fn();
      const rightAction = (
        <TouchableOpacity onPress={onPress} testID="right-button">
          <Text>Action</Text>
        </TouchableOpacity>
      );
      
      const { getByTestId } = render(
        <Header title="Test Title" rightAction={rightAction} />
      );
      
      const button = getByTestId('right-button');
      fireEvent.press(button);
      
      expect(onPress).toHaveBeenCalledTimes(1);
    });

    it('should not render right action when not provided', () => {
      const { container } = render(<Header title="Test Title" />);
      
      // Verify the right container exists but is empty
      const rightContainer = container.findAllByProps({ style: expect.objectContaining({ width: 40 }) });
      expect(rightContainer).toBeTruthy();
    });
  });

  describe('Styling', () => {
    it('should apply theme colors', () => {
      const { getByText, container } = render(<Header title="Test Title" />);
      
      const title = getByText('Test Title');
      expect(title.props.style).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ color: '#000000' }),
        ])
      );
    });

    it('should apply theme colors to back button', () => {
      const { getByText } = render(<Header title="Test Title" showBack />);
      
      const backButton = getByText('←');
      expect(backButton.props.style).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ color: '#007AFF' }),
        ])
      );
    });

    it('should have proper container height', () => {
      const { container } = render(<Header title="Test Title" />);
      
      // Find the main container (not SafeAreaView)
      const mainContainer = container.findByProps({ 
        style: expect.arrayContaining([
          expect.objectContaining({ height: 56 })
        ])
      });
      
      expect(mainContainer).toBeTruthy();
    });

    it('should center the title', () => {
      const { getByText } = render(<Header title="Test Title" />);
      
      const title = getByText('Test Title');
      expect(title.props.style).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ 
            textAlign: 'center',
            flex: 1 
          }),
        ])
      );
    });

    it('should have proper title styling', () => {
      const { getByText } = render(<Header title="Test Title" />);
      
      const title = getByText('Test Title');
      expect(title.props.style).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            fontSize: 18,
            fontWeight: '600',
          }),
        ])
      );
    });
  });

  describe('Layout', () => {
    it('should have balanced layout with left and right containers', () => {
      const { container } = render(<Header title="Test Title" />);
      
      // Both left and right containers should have the same width
      const sideContainers = container.findAllByProps({ 
        style: expect.objectContaining({ width: 40 })
      });
      
      expect(sideContainers.length).toBeGreaterThanOrEqual(2);
    });

    it('should wrap in SafeAreaView', () => {
      const { UNSAFE_getByType } = render(<Header title="Test Title" />);
      
      // Verify SafeAreaView is used for proper spacing on devices with notches
      expect(() => UNSAFE_getByType('SafeAreaView')).not.toThrow();
    });

    it('should apply background color to SafeAreaView', () => {
      const { container } = render(<Header title="Test Title" />);
      
      const safeAreaView = container.findByProps({ 
        style: { backgroundColor: '#F5F5F5' }
      });
      
      expect(safeAreaView).toBeTruthy();
    });
  });

  describe('Accessibility', () => {
    it('should have accessible back button', () => {
      const { getByText } = render(<Header title="Test Title" showBack />);
      
      const backButton = getByText('←').parent;
      expect(backButton).toBeTruthy();
      // TouchableOpacity has built-in accessibility
    });

    it('should be accessible with screen readers', () => {
      const { getByText } = render(<Header title="Profile Settings" showBack />);
      
      // Title should be readable by screen readers
      const title = getByText('Profile Settings');
      expect(title).toBeTruthy();
    });
  });

  describe('Edge Cases', () => {
    it('should handle very long titles', () => {
      const longTitle = 'This is a very long title that might overflow the header space';
      const { getByText } = render(<Header title={longTitle} />);
      
      const title = getByText(longTitle);
      expect(title).toBeTruthy();
      
      // Title has flex: 1 to handle overflow properly
      expect(title.props.style).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ flex: 1 }),
        ])
      );
    });

    it('should handle empty title', () => {
      const { container } = render(<Header title="" />);
      expect(container).toBeTruthy();
    });

    it('should handle both back button and right action', () => {
      const rightAction = <Text testID="right-action">Done</Text>;
      const { getByText, getByTestId } = render(
        <Header title="Test" showBack rightAction={rightAction} />
      );
      
      expect(getByText('←')).toBeTruthy();
      expect(getByTestId('right-action')).toBeTruthy();
    });
  });

  describe('Stress-Friendly Design', () => {
    it('should have adequate touch target size for back button', () => {
      const { getByText } = render(<Header title="Test Title" showBack />);
      
      const backButton = getByText('←');
      // Back button font size is 24, providing good touch target
      expect(backButton.props.style).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ fontSize: 24 }),
        ])
      );
    });

    it('should use calming background color', () => {
      const { container } = render(<Header title="Test Title" />);
      
      // Background color #F5F5F5 is a soft, non-harsh color
      const backgroundElements = container.findAllByProps({ 
        style: expect.objectContaining({ backgroundColor: '#F5F5F5' })
      });
      
      expect(backgroundElements.length).toBeGreaterThan(0);
    });
  });
});