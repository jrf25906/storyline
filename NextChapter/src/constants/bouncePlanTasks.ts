export interface BouncePlanTaskDefinition {
  id: string;
  day: number;
  title: string;
  description: string;
  duration: string; // e.g., "10 minutes"
  category: 'mindset' | 'practical' | 'network' | 'prepare' | 'action';
  tips: string[];
  isWeekend?: boolean;
}

export const BOUNCE_PLAN_TASKS: BouncePlanTaskDefinition[] = [
  // Week 1: Stabilization & Mindset Reset
  {
    id: 'day1_breathe',
    day: 1,
    title: 'Take a Breath & Acknowledge',
    description: 'Today is about acknowledging what happened and giving yourself permission to feel. This is the first step in your bounce back journey.',
    duration: '10 minutes',
    category: 'mindset',
    tips: [
      'Find a quiet space where you feel comfortable',
      'Write down three feelings you\'re experiencing right now',
      'Remember: It\'s okay to not be okay today'
    ]
  },
  {
    id: 'day2_routine',
    day: 2,
    title: 'Establish Your New Routine',
    description: 'Create structure in your day to maintain momentum and mental health.',
    duration: '10 minutes',
    category: 'practical',
    tips: [
      'Set a consistent wake-up time',
      'Plan three anchor points in your day',
      'Include one self-care activity'
    ]
  },
  {
    id: 'day3_finances',
    day: 3,
    title: 'Quick Financial Health Check',
    description: 'Get a clear picture of your financial runway without overwhelming yourself.',
    duration: '10 minutes',
    category: 'practical',
    tips: [
      'List your monthly essential expenses',
      'Calculate your current runway',
      'Note any immediate actions needed'
    ]
  },
  {
    id: 'day4_tell_story',
    day: 4,
    title: 'Craft Your Transition Story',
    description: 'Prepare a brief, positive explanation of your situation for networking and interviews.',
    duration: '10 minutes',
    category: 'prepare',
    tips: [
      'Keep it brief (30 seconds)',
      'Focus on the future, not the past',
      'Practice saying it out loud'
    ]
  },
  {
    id: 'day5_network_list',
    day: 5,
    title: 'Create Your Support Network List',
    description: 'Identify 5-10 people who could help with your job search or provide support.',
    duration: '10 minutes',
    category: 'network',
    tips: [
      'Include former colleagues and managers',
      'Add industry contacts and mentors',
      'Don\'t forget personal supporters'
    ]
  },
  {
    id: 'day6_weekend',
    day: 6,
    title: 'Weekend Recharge',
    description: 'Take time to recharge. Your bounce back includes rest.',
    duration: '0 minutes',
    category: 'mindset',
    tips: ['Enjoy your weekend - you\'ll come back stronger Monday'],
    isWeekend: true
  },
  {
    id: 'day7_weekend',
    day: 7,
    title: 'Weekend Recharge',
    description: 'Take time to recharge. Your bounce back includes rest.',
    duration: '0 minutes',
    category: 'mindset',
    tips: ['Enjoy your weekend - you\'ll come back stronger Monday'],
    isWeekend: true
  },
  
  // Week 2: Building Momentum
  {
    id: 'day8_skills_audit',
    day: 8,
    title: 'Quick Skills Inventory',
    description: 'List your top skills and recent accomplishments to boost confidence.',
    duration: '10 minutes',
    category: 'prepare',
    tips: [
      'List 5 technical skills',
      'List 5 soft skills',
      'Note 3 recent wins or accomplishments'
    ]
  },
  {
    id: 'day9_linkedin_update',
    day: 9,
    title: 'LinkedIn Profile Refresh',
    description: 'Update your LinkedIn headline and status to signal you\'re open to opportunities.',
    duration: '10 minutes',
    category: 'action',
    tips: [
      'Update your headline to be forward-looking',
      'Turn on "Open to Work" settings',
      'Add a brief post about being excited for new opportunities'
    ]
  },
  {
    id: 'day10_resume_gather',
    day: 10,
    title: 'Gather Resume Materials',
    description: 'Collect all the information you\'ll need to update your resume.',
    duration: '10 minutes',
    category: 'prepare',
    tips: [
      'Find your most recent resume',
      'List recent projects and achievements',
      'Gather any performance reviews or feedback'
    ]
  },
  {
    id: 'day11_first_reach_out',
    day: 11,
    title: 'First Networking Outreach',
    description: 'Reach out to one person from your network list with a brief, positive message.',
    duration: '10 minutes',
    category: 'network',
    tips: [
      'Keep the message brief and positive',
      'Don\'t ask for a job directly',
      'Suggest a brief coffee chat or call'
    ]
  },
  {
    id: 'day12_job_boards',
    day: 12,
    title: 'Set Up Job Alerts',
    description: 'Configure job alerts on 2-3 major job boards to automate your search.',
    duration: '10 minutes',
    category: 'action',
    tips: [
      'Use specific keywords for your role',
      'Set location preferences',
      'Choose daily or weekly alert frequency'
    ]
  },
  {
    id: 'day13_weekend',
    day: 13,
    title: 'Weekend Recharge',
    description: 'Take time to recharge. Your bounce back includes rest.',
    duration: '0 minutes',
    category: 'mindset',
    tips: ['Enjoy your weekend - you\'re making great progress!'],
    isWeekend: true
  },
  {
    id: 'day14_weekend',
    day: 14,
    title: 'Weekend Recharge',
    description: 'Take time to recharge. Your bounce back includes rest.',
    duration: '0 minutes',
    category: 'mindset',
    tips: ['Enjoy your weekend - you\'re making great progress!'],
    isWeekend: true
  },
  
  // Week 3: Active Job Search
  {
    id: 'day15_target_companies',
    day: 15,
    title: 'Create Target Company List',
    description: 'Identify 10-15 companies you\'d love to work for.',
    duration: '10 minutes',
    category: 'prepare',
    tips: [
      'Mix dream companies with realistic options',
      'Include companies of different sizes',
      'Note why each company interests you'
    ]
  },
  {
    id: 'day16_resume_update',
    day: 16,
    title: 'Resume First Draft',
    description: 'Update your resume with recent experience and achievements.',
    duration: '10 minutes',
    category: 'prepare',
    tips: [
      'Focus on quantifiable achievements',
      'Use action verbs',
      'Keep it to 2 pages maximum'
    ]
  },
  {
    id: 'day17_first_application',
    day: 17,
    title: 'Submit First Application',
    description: 'Apply to one job that genuinely excites you.',
    duration: '10 minutes',
    category: 'action',
    tips: [
      'Quality over quantity for your first one',
      'Tailor your resume to the role',
      'Save the job posting for reference'
    ]
  },
  {
    id: 'day18_interview_prep',
    day: 18,
    title: 'Interview Story Bank',
    description: 'Prepare 3-5 STAR stories for common interview questions.',
    duration: '10 minutes',
    category: 'prepare',
    tips: [
      'Situation, Task, Action, Result format',
      'Include stories showing different skills',
      'Practice telling them out loud'
    ]
  },
  {
    id: 'day19_network_follow_up',
    day: 19,
    title: 'Network Follow-ups',
    description: 'Send follow-up messages or schedule calls with your network contacts.',
    duration: '10 minutes',
    category: 'network',
    tips: [
      'Thank anyone who\'s already responded',
      'Send gentle follow-ups to non-responders',
      'Schedule any offered meetings'
    ]
  },
  {
    id: 'day20_weekend',
    day: 20,
    title: 'Weekend Recharge',
    description: 'Take time to recharge. Your bounce back includes rest.',
    duration: '0 minutes',
    category: 'mindset',
    tips: ['Enjoy your weekend - you\'re in the home stretch!'],
    isWeekend: true
  },
  {
    id: 'day21_weekend',
    day: 21,
    title: 'Weekend Recharge',
    description: 'Take time to recharge. Your bounce back includes rest.',
    duration: '0 minutes',
    category: 'mindset',
    tips: ['Enjoy your weekend - you\'re in the home stretch!'],
    isWeekend: true
  },
  
  // Week 4: Accelerate & Refine
  {
    id: 'day22_application_rhythm',
    day: 22,
    title: 'Establish Application Rhythm',
    description: 'Set a sustainable pace for job applications going forward.',
    duration: '10 minutes',
    category: 'action',
    tips: [
      'Aim for 3-5 quality applications per week',
      'Set specific times for job searching',
      'Track your applications'
    ]
  },
  {
    id: 'day23_skill_gap',
    day: 23,
    title: 'Identify One Skill Gap',
    description: 'Choose one skill to improve that would make you more marketable.',
    duration: '10 minutes',
    category: 'prepare',
    tips: [
      'Look at job postings for common requirements',
      'Choose something you can learn in 30 days',
      'Find free resources to start learning'
    ]
  },
  {
    id: 'day24_recruiter_outreach',
    day: 24,
    title: 'Connect with Recruiters',
    description: 'Reach out to 2-3 recruiters in your industry.',
    duration: '10 minutes',
    category: 'network',
    tips: [
      'Find recruiters who specialize in your field',
      'Send personalized connection requests',
      'Have your resume ready to share'
    ]
  },
  {
    id: 'day25_mock_interview',
    day: 25,
    title: 'Practice Interview',
    description: 'Do a mock interview with a friend or use an AI tool.',
    duration: '10 minutes',
    category: 'prepare',
    tips: [
      'Practice your transition story',
      'Get feedback on your answers',
      'Work on maintaining positive energy'
    ]
  },
  {
    id: 'day26_expand_search',
    day: 26,
    title: 'Expand Your Search',
    description: 'Consider adjacent roles or industries you hadn\'t thought of.',
    duration: '10 minutes',
    category: 'action',
    tips: [
      'Look at roles using similar skills',
      'Consider contract or project work',
      'Think about remote opportunities'
    ]
  },
  {
    id: 'day27_weekend',
    day: 27,
    title: 'Weekend Recharge',
    description: 'Take time to recharge. Your bounce back includes rest.',
    duration: '0 minutes',
    category: 'mindset',
    tips: ['Enjoy your weekend - you\'re almost there!'],
    isWeekend: true
  },
  {
    id: 'day28_weekend',
    day: 28,
    title: 'Weekend Recharge',
    description: 'Take time to recharge. Your bounce back includes rest.',
    duration: '0 minutes',
    category: 'mindset',
    tips: ['Enjoy your weekend - you\'re almost there!'],
    isWeekend: true
  },
  
  // Final Days
  {
    id: 'day29_momentum_plan',
    day: 29,
    title: 'Create Your Go-Forward Plan',
    description: 'Design your job search strategy for the coming weeks.',
    duration: '10 minutes',
    category: 'action',
    tips: [
      'Set weekly application goals',
      'Schedule regular networking',
      'Plan skill development time'
    ]
  },
  {
    id: 'day30_celebrate',
    day: 30,
    title: 'Celebrate Your Progress',
    description: 'Acknowledge how far you\'ve come and the foundation you\'ve built.',
    duration: '10 minutes',
    category: 'mindset',
    tips: [
      'List 5 things you\'ve accomplished',
      'Recognize your resilience',
      'Set an intention for your continued journey'
    ]
  }
];

// Helper function to get tasks by category
export function getTasksByCategory(category: BouncePlanTaskDefinition['category']): BouncePlanTaskDefinition[] {
  return BOUNCE_PLAN_TASKS.filter(task => task.category === category);
}

// Helper function to get task by day
export function getTaskByDay(day: number): BouncePlanTaskDefinition | undefined {
  return BOUNCE_PLAN_TASKS.find(task => task.day === day);
}

// Helper function to get week number from day
export function getWeekFromDay(day: number): number {
  return Math.ceil(day / 7);
}

// Week titles for display
export const WEEK_TITLES = {
  1: 'Stabilization & Mindset Reset',
  2: 'Building Momentum',
  3: 'Active Job Search',
  4: 'Accelerate & Refine'
};