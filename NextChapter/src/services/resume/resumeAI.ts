import { OpenAIService } from '@services/api/openai';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  Resume, 
  ResumeAnalysis, 
  ResumeRewriteRequest,
  ResumeRewriteResponse,
  ResumeSuggestion,
  ResumeKeywordMatch 
} from '@types/resume';
import { getErrorMessage } from '@utils/typeGuards';

interface RateLimitData {
  count: number;
  resetTime: Date;
}

const RATE_LIMIT_KEY = '@next_chapter/resume_ai_rate_limit';
const DAILY_LIMIT_FREE = 10;

export class ResumeAIService {
  private openAIService: OpenAIService;
  private userConsent: boolean = false;
  private analysisCache: Map<string, { analysis: ResumeAnalysis; timestamp: number }> = new Map();
  private requestCounts: Map<string, number> = new Map();
  private lastResetTime: Date = new Date();
  private readonly CACHE_DURATION = 1000 * 60 * 30; // 30 minutes
  private readonly RATE_LIMIT_KEY = '@next_chapter/resume_ai_rate_limit';

  constructor(openAIService: OpenAIService) {
    this.openAIService = openAIService;
    this.loadRateLimitData();
  }

  setUserConsent(consent: boolean) {
    this.userConsent = consent;
  }

  async analyzeResume(resume: Resume, jobDescription?: string): Promise<ResumeAnalysis> {
    // Validate resume content
    if (!resume.parsedText || resume.parsedText.trim().length === 0) {
      throw new Error('Resume content is empty');
    }

    // Check rate limit
    await this.checkRateLimit(resume.userId);

    // Check cache
    const cacheKey = `${resume.id}-${resume.updatedAt.getTime()}-${jobDescription || ''}`;
    const cached = this.analysisCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.analysis;
    }

    const systemPrompt = `You are a resume analysis expert. Analyze the resume against the job description (if provided) and return a JSON object with the following structure:
    {
      "matchedKeywords": [{ "keyword": "string", "count": number, "relevance": "high|medium|low" }],
      "missingKeywords": ["string"],
      "overallScore": number (0-100),
      "suggestions": [{
        "id": "string",
        "type": "keyword|format|content|section",
        "priority": "high|medium|low",
        "originalText": "string",
        "suggestedText": "string",
        "reason": "string",
        "applied": false
      }]
    }`;

    const prompt = jobDescription 
      ? `Analyze this resume against the following job description:\n\nResume:\n${resume.parsedText}\n\nJob Description:\n${jobDescription}\n\nExtracted Keywords: ${resume.extractedKeywords.join(', ')}`
      : `Analyze this resume for general improvements:\n\nResume:\n${resume.parsedText}\n\nExtracted Keywords: ${resume.extractedKeywords.join(', ')}`;

    try {
      const { analysis } = await this.openAIService.analyzeChatContent<any>(prompt, { systemPrompt });
      
      const resumeAnalysis: ResumeAnalysis = {
        resumeId: resume.id,
        matchedKeywords: analysis.matchedKeywords || [],
        missingKeywords: analysis.missingKeywords || [],
        overallScore: analysis.overallScore || 0,
        suggestions: (analysis.suggestions || []).map((s: any) => ({
          ...s,
          id: s.id || `sug-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        })),
        createdAt: new Date()
      };

      // Cache the result
      this.analysisCache.set(cacheKey, { analysis: resumeAnalysis, timestamp: Date.now() });

      // Update rate limit
      await this.incrementRateLimit(resume.userId);

      return resumeAnalysis;
    } catch (error) {
      throw new Error(`Failed to analyze resume: ${getErrorMessage(error)}`);
    }
  }

  async generateRewriteSuggestions(
    request: ResumeRewriteRequest, 
    resume: Resume
  ): Promise<ResumeRewriteResponse> {
    // Check user consent
    if (!this.userConsent) {
      throw new Error('User consent required to process resume with AI');
    }

    // Sanitize PII from resume text
    const sanitizedResume = this.sanitizePII(resume.parsedText);

    const response = await this.openAIService.generateResumeContent({
      resume: sanitizedResume,
      targetKeywords: request.targetKeywords,
      jobDescription: request.jobDescription,
      tone: request.tone,
      focusAreas: request.focusAreas
    });

    return {
      sections: response.sections || [],
      suggestions: response.suggestions || [],
      improvedScore: response.improvedScore || 0
    };
  }

  async compareWithJobApplication(
    resume: Resume, 
    jobKeywords: string[]
  ): Promise<{
    matchedKeywords: ResumeKeywordMatch[];
    missingKeywords: string[];
    matchPercentage: number;
  }> {
    const resumeKeywordsLower = resume.extractedKeywords.map(k => k.toLowerCase());
    const jobKeywordsLower = jobKeywords.map(k => k.toLowerCase());
    
    const matchedKeywords: ResumeKeywordMatch[] = [];
    const missingKeywords: string[] = [];

    jobKeywordsLower.forEach(jobKeyword => {
      if (resumeKeywordsLower.includes(jobKeyword)) {
        // Count occurrences in parsed text
        const regex = new RegExp(`\\b${jobKeyword}\\b`, 'gi');
        const matches = resume.parsedText.match(regex) || [];
        
        matchedKeywords.push({
          keyword: jobKeyword,
          count: matches.length,
          relevance: this.calculateRelevance(jobKeyword, jobKeywords)
        });
      } else {
        missingKeywords.push(jobKeyword);
      }
    });

    const matchPercentage = (matchedKeywords.length / jobKeywords.length) * 100;

    return {
      matchedKeywords,
      missingKeywords,
      matchPercentage: Math.round(matchPercentage * 100) / 100
    };
  }

  private sanitizePII(text: string): string {
    return text
      // SSN patterns
      .replace(/\b\d{3}-\d{2}-\d{4}\b/g, '[SSN REMOVED]')
      // Phone numbers
      .replace(/\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b/g, '[PHONE REMOVED]')
      .replace(/\(\d{3}\)\s?\d{3}[-.\s]?\d{4}/g, '[PHONE REMOVED]')
      // Email addresses (basic pattern)
      .replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, '[EMAIL REMOVED]')
      // Credit card numbers
      .replace(/\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g, '[CARD REMOVED]');
  }

  private calculateRelevance(keyword: string, allKeywords: string[]): 'high' | 'medium' | 'low' {
    // Simple heuristic: keywords appearing early in the list are more important
    const position = allKeywords.findIndex(k => k.toLowerCase() === keyword.toLowerCase());
    const percentage = position / allKeywords.length;
    
    if (percentage <= 0.33) return 'high';
    if (percentage <= 0.66) return 'medium';
    return 'low';
  }

  private async checkRateLimit(userId: string = 'default'): Promise<void> {
    // Reset if it's a new day
    const now = new Date();
    const resetTime = new Date(this.lastResetTime);
    if (now.getDate() !== resetTime.getDate() || now.getMonth() !== resetTime.getMonth() || now.getFullYear() !== resetTime.getFullYear()) {
      this.requestCounts.clear();
      this.lastResetTime = now;
      await this.saveRateLimitData();
    }

    const currentCount = this.requestCounts.get(userId) || 0;
    if (currentCount >= DAILY_LIMIT_FREE) {
      throw new Error('Rate limit exceeded. Please try again later.');
    }
  }

  private async incrementRateLimit(userId: string = 'default'): Promise<void> {
    const currentCount = this.requestCounts.get(userId) || 0;
    this.requestCounts.set(userId, currentCount + 1);
    await this.saveRateLimitData();
  }

  private getNextResetTime(): Date {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    return tomorrow;
  }

  private async loadRateLimitData(): Promise<void> {
    try {
      const data = await AsyncStorage.getItem(this.RATE_LIMIT_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        this.requestCounts = new Map(Object.entries(parsed.counts));
        this.lastResetTime = new Date(parsed.lastReset);
      }
    } catch (error) {
      console.error('Failed to load rate limit data:', error);
    }
  }

  private async saveRateLimitData(): Promise<void> {
    try {
      const data = {
        counts: Object.fromEntries(this.requestCounts),
        lastReset: this.lastResetTime.toISOString()
      };
      await AsyncStorage.setItem(this.RATE_LIMIT_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save rate limit data:', error);
    }
  }
}