import { CoachService } from '@services/ai/coachService';
import { getOpenAIClient } from '@services/ai/openai';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CoachMessage } from '@types/coach';

// Mock dependencies
jest.mock('../openai');
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
}));

const mockGetOpenAIClient = getOpenAIClient as jest.MockedFunction<typeof getOpenAIClient>;
const mockAsyncStorage = AsyncStorage as jest.Mocked<typeof AsyncStorage>;

describe('CoachService', () => {
  let coachService: CoachService;
  let mockOpenAI: any;

  beforeEach(() => {
    jest.clearAllMocks();
    coachService = CoachService.getInstance();
    
    // Mock OpenAI client
    mockOpenAI = {
      chat: {
        completions: {
          create: jest.fn().mockResolvedValue({
            choices: [{
              message: {
                content: 'Test response from coach',
              },
            }],
          }),
        },
      },
      moderations: {
        create: jest.fn().mockResolvedValue({
          results: [{
            categories: {
              hate: false,
              'hate/threatening': false,
              'self-harm': false,
              'sexual': false,
              'sexual/minors': false,
              violence: false,
              'violence/graphic': false,
            },
            category_scores: {
              hate: 0.01,
              'hate/threatening': 0.01,
              'self-harm': 0.01,
              'sexual': 0.01,
              'sexual/minors': 0.01,
              violence: 0.01,
              'violence/graphic': 0.01,
            },
          }],
        }),
      },
    };
    
    mockGetOpenAIClient.mockResolvedValue(mockOpenAI);
    mockAsyncStorage.getItem.mockResolvedValue(null);
    mockAsyncStorage.setItem.mockResolvedValue();
  });

  describe('generateResponse', () => {
    it('should detect hype tone for hopeless messages', async () => {
      const result = await coachService.generateResponse(
        'I feel so hopeless about finding a job',
        [],
        'test-user'
      );

      expect(result.tone).toBe('hype');
      expect(result.response).toBeTruthy();
    });

    it('should detect tough-love tone for excuse messages', async () => {
      const result = await coachService.generateResponse(
        'They screwed me over and now no one will hire me',
        [],
        'test-user'
      );

      expect(result.tone).toBe('toughLove');
      expect(result.response).toBeTruthy();
    });

    it('should default to pragmatist tone', async () => {
      const result = await coachService.generateResponse(
        'Can you help me update my resume?',
        [],
        'test-user'
      );

      expect(result.tone).toBe('pragmatist');
      expect(result.response).toBeTruthy();
    });

    it('should handle crisis keywords appropriately', async () => {
      const result = await coachService.generateResponse(
        'I want to end it all',
        [],
        'test-user'
      );

      expect(result.flags).toContain('crisis_intervention');
      expect(result.response).toContain('988');
      expect(result.response).toContain('Crisis Text Line');
    });

    it('should enforce professional boundaries', async () => {
      const result = await coachService.generateResponse(
        'Can you give me relationship advice?',
        [],
        'test-user'
      );

      expect(result.flags).toContain('boundary_redirect');
      expect(result.response).toContain('career transition');
    });

    it('should enforce rate limits for free tier', async () => {
      // Mock that user has already sent 10 messages
      mockAsyncStorage.getItem.mockResolvedValueOnce('10');

      const result = await coachService.generateResponse(
        'Help me with my job search',
        [],
        'test-user'
      );

      expect(result.flags).toContain('rate_limit');
      expect(result.response).toContain('daily message limit');
    });

    it('should include conversation history in API call', async () => {
      const history: CoachMessage[] = [
        {
          id: '1',
          content: 'Previous user message',
          sender: 'user',
          timestamp: new Date(),
        },
        {
          id: '2',
          content: 'Previous coach response',
          sender: 'coach',
          timestamp: new Date(),
          tone: 'pragmatist',
        },
      ];

      await coachService.generateResponse(
        'Follow up message',
        history,
        'test-user'
      );

      const createCall = mockOpenAI.chat.completions.create.mock.calls[0][0];
      expect(createCall.messages).toHaveLength(4); // system + 2 history + 1 current
      expect(createCall.messages[1].content).toBe('Previous user message');
      expect(createCall.messages[2].content).toBe('Previous coach response');
    });

    it('should handle API errors gracefully', async () => {
      mockOpenAI.chat.completions.create.mockRejectedValueOnce(
        new Error('API Error')
      );

      const result = await coachService.generateResponse(
        'Help me',
        [],
        'test-user'
      );

      expect(result.flags).toContain('error_fallback');
      expect(result.response).toContain('having trouble connecting');
    });

    it('should moderate inappropriate content', async () => {
      mockOpenAI.moderations.create.mockResolvedValueOnce({
        results: [{
          categories: {
            hate: true,
            'hate/threatening': false,
            'self-harm': false,
            'sexual': false,
            'sexual/minors': false,
            violence: false,
            'violence/graphic': false,
          },
          category_scores: {
            hate: 0.96,
            'hate/threatening': 0.01,
            'self-harm': 0.01,
            'sexual': 0.01,
            'sexual/minors': 0.01,
            violence: 0.01,
            'violence/graphic': 0.01,
          },
        }],
      });

      const result = await coachService.generateResponse(
        'Inappropriate content here',
        [],
        'test-user'
      );

      expect(result.flags).toContain('content_moderated');
      expect(result.response).toContain('professional and focused');
    });
  });

  describe('offline support', () => {
    it('should provide offline responses', () => {
      const responses = coachService.getOfflineResponses();
      
      expect(responses.greeting).toBeTruthy();
      expect(responses.encouragement).toBeTruthy();
      expect(responses.taskReminder).toBeTruthy();
      expect(responses.networkingTip).toBeTruthy();
      expect(responses.applicationTip).toBeTruthy();
      expect(responses.interviewPrep).toBeTruthy();
      expect(responses.rejectionSupport).toBeTruthy();
      expect(responses.motivationBoost).toBeTruthy();
    });
  });
});