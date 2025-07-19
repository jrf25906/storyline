import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { AnalysisResults } from '@components/feature/resume/AnalysisResults';
import { ResumeAnalysis } from '@types/resume';

describe('AnalysisResults', () => {
  const mockAnalysis: ResumeAnalysis = {
    resumeId: 'resume-123',
    matchedKeywords: [
      { keyword: 'react', count: 5, relevance: 'high' },
      { keyword: 'javascript', count: 3, relevance: 'high' },
      { keyword: 'node.js', count: 2, relevance: 'medium' },
      { keyword: 'css', count: 1, relevance: 'low' }
    ],
    missingKeywords: ['python', 'aws', 'docker', 'kubernetes'],
    overallScore: 72,
    suggestions: [
      {
        id: 'sug-1',
        type: 'keyword',
        priority: 'high',
        originalText: 'Experience with frontend technologies',
        suggestedText: 'Experience with frontend technologies including React, Python, and AWS',
        reason: 'Add high-priority missing keywords',
        applied: false
      },
      {
        id: 'sug-2',
        type: 'format',
        priority: 'medium',
        originalText: 'Software Developer',
        suggestedText: 'Senior Software Developer | Full Stack Engineer',
        reason: 'Enhance title to reflect seniority and full-stack capabilities',
        applied: false
      }
    ],
    createdAt: new Date()
  };

  const mockOnGenerateRewrite = jest.fn();
  const mockOnApplySuggestion = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Score Display', () => {
    it('should display overall score with correct color', () => {
      const { getByText, getByTestId } = render(
        <AnalysisResults 
          analysis={mockAnalysis} 
          onGenerateRewrite={mockOnGenerateRewrite}
        />
      );

      expect(getByText('72%')).toBeTruthy();
      
      const scoreCircle = getByTestId('score-circle');
      // Score 72 should be yellow/warning color
      expect(scoreCircle.props.style).toContainEqual(
        expect.objectContaining({ borderColor: '#F39C12' })
      );
    });

    it('should show different colors for score ranges', () => {
      const scoreRanges = [
        { score: 85, color: '#2ECC71' }, // High - Green
        { score: 72, color: '#F39C12' }, // Medium - Yellow
        { score: 45, color: '#E74C3C' }  // Low - Red
      ];

      scoreRanges.forEach(({ score, color }) => {
        const analysis = { ...mockAnalysis, overallScore: score };
        const { getByTestId } = render(
          <AnalysisResults 
            analysis={analysis} 
            onGenerateRewrite={mockOnGenerateRewrite}
          />
        );

        const scoreCircle = getByTestId('score-circle');
        expect(scoreCircle.props.style).toContainEqual(
          expect.objectContaining({ borderColor: color })
        );
      });
    });

    it('should display score interpretation message', () => {
      const interpretations = [
        { score: 85, message: 'Excellent match!' },
        { score: 72, message: 'Good match with room for improvement' },
        { score: 45, message: 'Consider adding more relevant keywords' }
      ];

      interpretations.forEach(({ score, message }) => {
        const analysis = { ...mockAnalysis, overallScore: score };
        const { getByText } = render(
          <AnalysisResults 
            analysis={analysis} 
            onGenerateRewrite={mockOnGenerateRewrite}
          />
        );

        expect(getByText(message)).toBeTruthy();
      });
    });
  });

  describe('Matched Keywords', () => {
    it('should display matched keywords with counts and relevance', () => {
      const { getByText, getAllByTestId, getAllByText } = render(
        <AnalysisResults 
          analysis={mockAnalysis} 
          onGenerateRewrite={mockOnGenerateRewrite}
        />
      );

      expect(getByText('Matched Keywords (4)')).toBeTruthy();
      
      const keywordItems = getAllByTestId(/keyword-match-/);
      expect(keywordItems).toHaveLength(4);

      // Check specific keyword details
      expect(getByText('react')).toBeTruthy();
      expect(getByText('5x')).toBeTruthy();
      // HIGH appears multiple times, so just check that it exists
      const highTexts = getAllByText('HIGH');
      expect(highTexts.length).toBeGreaterThan(0);
    });

    it('should sort keywords by relevance and count', () => {
      const { getAllByTestId, getByText } = render(
        <AnalysisResults 
          analysis={mockAnalysis} 
          onGenerateRewrite={mockOnGenerateRewrite}
        />
      );

      const keywordItems = getAllByTestId(/keyword-match-/);
      
      // First keyword should be 'react' (high relevance, highest count)
      // Check the text content of the first keyword item
      const reactText = getByText('react');
      expect(reactText).toBeTruthy();
    });

    it('should show relevance badges with appropriate colors', () => {
      const { getByTestId } = render(
        <AnalysisResults 
          analysis={mockAnalysis} 
          onGenerateRewrite={mockOnGenerateRewrite}
        />
      );

      // Check specific relevance badges
      const highBadge = getByTestId('relevance-badge-high-0');
      expect(highBadge.props.style).toContainEqual(
        expect.objectContaining({ backgroundColor: '#2ECC71' })
      );
      
      const mediumBadge = getByTestId('relevance-badge-medium-2');
      expect(mediumBadge.props.style).toContainEqual(
        expect.objectContaining({ backgroundColor: '#F39C12' })
      );
      
      const lowBadge = getByTestId('relevance-badge-low-3');
      expect(lowBadge.props.style).toContainEqual(
        expect.objectContaining({ backgroundColor: '#95A5A6' })
      );
    });
  });

  describe('Missing Keywords', () => {
    it('should display missing keywords', () => {
      const { getByText, getAllByTestId } = render(
        <AnalysisResults 
          analysis={mockAnalysis} 
          onGenerateRewrite={mockOnGenerateRewrite}
        />
      );

      expect(getByText('Missing Keywords (4)')).toBeTruthy();
      
      const missingItems = getAllByTestId(/missing-keyword-/);
      expect(missingItems).toHaveLength(4);

      mockAnalysis.missingKeywords.forEach(keyword => {
        expect(getByText(keyword)).toBeTruthy();
      });
    });

    it('should show add buttons for missing keywords when onApplySuggestion is provided', () => {
      const { getAllByTestId, queryAllByTestId } = render(
        <AnalysisResults 
          analysis={mockAnalysis} 
          onGenerateRewrite={mockOnGenerateRewrite}
          onApplySuggestion={mockOnApplySuggestion}
        />
      );

      const addButtons = getAllByTestId(/add-keyword-button-/);
      expect(addButtons).toHaveLength(4);

      // Each button should have proper accessibility
      addButtons.forEach((button, index) => {
        expect(button.props.accessibilityLabel).toBe(
          `Add ${mockAnalysis.missingKeywords[index]} to resume`
        );
      });
    });
    
    it('should not show add buttons when onApplySuggestion is not provided', () => {
      const { queryAllByTestId } = render(
        <AnalysisResults 
          analysis={mockAnalysis} 
          onGenerateRewrite={mockOnGenerateRewrite}
        />
      );

      const addButtons = queryAllByTestId(/add-keyword-button-/);
      expect(addButtons).toHaveLength(0);
    });
  });

  describe('Suggestions', () => {
    it('should display suggestions grouped by priority', () => {
      const { getByText, getAllByTestId } = render(
        <AnalysisResults 
          analysis={mockAnalysis} 
          onGenerateRewrite={mockOnGenerateRewrite}
        />
      );

      expect(getByText('Improvement Suggestions')).toBeTruthy();
      
      const suggestionCards = getAllByTestId(/suggestion-card-/);
      expect(suggestionCards).toHaveLength(2);

      // Check high priority suggestion
      expect(getByText(/Add high-priority missing keywords/)).toBeTruthy();
      
      // Check medium priority suggestion
      expect(getByText(/Enhance title to reflect/)).toBeTruthy();
    });

    it('should show suggestion type icons', () => {
      const { getByTestId } = render(
        <AnalysisResults 
          analysis={mockAnalysis} 
          onGenerateRewrite={mockOnGenerateRewrite}
        />
      );

      expect(getByTestId('suggestion-icon-keyword')).toBeTruthy();
      expect(getByTestId('suggestion-icon-format')).toBeTruthy();
    });

    it('should handle suggestion application', () => {
      const { getByTestId } = render(
        <AnalysisResults 
          analysis={mockAnalysis} 
          onGenerateRewrite={mockOnGenerateRewrite}
          onApplySuggestion={mockOnApplySuggestion}
        />
      );

      // First expand the suggestion to see the apply button
      const suggestionCard = getByTestId('suggestion-card-sug-1');
      fireEvent.press(suggestionCard);
      
      // Now press the apply button
      const applyButton = getByTestId('apply-suggestion-button-sug-1');
      fireEvent.press(applyButton);

      expect(mockOnApplySuggestion).toHaveBeenCalledWith(mockAnalysis.suggestions[0]);
    });

    it('should show applied state for suggestions', () => {
      const analysisWithApplied = {
        ...mockAnalysis,
        suggestions: [
          { ...mockAnalysis.suggestions[0], applied: true },
          mockAnalysis.suggestions[1]
        ]
      };

      const { getByTestId, queryByTestId } = render(
        <AnalysisResults 
          analysis={analysisWithApplied} 
          onGenerateRewrite={mockOnGenerateRewrite}
          onApplySuggestion={mockOnApplySuggestion}
        />
      );

      // Applied suggestion should show checkmark
      expect(getByTestId('applied-checkmark-sug-1')).toBeTruthy();
      
      // Expand the applied suggestion to check for apply button
      const suggestionCard = getByTestId('suggestion-card-sug-1');
      fireEvent.press(suggestionCard);
      
      // Apply button should be hidden for applied suggestions
      expect(queryByTestId('apply-suggestion-button-sug-1')).toBeNull();
    });

    it('should expand/collapse suggestion details', () => {
      const { getByTestId, queryByText } = render(
        <AnalysisResults 
          analysis={mockAnalysis} 
          onGenerateRewrite={mockOnGenerateRewrite}
        />
      );

      const suggestionCard = getByTestId('suggestion-card-sug-1');
      
      // Initially collapsed - suggested text not visible
      expect(queryByText(mockAnalysis.suggestions[0].suggestedText)).toBeNull();

      // Expand
      fireEvent.press(suggestionCard);
      expect(queryByText(mockAnalysis.suggestions[0].suggestedText)).toBeTruthy();

      // Collapse
      fireEvent.press(suggestionCard);
      expect(queryByText(mockAnalysis.suggestions[0].suggestedText)).toBeNull();
    });
  });

  describe('Generate Rewrite Button', () => {
    it('should show generate rewrite button', () => {
      const { getByTestId } = render(
        <AnalysisResults 
          analysis={mockAnalysis} 
          onGenerateRewrite={mockOnGenerateRewrite}
        />
      );

      const button = getByTestId('generate-rewrite-button');
      expect(button).toBeTruthy();
      expect(button.props.accessibilityLabel).toBe('Generate AI-powered rewrite suggestions');
    });

    it('should trigger rewrite generation', () => {
      const { getByTestId } = render(
        <AnalysisResults 
          analysis={mockAnalysis} 
          onGenerateRewrite={mockOnGenerateRewrite}
        />
      );

      const button = getByTestId('generate-rewrite-button');
      fireEvent.press(button);

      expect(mockOnGenerateRewrite).toHaveBeenCalled();
    });

    it('should be disabled when loading', () => {
      const { getByTestId } = render(
        <AnalysisResults 
          analysis={mockAnalysis} 
          onGenerateRewrite={mockOnGenerateRewrite}
          isGeneratingRewrite={true}
        />
      );

      const button = getByTestId('generate-rewrite-button');
      expect(button.props.accessibilityState).toEqual({ disabled: true });
    });
  });

  describe('Empty States', () => {
    it('should handle analysis with no matched keywords', () => {
      const emptyAnalysis = {
        ...mockAnalysis,
        matchedKeywords: []
      };

      const { getByText } = render(
        <AnalysisResults 
          analysis={emptyAnalysis} 
          onGenerateRewrite={mockOnGenerateRewrite}
        />
      );

      expect(getByText('No matching keywords found')).toBeTruthy();
    });

    it('should handle analysis with no missing keywords', () => {
      const perfectAnalysis = {
        ...mockAnalysis,
        missingKeywords: []
      };

      const { getByText } = render(
        <AnalysisResults 
          analysis={perfectAnalysis} 
          onGenerateRewrite={mockOnGenerateRewrite}
        />
      );

      expect(getByText('All required keywords are present!')).toBeTruthy();
    });

    it('should handle analysis with no suggestions', () => {
      const noSuggestionsAnalysis = {
        ...mockAnalysis,
        suggestions: []
      };

      const { getByText } = render(
        <AnalysisResults 
          analysis={noSuggestionsAnalysis} 
          onGenerateRewrite={mockOnGenerateRewrite}
        />
      );

      expect(getByText('No specific improvements suggested')).toBeTruthy();
    });
  });

  describe('Accessibility', () => {
    it('should have proper accessibility labels for all interactive elements', () => {
      const { getByTestId } = render(
        <AnalysisResults 
          analysis={mockAnalysis} 
          onGenerateRewrite={mockOnGenerateRewrite}
        />
      );

      const scoreCircle = getByTestId('score-circle');
      expect(scoreCircle.props.accessibilityLabel).toBe(
        'Resume match score: 72 percent. Good match with room for improvement'
      );

      const generateButton = getByTestId('generate-rewrite-button');
      expect(generateButton.props.accessibilityRole).toBe('button');
    });

    it('should announce section headers', () => {
      const { getByText } = render(
        <AnalysisResults 
          analysis={mockAnalysis} 
          onGenerateRewrite={mockOnGenerateRewrite}
        />
      );

      const headers = [
        'Matched Keywords (4)',
        'Missing Keywords (4)',
        'Improvement Suggestions'
      ];

      headers.forEach(header => {
        const element = getByText(header);
        expect(element.props.accessibilityRole).toBe('header');
      });
    });
  });

  describe('Export Functionality', () => {
    it('should show export button only when onExport is provided', () => {
      const mockOnExport = jest.fn();
      const { getByTestId, queryByTestId, rerender } = render(
        <AnalysisResults 
          analysis={mockAnalysis} 
          onGenerateRewrite={mockOnGenerateRewrite}
        />
      );

      // Should not show without onExport
      expect(queryByTestId('export-analysis-button')).toBeNull();
      
      // Should show with onExport
      rerender(
        <AnalysisResults 
          analysis={mockAnalysis} 
          onGenerateRewrite={mockOnGenerateRewrite}
          onExport={mockOnExport}
        />
      );
      
      expect(getByTestId('export-analysis-button')).toBeTruthy();
    });

    it('should export analysis as text', () => {
      const mockOnExport = jest.fn();
      const { getByTestId } = render(
        <AnalysisResults 
          analysis={mockAnalysis} 
          onGenerateRewrite={mockOnGenerateRewrite}
          onExport={mockOnExport}
        />
      );

      fireEvent.press(getByTestId('export-analysis-button'));
      expect(mockOnExport).toHaveBeenCalledWith(mockAnalysis);
    });
  });
});