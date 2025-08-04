import { Memory, Contradiction } from '@storyline/shared-types';

/**
 * Extended Memory interface for the memory service with additional metadata
 */
export interface ExtendedMemory extends Memory {
  versions: MemoryVersion[];
  activeVersion: string;
  userPreference: 'latest' | 'earliest' | 'layer_perspectives';
  narrativeAnalysis: NarrativeAnalysis;
  privacyLevel: 'public' | 'private' | 'sensitive';
  encryptionRequired: boolean;
}

/**
 * Memory version for tracking evolution of memories
 */
export interface MemoryVersion {
  id: string;
  timestamp: Date;
  emotionalTone: string;
  content: string;
  context: string;
  narrativeElements: NarrativeElements;
  confidence: number;
}

/**
 * Narrative elements extracted from memory
 */
export interface NarrativeElements {
  characters_mentioned: string[];
  story_beat?: 'exposition' | 'inciting_incident' | 'rising_action' | 'climax' | 'falling_action' | 'resolution';
  conflict_type?: 'internal' | 'external' | 'interpersonal' | 'societal';
  theme?: string;
  setting?: string;
  mood?: string;
}

/**
 * Narrative analysis for story structure tracking
 */
export interface NarrativeAnalysis {
  character_development_stage: 'introduction' | 'development' | 'transformation' | 'resolution';
  plot_progression: number; // 0-1 scale
  theme_consistency: number; // 0-1 scale
  emotional_arc: string;
  story_coherence: number; // 0-1 scale
}

/**
 * Graph node for relationship storage
 */
export interface GraphNode {
  id: string;
  type: 'character' | 'theme' | 'event' | 'location' | 'conflict' | 'memory';
  properties: Record<string, any>;
  labels: string[];
}

/**
 * Graph relationship for connecting nodes
 */
export interface GraphRelationship {
  id: string;
  fromNodeId: string;
  toNodeId: string;
  type: string;
  properties: Record<string, any>;
  weight: number;
}

/**
 * Context query for memory retrieval
 */
export interface ContextQuery {
  query: string;
  userId: string;
  documentId?: string;
  maxResults?: number;
  includeGraph?: boolean;
  includeVector?: boolean;
  emotionalContext?: string;
  timeRange?: {
    start: Date;
    end: Date;
  };
  filters?: MemoryFilter[];
}

/**
 * Memory filter for search refinement
 */
export interface MemoryFilter {
  field: 'type' | 'emotionalTone' | 'documentId' | 'privacyLevel' | 'theme';
  operator: 'eq' | 'neq' | 'in' | 'nin' | 'contains' | 'gt' | 'lt';
  value: any;
}

/**
 * Memory search result
 */
export interface MemorySearchResult {
  memories: ExtendedMemory[];
  relationships: GraphRelationship[];
  totalCount: number;
  queryTime: number;
  source: 'vector' | 'graph' | 'hybrid';
}

/**
 * Contradiction detection result
 */
export interface ContradictionDetectionResult {
  contradictions: EnhancedContradiction[];
  confidence: number;
  suggestions: ContradictionSuggestion[];
}

/**
 * Enhanced contradiction with resolution options
 */
export interface EnhancedContradiction extends Contradiction {
  severity: 'low' | 'medium' | 'high';
  confidence: number;
  affectedMemories: string[];
  narrativeImpact: 'positive' | 'neutral' | 'negative';
  suggestions: ContradictionSuggestion[];
}

/**
 * Suggestion for handling contradictions
 */
export interface ContradictionSuggestion {
  action: 'replace' | 'layer' | 'explore' | 'merge' | 'ignore';
  reason: string;
  confidence: number;
  narrativeImprovement?: string;
}

/**
 * Memory storage configuration
 */
export interface MemoryStorageConfig {
  vectorStore: {
    collection: string;
    dimension: number;
    distance: 'cosine' | 'euclidean' | 'dot';
  };
  graphStore: {
    database: string;
    labels: string[];
  };
  cache: {
    ttl: number;
    maxSize: number;
  };
}

/**
 * Query routing decision
 */
export interface QueryRoutingDecision {
  useVector: boolean;
  useGraph: boolean;
  strategy: 'vector_only' | 'graph_only' | 'hybrid_parallel' | 'hybrid_sequential';
  confidence: number;
  reasoning: string;
}

/**
 * Memory service metrics
 */
export interface MemoryMetrics {
  vectorQueries: {
    count: number;
    averageLatency: number;
    accuracy: number;
  };
  graphQueries: {
    count: number;
    averageLatency: number;
    accuracy: number;
  };
  hybridQueries: {
    count: number;
    averageLatency: number;
    synthesisTime: number;
  };
  contradictionsDetected: number;
  contradictionsResolved: number;
  memoryEvolutions: number;
}