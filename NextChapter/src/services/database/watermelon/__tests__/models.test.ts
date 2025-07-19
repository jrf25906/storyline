import { Model } from '@nozbe/watermelondb';
import { 
  Profile,
  JobApplication,
  BudgetEntry,
  MoodEntry,
  BouncePlanTask,
  CoachConversation,
  WellnessActivity
} from '@services/database/watermelon/models';

describe('WatermelonDB Models', () => {
  describe('Profile Model', () => {
    it('should extend WatermelonDB Model', () => {
      expect(Profile.prototype).toBeInstanceOf(Model);
    });

    it('should have correct table name', () => {
      expect(Profile.table).toBe('profiles');
    });

    it('should have associations defined', () => {
      expect(Profile.associations).toBeDefined();
      expect(Profile.associations.layoff_details).toBeDefined();
      expect(Profile.associations.user_goals).toBeDefined();
    });
  });

  describe('JobApplication Model', () => {
    it('should extend WatermelonDB Model', () => {
      expect(JobApplication.prototype).toBeInstanceOf(Model);
    });

    it('should have correct table name', () => {
      expect(JobApplication.table).toBe('job_applications');
    });

    it('should have status field with proper type', () => {
      const model = new JobApplication({} as any, {} as any);
      expect(model).toHaveProperty('status');
    });

    it('should have proper observables', () => {
      const model = new JobApplication({} as any, {} as any);
      expect(model.asObservable).toBeDefined();
    });
  });

  describe('BudgetEntry Model', () => {
    it('should extend WatermelonDB Model', () => {
      expect(BudgetEntry.prototype).toBeInstanceOf(Model);
    });

    it('should have encryption methods for amount', () => {
      const model = new BudgetEntry({} as any, {} as any);
      expect(model.encryptAmount).toBeDefined();
      expect(model.decryptAmount).toBeDefined();
    });

    it('should encrypt amount before saving', async () => {
      const model = new BudgetEntry({} as any, {} as any);
      const amount = 1000;
      const encrypted = await model.encryptAmount(amount);
      
      expect(encrypted).not.toBe(amount);
      expect(typeof encrypted).toBe('string');
    });

    it('should decrypt amount correctly', async () => {
      const model = new BudgetEntry({} as any, {} as any);
      const amount = 1000;
      const encrypted = await model.encryptAmount(amount);
      const decrypted = await model.decryptAmount(encrypted);
      
      expect(decrypted).toBe(amount);
    });
  });

  describe('MoodEntry Model', () => {
    it('should extend WatermelonDB Model', () => {
      expect(MoodEntry.prototype).toBeInstanceOf(Model);
    });

    it('should validate mood score range', () => {
      const model = new MoodEntry({} as any, {} as any);
      expect(model.validateMoodScore).toBeDefined();
      
      expect(model.validateMoodScore(1)).toBe(true);
      expect(model.validateMoodScore(5)).toBe(true);
      expect(model.validateMoodScore(0)).toBe(false);
      expect(model.validateMoodScore(6)).toBe(false);
    });
  });

  describe('BouncePlanTask Model', () => {
    it('should extend WatermelonDB Model', () => {
      expect(BouncePlanTask.prototype).toBeInstanceOf(Model);
    });

    it('should have methods to check task status', () => {
      const model = new BouncePlanTask({} as any, {} as any);
      expect(model.isCompleted).toBeDefined();
      expect(model.isSkipped).toBeDefined();
      expect(model.isPending).toBeDefined();
    });

    it('should calculate task status correctly', () => {
      const model = new BouncePlanTask({} as any, {} as any);
      
      // Test completed status
      model._raw.completed_at = new Date().toISOString();
      expect(model.isCompleted()).toBe(true);
      expect(model.isPending()).toBe(false);
      
      // Test skipped status
      model._raw.completed_at = null;
      model._raw.skipped_at = new Date().toISOString();
      expect(model.isSkipped()).toBe(true);
      expect(model.isPending()).toBe(false);
      
      // Test pending status
      model._raw.skipped_at = null;
      expect(model.isPending()).toBe(true);
    });
  });

  describe('CoachConversation Model', () => {
    it('should extend WatermelonDB Model', () => {
      expect(CoachConversation.prototype).toBeInstanceOf(Model);
    });

    it('should validate role types', () => {
      const model = new CoachConversation({} as any, {} as any);
      expect(model.validateRole).toBeDefined();
      
      expect(model.validateRole('user')).toBe(true);
      expect(model.validateRole('assistant')).toBe(true);
      expect(model.validateRole('system')).toBe(false);
    });

    it('should validate tone types', () => {
      const model = new CoachConversation({} as any, {} as any);
      expect(model.validateTone).toBeDefined();
      
      expect(model.validateTone('hype')).toBe(true);
      expect(model.validateTone('pragmatist')).toBe(true);
      expect(model.validateTone('tough-love')).toBe(true);
      expect(model.validateTone('invalid')).toBe(false);
    });
  });

  describe('Model Sync Status', () => {
    it('should track sync status for all models', () => {
      const models = [
        Profile,
        JobApplication, 
        BudgetEntry,
        MoodEntry,
        BouncePlanTask,
        CoachConversation,
        WellnessActivity
      ];

      models.forEach(ModelClass => {
        const model = new ModelClass({} as any, {} as any);
        expect(model).toHaveProperty('syncStatus');
        expect(model).toHaveProperty('lastSyncedAt');
        expect(model.markAsSynced).toBeDefined();
        expect(model.markAsPending).toBeDefined();
        expect(model.markAsFailed).toBeDefined();
      });
    });
  });
});