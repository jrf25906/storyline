import neo4j from 'neo4j-driver';
import nlp from 'compromise';

const driver = neo4j.driver(
  process.env.NEO4J_URI || 'bolt://localhost:7687',
  neo4j.auth.basic(process.env.NEO4J_USER || 'neo4j', process.env.NEO4J_PASSWORD || 'password')
);

class Graph {
  static async addConversation(content: string) {
    const doc = nlp(content);
    const people = doc.people().out('array');
    const places = doc.places().out('array');
    const things = doc.nouns().out('array');

    const session = driver.session();
    try {
      for (const person of people) {
        await session.run('MERGE (p:Person {name: $name})', { name: person });
      }
      for (const place of places) {
        await session.run('MERGE (l:Location {name: $name})', { name: place });
      }
      for (const thing of things) {
        await session.run('MERGE (t:Thing {name: $name})', { name: thing });
      }

      // Add relationships (this is a simplified example)
      if (people.length > 1) {
        for (let i = 0; i < people.length - 1; i++) {
          for (let j = i + 1; j < people.length; j++) {
            await session.run(
              'MATCH (a:Person {name: $person1}), (b:Person {name: $person2}) MERGE (a)-[:INTERACTED_WITH]-(b)',
              { person1: people[i], person2: people[j] }
            );
          }
        }
      }
    } finally {
      await session.close();
    }
  }

  static async getRelatedEntities(entity: string) {
    const session = driver.session();
    try {
      const result = await session.run(
        'MATCH (a {name: $name})-[]-(b) RETURN b.name AS relatedEntity',
        { name: entity }
      );
      return result.records.map(record => record.get('relatedEntity'));
    } finally {
      await session.close();
    }
  }
}

export default Graph;
