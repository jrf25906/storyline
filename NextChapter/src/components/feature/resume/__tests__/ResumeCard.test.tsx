import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { ResumeCard } from '../ResumeCard';
import { Resume } from '../../../../types/resume';

describe('ResumeCard', () => {
  const mockResume: Resume = {
    id: 'resume-123',
    userId: 'user-123',
    fileName: 'john-doe-resume.pdf',
    fileType: '.pdf',
    content: 'base64content',
    parsedText: 'John Doe Software Engineer',
    extractedKeywords: ['software', 'engineer', 'react', 'node.js'],
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-20'),
    lastModified: new Date('2024-01-20')
  };

  const mockOnPress = jest.fn();
  const mockOnDelete = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render resume information correctly', () => {
    const { getByText, getByTestId } = render(
      <ResumeCard resume={mockResume} onPress={mockOnPress} onDelete={mockOnDelete} />
    );

    expect(getByText('john-doe-resume.pdf')).toBeTruthy();
    expect(getByText('PDF')).toBeTruthy();
    expect(getByText('4 keywords extracted')).toBeTruthy();
    expect(getByTestId('resume-card')).toBeTruthy();
  });

  it('should display file type badge with correct color', () => {
    const fileTypes = [
      { fileType: '.pdf', expectedColor: '#E74C3C' },
      { fileType: '.docx', expectedColor: '#3498DB' },
      { fileType: '.doc', expectedColor: '#3498DB' },
      { fileType: '.txt', expectedColor: '#95A5A6' }
    ];

    fileTypes.forEach(({ fileType, expectedColor }) => {
      const resume = { ...mockResume, fileType };
      const { getByTestId } = render(
        <ResumeCard resume={resume as Resume} onPress={mockOnPress} onDelete={mockOnDelete} />
      );

      const badge = getByTestId('file-type-badge');
      expect(badge.props.style).toContainEqual(
        expect.objectContaining({ backgroundColor: expectedColor })
      );
    });
  });

  it('should handle press events', () => {
    const { getByTestId } = render(
      <ResumeCard resume={mockResume} onPress={mockOnPress} onDelete={mockOnDelete} />
    );

    const card = getByTestId('resume-card');
    fireEvent.press(card);

    expect(mockOnPress).toHaveBeenCalledWith(mockResume);
  });

  it('should handle delete button press', () => {
    const { getByTestId } = render(
      <ResumeCard resume={mockResume} onPress={mockOnPress} onDelete={mockOnDelete} />
    );

    const deleteButton = getByTestId('delete-button');
    fireEvent.press(deleteButton);

    expect(mockOnDelete).toHaveBeenCalledWith(mockResume.id);
    expect(mockOnPress).not.toHaveBeenCalled(); // Should not trigger card press
  });

  it('should format dates correctly', () => {
    const { getByText } = render(
      <ResumeCard resume={mockResume} onPress={mockOnPress} onDelete={mockOnDelete} />
    );

    // Check that the date is formatted, regardless of timezone
    expect(getByText(/Last modified: \w{3} \d{1,2}, \d{4}/)).toBeTruthy();
  });

  it('should show selected state', () => {
    const { getByTestId, rerender } = render(
      <ResumeCard resume={mockResume} onPress={mockOnPress} onDelete={mockOnDelete} isSelected={false} />
    );

    let card = getByTestId('resume-card');
    const flattenedStyles = card.props.style.flat ? card.props.style.flat() : card.props.style;
    const hasBorderColor = flattenedStyles.some ? 
      flattenedStyles.some((style: any) => style?.borderColor === '#2ECC71') :
      flattenedStyles.borderColor === '#2ECC71';
    expect(hasBorderColor).toBe(false);

    rerender(
      <ResumeCard resume={mockResume} onPress={mockOnPress} onDelete={mockOnDelete} isSelected={true} />
    );

    card = getByTestId('resume-card');
    const updatedFlattenedStyles = card.props.style.flat ? card.props.style.flat() : card.props.style;
    const hasSelectedBorderColor = updatedFlattenedStyles.some ? 
      updatedFlattenedStyles.some((style: any) => style?.borderColor === '#2ECC71') :
      updatedFlattenedStyles.borderColor === '#2ECC71';
    expect(hasSelectedBorderColor).toBe(true);
  });

  it('should display keyword preview', () => {
    const { getByText } = render(
      <ResumeCard resume={mockResume} onPress={mockOnPress} onDelete={mockOnDelete} showKeywords />
    );

    // Should show first 3 keywords
    expect(getByText('software')).toBeTruthy();
    expect(getByText('engineer')).toBeTruthy();
    expect(getByText('react')).toBeTruthy();
    expect(getByText('+1 more')).toBeTruthy();
  });

  it('should handle long file names', () => {
    const longNameResume = {
      ...mockResume,
      fileName: 'this-is-a-very-long-file-name-that-should-be-truncated-properly.pdf'
    };

    const { getByText } = render(
      <ResumeCard resume={longNameResume} onPress={mockOnPress} onDelete={mockOnDelete} />
    );

    const fileName = getByText(/this-is-a-very-long.*\.pdf/);
    expect(fileName.props.numberOfLines).toBe(1);
    expect(fileName.props.ellipsizeMode).toBe('middle');
  });

  it('should have proper accessibility attributes', () => {
    const { getByTestId } = render(
      <ResumeCard resume={mockResume} onPress={mockOnPress} onDelete={mockOnDelete} />
    );

    const card = getByTestId('resume-card');
    expect(card.props.accessible).toBe(true);
    expect(card.props.accessibilityRole).toBe('button');
    expect(card.props.accessibilityLabel).toBe('Resume: john-doe-resume.pdf, PDF file, 4 keywords extracted');

    const deleteButton = getByTestId('delete-button');
    expect(deleteButton.props.accessibilityLabel).toBe('Delete resume');
    expect(deleteButton.props.accessibilityRole).toBe('button');
  });

  it('should show loading state during deletion', () => {
    const { getByTestId, rerender } = render(
      <ResumeCard resume={mockResume} onPress={mockOnPress} onDelete={mockOnDelete} isDeleting={false} />
    );

    expect(() => getByTestId('delete-spinner')).toThrow();

    rerender(
      <ResumeCard resume={mockResume} onPress={mockOnPress} onDelete={mockOnDelete} isDeleting={true} />
    );

    expect(getByTestId('delete-spinner')).toBeTruthy();
    expect(() => getByTestId('delete-button')).toThrow();
  });

  it('should disable interactions when deleting', () => {
    const { getByTestId } = render(
      <ResumeCard resume={mockResume} onPress={mockOnPress} onDelete={mockOnDelete} isDeleting={true} />
    );

    const card = getByTestId('resume-card');
    fireEvent.press(card);

    expect(mockOnPress).not.toHaveBeenCalled();
    expect(card.props.accessibilityState).toEqual({ disabled: true });
  });
});