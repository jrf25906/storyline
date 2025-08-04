export interface Document {
  id: string;
  userId: string;
  title: string;
  content: string;
  type: DocumentType;
  genre?: string;
  tags: string[];
  metadata: DocumentMetadata;
  outline?: OutlineItem[];
  characters?: Character[];
  themes?: string[];
  createdAt: Date;
  updatedAt: Date;
  lastAccessedAt: Date;
}

export type DocumentType = 'fiction' | 'memoir' | 'non-fiction' | 'poetry' | 'screenplay' | 'other';

export interface DocumentMetadata {
  wordCount: number;
  characterCount: number;
  readingTime: number; // in minutes
  completionPercentage: number;
  lastEditPosition?: number;
  voiceRecordingIds?: string[];
}

export interface OutlineItem {
  id: string;
  title: string;
  level: number; // 1-6 for h1-h6
  position: number; // character position in document
  wordCount: number;
  children?: OutlineItem[];
}

export interface Character {
  id: string;
  name: string;
  description?: string;
  relationships: CharacterRelationship[];
  appearances: number[];
  traits: string[];
}

export interface CharacterRelationship {
  characterId: string;
  type: 'family' | 'friend' | 'rival' | 'romantic' | 'professional' | 'other';
  description?: string;
}

export interface DocumentVersion {
  id: string;
  documentId: string;
  versionNumber: number;
  content: string;
  changes: string;
  createdAt: Date;
  createdBy: string;
}