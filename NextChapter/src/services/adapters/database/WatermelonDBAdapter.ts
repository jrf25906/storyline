/**
 * WatermelonDB adapter implementing IDataService
 * Example of database abstraction with offline support
 */

import { Database, Model, Query, Collection } from '@nozbe/watermelondb';
import { Q } from '@nozbe/watermelondb';
import { 
  IDataService, 
  ITransaction 
} from '@services/interfaces/data/IDataService';
import { 
  BaseEntity, 
  PaginationParams, 
  PaginatedResult, 
  QueryOptions,
  BatchOperation,
  OperationMetadata 
} from '@services/interfaces/common/types';
import { Result, ok, err, tryCatch } from '@services/interfaces/common/result';
import { DataError, NotFoundError, StorageError, StorageLimitError } from '@services/interfaces/common/errors';

export class WatermelonDBAdapter<T extends BaseEntity & Model> implements IDataService<T> {
  private collection: Collection<T>;
  
  constructor(
    private database: Database,
    private collectionName: string
  ) {
    this.collection = database.collections.get<T>(collectionName);
  }

  // Read operations
  async findById(id: string, options?: QueryOptions): Promise<Result<T | null>> {
    return tryCatch(
      async () => {
        try {
          const record = await this.collection.find(id);
          return record;
        } catch (e) {
          // Record not found
          return null;
        }
      },
      (error) => new DataError(`Failed to find by id: ${error}`)
    );
  }

  async findOne(filter: Partial<T>, options?: QueryOptions): Promise<Result<T | null>> {
    return tryCatch(
      async () => {
        const query = this.buildQuery(filter, options);
        const results = await query.fetch();
        return results[0] || null;
      },
      (error) => new DataError(`Failed to find one: ${error}`)
    );
  }

  async findMany(filter: Partial<T>, options?: QueryOptions): Promise<Result<T[]>> {
    return tryCatch(
      async () => {
        const query = this.buildQuery(filter, options);
        return await query.fetch();
      },
      (error) => new DataError(`Failed to find many: ${error}`)
    );
  }

  async findPaginated(
    filter: Partial<T>,
    pagination: PaginationParams,
    options?: QueryOptions
  ): Promise<Result<PaginatedResult<T>>> {
    return tryCatch(
      async () => {
        const query = this.buildQuery(filter, options);
        const total = await query.fetchCount();
        
        const paginatedQuery = query
          .take(pagination.limit)
          .skip(pagination.offset);
        
        const data = await paginatedQuery.fetch();
        
        return {
          data,
          total,
          hasMore: pagination.offset + data.length < total
        };
      },
      (error) => new DataError(`Failed to find paginated: ${error}`)
    );
  }

  async count(filter: Partial<T>): Promise<Result<number>> {
    return tryCatch(
      async () => {
        const query = this.buildQuery(filter);
        return await query.fetchCount();
      },
      (error) => new DataError(`Failed to count: ${error}`)
    );
  }

  async exists(id: string): Promise<Result<boolean>> {
    const result = await this.findById(id);
    if (result.isErr()) return result;
    return ok(result.value !== null);
  }

  // Write operations
  async create(data: Omit<T, keyof BaseEntity>, metadata?: OperationMetadata): Promise<Result<T>> {
    return tryCatch(
      async () => {
        // Check storage limits
        const canWriteResult = await this.checkStorageLimit();
        if (!canWriteResult) {
          throw new StorageLimitError(25 * 1024 * 1024, 25 * 1024 * 1024);
        }

        // Apply before hook if exists
        const processedData = this.beforeCreate ? await this.beforeCreate(data) : data;

        const record = await this.database.write(async () => {
          return await this.collection.create((record: any) => {
            Object.assign(record, processedData);
            if (metadata) {
              record._metadata = metadata;
            }
          });
        });

        // Apply after hook if exists
        if (this.afterCreate) {
          await this.afterCreate(record);
        }

        return record;
      },
      (error) => error instanceof StorageError ? error : new DataError(`Failed to create: ${error}`)
    );
  }

  async update(id: string, data: Partial<T>, metadata?: OperationMetadata): Promise<Result<T>> {
    return tryCatch(
      async () => {
        const record = await this.collection.find(id);
        
        // Apply before hook if exists
        const processedData = this.beforeUpdate ? await this.beforeUpdate(id, data) : data;

        await this.database.write(async () => {
          await record.update((r: any) => {
            Object.assign(r, processedData);
            if (metadata) {
              r._metadata = metadata;
            }
          });
        });

        // Apply after hook if exists
        if (this.afterUpdate) {
          await this.afterUpdate(record);
        }

        return record;
      },
      (error) => {
        if (error.message?.includes('not found')) {
          return new NotFoundError(this.collectionName, id);
        }
        return new DataError(`Failed to update: ${error}`);
      }
    );
  }

  async delete(id: string, metadata?: OperationMetadata): Promise<Result<void>> {
    return tryCatch(
      async () => {
        // Apply before hook if exists
        if (this.beforeDelete) {
          await this.beforeDelete(id);
        }

        const record = await this.collection.find(id);
        
        await this.database.write(async () => {
          await record.markAsDeleted();
        });

        // Apply after hook if exists
        if (this.afterDelete) {
          await this.afterDelete(id);
        }
      },
      (error) => {
        if (error.message?.includes('not found')) {
          return new NotFoundError(this.collectionName, id);
        }
        return new DataError(`Failed to delete: ${error}`);
      }
    );
  }

  // Batch operations
  async createMany(data: Array<Omit<T, keyof BaseEntity>>, metadata?: OperationMetadata): Promise<Result<T[]>> {
    return tryCatch(
      async () => {
        // Check storage limits
        const canWriteResult = await this.checkStorageLimit();
        if (!canWriteResult) {
          throw new StorageLimitError(25 * 1024 * 1024, 25 * 1024 * 1024);
        }

        const records = await this.database.write(async () => {
          return await this.database.batch(
            ...data.map(item => 
              this.collection.prepareCreate((record: any) => {
                Object.assign(record, item);
                if (metadata) {
                  record._metadata = metadata;
                }
              })
            )
          );
        });

        return records as T[];
      },
      (error) => error instanceof StorageError ? error : new DataError(`Failed to create many: ${error}`)
    );
  }

  async updateMany(updates: Array<{ id: string; data: Partial<T> }>, metadata?: OperationMetadata): Promise<Result<T[]>> {
    return tryCatch(
      async () => {
        const records = await Promise.all(
          updates.map(({ id }) => this.collection.find(id))
        );

        await this.database.write(async () => {
          await this.database.batch(
            ...records.map((record, index) => 
              record.prepareUpdate((r: any) => {
                Object.assign(r, updates[index].data);
                if (metadata) {
                  r._metadata = metadata;
                }
              })
            )
          );
        });

        return records;
      },
      (error) => new DataError(`Failed to update many: ${error}`)
    );
  }

  async deleteMany(ids: string[], metadata?: OperationMetadata): Promise<Result<void>> {
    return tryCatch(
      async () => {
        const records = await Promise.all(
          ids.map(id => this.collection.find(id))
        );

        await this.database.write(async () => {
          await this.database.batch(
            ...records.map(record => record.prepareMarkAsDeleted())
          );
        });
      },
      (error) => new DataError(`Failed to delete many: ${error}`)
    );
  }

  async batch(operations: BatchOperation<T>, metadata?: OperationMetadata): Promise<Result<{
    created: T[];
    updated: T[];
    deleted: string[];
  }>> {
    return tryCatch(
      async () => {
        const result = {
          created: [] as T[],
          updated: [] as T[],
          deleted: [] as string[]
        };

        await this.database.write(async () => {
          const batchOps = [];

          // Handle creates
          if (operations.create) {
            const createOps = operations.create.map(item =>
              this.collection.prepareCreate((record: any) => {
                Object.assign(record, item);
                if (metadata) {
                  record._metadata = metadata;
                }
                result.created.push(record);
              })
            );
            batchOps.push(...createOps);
          }

          // Handle updates
          if (operations.update) {
            for (const update of operations.update) {
              const record = await this.collection.find(update.id);
              const updateOp = record.prepareUpdate((r: any) => {
                Object.assign(r, update.data);
                if (metadata) {
                  r._metadata = metadata;
                }
              });
              batchOps.push(updateOp);
              result.updated.push(record);
            }
          }

          // Handle deletes
          if (operations.delete) {
            for (const id of operations.delete) {
              const record = await this.collection.find(id);
              batchOps.push(record.prepareMarkAsDeleted());
              result.deleted.push(id);
            }
          }

          await this.database.batch(...batchOps);
        });

        return result;
      },
      (error) => new DataError(`Failed batch operation: ${error}`)
    );
  }

  // Transaction support
  async transaction<T>(fn: (tx: ITransaction) => Promise<T>): Promise<Result<T>> {
    return tryCatch(
      async () => {
        let result: T;
        let committed = false;

        await this.database.write(async () => {
          const tx: ITransaction = {
            commit: async () => { committed = true; },
            rollback: async () => { throw new Error('Transaction rollback'); },
            isActive: () => !committed
          };

          try {
            result = await fn(tx);
            await tx.commit();
          } catch (error) {
            // WatermelonDB automatically rolls back on error
            throw error;
          }
        });

        return result!;
      },
      (error) => new DataError(`Transaction failed: ${error}`)
    );
  }

  async clear(): Promise<Result<void>> {
    return tryCatch(
      async () => {
        await this.database.write(async () => {
          const allRecords = await this.collection.query().fetch();
          await this.database.batch(
            ...allRecords.map(record => record.prepareDestroyPermanently())
          );
        });
      },
      (error) => new DataError(`Failed to clear collection: ${error}`)
    );
  }

  // Helper methods
  private buildQuery(filter: Partial<T>, options?: QueryOptions): Query<T> {
    let query = this.collection.query();
    
    // Apply filters
    const conditions: any[] = [];
    for (const [key, value] of Object.entries(filter)) {
      if (value !== undefined) {
        conditions.push(Q.where(key as any, value));
      }
    }
    
    if (conditions.length > 0) {
      query = query.extend(...conditions);
    }

    // Apply ordering
    if (options?.orderBy) {
      const direction = options.orderBy.direction === 'desc' ? Q.desc : Q.asc;
      query = query.extend(Q.sortBy(options.orderBy.field as any, direction));
    }

    return query;
  }

  private async checkStorageLimit(): Promise<boolean> {
    // This would be implemented based on your storage tracking
    // For now, return true
    return true;
  }

  // Hook implementations (optional)
  beforeCreate?: (data: Omit<T, keyof BaseEntity>) => Promise<Omit<T, keyof BaseEntity>>;
  afterCreate?: (entity: T) => Promise<void>;
  beforeUpdate?: (id: string, data: Partial<T>) => Promise<Partial<T>>;
  afterUpdate?: (entity: T) => Promise<void>;
  beforeDelete?: (id: string) => Promise<void>;
  afterDelete?: (id: string) => Promise<void>;
}