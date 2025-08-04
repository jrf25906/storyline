import Graph from '../graph';

describe('Graph', () => {
  it('should add a conversation to the graph', async () => {
    // This is a simplified test. In a real-world scenario, you would mock the neo4j driver.
    await Graph.addConversation('John met Jane in Paris.');
  });

  it('should retrieve related entities', async () => {
    // This is a simplified test. In a real-world scenario, you would mock the neo4j driver.
    const relatedEntities = await Graph.getRelatedEntities('John');
    expect(relatedEntities).toBeDefined();
  });
});
