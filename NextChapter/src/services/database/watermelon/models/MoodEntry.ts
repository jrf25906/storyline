import { field, relation } from '@nozbe/watermelondb/decorators';
import { BaseModel } from '@services/database/watermelon/models/BaseModel';
import { Associations } from '@nozbe/watermelondb/Model';

export class MoodEntry extends BaseModel {
  static table = 'mood_entries';

  static associations: Associations = {
    profiles: { type: 'belongs_to', key: 'user_id' }
  };

  @field('user_id') userId!: string;
  @field('mood_score') moodScore!: number; // 1-5
  @field('mood_label') moodLabel?: string;
  @field('notes') notes?: string;

  @relation('profiles', 'user_id') profile!: any;

  validateMoodScore(score: number): boolean {
    return score >= 1 && score <= 5 && Number.isInteger(score);
  }

  getMoodEmoji(): string {
    switch (this.moodScore) {
      case 1: return '😔';
      case 2: return '😟';
      case 3: return '😐';
      case 4: return '🙂';
      case 5: return '😊';
      default: return '😐';
    }
  }

  getMoodLabel(): string {
    if (this.moodLabel) return this.moodLabel;
    
    switch (this.moodScore) {
      case 1: return 'Very Low';
      case 2: return 'Low';
      case 3: return 'Neutral';
      case 4: return 'Good';
      case 5: return 'Great';
      default: return 'Unknown';
    }
  }

  async updateMood(score: number, notes?: string, label?: string) {
    if (!this.validateMoodScore(score)) {
      throw new Error('Invalid mood score. Must be between 1 and 5.');
    }

    await this.update(record => {
      record.moodScore = score;
      if (notes !== undefined) record.notes = notes;
      if (label !== undefined) record.moodLabel = label;
      record.syncStatus = 'pending';
    });
  }

  isPositive(): boolean {
    return this.moodScore >= 4;
  }

  isNegative(): boolean {
    return this.moodScore <= 2;
  }

  getDaysAgo(): number {
    const created = new Date(this.createdAt);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - created.getTime());
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
  }
}