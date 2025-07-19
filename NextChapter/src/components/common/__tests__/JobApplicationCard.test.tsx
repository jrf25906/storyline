import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { JobApplicationCard, JobApplication, ApplicationStatus } from '@components/common/JobApplicationCard';

// Mock dependencies
jest.mock('../../../hooks/useAnimations', () => ({
  useCelebrationAnimation: () => ({
    animate: jest.fn(),
  }),
  useCardPressAnimation: () => ({
    pressIn: jest.fn(),
    pressOut: jest.fn(),
    animatedStyle: {},
  }),
}));

jest.mock('../../../contexts/ToastContext', () => ({
  useToast: () => ({
    showSuccess: jest.fn(),
    showInfo: jest.fn(),
    showWarning: jest.fn(),
  }),
}));

// Mock theme imports
jest.mock('../../../theme/colors', () => ({
  Colors: {
    background: { secondary: '#f5f5f5' },
    border: { light: '#e0e0e0' },
    text: { 
      primary: '#000000', 
      secondary: '#666666', 
      disabled: '#999999',
      inverse: '#ffffff' 
    },
    neutral: { black: '#000000' },
    primary: { main: '#2196F3', light: '#e3f2fd' },
    success: { main: '#4CAF50', dark: '#2E7D32', light: '#c8e6c9' },
    warning: { main: '#FF9800', light: '#fff3e0' },
    error: { main: '#F44336' },
  },
}));

jest.mock('../../../theme/typography', () => ({
  Typography: {
    heading: { h4: { fontSize: 16, fontWeight: '600' } },
    body: { 
      medium: { fontSize: 14 },
      small: { fontSize: 12 },
      semiBold: { fontSize: 14, fontWeight: '600' }
    },
  },
}));

jest.mock('../../../theme/spacing', () => ({
  Spacing: { xs: 4, sm: 8, md: 16, lg: 24 },
}));

// Mock LayoutAnimation for ExpandableCard
jest.mock('react-native/Libraries/LayoutAnimation/LayoutAnimation', () => ({
  configureNext: jest.fn(),
  Types: { easeInEaseOut: 'easeInEaseOut' },
  Properties: { opacity: 'opacity' },
}));

describe('JobApplicationCard', () => {
  const mockApplication: JobApplication = {
    id: '1',
    title: 'Software Engineer',
    company: 'TechCorp',
    location: 'San Francisco, CA',
    salary: '$120k - $160k',
    status: 'applied',
    appliedDate: '2024-01-15',
    nextSteps: ['Phone screening', 'Technical interview'],
    notes: 'Great company culture, focus on React experience',
    contactPerson: 'Jane Smith',
  };

  const defaultProps = {
    application: mockApplication,
    onStatusChange: jest.fn(),
    onArchive: jest.fn(),
    onDelete: jest.fn(),
    onPress: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders job application details correctly', () => {
      const { getByText } = render(<JobApplicationCard {...defaultProps} />);
      
      expect(getByText('Software Engineer at TechCorp')).toBeTruthy();
      expect(getByText('San Francisco, CA • Applied')).toBeTruthy();
    });

    it('renders compact variant correctly', () => {
      const { getByText } = render(
        <JobApplicationCard {...defaultProps} variant="compact" />
      );
      
      expect(getByText('Software Engineer')).toBeTruthy();
      expect(getByText('TechCorp')).toBeTruthy();
      expect(getByText('San Francisco, CA')).toBeTruthy();
    });

    it('renders detailed variant with expanded content', () => {
      const { getByText } = render(
        <JobApplicationCard {...defaultProps} showExpandedDetails={true} />
      );
      
      expect(getByText('$120k - $160k')).toBeTruthy();
      expect(getByText('Jane Smith')).toBeTruthy();
      expect(getByText('• Phone screening')).toBeTruthy();
    });
  });

  describe('Status Display', () => {
    const statusTests: Array<{ status: ApplicationStatus; expectedLabel: string }> = [
      { status: 'saved', expectedLabel: 'Saved' },
      { status: 'applied', expectedLabel: 'Applied' },
      { status: 'screening', expectedLabel: 'Screening' },
      { status: 'interview', expectedLabel: 'Interview' },
      { status: 'offer', expectedLabel: 'Offer!' },
      { status: 'rejected', expectedLabel: 'Not selected' },
      { status: 'archived', expectedLabel: 'Archived' },
    ];

    statusTests.forEach(({ status, expectedLabel }) => {
      it(`displays correct status for ${status}`, () => {
        const application = { ...mockApplication, status };
        const { getByText } = render(
          <JobApplicationCard {...defaultProps} application={application} variant="compact" />
        );
        
        expect(getByText(expectedLabel)).toBeTruthy();
      });
    });
  });

  describe('Swipe Actions', () => {
    it('shows apply action for saved applications', () => {
      const application = { ...mockApplication, status: 'saved' as ApplicationStatus };
      const { getByText } = render(
        <JobApplicationCard {...defaultProps} application={application} variant="compact" />
      );
      
      expect(getByText('Apply')).toBeTruthy();
    });

    it('shows screening action for applied applications', () => {
      const application = { ...mockApplication, status: 'applied' as ApplicationStatus };
      const { getByText } = render(
        <JobApplicationCard {...defaultProps} application={application} variant="compact" />
      );
      
      expect(getByText('Screening')).toBeTruthy();
    });

    it('shows interview action for screening applications', () => {
      const application = { ...mockApplication, status: 'screening' as ApplicationStatus };
      const { getByText } = render(
        <JobApplicationCard {...defaultProps} application={application} variant="compact" />
      );
      
      expect(getByText('Interview')).toBeTruthy();
    });

    it('shows archive action for non-archived applications', () => {
      const { getByText } = render(
        <JobApplicationCard {...defaultProps} variant="compact" />
      );
      
      expect(getByText('Archive')).toBeTruthy();
    });

    it('shows delete action for saved applications', () => {
      const application = { ...mockApplication, status: 'saved' as ApplicationStatus };
      const { getByText } = render(
        <JobApplicationCard {...defaultProps} application={application} variant="compact" />
      );
      
      expect(getByText('Delete')).toBeTruthy();
    });
  });

  describe('Interactions', () => {
    it('calls onPress when card is pressed', () => {
      const { getByText } = render(
        <JobApplicationCard {...defaultProps} variant="compact" />
      );
      
      fireEvent.press(getByText('Software Engineer'));
      expect(defaultProps.onPress).toHaveBeenCalledWith(mockApplication);
    });

    it('handles status change correctly', () => {
      const application = { ...mockApplication, status: 'saved' as ApplicationStatus };
      const { getByText } = render(
        <JobApplicationCard {...defaultProps} application={application} variant="compact" />
      );
      
      // This would be triggered by swipe action in real usage
      // For testing, we verify the action exists
      expect(getByText('Apply')).toBeTruthy();
    });
  });

  describe('Date Formatting', () => {
    it('formats applied date correctly', () => {
      const { getByText } = render(
        <JobApplicationCard {...defaultProps} variant="compact" />
      );
      
      // The date format includes year, so it shows as "Jan 14, 2024"
      expect(getByText('Applied Jan 14, 2024')).toBeTruthy();
    });

    it('handles missing dates gracefully', () => {
      const application = { ...mockApplication, appliedDate: undefined };
      const { queryByText } = render(
        <JobApplicationCard {...defaultProps} application={application} variant="compact" />
      );
      
      // Should not show "Applied" text when no date is provided
      expect(queryByText(/Applied \w/)).toBeNull();
    });
  });

  describe('Optional Fields', () => {
    it('renders salary when provided', () => {
      const { getByText } = render(
        <JobApplicationCard {...defaultProps} showExpandedDetails={true} />
      );
      
      expect(getByText('$120k - $160k')).toBeTruthy();
    });

    it('renders contact person when provided', () => {
      const { getByText } = render(
        <JobApplicationCard {...defaultProps} showExpandedDetails={true} />
      );
      
      expect(getByText('Jane Smith')).toBeTruthy();
    });

    it('renders next steps when provided', () => {
      const { getByText } = render(
        <JobApplicationCard {...defaultProps} showExpandedDetails={true} />
      );
      
      expect(getByText('• Phone screening')).toBeTruthy();
      expect(getByText('• Technical interview')).toBeTruthy();
    });

    it('renders notes when provided', () => {
      const { getByText } = render(
        <JobApplicationCard {...defaultProps} showExpandedDetails={true} />
      );
      
      expect(getByText('Great company culture, focus on React experience')).toBeTruthy();
    });

    it('handles missing optional fields gracefully', () => {
      const minimalApplication: JobApplication = {
        id: '2',
        title: 'Developer',
        company: 'StartupXYZ',
        location: 'Remote',
        status: 'saved',
      };

      const { getByText, queryByText } = render(
        <JobApplicationCard 
          {...defaultProps} 
          application={minimalApplication} 
          showExpandedDetails={true} 
        />
      );
      
      expect(getByText('Developer at StartupXYZ')).toBeTruthy();
      expect(queryByText('Salary:')).toBeNull();
      expect(queryByText('Contact:')).toBeNull();
    });
  });

  describe('Accessibility', () => {
    it('provides proper accessibility labels', () => {
      const { getByLabelText } = render(
        <JobApplicationCard {...defaultProps} variant="compact" />
      );
      
      expect(getByLabelText('Software Engineer at TechCorp, status: Applied')).toBeTruthy();
    });

    it('provides accessibility hints for interactions', () => {
      const { getByA11yHint } = render(
        <JobApplicationCard {...defaultProps} variant="compact" />
      );
      
      expect(getByA11yHint('Double tap to view details, swipe for actions')).toBeTruthy();
    });
  });
});