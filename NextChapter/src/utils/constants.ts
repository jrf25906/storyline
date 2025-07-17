export const APP_CONFIG = {
  // Coach limits
  FREE_COACH_MESSAGES_PER_DAY: 10,
  
  // Storage limits
  MAX_LOCAL_STORAGE_MB: 25,
  MAX_CACHED_COACH_MESSAGES: 25,
  
  // Sync settings
  SYNC_INTERVAL_MS: 5 * 60 * 1000, // 5 minutes
  
  // Task settings
  DEFAULT_TASK_TIME: '09:00',
  
  // Benefits deadlines (days)
  UI_FILING_DEADLINE: 30,
  COBRA_DEADLINE: 60,
  
  // App version
  VERSION: '0.1.0',
};

export const US_STATES = [
  'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado',
  'Connecticut', 'Delaware', 'Florida', 'Georgia', 'Hawaii', 'Idaho',
  'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky', 'Louisiana',
  'Maine', 'Maryland', 'Massachusetts', 'Michigan', 'Minnesota',
  'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada',
  'New Hampshire', 'New Jersey', 'New Mexico', 'New York',
  'North Carolina', 'North Dakota', 'Ohio', 'Oklahoma', 'Oregon',
  'Pennsylvania', 'Rhode Island', 'South Carolina', 'South Dakota',
  'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington',
  'West Virginia', 'Wisconsin', 'Wyoming'
];

export const JOB_GOALS = [
  'Find a similar role',
  'Switch to a new industry',
  'Get promoted to senior level',
  'Start freelancing/consulting',
  'Take a career break',
  'Start my own business',
];