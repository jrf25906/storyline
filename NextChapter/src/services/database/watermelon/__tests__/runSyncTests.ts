#!/usr/bin/env node

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

interface TestResult {
  suite: string;
  passed: number;
  failed: number;
  skipped: number;
  duration: number;
  failures: Array<{
    test: string;
    error: string;
  }>;
}

interface PerformanceMetrics {
  syncDuration: {
    min: number;
    max: number;
    avg: number;
  };
  dataSize: {
    profiles: number;
    jobApplications: number;
    budgetEntries: number;
    moodEntries: number;
    bouncePlanTasks: number;
    coachConversations: number;
  };
  memoryUsage: {
    before: number;
    after: number;
    peak: number;
  };
}

interface SecurityValidation {
  encryptionVerified: boolean;
  noPlaintextFinancialData: boolean;
  noSensitiveDataInLogs: boolean;
  financialDataExcludedFromAI: boolean;
}

interface TestReport {
  timestamp: Date;
  environment: {
    node: string;
    platform: string;
    reactNative: string;
  };
  testResults: TestResult[];
  performanceMetrics: PerformanceMetrics;
  securityValidation: SecurityValidation;
  syncStrategies: {
    [key: string]: {
      strategy: string;
      tested: boolean;
      passed: boolean;
      notes: string;
    };
  };
  storageLimits: {
    softLimit: {
      value: number;
      tested: boolean;
      behavior: string;
    };
    hardLimit: {
      value: number;
      tested: boolean;
      behavior: string;
    };
  };
  conflictResolution: {
    scenariosTested: string[];
    passed: boolean;
    issues: string[];
  };
  edgeCases: {
    networkInterruptions: boolean;
    largeDataSets: boolean;
    concurrentModifications: boolean;
    storageCleanup: boolean;
  };
  recommendations: string[];
}

async function runTests(): Promise<TestReport> {
  console.log('🧪 Running WatermelonDB Offline Sync Integration Tests...\n');

  const report: TestReport = {
    timestamp: new Date(),
    environment: {
      node: process.version,
      platform: process.platform,
      reactNative: '0.72+'
    },
    testResults: [],
    performanceMetrics: {
      syncDuration: { min: 0, max: 0, avg: 0 },
      dataSize: {
        profiles: 1,
        jobApplications: 20,
        budgetEntries: 15,
        moodEntries: 30,
        bouncePlanTasks: 30,
        coachConversations: 25
      },
      memoryUsage: {
        before: process.memoryUsage().heapUsed,
        after: 0,
        peak: 0
      }
    },
    securityValidation: {
      encryptionVerified: false,
      noPlaintextFinancialData: false,
      noSensitiveDataInLogs: false,
      financialDataExcludedFromAI: false
    },
    syncStrategies: {
      profiles: {
        strategy: 'last-write-wins',
        tested: false,
        passed: false,
        notes: ''
      },
      layoffDetails: {
        strategy: 'last-write-wins',
        tested: false,
        passed: false,
        notes: ''
      },
      userGoals: {
        strategy: 'last-write-wins',
        tested: false,
        passed: false,
        notes: ''
      },
      jobApplications: {
        strategy: 'last-write-wins',
        tested: false,
        passed: false,
        notes: ''
      },
      budgetEntries: {
        strategy: 'encrypted-sync',
        tested: false,
        passed: false,
        notes: 'AES-256 encryption'
      },
      moodEntries: {
        strategy: 'one-way-push',
        tested: false,
        passed: false,
        notes: ''
      },
      bouncePlanTasks: {
        strategy: 'one-way-push',
        tested: false,
        passed: false,
        notes: ''
      },
      coachConversations: {
        strategy: 'merge-with-conflicts',
        tested: false,
        passed: false,
        notes: ''
      },
      wellnessActivities: {
        strategy: 'one-way-push',
        tested: false,
        passed: false,
        notes: ''
      }
    },
    storageLimits: {
      softLimit: {
        value: 20 * 1024 * 1024,
        tested: false,
        behavior: 'Warning displayed to user'
      },
      hardLimit: {
        value: 25 * 1024 * 1024,
        tested: false,
        behavior: 'Sync blocked, cleanup required'
      }
    },
    conflictResolution: {
      scenariosTested: [],
      passed: false,
      issues: []
    },
    edgeCases: {
      networkInterruptions: false,
      largeDataSets: false,
      concurrentModifications: false,
      storageCleanup: false
    },
    recommendations: []
  };

  try {
    // Run the integration tests
    console.log('Running sync integration tests...');
    const testOutput = execSync(
      'npm test -- src/services/database/watermelon/__tests__/sync.integration.test.ts --coverage --json',
      { encoding: 'utf8', stdio: 'pipe' }
    );

    // Parse test results
    const results = JSON.parse(testOutput);
    report.testResults = parseTestResults(results);

    // Update test status based on results
    updateTestStatus(report, results);

    // Analyze performance metrics
    report.performanceMetrics = analyzePerformance(results);

    // Validate security
    report.securityValidation = validateSecurity(results);

    // Check conflict resolution
    report.conflictResolution = analyzeConflictResolution(results);

    // Update edge cases
    report.edgeCases = analyzeEdgeCases(results);

  } catch (error) {
    console.error('❌ Test execution failed:', error);
    report.recommendations.push('Fix failing tests before deployment');
  }

  // Generate recommendations
  report.recommendations = generateRecommendations(report);

  // Update memory usage
  report.performanceMetrics.memoryUsage.after = process.memoryUsage().heapUsed;
  report.performanceMetrics.memoryUsage.peak = process.memoryUsage().heapTotal;

  return report;
}

function parseTestResults(jestOutput: any): TestResult[] {
  const results: TestResult[] = [];
  
  if (jestOutput.testResults) {
    jestOutput.testResults.forEach((suite: any) => {
      const result: TestResult = {
        suite: suite.name,
        passed: 0,
        failed: 0,
        skipped: 0,
        duration: suite.endTime - suite.startTime,
        failures: []
      };

      suite.assertionResults.forEach((test: any) => {
        if (test.status === 'passed') {
          result.passed++;
        } else if (test.status === 'failed') {
          result.failed++;
          result.failures.push({
            test: test.title,
            error: test.failureMessages.join('\n')
          });
        } else {
          result.skipped++;
        }
      });

      results.push(result);
    });
  }

  return results;
}

function updateTestStatus(report: TestReport, results: any): void {
  // Update sync strategy test status
  Object.keys(report.syncStrategies).forEach(table => {
    const testName = `${table} Sync`;
    const passed = results.testResults.some((suite: any) =>
      suite.assertionResults.some((test: any) =>
        test.title.toLowerCase().includes(table.toLowerCase()) &&
        test.status === 'passed'
      )
    );
    
    report.syncStrategies[table].tested = true;
    report.syncStrategies[table].passed = passed;
  });

  // Update storage limit test status
  const storageLimitTests = results.testResults.flatMap((suite: any) =>
    suite.assertionResults.filter((test: any) =>
      test.title.includes('storage') || test.title.includes('limit')
    )
  );

  report.storageLimits.softLimit.tested = storageLimitTests.some((t: any) => 
    t.title.includes('20MB') || t.title.includes('soft')
  );
  report.storageLimits.hardLimit.tested = storageLimitTests.some((t: any) => 
    t.title.includes('25MB') || t.title.includes('hard')
  );
}

function analyzePerformance(results: any): PerformanceMetrics {
  // Extract performance data from test results
  const perfTests = results.testResults.flatMap((suite: any) =>
    suite.assertionResults.filter((test: any) =>
      test.title.includes('performance') || test.title.includes('time')
    )
  );

  const durations = perfTests
    .map((t: any) => t.duration || 0)
    .filter((d: number) => d > 0);

  return {
    syncDuration: {
      min: Math.min(...durations) || 0,
      max: Math.max(...durations) || 0,
      avg: durations.reduce((a, b) => a + b, 0) / durations.length || 0
    },
    dataSize: {
      profiles: 1,
      jobApplications: 20,
      budgetEntries: 15,
      moodEntries: 30,
      bouncePlanTasks: 30,
      coachConversations: 25
    },
    memoryUsage: {
      before: process.memoryUsage().heapUsed,
      after: 0,
      peak: process.memoryUsage().heapTotal
    }
  };
}

function validateSecurity(results: any): SecurityValidation {
  const securityTests = results.testResults.flatMap((suite: any) =>
    suite.assertionResults.filter((test: any) =>
      test.title.includes('security') || 
      test.title.includes('encrypt') ||
      test.title.includes('financial')
    )
  );

  return {
    encryptionVerified: securityTests.some((t: any) => 
      t.title.includes('encrypt') && t.status === 'passed'
    ),
    noPlaintextFinancialData: securityTests.some((t: any) => 
      t.title.includes('raw financial') && t.status === 'passed'
    ),
    noSensitiveDataInLogs: securityTests.some((t: any) => 
      t.title.includes('log sensitive') && t.status === 'passed'
    ),
    financialDataExcludedFromAI: securityTests.some((t: any) => 
      t.title.includes('AI') && t.status === 'passed'
    )
  };
}

function analyzeConflictResolution(results: any): any {
  const conflictTests = results.testResults.flatMap((suite: any) =>
    suite.assertionResults.filter((test: any) =>
      test.title.includes('conflict') || test.title.includes('merge')
    )
  );

  const scenarios = conflictTests.map((t: any) => t.title);
  const passed = conflictTests.every((t: any) => t.status === 'passed');
  const issues = conflictTests
    .filter((t: any) => t.status === 'failed')
    .map((t: any) => t.title);

  return {
    scenariosTested: scenarios,
    passed,
    issues
  };
}

function analyzeEdgeCases(results: any): any {
  const edgeTests = results.testResults.flatMap((suite: any) =>
    suite.assertionResults
  );

  return {
    networkInterruptions: edgeTests.some((t: any) => 
      t.title.includes('network') && t.status === 'passed'
    ),
    largeDataSets: edgeTests.some((t: any) => 
      t.title.includes('large') && t.status === 'passed'
    ),
    concurrentModifications: edgeTests.some((t: any) => 
      t.title.includes('concurrent') && t.status === 'passed'
    ),
    storageCleanup: edgeTests.some((t: any) => 
      t.title.includes('clean') && t.status === 'passed'
    )
  };
}

function generateRecommendations(report: TestReport): string[] {
  const recommendations: string[] = [];

  // Check sync strategies
  Object.entries(report.syncStrategies).forEach(([table, status]) => {
    if (!status.passed) {
      recommendations.push(`Fix sync implementation for ${table} table`);
    }
  });

  // Check security
  if (!report.securityValidation.encryptionVerified) {
    recommendations.push('Verify AES-256 encryption implementation');
  }
  if (!report.securityValidation.noPlaintextFinancialData) {
    recommendations.push('Ensure all financial data is encrypted before sync');
  }

  // Check performance
  if (report.performanceMetrics.syncDuration.max > 5000) {
    recommendations.push('Optimize sync performance - current max duration exceeds 5s');
  }

  // Check storage
  if (!report.storageLimits.softLimit.tested || !report.storageLimits.hardLimit.tested) {
    recommendations.push('Implement and test storage limit handling');
  }

  // Check edge cases
  if (!report.edgeCases.networkInterruptions) {
    recommendations.push('Add robust network interruption handling');
  }

  // Check conflicts
  if (!report.conflictResolution.passed) {
    recommendations.push('Fix conflict resolution for coach conversations');
  }

  if (recommendations.length === 0) {
    recommendations.push('All tests passing - ready for production deployment');
  }

  return recommendations;
}

function generateReport(report: TestReport): void {
  console.log('\n📊 WatermelonDB Offline Sync Test Report');
  console.log('=' .repeat(60));
  console.log(`Generated: ${report.timestamp.toISOString()}`);
  console.log(`Platform: ${report.environment.platform}`);
  console.log(`Node: ${report.environment.node}`);
  console.log(`React Native: ${report.environment.reactNative}`);

  console.log('\n📈 Test Results Summary');
  console.log('-'.repeat(60));
  
  let totalPassed = 0;
  let totalFailed = 0;
  
  report.testResults.forEach(result => {
    totalPassed += result.passed;
    totalFailed += result.failed;
    
    console.log(`\n${result.suite}`);
    console.log(`  ✅ Passed: ${result.passed}`);
    console.log(`  ❌ Failed: ${result.failed}`);
    console.log(`  ⏭️  Skipped: ${result.skipped}`);
    console.log(`  ⏱️  Duration: ${result.duration}ms`);
    
    if (result.failures.length > 0) {
      console.log('  Failures:');
      result.failures.forEach(failure => {
        console.log(`    - ${failure.test}`);
      });
    }
  });

  console.log(`\nTotal: ${totalPassed} passed, ${totalFailed} failed`);

  console.log('\n🔄 Sync Strategy Validation');
  console.log('-'.repeat(60));
  
  Object.entries(report.syncStrategies).forEach(([table, status]) => {
    const icon = status.passed ? '✅' : '❌';
    console.log(`${icon} ${table}: ${status.strategy} ${status.notes ? `(${status.notes})` : ''}`);
  });

  console.log('\n🔐 Security Validation');
  console.log('-'.repeat(60));
  
  Object.entries(report.securityValidation).forEach(([check, passed]) => {
    const icon = passed ? '✅' : '❌';
    const label = check.replace(/([A-Z])/g, ' $1').toLowerCase();
    console.log(`${icon} ${label}`);
  });

  console.log('\n💾 Storage Limits');
  console.log('-'.repeat(60));
  console.log(`Soft Limit (${(report.storageLimits.softLimit.value / 1024 / 1024).toFixed(0)}MB): ${
    report.storageLimits.softLimit.tested ? '✅ Tested' : '❌ Not tested'
  } - ${report.storageLimits.softLimit.behavior}`);
  console.log(`Hard Limit (${(report.storageLimits.hardLimit.value / 1024 / 1024).toFixed(0)}MB): ${
    report.storageLimits.hardLimit.tested ? '✅ Tested' : '❌ Not tested'
  } - ${report.storageLimits.hardLimit.behavior}`);

  console.log('\n⚡ Performance Metrics');
  console.log('-'.repeat(60));
  console.log(`Sync Duration: ${report.performanceMetrics.syncDuration.min}-${
    report.performanceMetrics.syncDuration.max
  }ms (avg: ${report.performanceMetrics.syncDuration.avg.toFixed(0)}ms)`);
  console.log(`Memory Usage: ${(report.performanceMetrics.memoryUsage.before / 1024 / 1024).toFixed(1)}MB → ${
    (report.performanceMetrics.memoryUsage.after / 1024 / 1024).toFixed(1)
  }MB (peak: ${(report.performanceMetrics.memoryUsage.peak / 1024 / 1024).toFixed(1)}MB)`);

  console.log('\n🔀 Conflict Resolution');
  console.log('-'.repeat(60));
  console.log(`Status: ${report.conflictResolution.passed ? '✅ Passed' : '❌ Failed'}`);
  console.log(`Scenarios tested: ${report.conflictResolution.scenariosTested.length}`);
  if (report.conflictResolution.issues.length > 0) {
    console.log('Issues:');
    report.conflictResolution.issues.forEach(issue => {
      console.log(`  - ${issue}`);
    });
  }

  console.log('\n🎯 Edge Cases');
  console.log('-'.repeat(60));
  Object.entries(report.edgeCases).forEach(([edgeCase, tested]) => {
    const icon = tested ? '✅' : '❌';
    const label = edgeCase.replace(/([A-Z])/g, ' $1').toLowerCase();
    console.log(`${icon} ${label}`);
  });

  console.log('\n📋 Recommendations');
  console.log('-'.repeat(60));
  report.recommendations.forEach((rec, index) => {
    console.log(`${index + 1}. ${rec}`);
  });

  // Save report to file
  const reportPath = path.join(__dirname, `sync-test-report-${Date.now()}.json`);
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`\n📁 Full report saved to: ${reportPath}`);
}

// Run tests and generate report
(async () => {
  try {
    const report = await runTests();
    generateReport(report);
    
    // Exit with appropriate code
    const hasFailures = report.testResults.some(r => r.failed > 0);
    process.exit(hasFailures ? 1 : 0);
  } catch (error) {
    console.error('❌ Test runner failed:', error);
    process.exit(1);
  }
})();