describe('Voice Accuracy Baseline - MUST PASS', () => {
  const infrastructure = new VoiceTestInfrastructure();
  const MIN_ACCURACY = 95; // 95% accuracy requirement
  const MAX_LATENCY = 200; // 200ms latency requirement
  
  test('establishes baseline accuracy across demographics', async () => {
    const datasets = await infrastructure.loadDemographicDatasets();
    const results = {
      overall: { accuracy: 0, latency: 0, count: 0 },
      byDemographic: {}
    };
    
    // Test each demographic
    for (const [category, groups] of Object.entries(datasets)) {
      results.byDemographic[category] = {};
      
      for (const [group, dataset] of Object.entries(groups)) {
        const groupResults = await infrastructure.testDataset(dataset);
        
        results.byDemographic[category][group] = groupResults;
        results.overall.accuracy += groupResults.accuracy;
        results.overall.latency += groupResults.latency;
        results.overall.count++;
        
        // Individual demographic must meet minimum
        expect(groupResults.accuracy).toBeGreaterThanOrEqual(MIN_ACCURACY - 2);
        expect(groupResults.latency.p95).toBeLessThan(MAX_LATENCY);
      }
    }
    
    // Overall must meet strict minimum
    const overallAccuracy = results.overall.accuracy / results.overall.count;
    expect(overallAccuracy).toBeGreaterThanOrEqual(MIN_ACCURACY);
    
    // Generate baseline report
    await generateBaselineReport(results);
  });
  
  test('maintains accuracy with background noise', async () => {
    const noiseTests = [
      { level: 'quiet', dbRange: [0, 30], minAccuracy: 95 },
      { level: 'moderate', dbRange: [30, 50], minAccuracy: 90 },
      { level: 'noisy', dbRange: [50, 70], minAccuracy: 85 }
    ];
    
    for (const test of noiseTests) {
      const result = await infrastructure.testWithNoise(test.dbRange);
      expect(result.accuracy).toBeGreaterThanOrEqual(test.minAccuracy);
      
      if (test.level === 'noisy') {
        expect(result.enhancementApplied).toBe(true);
        expect(result.userNotified).toBe(true);
      }
    }
  });
});