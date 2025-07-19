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

export type TaskWeek = 1 | 2 | 3 | 4;