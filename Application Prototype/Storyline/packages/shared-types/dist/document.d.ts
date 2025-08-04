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
    readingTime: number;
    completionPercentage: number;
    lastEditPosition?: number;
    voiceRecordingIds?: string[];
}
export interface OutlineItem {
    id: string;
    title: string;
    level: number;
    position: number;
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
//# sourceMappingURL=document.d.ts.map