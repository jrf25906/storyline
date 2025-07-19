import { field, date, relation } from '@nozbe/watermelondb/decorators';
import { BaseModel } from '@services/database/watermelon/models/BaseModel';
import { Associations } from '@nozbe/watermelondb/Model';

export class LayoffDetails extends BaseModel {
  static table = 'layoff_details';

  static associations: Associations = {
    profiles: { type: 'belongs_to', key: 'user_id' }
  };

  @field('user_id') userId!: string;
  @field('company') company!: string;
  @field('role') role!: string;
  @field('layoff_date') layoffDate!: string;
  @field('severance_weeks') severanceWeeks?: number;
  @field('severance_end_date') severanceEndDate?: string;
  @date('updated_at') updatedAt!: Date;

  @relation('profiles', 'user_id') profile!: any;

  getDaysSinceLayoff(): number {
    const layoff = new Date(this.layoffDate);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - layoff.getTime());
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
  }

  getWeeksSinceLayoff(): number {
    return Math.floor(this.getDaysSinceLayoff() / 7);
  }

  isSeveranceActive(): boolean {
    if (!this.severanceEndDate) return false;
    return new Date(this.severanceEndDate) > new Date();
  }

  getDaysUntilSeveranceEnds(): number | null {
    if (!this.severanceEndDate) return null;
    const end = new Date(this.severanceEndDate);
    const now = new Date();
    const diffTime = end.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  async updateDetails(data: Partial<{
    company: string;
    role: string;
    layoffDate: string;
    severanceWeeks: number;
    severanceEndDate: string;
  }>) {
    await this.update(record => {
      if (data.company !== undefined) record.company = data.company;
      if (data.role !== undefined) record.role = data.role;
      if (data.layoffDate !== undefined) record.layoffDate = data.layoffDate;
      if (data.severanceWeeks !== undefined) record.severanceWeeks = data.severanceWeeks;
      if (data.severanceEndDate !== undefined) record.severanceEndDate = data.severanceEndDate;
      record.updatedAt = new Date();
      record.syncStatus = 'pending';
    });
  }
}