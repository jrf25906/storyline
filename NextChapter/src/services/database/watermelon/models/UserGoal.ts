import { field, relation } from '@nozbe/watermelondb/decorators';
import { BaseModel } from '@services/database/watermelon/models/BaseModel';
import { Associations } from '@nozbe/watermelondb/Model';

export type GoalType = 
  | 'job-search' 
  | 'career-change' 
  | 'skills' 
  | 'networking'
  | 'financial' 
  | 'wellness' 
  | 'freelance' 
  | 'entrepreneurship';

export class UserGoal extends BaseModel {
  static table = 'user_goals';

  static associations: Associations = {
    profiles: { type: 'belongs_to', key: 'user_id' }
  };

  @field('user_id') userId!: string;
  @field('goal_type') goalType!: GoalType;
  @field('is_active') isActive!: boolean;

  @relation('profiles', 'user_id') profile!: any;

  getGoalLabel(): string {
    const labels: Record<GoalType, string> = {
      'job-search': 'Find a New Job',
      'career-change': 'Change Careers',
      'skills': 'Learn New Skills',
      'networking': 'Expand Network',
      'financial': 'Financial Stability',
      'wellness': 'Mental Wellness',
      'freelance': 'Start Freelancing',
      'entrepreneurship': 'Start a Business'
    };
    
    return labels[this.goalType] || this.goalType;
  }

  getGoalEmoji(): string {
    const emojis: Record<GoalType, string> = {
      'job-search': '💼',
      'career-change': '🔄',
      'skills': '📚',
      'networking': '🤝',
      'financial': '💰',
      'wellness': '🧘',
      'freelance': '💻',
      'entrepreneurship': '🚀'
    };
    
    return emojis[this.goalType] || '🎯';
  }

  async toggleActive() {
    await this.update(record => {
      record.isActive = !record.isActive;
      record.syncStatus = 'pending';
    });
  }

  async activate() {
    if (!this.isActive) {
      await this.update(record => {
        record.isActive = true;
        record.syncStatus = 'pending';
      });
    }
  }

  async deactivate() {
    if (this.isActive) {
      await this.update(record => {
        record.isActive = false;
        record.syncStatus = 'pending';
      });
    }
  }

  isCareerRelated(): boolean {
    return ['job-search', 'career-change', 'skills', 'networking'].includes(this.goalType);
  }

  isFinancialRelated(): boolean {
    return ['financial', 'freelance', 'entrepreneurship'].includes(this.goalType);
  }
}