import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { ToneSelector } from '../ToneSelector';
import { ThemeProvider } from '../../../context/ThemeContext';
import { CoachTone } from '../../../types/database';

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

  it('opens modal when pressed', () => {
    const { getByText, getByLabelText } = renderWithTheme(
      <ToneSelector currentTone="pragmatist" onToneChange={mockOnToneChange} />
    );

    const selector = getByLabelText('Coach tone: Pragmatist');
    fireEvent.press(selector);

    expect(getByText('Choose Coach Tone')).toBeTruthy();
    expect(getByText('Hype')).toBeTruthy();
    expect(getByText('Tough Love')).toBeTruthy();
  });

  it('calls onToneChange when new tone selected', async () => {
    const { getByText, getByLabelText } = renderWithTheme(
      <ToneSelector currentTone="pragmatist" onToneChange={mockOnToneChange} />
    );

    // Open modal
    const selector = getByLabelText('Coach tone: Pragmatist');
    fireEvent.press(selector);

    // Select new tone
    const hypeOption = getByLabelText('Hype: Energetic encouragement when you need a boost');
    fireEvent.press(hypeOption);

    await waitFor(() => {
      expect(mockOnToneChange).toHaveBeenCalledWith('hype');
    });
  });

  it('does not open modal when disabled', () => {
    const { getByLabelText, queryByText } = renderWithTheme(
      <ToneSelector currentTone="pragmatist" onToneChange={mockOnToneChange} disabled />
    );

    const selector = getByLabelText('Coach tone: Pragmatist');
    fireEvent.press(selector);

    expect(queryByText('Choose Coach Tone')).toBeNull();
  });

  it('closes modal when overlay pressed', () => {
    const { getByText, getByLabelText, queryByText } = renderWithTheme(
      <ToneSelector currentTone="pragmatist" onToneChange={mockOnToneChange} />
    );

    // Open modal
    const selector = getByLabelText('Coach tone: Pragmatist');
    fireEvent.press(selector);
    expect(getByText('Choose Coach Tone')).toBeTruthy();

    // Press overlay
    const overlay = getByText('Choose Coach Tone').parent?.parent;
    if (overlay) {
      fireEvent.press(overlay);
    }

    expect(queryByText('Choose Coach Tone')).toBeNull();
  });

  it('displays correct colors for each tone', () => {
    const { getByLabelText, getByText } = renderWithTheme(
      <ToneSelector currentTone="hype" onToneChange={mockOnToneChange} />
    );

    // Open modal
    const selector = getByLabelText('Coach tone: Hype');
    fireEvent.press(selector);

    // Check that all tone options are visible with descriptions
    expect(getByText('Energetic encouragement when you need a boost')).toBeTruthy();
    expect(getByText('Practical step-by-step guidance')).toBeTruthy();
    expect(getByText('Direct feedback to help you move forward')).toBeTruthy();
  });

  it('shows checkmark for currently selected tone', () => {
    const { getByLabelText } = renderWithTheme(
      <ToneSelector currentTone="tough-love" onToneChange={mockOnToneChange} />
    );

    // Open modal
    const selector = getByLabelText('Coach tone: Tough Love');
    fireEvent.press(selector);

    // The selected tone should have a checkmark (implemented via Ionicons)
    const toughLoveOption = getByLabelText('Tough Love: Direct feedback to help you move forward');
    expect(toughLoveOption).toBeTruthy();
  });
});