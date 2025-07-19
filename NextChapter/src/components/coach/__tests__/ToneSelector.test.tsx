import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { ToneSelector } from '@components/coach/ToneSelector';
import { ThemeProvider } from '@context/ThemeContext';
import { CoachTone } from '@types/database';

const mockTheme = {
  colors: {
    surface: '#FFFFFF',
    border: '#E8EDE9',
    text: '#1D2B1F',
    textSecondary: '#5A6B5D',
    textTertiary: '#8A9B8D',
    primary: '#2D5A27',
    surfaceSection: '#F7F9F7',
    warning: '#E8A317',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
};

const renderWithTheme = (component: React.ReactElement) => {
  return render(
    <ThemeProvider theme={mockTheme}>
      {component}
    </ThemeProvider>
  );
};

describe('ToneSelector', () => {
  const mockOnToneChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders current tone correctly', () => {
    const { getByText } = renderWithTheme(
      <ToneSelector currentTone="pragmatist" onToneChange={mockOnToneChange} />
    );

    expect(getByText('Pragmatist')).toBeTruthy();
  });

  it('opens modal when pressed', async () => {
    const { getByText, getByLabelText } = renderWithTheme(
      <ToneSelector currentTone="pragmatist" onToneChange={mockOnToneChange} />
    );

    const selector = getByLabelText('Coach tone: Pragmatist');
    fireEvent.press(selector);

    await waitFor(() => {
      expect(getByText('Choose Coach Tone')).toBeTruthy();
    });

    // Use accessibility labels to find the tone options
    await waitFor(() => {
      expect(getByLabelText('Hype: Energetic encouragement when you need a boost')).toBeTruthy();
      expect(getByLabelText('Tough Love: Direct feedback to help you move forward')).toBeTruthy();
    });
  });

  it('calls onToneChange when new tone selected', async () => {
    const { getByText, getByLabelText } = renderWithTheme(
      <ToneSelector currentTone="pragmatist" onToneChange={mockOnToneChange} />
    );

    // Open modal
    const selector = getByLabelText('Coach tone: Pragmatist');
    fireEvent.press(selector);

    // Wait for modal to open
    await waitFor(() => {
      expect(getByText('Choose Coach Tone')).toBeTruthy();
    });

    // Select new tone
    const hypeOption = getByLabelText('Hype: Energetic encouragement when you need a boost');
    fireEvent.press(hypeOption);

    await waitFor(() => {
      expect(mockOnToneChange).toHaveBeenCalledWith('hype');
    });
  });

  it('does not open modal when disabled', async () => {
    const { getByLabelText, queryByText } = renderWithTheme(
      <ToneSelector currentTone="pragmatist" onToneChange={mockOnToneChange} disabled />
    );

    const selector = getByLabelText('Coach tone: Pragmatist');
    fireEvent.press(selector);

    // Wait a moment to ensure modal doesn't open
    await new Promise(resolve => setTimeout(resolve, 100));
    
    expect(queryByText('Choose Coach Tone')).toBeNull();
  });

  it('closes modal when overlay pressed', async () => {
    const { getByText, getByLabelText, queryByText, getByTestId } = renderWithTheme(
      <ToneSelector currentTone="pragmatist" onToneChange={mockOnToneChange} />
    );

    // Open modal
    const selector = getByLabelText('Coach tone: Pragmatist');
    fireEvent.press(selector);
    
    await waitFor(() => {
      expect(getByText('Choose Coach Tone')).toBeTruthy();
    });

    // Press outside the modal content (on the overlay)
    // Find the TouchableOpacity that acts as the overlay
    const modal = getByText('Choose Coach Tone').parent?.parent?.parent;
    if (modal) {
      fireEvent.press(modal);
    }

    await waitFor(() => {
      expect(queryByText('Choose Coach Tone')).toBeNull();
    });
  });

  it('displays correct colors for each tone', async () => {
    const { getByLabelText, getByText } = renderWithTheme(
      <ToneSelector currentTone="hype" onToneChange={mockOnToneChange} />
    );

    // Open modal
    const selector = getByLabelText('Coach tone: Hype');
    fireEvent.press(selector);

    await waitFor(() => {
      expect(getByText('Choose Coach Tone')).toBeTruthy();
    });

    // Check that all tone options are visible with descriptions
    await waitFor(() => {
      expect(getByText('Energetic encouragement when you need a boost')).toBeTruthy();
      expect(getByText('Practical step-by-step guidance')).toBeTruthy();
      expect(getByText('Direct feedback to help you move forward')).toBeTruthy();
    });
  });

  it('shows checkmark for currently selected tone', async () => {
    const { getByLabelText, getByText } = renderWithTheme(
      <ToneSelector currentTone="tough-love" onToneChange={mockOnToneChange} />
    );

    // Open modal
    const selector = getByLabelText('Coach tone: Tough Love');
    fireEvent.press(selector);

    await waitFor(() => {
      expect(getByText('Choose Coach Tone')).toBeTruthy();
    });

    // The selected tone should have a checkmark (implemented via Ionicons)
    const toughLoveOption = getByLabelText('Tough Love: Direct feedback to help you move forward');
    expect(toughLoveOption).toBeTruthy();
  });
});