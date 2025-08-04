# Golden Dataset for Memory System Quality Testing

**Version**: 1.0

**Purpose**: This dataset is used to perform automated quality assurance on the `memory` service. It tests the ability of the Dual RAG system to retrieve accurate and relevant information for a variety of query types.

---

## Test Cases

Each test case includes a `query`, the `expected_type` of result (semantic, graph, or hybrid), and `expected_keywords` that should appear in the results.

### Semantic Queries

- id: SEM_001
  query: "What did I say about my childhood dog, Sparky?"
  expected_type: "semantic"
  expected_keywords: ["sparky", "dog", "childhood"]

- id: SEM_002
  query: "Tell me about the time I felt most proud."
  expected_type: "semantic"
  expected_keywords: ["proud", "accomplishment", "achievement"]

- id: SEM_003
  query: "Find the part where I talked about my trip to the Grand Canyon."
  expected_type: "semantic"
  expected_keywords: ["grand canyon", "trip", "vacation"]

### Graph Queries

- id: GPH_001
  query: "Who was with me when I visited Paris?"
  expected_type: "graph"
  expected_keywords: ["John", "Jane"] # Assuming John and Jane were mentioned in the context of Paris

- id: GPH_002
  query: "Where did I first meet my wife?"
  expected_type: "graph"
  expected_keywords: ["Paris", "France"]

- id: GPH_003
  query: "List all the characters in my story."
  expected_type: "graph"
  expected_keywords: ["John", "Jane", "Maria", "Sparky"]

### Hybrid Queries

- id: HYB_001
  query: "What did Jane say about the project in Paris?"
  expected_type: "hybrid"
  expected_keywords: ["Jane", "Paris", "project", "deadline"]

- id: HYB_002
  query: "Describe the argument between John and Maria."
  expected_type: "hybrid"
  expected_keywords: ["John", "Maria", "argument", "disagreement"]

### Contradiction Queries

- id: CON_001
  setup: # First, add a piece of information
    - "My favorite color is blue."
  query: # Then, contradict it
    - "My favorite color is red."
  expected_type: "contradiction_detected"
  expected_keywords: ["contradiction", "clarify", "perspective"]
