import { BouncePlanTaskDefinition } from './types';

export const WEEK_1_TASKS: BouncePlanTaskDefinition[] = [
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
  }
];