/**
 * Content analysis service for resume parsing and analysis
 */

import { Result } from '@services/interfaces/common/result';

export interface IContentAnalysisService {
  // Resume analysis
  analyzeResume(params: ResumeAnalysisParams): Promise<Result<ResumeAnalysis>>;
  
  // Job description analysis
  analyzeJobDescription(description: string): Promise<Result<JobAnalysis>>;
  
  // Matching and scoring
  matchResumeToJob(
    resume: string,
    jobDescription: string
  ): Promise<Result<MatchAnalysis>>;
  
  // Keyword extraction
  extractKeywords(text: string, options?: KeywordOptions): Promise<Result<string[]>>;
  
  // Content generation
  generateContent(params: ContentGenerationParams): Promise<Result<GeneratedContent>>;
}

export interface ResumeAnalysisParams {
  resumeText: string;
  targetRole?: string;
  industry?: string;
  experienceLevel?: 'entry' | 'mid' | 'senior' | 'executive';
}

export interface ResumeAnalysis {
  summary: string;
  strengths: string[];
  weaknesses: string[];
  missingKeywords: string[];
  suggestions: ResumeSuggestion[];
  score: number; // 0-100
  sections: {
    contact: ContactInfo;
    experience: Experience[];
    education: Education[];
    skills: string[];
    certifications?: Certification[];
  };
}

export interface ResumeSuggestion {
  section: string;
  issue: string;
  suggestion: string;
  priority: 'high' | 'medium' | 'low';
  example?: string;
}

export interface ContactInfo {
  name?: string;
  email?: string;
  phone?: string;
  location?: string;
  linkedin?: string;
}

export interface Experience {
  company: string;
  position: string;
  startDate?: string;
  endDate?: string;
  description: string;
  achievements: string[];
}

export interface Education {
  institution: string;
  degree: string;
  field?: string;
  graduationDate?: string;
  gpa?: number;
}

export interface Certification {
  name: string;
  issuer: string;
  date?: string;
  expirationDate?: string;
}

export interface JobAnalysis {
  title: string;
  company?: string;
  requiredSkills: string[];
  preferredSkills: string[];
  responsibilities: string[];
  qualifications: string[];
  experienceRequired: string;
  educationRequired: string;
  keywords: string[];
}

export interface MatchAnalysis {
  overallScore: number; // 0-100
  skillMatch: {
    matched: string[];
    missing: string[];
    score: number;
  };
  experienceMatch: {
    yearsRequired: number;
    yearsFound: number;
    relevantExperience: string[];
    score: number;
  };
  educationMatch: {
    meets: boolean;
    details: string;
    score: number;
  };
  recommendations: string[];
}

export interface KeywordOptions {
  maxKeywords?: number;
  minFrequency?: number;
  includeSkills?: boolean;
  includeSoftSkills?: boolean;
  industry?: string;
}

export interface ContentGenerationParams {
  type: 'resume_section' | 'cover_letter' | 'linkedin_summary';
  context: {
    currentContent?: string;
    targetRole?: string;
    keywords?: string[];
    tone?: 'professional' | 'conversational' | 'creative';
    length?: 'short' | 'medium' | 'long';
  };
}

export interface GeneratedContent {
  content: string;
  alternativeVersions?: string[];
  keywordsIncluded: string[];
  tone: string;
  readabilityScore: number;
}