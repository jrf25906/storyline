import { hashFinancialData, sanitizeProperties, isPotentialPII } from '@services/analytics/utils';

describe('Analytics Utils', () => {
  describe('hashFinancialData', () => {
    it('should hash numeric values consistently', () => {
      const value = 5000;
      const hash1 = hashFinancialData(value);
      const hash2 = hashFinancialData(value);
      
      expect(hash1).toBe(hash2);
      expect(hash1).toMatch(/^[0-9a-f]{8}$/);
    });

    it('should hash string values consistently', () => {
      const value = '3500.50';
      const hash1 = hashFinancialData(value);
      const hash2 = hashFinancialData(value);
      
      expect(hash1).toBe(hash2);
      expect(hash1).toMatch(/^[0-9a-f]{8}$/);
    });

    it('should produce different hashes for different values', () => {
      const hash1 = hashFinancialData(1000);
      const hash2 = hashFinancialData(2000);
      
      expect(hash1).not.toBe(hash2);
    });

    it('should not expose original values in hash', () => {
      const sensitiveValue = 75000;
      const hash = hashFinancialData(sensitiveValue);
      
      expect(hash).not.toContain('75000');
      expect(hash).not.toContain('75');
    });
  });

  describe('sanitizeProperties', () => {
    it('should pass through valid properties', () => {
      const properties = {
        string: 'test',
        number: 123,
        boolean: true,
        array: [1, 2, 3],
      };
      
      const sanitized = sanitizeProperties(properties);
      expect(sanitized).toEqual(properties);
    });

    it('should remove null and undefined values', () => {
      const properties = {
        valid: 'test',
        nullValue: null,
        undefinedValue: undefined,
      };
      
      const sanitized = sanitizeProperties(properties);
      expect(sanitized).toEqual({ valid: 'test' });
    });

    it('should remove non-finite numbers', () => {
      const properties = {
        valid: 123,
        infinity: Infinity,
        negInfinity: -Infinity,
        nan: NaN,
      };
      
      const sanitized = sanitizeProperties(properties);
      expect(sanitized).toEqual({ valid: 123 });
    });

    it('should truncate long strings', () => {
      const longString = 'a'.repeat(1500);
      const properties = { text: longString };
      
      const sanitized = sanitizeProperties(properties);
      expect(sanitized.text).toHaveLength(1003); // 1000 + '...'
      expect(sanitized.text.endsWith('...')).toBe(true);
    });
  });

  describe('isPotentialPII', () => {
    it('should detect common PII property names', () => {
      const piiProperties = [
        'email',
        'user_email',
        'EMAIL_ADDRESS',
        'name',
        'full_name',
        'firstName',
        'phone',
        'phoneNumber',
        'address',
        'streetAddress',
        'ssn',
        'socialSecurityNumber',
        'creditCard',
        'cardNumber',
        'password',
        'user_password',
        'dob',
        'dateOfBirth',
        'birthDate',
      ];
      
      piiProperties.forEach(prop => {
        expect(isPotentialPII(prop)).toBe(true);
      });
    });

    it('should not flag safe property names', () => {
      const safeProperties = [
        'id',
        'timestamp',
        'event_type',
        'button_clicked',
        'industry',
        'location_state',
        'days_since_layoff',
        'task_completed',
        'mood_score',
      ];
      
      safeProperties.forEach(prop => {
        expect(isPotentialPII(prop)).toBe(false);
      });
    });

    it('should be case insensitive', () => {
      expect(isPotentialPII('EMAIL')).toBe(true);
      expect(isPotentialPII('Email')).toBe(true);
      expect(isPotentialPII('email')).toBe(true);
    });
  });
});