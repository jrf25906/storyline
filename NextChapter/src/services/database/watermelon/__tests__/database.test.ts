import { Database } from '@nozbe/watermelondb';
import SQLiteAdapter from '@nozbe/watermelondb/adapters/sqlite';
import { database, initializeWatermelonDB, resetDatabase } from '@services/database/watermelon/database';
import { schema } from '@services/database/watermelon/schema';
import { 
  Profile,
  JobApplication,
  BudgetEntry,
  MoodEntry,
  BouncePlanTask
} from '@services/database/watermelon/models';

// Mock SQLiteAdapter
jest.mock('@nozbe/watermelondb/adapters/sqlite', () => {
  return jest.fn().mockImplementation(() => ({
    schema: {},
    migrations: [],
    dbName: 'test.db',
    onSetUpError: jest.fn()
  }));
});

describe('WatermelonDB Database', () => {
  let db: Database;

  beforeEach(async () => {
    // Reset any existing database instance
    await resetDatabase();
    db = await initializeWatermelonDB();
  });

  afterEach(async () => {
    // Clean up
    if (db) {
      await resetDatabase();
    }
  });

  it('should initialize database with correct adapter', async () => {
    expect(db).toBeInstanceOf(Database);
    expect(SQLiteAdapter).toHaveBeenCalledWith({
      schema,
      migrations: expect.any(Array),
      dbName: 'nextchapter.db',
      onSetUpError: expect.any(Function)
    });
  });

  it('should register all model classes', () => {
    const collections = db.collections;
    
    expect(collections.get('profiles')).toBeDefined();
    expect(collections.get('job_applications')).toBeDefined();
    expect(collections.get('budget_entries')).toBeDefined();
    expect(collections.get('mood_entries')).toBeDefined();
    expect(collections.get('bounce_plan_tasks')).toBeDefined();
    expect(collections.get('coach_conversations')).toBeDefined();
    expect(collections.get('wellness_activities')).toBeDefined();
  });

  it('should handle database initialization errors', async () => {
    // Mock adapter to throw error
    (SQLiteAdapter as jest.Mock).mockImplementationOnce(() => {
      throw new Error('Database initialization failed');
    });

    await expect(initializeWatermelonDB()).rejects.toThrow('Database initialization failed');
  });

  it('should return existing database instance on subsequent calls', async () => {
    const db1 = await initializeWatermelonDB();
    const db2 = await initializeWatermelonDB();
    
    expect(db1).toBe(db2);
  });

  it('should reset database properly', async () => {
    const db1 = await initializeWatermelonDB();
    await resetDatabase();
    const db2 = await initializeWatermelonDB();
    
    expect(db1).not.toBe(db2);
  });

  describe('Database Operations', () => {
    it('should create a new profile record', async () => {
      const profilesCollection = db.collections.get<Profile>('profiles');
      
      const newProfile = await db.write(async () => {
        return await profilesCollection.create(profile => {
          profile.firstName = 'John';
          profile.lastName = 'Doe';
          profile.location = 'San Francisco, CA';
        });
      });

      expect(newProfile).toBeDefined();
      expect(newProfile.firstName).toBe('John');
      expect(newProfile.lastName).toBe('Doe');
    });

    it('should query records with filters', async () => {
      const jobsCollection = db.collections.get<JobApplication>('job_applications');
      
      // Create test data
      await db.write(async () => {
        await jobsCollection.create(job => {
          job.company = 'Tech Corp';
          job.position = 'Senior Developer';
          job.status = 'applied';
        });
        
        await jobsCollection.create(job => {
          job.company = 'Startup Inc';
          job.position = 'Lead Engineer';
          job.status = 'interviewing';
        });
      });

      // Query by status
      const appliedJobs = await jobsCollection
        .query(Q => Q.where('status', 'applied'))
        .fetch();

      expect(appliedJobs).toHaveLength(1);
      expect(appliedJobs[0].company).toBe('Tech Corp');
    });

    it('should update records', async () => {
      const moodCollection = db.collections.get<MoodEntry>('mood_entries');
      
      // Create a mood entry
      const mood = await db.write(async () => {
        return await moodCollection.create(entry => {
          entry.moodScore = 3;
          entry.notes = 'Feeling okay';
        });
      });

      // Update the mood entry
      await db.write(async () => {
        await mood.update(entry => {
          entry.moodScore = 4;
          entry.notes = 'Feeling better!';
        });
      });

      expect(mood.moodScore).toBe(4);
      expect(mood.notes).toBe('Feeling better!');
    });

    it('should delete records', async () => {
      const tasksCollection = db.collections.get<BouncePlanTask>('bounce_plan_tasks');
      
      // Create a task
      const task = await db.write(async () => {
        return await tasksCollection.create(t => {
          t.userId = 'user123';
          t.dayNumber = 1;
          t.taskId = 'day1_breathe';
        });
      });

      // Delete the task
      await db.write(async () => {
        await task.markAsDeleted();
      });

      const remainingTasks = await tasksCollection.query().fetch();
      expect(remainingTasks).toHaveLength(0);
    });

    it('should handle batch operations', async () => {
      const budgetCollection = db.collections.get<BudgetEntry>('budget_entries');
      
      // Batch create
      const entries = await db.write(async () => {
        return await db.batch(
          budgetCollection.prepareCreate(entry => {
            entry.category = 'Rent';
            entry.amount = 2000;
            entry.type = 'expense';
            entry.frequency = 'monthly';
          }),
          budgetCollection.prepareCreate(entry => {
            entry.category = 'Groceries';
            entry.amount = 500;
            entry.type = 'expense';
            entry.frequency = 'monthly';
          })
        );
      });

      expect(entries).toHaveLength(2);
      
      const allEntries = await budgetCollection.query().fetch();
      expect(allEntries).toHaveLength(2);
    });
  });

  describe('Storage Limits', () => {
    it('should track database size', async () => {
      const size = await db.localStorage.get('database_size');
      expect(size).toBeDefined();
    });

    it('should warn when approaching soft limit (20MB)', async () => {
      const warnSpy = jest.spyOn(console, 'warn');
      
      // Mock database size
      await db.localStorage.set('database_size', 20 * 1024 * 1024); // 20MB
      
      // Trigger size check
      await db.write(async () => {
        // Any write operation
      });

      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('approaching storage limit'));
    });

    it('should prevent writes when hard limit reached (25MB)', async () => {
      // Mock database size at hard limit
      await db.localStorage.set('database_size', 25 * 1024 * 1024); // 25MB
      
      const jobsCollection = db.collections.get<JobApplication>('job_applications');
      
      await expect(
        db.write(async () => {
          await jobsCollection.create(job => {
            job.company = 'Test Company';
            job.position = 'Test Position';
          });
        })
      ).rejects.toThrow('Storage limit exceeded');
    });
  });
});