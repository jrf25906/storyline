import { field, date, relation } from '@nozbe/watermelondb/decorators';
import { BaseModel } from './BaseModel';
import { Associations } from '@nozbe/watermelondb/Model';
import { encryptData, decryptData } from '../encryption';

export type BudgetType = 'income' | 'expense';
export type BudgetFrequency = 'one-time' | 'monthly' | 'weekly' | 'daily';

export class BudgetEntry extends BaseModel {
  static table = 'budget_entries';

  static associations: Associations = {
    profiles: { type: 'belongs_to', key: 'user_id' }
  };

  @field('user_id') userId!: string;
  @field('category') category!: string;
  @field('amount') encryptedAmount!: string; // Stored encrypted
  @field('type') type!: BudgetType;
  @field('frequency') frequency!: BudgetFrequency;
  @field('description') description?: string;
  @field('is_active') isActive!: boolean;
  @date('updated_at') updatedAt!: Date;

  @relation('profiles', 'user_id') profile!: any;

  // Getter for decrypted amount
  private _decryptedAmount?: number;

  async getAmount(): Promise<number> {
    if (this._decryptedAmount === undefined) {
      this._decryptedAmount = await this.decryptAmount(this.encryptedAmount);
    }
    return this._decryptedAmount;
  }

  async encryptAmount(amount: number): Promise<string> {
    return encryptData(amount);
  }

  async decryptAmount(encryptedAmount: string): Promise<number> {
    return decryptData(encryptedAmount) as Promise<number>;
  }

  async updateAmount(newAmount: number) {
    const encrypted = await this.encryptAmount(newAmount);
    await this.update(record => {
      record.encryptedAmount = encrypted;
      record.updatedAt = new Date();
      record.syncStatus = 'pending';
    });
    this._decryptedAmount = newAmount;
  }

  async toggleActive() {
    await this.update(record => {
      record.isActive = !record.isActive;
      record.updatedAt = new Date();
      record.syncStatus = 'pending';
    });
  }

  async getMonthlyAmount(): Promise<number> {
    const amount = await this.getAmount();
    
    switch (this.frequency) {
      case 'monthly':
        return amount;
      case 'weekly':
        return amount * 4.33; // Average weeks per month
      case 'daily':
        return amount * 30;
      case 'one-time':
        return 0; // One-time doesn't contribute to monthly
      default:
        return amount;
    }
  }

  async getAnnualAmount(): Promise<number> {
    const amount = await this.getAmount();
    
    switch (this.frequency) {
      case 'monthly':
        return amount * 12;
      case 'weekly':
        return amount * 52;
      case 'daily':
        return amount * 365;
      case 'one-time':
        return amount;
      default:
        return amount;
    }
  }
}