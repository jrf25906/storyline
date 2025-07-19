import { field, relation } from '@nozbe/watermelondb/decorators';
import { BaseModel } from '@services/database/watermelon/models/BaseModel';
import { Associations } from '@nozbe/watermelondb/Model';

export class BouncePlanTask extends BaseModel {
  static table = 'bounce_plan_tasks';

  static associations: Associations = {
    profiles: { type: 'belongs_to', key: 'user_id' }
  };

  @field('user_id') userId!: string;
  @field('day_number') dayNumber!: number;
  @field('task_id') taskId!: string;
  @field('completed_at') completedAt?: string;
  @field('skipped_at') skippedAt?: string;
  @field('notes') notes?: string;

  @relation('profiles', 'user_id') profile!: any;

  isCompleted(): boolean {
    return !!this.completedAt;
  }

  isSkipped(): boolean {
    return !!this.skippedAt && !this.completedAt;
  }

  isPending(): boolean {
    return !this.completedAt && !this.skippedAt;
  }

  getStatus(): 'completed' | 'skipped' | 'pending' {
    if (this.isCompleted()) return 'completed';
    if (this.isSkipped()) return 'skipped';
    return 'pending';
  }

  async markAsCompleted(notes?: string) {
    await this.update(record => {
      record.completedAt = new Date().toISOString();
      record.skippedAt = undefined;
      if (notes) record.notes = notes;
      record.syncStatus = 'pending';
    });
  }

  async markAsSkipped(notes?: string) {
    await this.update(record => {
      record.skippedAt = new Date().toISOString();
      record.completedAt = undefined;
      if (notes) record.notes = notes;
      record.syncStatus = 'pending';
    });
  }

  async markAsPending() {
    await this.update(record => {
      record.completedAt = undefined;
      record.skippedAt = undefined;
      record.syncStatus = 'pending';
    });
  }

  async updateNotes(notes: string) {
    await this.update(record => {
      record.notes = notes;
      record.syncStatus = 'pending';
    });
  }

  getDaysSinceCreated(): number {
    const created = new Date(this.createdAt);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - created.getTime());
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
  }

  isAvailable(): boolean {
    // Task is available if it's for today or earlier
    const daysSinceStart = this.getDaysSinceCreated();
    return this.dayNumber <= daysSinceStart + 1;
  }

  isOverdue(): boolean {
    return this.isPending() && this.getDaysSinceCreated() > this.dayNumber;
  }
}