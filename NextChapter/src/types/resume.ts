export interface Resume {
  id: string;
  userId: string;
  fileName: string;
  fileType: AllowedFileTypes;
  content: string;
  parsedText: string;
  extractedKeywords: string[];
  lastModified: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ResumeKeywordMatch {
  keyword: string;
  count: number;
  relevance: 'high' | 'medium' | 'low';
}

export interface ResumeAnalysis {
  resumeId: string;
  jobApplicationId?: string;
  matchedKeywords: ResumeKeywordMatch[];
  missingKeywords: string[];
  overallScore: number; // 0-100
  suggestions: ResumeSuggestion[];
  createdAt: Date;
}

export interface ResumeSuggestion {
  id: string;
  type: 'keyword' | 'format' | 'content' | 'section';
  priority: 'high' | 'medium' | 'low';
  originalText: string;
  suggestedText: string;
  reason: string;
  applied: boolean;
}

export interface ResumeRewriteRequest {
  resumeId: string;
  targetKeywords: string[];
  jobDescription?: string;
  tone?: 'professional' | 'creative' | 'technical';
  focusAreas?: string[];
}

export interface ResumeRewriteResponse {
  sections: ResumeSection[];
  suggestions: ResumeSuggestion[];
  improvedScore: number;
}

export interface ResumeSection {
  title: string;
  originalContent: string;
  rewrittenContent: string;
  hasChanges: boolean;
}

export interface ResumeUploadProgress {
  stage: 'uploading' | 'parsing' | 'analyzing' | 'complete' | 'error';
  progress: number; // 0-100
  message: string;
}

export type AllowedFileTypes = '.pdf' | '.docx' | '.doc' | '.txt';

export const ALLOWED_FILE_EXTENSIONS: AllowedFileTypes[] = ['.pdf', '.docx', '.doc', '.txt'];
export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB