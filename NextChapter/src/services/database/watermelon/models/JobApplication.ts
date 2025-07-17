import { field, date, relation } from '@nozbe/watermelondb/decorators';
import { BaseModel } from './BaseModel';
import { Associations } from '@nozbe/watermelondb/Model';

export type JobApplicationStatus = 
  | 'saved'
  | 'applied'
  | 'interviewing'
  | 'offer'
  | 'rejected'
  | 'withdrawn';

export class JobApplication extends BaseModel {
  static table = 'job_applications';

  static associations: Associations = {
    profiles: { type: 'belongs_to', key: 'user_id' }
  };

  @field('user_id') userId!: string;
  @field('company') company!: string;
  @field('position') position!: string;
  @field('location') location?: string;
  @field('salary_range') salaryRange?: string;
  @field('status') status!: JobApplicationStatus;
  @field('applied_date') appliedDate?: string;
  @field('notes') notes?: string;
  @field('job_posting_url') jobPostingUrl?: string;
  @field('contact_name') contactName?: string;
  @field('contact_email') contactEmail?: string;
  @date('updated_at') updatedAt!: Date;

  @relation('profiles', 'user_id') profile!: any;

  async updateStatus(newStatus: JobApplicationStatus) {
    await this.update(record => {
      record.status = newStatus;
      if (newStatus === 'applied' && !record.appliedDate) {
        record.appliedDate = new Date().toISOString();
      }
      record.updatedAt = new Date();
      record.syncStatus = 'pending';
    });
  }

  async addNote(note: string) {
    await this.update(record => {
      record.notes = record.notes ? `${record.notes}\n\n${note}` : note;
      record.updatedAt = new Date();
      record.syncStatus = 'pending';
    });
  }

  isActive(): boolean {
    return !['rejected', 'withdrawn'].includes(this.status);
  }

  getDaysSinceApplied(): number | null {
    if (!this.appliedDate) return null;
    const applied = new Date(this.appliedDate);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - applied.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
}