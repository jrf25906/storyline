import {
  validateEmail,
  validatePassword,
  validatePasswordMatch,
  getAuthErrorMessage,
  getAuthLoadingMessage,
} from '@utils/validation';

describe('validation utilities', () => {
  describe('validateEmail', () => {
    it('returns invalid for empty email', () => {
      const result = validateEmail('');
      expect(result.isValid).toBe(false);
      expect(result.message).toBe('Please enter your email address');
    });

    it('returns invalid for email with only spaces', () => {
      const result = validateEmail('   ');
      expect(result.isValid).toBe(false);
      expect(result.message).toBe('Please enter your email address');
    });

    it('returns invalid for malformed email', () => {
      const invalidEmails = [
        'notanemail',
        'missing@domain',
        '@nodomain.com',
        'spaces in@email.com',
        'double@@domain.com',
      ];

      invalidEmails.forEach(email => {
        const result = validateEmail(email);
        expect(result.isValid).toBe(false);
        expect(result.message).toBe('Please check your email address format');
      });
    });

    it('returns valid for correct email format', () => {
      const validEmails = [
        'user@example.com',
        'first.last@domain.co.uk',
        'test+tag@company.org',
        'number123@test.com',
      ];

      validEmails.forEach(email => {
        const result = validateEmail(email);
        expect(result.isValid).toBe(true);
        expect(result.message).toBeUndefined();
      });
    });
  });

  describe('validatePassword', () => {
    it('returns invalid for empty password', () => {
      const result = validatePassword('');
      expect(result.isValid).toBe(false);
      expect(result.message).toBe('Please enter a password');
    });

    it('returns invalid for password shorter than 6 characters', () => {
      const result = validatePassword('12345');
      expect(result.isValid).toBe(false);
      expect(result.message).toBe('Password should be at least 6 characters');
    });

    it('returns valid for password with 6 or more characters', () => {
      const validPasswords = ['123456', 'password', 'verylongpassword123!'];

      validPasswords.forEach(password => {
        const result = validatePassword(password);
        expect(result.isValid).toBe(true);
        expect(result.message).toBeUndefined();
      });
    });
  });

  describe('validatePasswordMatch', () => {
    it('returns invalid when confirm password is empty', () => {
      const result = validatePasswordMatch('password123', '');
      expect(result.isValid).toBe(false);
      expect(result.message).toBe('Please confirm your password');
    });

    it('returns invalid when passwords do not match', () => {
      const result = validatePasswordMatch('password123', 'different456');
      expect(result.isValid).toBe(false);
      expect(result.message).toBe('Passwords don\'t match - please try again');
    });

    it('returns valid when passwords match', () => {
      const result = validatePasswordMatch('password123', 'password123');
      expect(result.isValid).toBe(true);
      expect(result.message).toBeUndefined();
    });
  });

  describe('getAuthErrorMessage', () => {
    it('returns friendly message for known error patterns', () => {
      expect(getAuthErrorMessage({ message: 'Invalid login credentials' }))
        .toBe('Email or password doesn\'t match our records. Please try again.');
      
      expect(getAuthErrorMessage({ message: 'Email not confirmed' }))
        .toBe('Please check your email to confirm your account before signing in.');
      
      expect(getAuthErrorMessage({ message: 'User already registered' }))
        .toBe('This email is already registered. Try signing in instead.');
    });

    it('returns default message for unknown errors', () => {
      expect(getAuthErrorMessage({ message: 'Unknown error code 500' }))
        .toBe('Something went wrong. Please try again in a moment.');
      
      expect(getAuthErrorMessage('Random error string'))
        .toBe('Something went wrong. Please try again in a moment.');
    });

    it('handles various error formats', () => {
      expect(getAuthErrorMessage({ error: 'Network request failed' }))
        .toBe('Having trouble connecting. Please check your internet and try again.');
      
      expect(getAuthErrorMessage('Network request failed'))
        .toBe('Having trouble connecting. Please check your internet and try again.');
    });
  });

  describe('getAuthLoadingMessage', () => {
    it('returns appropriate message for each operation', () => {
      expect(getAuthLoadingMessage('signin')).toBe('Signing you in...');
      expect(getAuthLoadingMessage('signup')).toBe('Creating your account...');
      expect(getAuthLoadingMessage('reset')).toBe('Sending reset instructions...');
    });

    it('returns default message for unknown operation', () => {
      expect(getAuthLoadingMessage('unknown' as any)).toBe('Please wait...');
    });
  });
});