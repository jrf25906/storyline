import { BouncePlanTaskDefinition } from './types';

export const WEEK_2_TASKS: BouncePlanTaskDefinition[] = [
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
  }
];