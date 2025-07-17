/**
 * Utility functions for analytics
 */

/**
 * Simple hash function for financial data
 * Uses a basic implementation since React Native doesn't have crypto module
 */
export function hashFinancialData(value: number | string): string {
  const str = value.toString();
  let hash = 0;
  
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  // Convert to hex and ensure it's always positive
  return Math.abs(hash).toString(16).padStart(8, '0');
}

/**
 * Validate and sanitize event properties
 */
export function sanitizeProperties(properties: Record<string, any>): Record<string, any> {
  const sanitized: Record<string, any> = {};
  
  for (const [key, value] of Object.entries(properties)) {
    // Skip null/undefined values
    if (value === null || value === undefined) continue;
    
    // Ensure numbers are finite
    if (typeof value === 'number' && !isFinite(value)) continue;
    
    // Limit string length
    if (typeof value === 'string' && value.length > 1000) {
      sanitized[key] = value.substring(0, 1000) + '...';
    } else {
      sanitized[key] = value;
    }
  }
  
  return sanitized;
}

/**
 * Check if a property name might contain PII
 */
export function isPotentialPII(propertyName: string): boolean {
  const piiPatterns = [
    /email/i,
    /e-mail/i,
    /(^|_)name($|_)/i,
    /full_?name/i,
    /first_?name/i,
    /last_?name/i,
    /phone/i,
    /address/i,
    /ssn/i,
    /social/i,
    /credit/i,
    /card/i,
    /account/i,
    /password/i,
    /dob/i,
    /birth/i,
  ];
  
  return piiPatterns.some(pattern => pattern.test(propertyName));
}