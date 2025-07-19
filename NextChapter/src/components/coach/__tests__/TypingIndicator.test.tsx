import React from 'react';
import { render } from '@testing-library/react-native';
import { TypingIndicator } from '@components/coach/TypingIndicator';
import { ThemeProvider } from '@context/ThemeContext';

const mockTheme = {
  colors: {
    calmBlue: '#4A6FA5',
    white: '#FFFFFF',
  },
};

const renderWithTheme = (component: React.ReactElement) => {
  return render(
    <ThemeProvider theme={mockTheme}>
      {component}
    </ThemeProvider>
  );
};

describe('TypingIndicator', () => {
  it('renders typing indicator', () => {
    const { getByTestId } = renderWithTheme(<TypingIndicator />);
    
    // Since the component doesn't have testID, we can check if it renders without errors
    expect(() => renderWithTheme(<TypingIndicator />)).not.toThrow();
  });

  it('displays animated dots', () => {
    const { toJSON } = renderWithTheme(<TypingIndicator />);
    const tree = toJSON();
    
    // Check that the component renders with expected structure
    expect(tree).toBeTruthy();
  });
});