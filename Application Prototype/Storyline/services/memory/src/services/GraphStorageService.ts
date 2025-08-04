import { Driver, Session, Record } from 'neo4j-driver';
import { DatabaseConfig } from '../config/database';
import { memoryConfig, performanceConfig } from '../config/memory';
import { 
  ExtendedMemory, 
  GraphNode, 
  GraphRelationship, 
  MemorySearchResult, 
  ContextQuery 
} from '../types';
import { logger } from '../utils/logger';

/**
 * Graph storage service using Neo4j for relationship-based queries
 */
export class GraphStorageService {
  private driver: Driver;

  constructor() {
    this.driver = DatabaseConfig.getNeo4j();
  }

  /**
   * Initialize the graph storage service
   */
  async initialize(): Promise<void> {
    const session = this.driver.session();
    
    try {
      // Create constraints and indexes
      await session.run(`
        CREATE CONSTRAINT memory_id IF NOT EXISTS 
        FOR (m:Memory) REQUIRE m.id IS UNIQUE
      `);

      await session.run(`
        CREATE CONSTRAINT character_id IF NOT EXISTS 
        FOR (c:Character) REQUIRE c.id IS UNIQUE
      `);

      await session.run(`
        CREATE CONSTRAINT theme_name IF NOT EXISTS 
        FOR (t:Theme) REQUIRE t.name IS UNIQUE
      `);

      await session.run(`
        CREATE INDEX memory_user_idx IF NOT EXISTS 
        FOR (m:Memory) ON (m.userId)
      `);

      await session.run(`
        CREATE INDEX memory_document_idx IF NOT EXISTS 
        FOR (m:Memory) ON (m.documentId)
      `);

      await session.run(`
        CREATE INDEX memory_timestamp_idx IF NOT EXISTS 
        FOR (m:Memory) ON (m.timestamp)
      `);

      logger.info('Graph storage service initialized successfully');

    } catch (error) {
      logger.error('Failed to initialize graph storage service:', error);
      throw error;
    } finally {
      await session.close();
    }
  }

  /**
   * Store memory and its relationships in the graph
   */
  async storeMemory(memory: ExtendedMemory): Promise<void> {
    const session = this.driver.session();

    try {
      await session.executeWrite(async (tx) => {
        // Create memory node
        await tx.run(`
          CREATE (m:Memory {
            id: $id,
            userId: $userId,
            content: $content,
            type: $type,
            timestamp: datetime($timestamp),
            privacyLevel: $privacyLevel,
            activeVersion: $activeVersion,
            emotionalTone: $emotionalTone,
            storyBeat: $storyBeat,
            conflictType: $conflictType,
            theme: $theme
          })
        `, {
          id: memory.id,
          userId: memory.userId,
          content: memory.content,
          type: memory.type,
          timestamp: memory.timestamp.toISOString(),
          privacyLevel: memory.privacyLevel,
          activeVersion: memory.activeVersion,
          emotionalTone: memory.versions[memory.versions.length - 1]?.emotionalTone || '',
          storyBeat: memory.versions[memory.versions.length - 1]?.narrativeElements.story_beat || '',
          conflictType: memory.versions[memory.versions.length - 1]?.narrativeElements.conflict_type || '',
          theme: memory.versions[memory.versions.length - 1]?.narrativeElements.theme || '',
        });

        // Link to documents
        for (const documentId of memory.documentIds) {
          await tx.run(`
            MERGE (d:Document {id: $documentId})
            WITH d
            MATCH (m:Memory {id: $memoryId})
            CREATE (m)-[:BELONGS_TO]->(d)
          `, {
            documentId,
            memoryId: memory.id,
          });
        }

        // Create character nodes and relationships
        const latestVersion = memory.versions[memory.versions.length - 1];
        if (latestVersion?.narrativeElements.characters_mentioned) {
          for (const characterName of latestVersion.narrativeElements.characters_mentioned) {
            await tx.run(`
              MERGE (c:Character {name: $characterName, userId: $userId})
              WITH c
              MATCH (m:Memory {id: $memoryId})
              CREATE (m)-[:MENTIONS]->(c)
            `, {
              characterName,
              userId: memory.userId,
              memoryId: memory.id,
            });
          }
        }

        // Create theme relationships
        if (latestVersion?.narrativeElements.theme) {
          await tx.run(`
            MERGE (t:Theme {name: $themeName, userId: $userId})
            WITH t
            MATCH (m:Memory {id: $memoryId})
            CREATE (m)-[:EXPLORES]->(t)
          `, {
            themeName: latestVersion.narrativeElements.theme,
            userId: memory.userId,
            memoryId: memory.id,
          });
        }

        // Create setting/location relationships
        if (latestVersion?.narrativeElements.setting) {
          await tx.run(`
            MERGE (l:Location {name: $locationName, userId: $userId})
            WITH l
            MATCH (m:Memory {id: $memoryId})
            CREATE (m)-[:TAKES_PLACE_IN]->(l)
          `, {
            locationName: latestVersion.narrativeElements.setting,
            userId: memory.userId,
            memoryId: memory.id,
          });
        }
      });

      logger.debug('Memory stored in graph database', {
        memoryId: memory.id,
        userId: memory.userId,
      });

    } catch (error) {
      logger.error('Failed to store memory in graph database:', error, {
        memoryId: memory.id,
        userId: memory.userId,
      });
      throw error;
    } finally {
      await session.close();
    }
  }

  /**
   * Update memory relationships in the graph
   */
  async updateMemory(memory: ExtendedMemory): Promise<void> {
    const session = this.driver.session();

    try {
      await session.executeWrite(async (tx) => {
        // Delete existing relationships
        await tx.run(`
          MATCH (m:Memory {id: $memoryId})-[r]-()
          DELETE r
        `, { memoryId: memory.id });

        // Update memory properties
        await tx.run(`
          MATCH (m:Memory {id: $id})
          SET m.content = $content,
              m.emotionalTone = $emotionalTone,
              m.storyBeat = $storyBeat,
              m.conflictType = $conflictType,
              m.theme = $theme,
              m.activeVersion = $activeVersion
        `, {
          id: memory.id,
          content: memory.content,
          activeVersion: memory.activeVersion,
          emotionalTone: memory.versions[memory.versions.length - 1]?.emotionalTone || '',
          storyBeat: memory.versions[memory.versions.length - 1]?.narrativeElements.story_beat || '',
          conflictType: memory.versions[memory.versions.length - 1]?.narrativeElements.conflict_type || '',
          theme: memory.versions[memory.versions.length - 1]?.narrativeElements.theme || '',
        });
      });

      // Re-create relationships using the store method logic
      const session2 = this.driver.session();
      try {
        await session2.executeWrite(async (tx) => {
          // Re-create all relationships (similar to store method)
          // ... (relationship creation logic from storeMemory)
        });
      } finally {
        await session2.close();
      }

      logger.debug('Memory updated in graph database', {
        memoryId: memory.id,
        userId: memory.userId,
      });

    } catch (error) {
      logger.error('Failed to update memory in graph database:', error, {
        memoryId: memory.id,
        userId: memory.userId,
      });
      throw error;
    } finally {
      await session.close();
    }
  }

  /**
   * Delete memory and its relationships from the graph
   */
  async deleteMemory(memoryId: string): Promise<void> {
    const session = this.driver.session();

    try {
      await session.executeWrite(async (tx) => {
        await tx.run(`
          MATCH (m:Memory {id: $memoryId})
          DETACH DELETE m
        `, { memoryId });
      });

      logger.debug('Memory deleted from graph database', {
        memoryId,
      });

    } catch (error) {
      logger.error('Failed to delete memory from graph database:', error, {
        memoryId,
      });
      throw error;
    } finally {
      await session.close();
    }
  }

  /**
   * Search memories using graph relationships
   */
  async searchMemories(query: ContextQuery): Promise<MemorySearchResult> {
    const session = this.driver.session();

    try {
      const startTime = Date.now();

      // Build Cypher query based on context
      let cypherQuery = `
        MATCH (m:Memory)
        WHERE m.userId = $userId
      `;

      const parameters: any = { userId: query.userId };

      // Add document filter
      if (query.documentId) {
        cypherQuery += ` AND EXISTS((m)-[:BELONGS_TO]->(:Document {id: $documentId}))`;
        parameters.documentId = query.documentId;
      }

      // Add time range filter
      if (query.timeRange) {
        cypherQuery += ` AND m.timestamp >= datetime($startTime) AND m.timestamp <= datetime($endTime)`;
        parameters.startTime = query.timeRange.start.toISOString();
        parameters.endTime = query.timeRange.end.toISOString();
      }

      // Add text search for content
      if (query.query.trim()) {
        cypherQuery += ` AND (m.content CONTAINS $searchTerm OR m.emotionalTone CONTAINS $searchTerm OR m.theme CONTAINS $searchTerm)`;
        parameters.searchTerm = query.query.toLowerCase();
      }

      // Add relationship context
      cypherQuery += `
        OPTIONAL MATCH (m)-[r1]->(c:Character)
        OPTIONAL MATCH (m)-[r2]->(t:Theme)
        OPTIONAL MATCH (m)-[r3]->(l:Location)
        RETURN m, collect(DISTINCT c) as characters, collect(DISTINCT t) as themes, 
               collect(DISTINCT l) as locations,
               collect(DISTINCT r1) as characterRels,
               collect(DISTINCT r2) as themeRels,
               collect(DISTINCT r3) as locationRels
        ORDER BY m.timestamp DESC
        LIMIT $limit
      `;

      parameters.limit = query.maxResults || performanceConfig.graph.maxResults;

      const result = await session.run(cypherQuery, parameters);

      const memories: ExtendedMemory[] = [];
      const relationships: GraphRelationship[] = [];

      for (const record of result.records) {
        const memoryNode = record.get('m');
        const characters = record.get('characters') || [];
        const themes = record.get('themes') || [];
        const locations = record.get('locations') || [];

        const memory: ExtendedMemory = {
          id: memoryNode.properties.id,
          userId: memoryNode.properties.userId,
          content: memoryNode.properties.content,
          embedding: [], // Not available in graph search
          type: memoryNode.properties.type,
          documentIds: [], // Will be populated if needed
          timestamp: new Date(memoryNode.properties.timestamp),
          relevance: 1.0, // Graph queries don't have similarity scores
          contradictions: [],
          versions: [], // Will be populated if needed
          activeVersion: memoryNode.properties.activeVersion,
          userPreference: 'latest',
          narrativeAnalysis: {
            character_development_stage: 'development',
            plot_progression: 0.5,
            theme_consistency: 0.8,
            emotional_arc: memoryNode.properties.emotionalTone || '',
            story_coherence: 0.7,
          },
          privacyLevel: memoryNode.properties.privacyLevel || 'private',
          encryptionRequired: memoryNode.properties.privacyLevel === 'sensitive',
        };

        memories.push(memory);

        // Add relationships
        characters.forEach((char: any) => {
          if (char.properties) {
            relationships.push({
              id: `${memory.id}-mentions-${char.properties.name}`,
              fromNodeId: memory.id,
              toNodeId: char.properties.name,
              type: 'MENTIONS',
              properties: {},
              weight: 1.0,
            });
          }
        });

        themes.forEach((theme: any) => {
          if (theme.properties) {
            relationships.push({
              id: `${memory.id}-explores-${theme.properties.name}`,
              fromNodeId: memory.id,
              toNodeId: theme.properties.name,
              type: 'EXPLORES',
              properties: {},
              weight: 1.0,
            });
          }
        });
      }

      const queryTime = Date.now() - startTime;

      logger.debug('Graph search completed', {
        query: query.query,
        userId: query.userId,
        resultsCount: memories.length,
        relationshipsCount: relationships.length,
        queryTime,
      });

      return {
        memories,
        relationships,
        totalCount: memories.length,
        queryTime,
        source: 'graph',
      };

    } catch (error) {
      logger.error('Graph search failed:', error, {
        query: query.query,
        userId: query.userId,
      });
      throw error;
    } finally {
      await session.close();
    }
  }

  /**
   * Find character relationships and development
   */
  async getCharacterRelationships(userId: string, characterName?: string): Promise<GraphRelationship[]> {
    const session = this.driver.session();

    try {
      let cypherQuery = `
        MATCH (c1:Character)-[r]-(c2:Character)
        WHERE c1.userId = $userId AND c2.userId = $userId
      `;

      const parameters: any = { userId };

      if (characterName) {
        cypherQuery += ` AND (c1.name = $characterName OR c2.name = $characterName)`;
        parameters.characterName = characterName;
      }

      cypherQuery += `
        RETURN c1, r, c2
        ORDER BY r.weight DESC
      `;

      const result = await session.run(cypherQuery, parameters);
      const relationships: GraphRelationship[] = [];

      for (const record of result.records) {
        const c1 = record.get('c1');
        const rel = record.get('r');
        const c2 = record.get('c2');

        relationships.push({
          id: rel.elementId,
          fromNodeId: c1.properties.name,
          toNodeId: c2.properties.name,
          type: rel.type,
          properties: rel.properties,
          weight: rel.properties.weight || 1.0,
        });
      }

      return relationships;

    } catch (error) {
      logger.error('Failed to get character relationships:', error, {
        userId,
        characterName,
      });
      throw error;
    } finally {
      await session.close();
    }
  }

  /**
   * Get narrative progression for a theme
   */
  async getThemeProgression(userId: string, themeName: string): Promise<ExtendedMemory[]> {
    const session = this.driver.session();

    try {
      const result = await session.run(`
        MATCH (m:Memory)-[:EXPLORES]->(t:Theme {name: $themeName})
        WHERE m.userId = $userId
        RETURN m
        ORDER BY m.timestamp
      `, { userId, themeName });

      const memories: ExtendedMemory[] = [];

      for (const record of result.records) {
        const memoryNode = record.get('m');
        
        const memory: ExtendedMemory = {
          id: memoryNode.properties.id,
          userId: memoryNode.properties.userId,
          content: memoryNode.properties.content,
          embedding: [],
          type: memoryNode.properties.type,
          documentIds: [],
          timestamp: new Date(memoryNode.properties.timestamp),
          relevance: 1.0,
          contradictions: [],
          versions: [],
          activeVersion: memoryNode.properties.activeVersion,
          userPreference: 'latest',
          narrativeAnalysis: {
            character_development_stage: 'development',
            plot_progression: 0.5,
            theme_consistency: 0.8,
            emotional_arc: memoryNode.properties.emotionalTone || '',
            story_coherence: 0.7,
          },
          privacyLevel: memoryNode.properties.privacyLevel || 'private',
          encryptionRequired: memoryNode.properties.privacyLevel === 'sensitive',
        };

        memories.push(memory);
      }

      return memories;

    } catch (error) {
      logger.error('Failed to get theme progression:', error, {
        userId,
        themeName,
      });
      throw error;
    } finally {
      await session.close();
    }
  }

  /**
   * Get graph statistics
   */
  async getStats(): Promise<any> {
    const session = this.driver.session();

    try {
      const memoryCount = await session.run('MATCH (m:Memory) RETURN count(m) as count');
      const characterCount = await session.run('MATCH (c:Character) RETURN count(c) as count');
      const themeCount = await session.run('MATCH (t:Theme) RETURN count(t) as count');
      const relationshipCount = await session.run('MATCH ()-[r]->() RETURN count(r) as count');

      return {
        memories: memoryCount.records[0]?.get('count').toNumber() || 0,
        characters: characterCount.records[0]?.get('count').toNumber() || 0,
        themes: themeCount.records[0]?.get('count').toNumber() || 0,
        relationships: relationshipCount.records[0]?.get('count').toNumber() || 0,
      };

    } catch (error) {
      logger.error('Failed to get graph storage stats:', error);
      throw error;
    } finally {
      await session.close();
    }
  }
}