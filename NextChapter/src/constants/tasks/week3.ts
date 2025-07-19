import { BouncePlanTaskDefinition } from './types';

export const WEEK_3_TASKS: BouncePlanTaskDefinition[] = [
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
  }
];