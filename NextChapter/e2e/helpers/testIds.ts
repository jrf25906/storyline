/**
 * Centralized test IDs for E2E testing
 * These match the testID props in the React Native components
 */

export const TestIds = {
  // Onboarding
  onboarding: {
    welcomeScreen: 'welcome-screen',
    startButton: 'start-onboarding-button',
    personalInfoScreen: 'personal-info-screen',
    nameInput: 'name-input',
    emailInput: 'email-input',
    passwordInput: 'password-input',
    nextButton: 'next-button',
    layoffDetailsScreen: 'layoff-details-screen',
    layoffDateInput: 'layoff-date-input',
    industryPicker: 'industry-picker',
    goalsScreen: 'goals-screen',
    completeButton: 'complete-onboarding-button',
  },

  // Authentication
  auth: {
    loginScreen: 'login-screen',
    signupScreen: 'signup-screen',
    biometricPrompt: 'biometric-prompt',
    biometricEnableButton: 'biometric-enable-button',
    biometricSkipButton: 'biometric-skip-button',
    emailVerificationScreen: 'email-verification-screen',
    resendEmailButton: 'resend-email-button',
  },

  // Home/Dashboard
  home: {
    screen: 'home-screen',
    dailyTaskCard: 'daily-task-card',
    moodCheckCard: 'mood-check-card',
    jobSearchCard: 'job-search-card',
    budgetCard: 'budget-card',
  },

  // Bounce Plan
  bouncePlan: {
    screen: 'bounce-plan-screen',
    taskCard: (id: string) => `task-card-${id}`,
    completeTaskButton: 'complete-task-button',
    skipTaskButton: 'skip-task-button',
    taskDetailModal: 'task-detail-modal',
    weeklyProgress: 'weekly-progress-dots',
    offlineIndicator: 'offline-indicator',
    syncButton: 'sync-button',
  },

  // AI Coach
  coach: {
    screen: 'coach-screen',
    messageInput: 'coach-message-input',
    sendButton: 'coach-send-button',
    messageList: 'coach-message-list',
    messageBubble: (index: number) => `message-bubble-${index}`,
    toneSelector: 'tone-selector',
    hypeButton: 'tone-hype-button',
    pragmatistButton: 'tone-pragmatist-button',
    toughLoveButton: 'tone-tough-love-button',
    typingIndicator: 'typing-indicator',
    crisisAlert: 'crisis-alert',
  },

  // Job Tracker
  jobTracker: {
    screen: 'job-tracker-screen',
    addButton: 'add-application-button',
    applicationModal: 'application-modal',
    companyInput: 'company-input',
    positionInput: 'position-input',
    statusPicker: 'status-picker',
    saveButton: 'save-application-button',
    kanbanBoard: 'kanban-board',
    applicationCard: (id: string) => `application-card-${id}`,
    searchBar: 'search-bar',
  },

  // Budget
  budget: {
    screen: 'budget-screen',
    monthlyIncomeInput: 'monthly-income-input',
    monthlyExpensesInput: 'monthly-expenses-input',
    savingsInput: 'savings-input',
    calculateButton: 'calculate-runway-button',
    runwayIndicator: 'runway-indicator',
    alertBanner: 'budget-alert-banner',
  },

  // Common
  common: {
    loadingIndicator: 'loading-indicator',
    errorMessage: 'error-message',
    retryButton: 'retry-button',
    networkStatusBar: 'network-status-bar',
    tabBar: 'main-tab-bar',
    homeTab: 'home-tab',
    bouncePlanTab: 'bounce-plan-tab',
    coachTab: 'coach-tab',
    trackerTab: 'tracker-tab',
    profileTab: 'profile-tab',
  },

  // Settings
  settings: {
    screen: 'settings-screen',
    biometricToggle: 'biometric-toggle',
    notificationsToggle: 'notifications-toggle',
    darkModeToggle: 'dark-mode-toggle',
    signOutButton: 'sign-out-button',
  },
} as const;