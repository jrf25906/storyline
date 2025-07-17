import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { Linking, Alert } from 'react-native';

// Components
import CoachScreen from '../../screens/main/CoachScreen';
import CoachChatScreen from '../../screens/coach/CoachChatScreen';
import { ThemeProvider } from '../../context/ThemeContext';
import { EmotionalStateProvider } from '../../context/EmotionalStateContext';

// Mock stores - create fresh instances for each test
const createMockCoachStore = () => ({
  messages: [],
  isLoading: false,
  sendMessage: jest.fn(),
  clearMessages: jest.fn(),
  currentTone: 'supportive',
  setTone: jest.fn(),
});

const createMockMoodStore = () => ({
  entries: [],
  addEntry: jest.fn(),
  getRecentTrend: jest.fn(() => 'declining'),
  getAverageRating: jest.fn(() => 2.1), // Low mood indicating potential crisis
});

let mockCoachStore = createMockCoachStore();
let mockMoodStore = createMockMoodStore();

const mockEmotionalState = {
  currentState: 'normal',
  setState: jest.fn(),
  triggerCelebration: jest.fn(),
  showCrisisSupport: jest.fn(),
  hideCrisisSupport: jest.fn(),
  isCrisisModeActive: false,
};

// Mock the stores
jest.mock('../../stores/coachStore', () => ({
  useCoachStore: () => mockCoachStore,
}));

jest.mock('../../stores/moodStore', () => ({
  useMoodStore: () => mockMoodStore,
}));

// Mock wellness service
const mockWellnessService = {
  detectCrisisKeywords: jest.fn(),
  getCrisisResources: jest.fn(),
  logCrisisEvent: jest.fn(),
};

jest.mock('../../services/wellness/wellnessService', () => ({
  wellnessService: mockWellnessService,
}));

// Mock Linking
jest.mock('react-native', () => ({
  ...jest.requireActual('react-native'),
  Linking: {
    openURL: jest.fn(() => Promise.resolve()),
    canOpenURL: jest.fn(() => Promise.resolve(true)),
  },
}));

// Mock auth context
const mockAuth = {
  user: { id: 'test-user', email: 'test@example.com' },
  isAuthenticated: true,
  isLoading: false,
  signIn: jest.fn(),
  signUp: jest.fn(),
  signOut: jest.fn(),
  resetPassword: jest.fn(),
  updateProfile: jest.fn(),
  resendVerificationEmail: jest.fn(),
  refreshSession: jest.fn(),
  checkEmailVerification: jest.fn(),
};

jest.mock('../../context/AuthContext', () => ({
  useAuth: () => mockAuth,
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
}));

// Test wrapper
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ThemeProvider>
    <EmotionalStateProvider value={mockEmotionalState}>
      {children}
    </EmotionalStateProvider>
  </ThemeProvider>
);

describe('Integration: Crisis Keyword → Resource Display Flow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset emotional state
    mockEmotionalState.currentState = 'normal';
    mockEmotionalState.isCrisisModeActive = false;
    
    // Reset stores with fresh instances
    mockCoachStore = createMockCoachStore();
    mockMoodStore = createMockMoodStore();
    
    // Reset wellness service
    mockWellnessService.detectCrisisKeywords.mockReturnValue({
      hasCrisisKeywords: false,
      keywords: [],
      severity: 'low',
    });
    
    mockWellnessService.getCrisisResources.mockReturnValue([
      {
        id: 'crisis-hotline',
        name: '988 Crisis Lifeline',
        phone: '988',
        description: '24/7 crisis support',
        type: 'hotline',
      },
      {
        id: 'text-crisis',
        name: 'Crisis Text Line',
        phone: '741741',
        description: 'Text HOME to 741741',
        type: 'text',
      },
    ]);
  });

  it('should detect crisis keywords and show immediate support resources', async () => {
    const { getByPlaceholderText, getByText, queryByText } = render(
      <TestWrapper>
        <CoachScreen />
      </TestWrapper>
    );

    // Step 1: User types message with crisis keywords
    const messageInput = getByPlaceholderText('Type your message...');
    const crisisMessage = "I can't take this anymore, I feel hopeless and want to hurt myself";
    
    await act(async () => {
      fireEvent.changeText(messageInput, crisisMessage);
    });

    // Step 2: Mock crisis detection
    await act(async () => {
      mockWellnessService.detectCrisisKeywords.mockReturnValue({
        hasCrisisKeywords: true,
        keywords: ['hurt myself', 'hopeless', "can't take this"],
        severity: 'high',
        confidence: 0.95,
      });
    });

    // Step 3: User sends message
    const sendButton = getByText('Send');
    
    await act(async () => {
      // Mock coach response with crisis detection
      mockCoachStore.sendMessage.mockImplementationOnce(async (message) => {
        const detection = mockWellnessService.detectCrisisKeywords(message);
        
        if (detection.hasCrisisKeywords) {
          // Trigger crisis mode
          mockEmotionalState.setState('crisis');
          mockEmotionalState.isCrisisModeActive = true;
          mockEmotionalState.showCrisisSupport();
          
          // Log crisis event
          mockWellnessService.logCrisisEvent({
            message,
            keywords: detection.keywords,
            severity: detection.severity,
            timestamp: new Date().toISOString(),
          });
        }
        
        return {
          id: 'msg-1',
          text: message,
          sender: 'user',
          timestamp: new Date().toISOString(),
        };
      });
      
      fireEvent.press(sendButton);
    });

    // Step 4: Verify crisis detection was triggered
    await waitFor(() => {
      expect(mockWellnessService.detectCrisisKeywords).toHaveBeenCalledWith(crisisMessage);
      expect(mockWellnessService.logCrisisEvent).toHaveBeenCalledWith({
        message: crisisMessage,
        keywords: ['hurt myself', 'hopeless', "can't take this"],
        severity: 'high',
        timestamp: expect.any(String),
      });
    });

    // Step 5: Verify crisis mode is activated
    await waitFor(() => {
      expect(mockEmotionalState.showCrisisSupport).toHaveBeenCalled();
      expect(mockEmotionalState.setState).toHaveBeenCalledWith('crisis');
    });

    // Step 6: Verify crisis resources are displayed
    await waitFor(() => {
      expect(queryByText('Crisis Support')).toBeTruthy();
      expect(queryByText('988 Crisis Lifeline')).toBeTruthy();
      expect(queryByText('Crisis Text Line')).toBeTruthy();
      expect(queryByText('24/7 crisis support')).toBeTruthy();
    });
  });

  it('should provide immediate access to crisis hotlines', async () => {
    // Step 1: Activate crisis mode
    await act(async () => {
      mockEmotionalState.isCrisisModeActive = true;
      mockEmotionalState.currentState = 'crisis';
    });

    const { getByText, queryByText } = render(
      <TestWrapper>
        <CoachScreen />
      </TestWrapper>
    );

    // Step 2: Verify crisis resources are displayed in coach screen
    await waitFor(() => {
      expect(queryByText('Crisis Support')).toBeTruthy();
    });

    // Step 3: Verify crisis event is logged when crisis mode is activated
    expect(mockWellnessService.logCrisisEvent).toHaveBeenCalledWith({
      action: 'crisis_mode_activated',
      timestamp: expect.any(String),
    });
  });

  it('should handle text crisis line interaction', async () => {
    await act(async () => {
      mockEmotionalState.isCrisisModeActive = true;
    });

    const { getByText, queryByText } = render(
      <TestWrapper>
        <CoachScreen />
      </TestWrapper>
    );

    // Should show crisis resources in coach screen
    await waitFor(() => {
      expect(queryByText('Crisis Support')).toBeTruthy();
    });

    // Verify crisis resources are available
    expect(mockWellnessService.getCrisisResources).toHaveBeenCalled();
  });

  it('should show emergency services for severe crisis', async () => {
    // Mock severe crisis detection
    await act(async () => {
      mockWellnessService.detectCrisisKeywords.mockReturnValue({
        hasCrisisKeywords: true,
        keywords: ['kill myself', 'suicide', 'end it all'],
        severity: 'severe',
        confidence: 0.98,
      });
      
      mockEmotionalState.currentState = 'crisis';
      mockEmotionalState.isCrisisModeActive = true;
    });

    const { queryByText } = render(
      <TestWrapper>
        <CoachScreen />
      </TestWrapper>
    );

    // Should show crisis support in coach screen
    await waitFor(() => {
      expect(queryByText('Crisis Support')).toBeTruthy();
    });

    // Verify severe crisis is logged
    expect(mockWellnessService.logCrisisEvent).toHaveBeenCalledWith({
      action: 'severe_crisis_detected',
      keywords: ['kill myself', 'suicide', 'end it all'],
      severity: 'severe',
      timestamp: expect.any(String),
    });
  });

  it('should provide breathing exercises for mild crisis', async () => {
    // Mock mild crisis detection
    await act(async () => {
      mockWellnessService.detectCrisisKeywords.mockReturnValue({
        hasCrisisKeywords: true,
        keywords: ['overwhelmed', 'anxious', 'stressed'],
        severity: 'mild',
        confidence: 0.75,
      });
      
      mockEmotionalState.currentState = 'struggling';
      mockEmotionalState.isCrisisModeActive = true;
    });

    const { queryByText } = render(
      <TestWrapper>
        <CoachScreen />
      </TestWrapper>
    );

    // Should show wellness support in coach screen
    await waitFor(() => {
      expect(queryByText('Crisis Support')).toBeTruthy();
    });

    // Verify mild crisis is logged
    expect(mockWellnessService.logCrisisEvent).toHaveBeenCalledWith({
      action: 'mild_crisis_detected',
      keywords: ['overwhelmed', 'anxious', 'stressed'],
      severity: 'mild',
      timestamp: expect.any(String),
    });
  });

  it('should track crisis intervention effectiveness', async () => {
    await act(async () => {
      mockEmotionalState.isCrisisModeActive = true;
    });

    const { queryByText } = render(
      <TestWrapper>
        <CoachScreen />
      </TestWrapper>
    );

    // Should show crisis support
    await waitFor(() => {
      expect(queryByText('Crisis Support')).toBeTruthy();
    });

    // Should log crisis intervention
    expect(mockWellnessService.logCrisisEvent).toHaveBeenCalledWith({
      action: 'crisis_intervention_active',
      timestamp: expect.any(String),
    });
  });

  it('should handle false positive crisis detection', async () => {
    const { getByPlaceholderText, getByText, queryByText } = render(
      <TestWrapper>
        <CoachScreen />
      </TestWrapper>
    );

    // User types message that might trigger false positive
    const messageInput = getByPlaceholderText('Type your message...');
    const falsePositiveMessage = "I'm going to kill it at this interview tomorrow!";
    
    await act(async () => {
      fireEvent.changeText(messageInput, falsePositiveMessage);
      
      // Mock low-confidence detection
      mockWellnessService.detectCrisisKeywords.mockReturnValue({
        hasCrisisKeywords: true,
        keywords: ['kill'],
        severity: 'low',
        confidence: 0.3, // Low confidence indicates likely false positive
      });
    });

    const sendButton = getByText('Send');
    fireEvent.press(sendButton);

    // Should not trigger crisis mode for low confidence detection
    await waitFor(() => {
      expect(mockEmotionalState.showCrisisSupport).not.toHaveBeenCalled();
      expect(queryByText('Crisis Support')).toBeFalsy();
    });
  });

  it('should provide follow-up support after crisis intervention', async () => {
    // Simulate user who previously had crisis intervention
    await act(async () => {
      mockMoodStore.getRecentTrend.mockReturnValue('improving');
      mockMoodStore.getAverageRating.mockReturnValue(3.5); // Improved mood
    });

    const { getByText, queryByText } = render(
      <TestWrapper>
        <CoachScreen />
      </TestWrapper>
    );

    // Should show follow-up support message
    await waitFor(() => {
      expect(queryByText('How are you feeling today?')).toBeTruthy();
      expect(queryByText('I noticed you might have been struggling recently')).toBeTruthy();
    });

    // User can access resources again if needed
    const resourcesButton = getByText('View Support Resources');
    fireEvent.press(resourcesButton);

    await waitFor(() => {
      expect(queryByText('Crisis Support')).toBeTruthy();
    });
  });
});