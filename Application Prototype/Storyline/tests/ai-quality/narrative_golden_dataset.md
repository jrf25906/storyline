# Golden Dataset for Narrative Analysis Quality Testing

**Version**: 1.0

**Purpose**: This dataset is used to perform automated quality assurance on the `narrative-analysis` service. It tests the ability of the service to accurately identify story structures, track character arcs, and analyze narrative elements.

---

## Test Cases

Each test case includes a `story_content` (a simplified representation of a story), and `expected_analysis` which defines the expected output for character and structure analysis.

### Story 1: The Hero's Journey (Simplified)

- id: HERO_001
  story_content: |
    John lived a simple life in his village. One day, a mysterious old man arrived, telling him of a great evil threatening the land. John initially refused, but after his village was attacked, he decided to embark on a quest. He faced many trials, met allies, and eventually confronted the dark lord. With the help of his friends, he defeated the evil and returned home a hero, forever changed.
  expected_analysis:
    characterAnalysis:
      protagonist: "John"
      emotionalJourney: "Reluctant hero -> challenged -> triumphant"
      relationships: ["mysterious old man", "allies", "dark lord"]
    structureAnalysis:
      incitingIncident: "Mysterious old man arrives, great evil threatening."
      risingAction: "Village attacked, John embarks on quest, faces trials, meets allies."
      climax: "Confronts and defeats the dark lord."
      threeActStructure:
        act1: "John's ordinary world and call to adventure."
        act2: "John's journey, trials, and confrontation."
        act3: "Return home as a changed hero."

### Story 2: The Tragic Fall

- id: TRAGIC_001
  story_content: |
    Maria was a brilliant scientist, driven by ambition. She achieved great success, but her relentless pursuit of power alienated her friends and family. In her final experiment, a catastrophic error led to her downfall, destroying everything she had built and leaving her alone and ruined.
  expected_analysis:
    characterAnalysis:
      protagonist: "Maria"
      emotionalJourney: "Ambitious -> successful -> alienated -> ruined"
      relationships: ["friends", "family"]
    structureAnalysis:
      incitingIncident: "Maria's relentless ambition."
      risingAction: "Achieves great success, alienates loved ones."
      climax: "Catastrophic error in final experiment."
      threeActStructure:
        act1: "Maria's brilliance and ambition."
        act2: "Her rise and alienation."
        act3: "Her downfall and ruin."
