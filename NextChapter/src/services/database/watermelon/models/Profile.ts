import { field, date, children } from '@nozbe/watermelondb/decorators';
import { BaseModel } from './BaseModel';
import { Associations } from '@nozbe/watermelondb/Model';

export class Profile extends BaseModel {
  static table = 'profiles';

  static associations: Associations = {
    layoff_details: { type: 'has_many', foreignKey: 'user_id' },
    user_goals: { type: 'has_many', foreignKey: 'user_id' },
    job_applications: { type: 'has_many', foreignKey: 'user_id' },
    budget_entries: { type: 'has_many', foreignKey: 'user_id' },
    mood_entries: { type: 'has_many', foreignKey: 'user_id' },
    bounce_plan_tasks: { type: 'has_many', foreignKey: 'user_id' },
    coach_conversations: { type: 'has_many', foreignKey: 'user_id' },
    wellness_activities: { type: 'has_many', foreignKey: 'user_id' }
  };

  @field('first_name') firstName!: string;
  @field('last_name') lastName!: string;
  @field('phone') phone!: string;
  @field('location') location!: string;
  @date('updated_at') updatedAt!: Date;

  @children('layoff_details') layoffDetails!: any;
  @children('user_goals') userGoals!: any;
  @children('job_applications') jobApplications!: any;
  @children('budget_entries') budgetEntries!: any;
  @children('mood_entries') moodEntries!: any;
  @children('bounce_plan_tasks') bouncePlanTasks!: any;
  @children('coach_conversations') coachConversations!: any;
  @children('wellness_activities') wellnessActivities!: any;

  get fullName(): string {
    return `${this.firstName} ${this.lastName}`.trim();
  }

  async updateProfile(data: Partial<{
    firstName: string;
    lastName: string;
    phone: string;
    location: string;
  }>) {
    await this.update(record => {
      if (data.firstName !== undefined) record.firstName = data.firstName;
      if (data.lastName !== undefined) record.lastName = data.lastName;
      if (data.phone !== undefined) record.phone = data.phone;
      if (data.location !== undefined) record.location = data.location;
      record.updatedAt = new Date();
      record.syncStatus = 'pending';
    });
  }
}