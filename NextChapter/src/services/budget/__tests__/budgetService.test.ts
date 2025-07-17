import { saveBudgetData, loadBudgetData, deleteBudgetData } from '../budgetService';
import { supabase } from '../../api/supabase';
import { BudgetData } from '../../../types/budget';
import CryptoJS from 'crypto-js';

jest.mock('../../api/supabase', () => ({
  supabase: {
    auth: {
      getUser: jest.fn(),
    },
    from: jest.fn(() => ({
      insert: jest.fn(),
      select: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      single: jest.fn(),
    })),
  },
}));

jest.mock('crypto-js', () => ({
  AES: {
    encrypt: jest.fn((data) => ({ toString: () => `encrypted_${data}` })),
    decrypt: jest.fn((data) => ({ 
      toString: jest.fn(() => data.replace('encrypted_', '')) 
    })),
  },
}));

describe('BudgetService', () => {
  const mockUserId = 'test-user-id';
  const mockBudgetData: BudgetData = {
    id: 'test-id',
    userId: mockUserId,
    monthlyIncome: 5000,
    currentSavings: 10000,
    monthlyExpenses: 3000,
    severanceAmount: 5000,
    unemploymentBenefit: 450,
    unemploymentWeeks: 26,
    cobraCost: 650,
    state: 'CA',
    lastUpdated: new Date(),
    createdAt: new Date(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (supabase.auth.getUser as jest.Mock).mockResolvedValue({
      data: { user: { id: mockUserId } },
      error: null,
    });
  });

  describe('saveBudgetData', () => {
    it('should encrypt sensitive data before saving', async () => {
      const mockInsert = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: { ...mockBudgetData, id: 'new-id' },
            error: null,
          }),
        }),
      });

      (supabase.from as jest.Mock).mockReturnValue({
        insert: mockInsert,
      });

      await saveBudgetData(mockBudgetData);

      expect(mockInsert).toHaveBeenCalledWith([
        expect.objectContaining({
          monthly_income: 'encrypted_5000',
          current_savings: 'encrypted_10000',
          severance_amount: 'encrypted_5000',
          // Non-sensitive data should not be encrypted
          state: 'CA',
          monthly_expenses: 3000,
        }),
      ]);
    });

    it('should update existing budget data if ID exists', async () => {
      const mockUpdate = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockBudgetData,
              error: null,
            }),
          }),
        }),
      });

      (supabase.from as jest.Mock).mockReturnValue({
        update: mockUpdate,
      });

      await saveBudgetData(mockBudgetData);

      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          monthly_income: 'encrypted_5000',
          current_savings: 'encrypted_10000',
          severance_amount: 'encrypted_5000',
        })
      );
    });

    it('should handle save errors gracefully', async () => {
      const mockError = new Error('Database error');
      
      (supabase.from as jest.Mock).mockReturnValue({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: mockError,
            }),
          }),
        }),
      });

      await expect(saveBudgetData(mockBudgetData)).rejects.toThrow('Database error');
    });

    it('should not save without authenticated user', async () => {
      (supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: null },
        error: null,
      });

      await expect(saveBudgetData(mockBudgetData)).rejects.toThrow('User not authenticated');
    });
  });

  describe('loadBudgetData', () => {
    it('should decrypt sensitive data after loading', async () => {
      const encryptedData = {
        ...mockBudgetData,
        monthly_income: 'encrypted_5000',
        current_savings: 'encrypted_10000',
        severance_amount: 'encrypted_5000',
      };

      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: encryptedData,
              error: null,
            }),
          }),
        }),
      });

      const result = await loadBudgetData();

      expect(result).toEqual(expect.objectContaining({
        monthlyIncome: 5000,
        currentSavings: 10000,
        severanceAmount: 5000,
      }));
    });

    it('should return null if no budget data exists', async () => {
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { code: 'PGRST116' }, // No rows found
            }),
          }),
        }),
      });

      const result = await loadBudgetData();

      expect(result).toBeNull();
    });

    it('should handle load errors gracefully', async () => {
      const mockError = new Error('Database error');
      
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: mockError,
            }),
          }),
        }),
      });

      await expect(loadBudgetData()).rejects.toThrow('Database error');
    });

    it('should parse dates correctly', async () => {
      const dateString = '2025-01-09T10:30:00Z';
      const dataWithStringDates = {
        ...mockBudgetData,
        lastUpdated: dateString,
        createdAt: dateString,
      };

      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: dataWithStringDates,
              error: null,
            }),
          }),
        }),
      });

      const result = await loadBudgetData();

      expect(result?.lastUpdated).toBeInstanceOf(Date);
      expect(result?.createdAt).toBeInstanceOf(Date);
    });
  });

  describe('deleteBudgetData', () => {
    it('should delete budget data for authenticated user', async () => {
      const mockDelete = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({
          error: null,
        }),
      });

      (supabase.from as jest.Mock).mockReturnValue({
        delete: mockDelete,
      });

      await deleteBudgetData();

      expect(mockDelete).toHaveBeenCalled();
      expect(supabase.from).toHaveBeenCalledWith('budget_data');
    });

    it('should handle delete errors gracefully', async () => {
      const mockError = new Error('Delete failed');
      
      (supabase.from as jest.Mock).mockReturnValue({
        delete: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            error: mockError,
          }),
        }),
      });

      await expect(deleteBudgetData()).rejects.toThrow('Delete failed');
    });

    it('should not delete without authenticated user', async () => {
      (supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: null },
        error: null,
      });

      await expect(deleteBudgetData()).rejects.toThrow('User not authenticated');
    });
  });

  describe('Data Encryption', () => {
    it('should only encrypt sensitive financial fields', async () => {
      const mockInsert = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: mockBudgetData,
            error: null,
          }),
        }),
      });

      (supabase.from as jest.Mock).mockReturnValue({
        insert: mockInsert,
      });

      await saveBudgetData(mockBudgetData);

      const insertedData = mockInsert.mock.calls[0][0][0];

      // Sensitive fields should be encrypted
      expect(insertedData.monthly_income).toContain('encrypted_');
      expect(insertedData.current_savings).toContain('encrypted_');
      expect(insertedData.severance_amount).toContain('encrypted_');

      // Non-sensitive fields should not be encrypted
      expect(insertedData.state).toBe('CA');
      expect(insertedData.monthly_expenses).toBe(3000);
      expect(insertedData.unemployment_weeks).toBe(26);
    });

    it('should handle decryption errors gracefully', async () => {
      (CryptoJS.AES.decrypt as jest.Mock).mockImplementation(() => {
        throw new Error('Decryption failed');
      });

      const encryptedData = {
        ...mockBudgetData,
        monthly_income: 'encrypted_5000',
      };

      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: encryptedData,
              error: null,
            }),
          }),
        }),
      });

      await expect(loadBudgetData()).rejects.toThrow('Decryption failed');
    });
  });
});