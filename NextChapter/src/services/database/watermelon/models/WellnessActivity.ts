import { field, relation } from '@nozbe/watermelondb/decorators';
import { BaseModel } from './BaseModel';
import { Associations } from '@nozbe/watermelondb/Model';

export class WellnessActivity extends BaseModel {
  static table = 'wellness_activities';

  static associations: Associations = {
    profiles: { type: 'belongs_to', key: 'user_id' }
  };

  @field('user_id') userId!: string;
  @field('activity_type') activityType!: string;
  @field('duration_minutes') durationMinutes?: number;
  @field('notes') notes?: string;
  @field('completed_at') completedAt!: string;

  @relation('profiles', 'user_id') profile!: any;

  getDurationFormatted(): string {
    if (!this.durationMinutes) return 'Not specified';
    
    const hours = Math.floor(this.durationMinutes / 60);
    const minutes = this.durationMinutes % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  }

  getActivityEmoji(): string {
    const emojiMap: Record<string, string> = {
      'meditation': '🧘',
      'exercise': '🏃',
      'yoga': '🧘‍♀️',
      'walking': '🚶',
      'running': '🏃‍♂️',
      'breathing': '🌬️',
      'journaling': '📝',
      'reading': '📚',
      'nature': '🌳',
      'sleep': '😴',
      'social': '👥',
      'hobby': '🎨'
    };
    
    const lowerType = this.activityType.toLowerCase();
    for (const [key, emoji] of Object.entries(emojiMap)) {
      if (lowerType.includes(key)) return emoji;
    }
    
    return '🎯';
  }

  isPhysicalActivity(): boolean {
    const physicalTypes = ['exercise', 'yoga', 'walking', 'running', 'gym', 'sports'];
    const lowerType = this.activityType.toLowerCase();
    return physicalTypes.some(type => lowerType.includes(type));
  }

  isMentalActivity(): boolean {
    const mentalTypes = ['meditation', 'breathing', 'journaling', 'reading', 'mindfulness'];
    const lowerType = this.activityType.toLowerCase();
    return mentalTypes.some(type => lowerType.includes(type));
  }

  getDaysAgo(): number {
    const completed = new Date(this.completedAt);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - completed.getTime());
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
  }

  wasCompletedToday(): boolean {
    const completed = new Date(this.completedAt);
    const today = new Date();
    return completed.toDateString() === today.toDateString();
  }

  async updateActivity(data: Partial<{
    activityType: string;
    durationMinutes: number;
    notes: string;
    completedAt: string;
  }>) {
    await this.update(record => {
      if (data.activityType !== undefined) record.activityType = data.activityType;
      if (data.durationMinutes !== undefined) record.durationMinutes = data.durationMinutes;
      if (data.notes !== undefined) record.notes = data.notes;
      if (data.completedAt !== undefined) record.completedAt = data.completedAt;
      record.syncStatus = 'pending';
    });
  }
}