/**
 * Test data and fixtures for E2E tests
 */

export const TestData = {
  // Test user accounts
  users: {
    newUser: {
      name: 'Test User',
      email: `test.user.${Date.now()}@example.com`,
      password: 'TestPassword123!',
    },
    existingUser: {
      email: 'existing.user@example.com',
      password: 'ExistingPassword123!',
    },
    biometricUser: {
      email: 'biometric.user@example.com',
      password: 'BiometricPassword123!',
    },
  },

  // Onboarding data
  onboarding: {
    layoffDate: '2025-01-01',
    industry: 'Technology',
    previousRole: 'Software Engineer',
    severanceWeeks: '4',
    goals: ['Find similar role', 'Improve skills', 'Network'],
  },

  // Coach messages with emotional triggers
  coachMessages: {
    hype: {
      trigger: "I feel hopeless about finding a job",
      expectedTone: 'hype',
    },
    toughLove: {
      trigger: "They screwed me over and I'm just being lazy",
      expectedTone: 'tough-love',
    },
    pragmatist: {
      trigger: "What should I focus on today?",
      expectedTone: 'pragmatist',
    },
    crisis: {
      trigger: "I want to end it all",
      expectsCrisisAlert: true,
    },
  },

  // Job applications
  jobApplications: {
    applied: {
      company: 'Tech Corp',
      position: 'Senior Developer',
      location: 'Remote',
      url: 'https://example.com/job1',
      notes: 'Great culture fit',
    },
    interviewing: {
      company: 'StartupXYZ',
      position: 'Full Stack Engineer',
      location: 'San Francisco, CA',
      url: 'https://example.com/job2',
      notes: 'Had phone screen',
    },
    offer: {
      company: 'BigTech Inc',
      position: 'Software Architect',
      location: 'Seattle, WA',
      salary: '150000',
      notes: 'Negotiating benefits',
    },
  },

  // Budget data
  budget: {
    standard: {
      monthlyIncome: '3000',
      monthlyExpenses: '2500',
      savings: '10000',
      expectedRunway: '20', // months
    },
    critical: {
      monthlyIncome: '1000',
      monthlyExpenses: '2500',
      savings: '3000',
      expectedRunway: '2', // months - should trigger alert
    },
  },

  // Bounce plan tasks
  bouncePlan: {
    day1TaskTitle: 'Take a Deep Breath',
    day2TaskTitle: 'Document Your Wins',
    day7TaskTitle: 'Update Your Resume',
  },

  // Error scenarios
  errors: {
    networkError: 'Network request failed',
    invalidCredentials: 'Invalid login credentials',
    weakPassword: 'Password must be at least 8 characters',
  },

  // Performance benchmarks
  performance: {
    coldStart: 3000, // 3 seconds max
    screenTransition: 300, // 300ms max
    apiResponse: 5000, // 5 seconds max
  },
};