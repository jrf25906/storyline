// Empathetic validation messages following stress-friendly design principles

export interface ValidationResult {
  isValid: boolean;
  message?: string;
}

export const validateEmail = (email: string): ValidationResult => {
  if (!email || email.trim() === '') {
    return {
      isValid: false,
      message: 'Please enter your email address',
    };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email.trim())) {
    return {
      isValid: false,
      message: 'Please check your email address format',
    };
  }

  return { isValid: true };
};

export const validatePassword = (password: string): ValidationResult => {
  if (!password) {
    return {
      isValid: false,
      message: 'Please enter a password',
    };
  }

  if (password.length < 6) {
    return {
      isValid: false,
      message: 'Password should be at least 6 characters',
    };
  }

  return { isValid: true };
};

export const validatePasswordMatch = (password: string, confirmPassword: string): ValidationResult => {
  if (!confirmPassword) {
    return {
      isValid: false,
      message: 'Please confirm your password',
    };
  }

  if (password !== confirmPassword) {
    return {
      isValid: false,
      message: 'Passwords don\'t match - please try again',
    };
  }

  return { isValid: true };
};

// Transform error messages from API to user-friendly messages
export const getAuthErrorMessage = (error: any): string => {
  const errorMessage = error?.message || error?.error || error;
  
  // Map common auth errors to empathetic messages
  const errorMap: Record<string, string> = {
    'Invalid login credentials': 'Email or password doesn\'t match our records. Please try again.',
    'Email not confirmed': 'Please check your email to confirm your account before signing in.',
    'User already registered': 'This email is already registered. Try signing in instead.',
    'Network request failed': 'Having trouble connecting. Please check your internet and try again.',
    'Too many requests': 'We\'re receiving too many requests. Please wait a moment and try again.',
    'Invalid email': 'Please check your email address format.',
    'Weak password': 'Please use a stronger password (at least 6 characters).',
    'User not found': 'We couldn\'t find an account with this email. Would you like to sign up?',
  };

  // Check for known error patterns
  for (const [pattern, friendlyMessage] of Object.entries(errorMap)) {
    if (errorMessage.toLowerCase().includes(pattern.toLowerCase())) {
      return friendlyMessage;
    }
  }

  // Default empathetic error message
  return 'Something went wrong. Please try again in a moment.';
};

// Get loading messages for different auth operations
export const getAuthLoadingMessage = (operation: 'signin' | 'signup' | 'reset'): string => {
  switch (operation) {
    case 'signin':
      return 'Signing you in...';
    case 'signup':
      return 'Creating your account...';
    case 'reset':
      return 'Sending reset instructions...';
    default:
      return 'Please wait...';
  }
};