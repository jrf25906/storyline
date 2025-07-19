/**
 * Content moderation service for user-generated content
 */

import { Result } from '@services/interfaces/common/result';

export interface IContentModerationService {
  // Text moderation
  moderateText(text: string, options?: ModerationOptions): Promise<Result<TextModerationResult>>;
  moderateTextBatch(texts: string[], options?: ModerationOptions): Promise<Result<TextModerationResult[]>>;
  
  // Personal information detection
  detectPII(text: string): Promise<Result<PIIDetectionResult>>;
  sanitizePII(text: string, options?: SanitizationOptions): Promise<Result<string>>;
  
  // Profanity filtering
  containsProfanity(text: string): Promise<Result<boolean>>;
  filterProfanity(text: string, replacement?: string): Promise<Result<string>>;
  
  // Custom rules
  addCustomRule(rule: ModerationRule): Promise<Result<void>>;
  removeCustomRule(ruleId: string): Promise<Result<void>>;
  getCustomRules(): Promise<Result<ModerationRule[]>>;
  
  // Allowlisting
  addToAllowlist(term: string): Promise<Result<void>>;
  removeFromAllowlist(term: string): Promise<Result<void>>;
  isAllowlisted(term: string): Promise<Result<boolean>>;
  
  // Reporting
  reportContent(content: string, reason: string, userId?: string): Promise<Result<void>>;
  getContentReports(options?: ReportQueryOptions): Promise<Result<ContentReport[]>>;
  
  // Configuration
  setModerationLevel(level: ModerationLevel): void;
  getModerationLevel(): ModerationLevel;
  setCategories(categories: ModerationCategory[]): void;
}

export interface ModerationOptions {
  categories?: ModerationCategory[];
  threshold?: number; // 0-1
  language?: string;
  context?: string;
}

export interface TextModerationResult {
  flagged: boolean;
  confidence: number;
  categories: CategoryScore[];
  suggestedAction: 'allow' | 'review' | 'block';
  reasons: string[];
}

export interface CategoryScore {
  category: ModerationCategory;
  score: number;
  flagged: boolean;
}

export type ModerationCategory = 
  | 'hate'
  | 'harassment'
  | 'self_harm'
  | 'sexual'
  | 'violence'
  | 'profanity'
  | 'spam'
  | 'personal_info'
  | 'medical_advice'
  | 'financial_advice'
  | 'legal_advice';

export interface PIIDetectionResult {
  hasPII: boolean;
  types: PIIType[];
  locations: PIILocation[];
}

export type PIIType = 
  | 'email'
  | 'phone'
  | 'ssn'
  | 'credit_card'
  | 'address'
  | 'name'
  | 'date_of_birth'
  | 'ip_address'
  | 'financial_account';

export interface PIILocation {
  type: PIIType;
  text: string;
  start: number;
  end: number;
  confidence: number;
}

export interface SanitizationOptions {
  replaceWith?: string;
  preserveFormat?: boolean;
  types?: PIIType[];
}

export interface ModerationRule {
  id?: string;
  name: string;
  description?: string;
  pattern: string | RegExp;
  action: 'flag' | 'block' | 'replace';
  replacement?: string;
  categories?: ModerationCategory[];
  enabled: boolean;
}

export type ModerationLevel = 'strict' | 'moderate' | 'lenient';

export interface ContentReport {
  id: string;
  content: string;
  reason: string;
  reportedBy?: string;
  reportedAt: Date;
  status: 'pending' | 'reviewed' | 'resolved';
  resolution?: string;
}

export interface ReportQueryOptions {
  status?: 'pending' | 'reviewed' | 'resolved';
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}