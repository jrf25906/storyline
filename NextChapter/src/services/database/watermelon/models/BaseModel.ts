import { Model } from '@nozbe/watermelondb';
import { field, date, readonly } from '@nozbe/watermelondb/decorators';

export type SyncStatus = 'synced' | 'pending' | 'failed';

export class BaseModel extends Model {
  @readonly @date('created_at') createdAt!: Date;
  @date('last_synced_at') lastSyncedAt?: Date;
  @field('sync_status') syncStatus!: SyncStatus;

  async markAsSynced() {
    await this.update(record => {
      record.syncStatus = 'synced';
      record.lastSyncedAt = new Date();
    });
  }

  async markAsPending() {
    await this.update(record => {
      record.syncStatus = 'pending';
    });
  }

  async markAsFailed() {
    await this.update(record => {
      record.syncStatus = 'failed';
    });
  }

  needsSync(): boolean {
    return this.syncStatus === 'pending' || this.syncStatus === 'failed';
  }

  isSynced(): boolean {
    return this.syncStatus === 'synced';
  }
}