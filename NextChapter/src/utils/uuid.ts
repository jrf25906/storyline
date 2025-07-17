/**
 * Generate a UUID v4
 * React Native doesn't have crypto.randomUUID, so we implement our own
 */
export function generateUUID(): string {
  // Generate random values
  const randomValues = new Uint8Array(16);
  for (let i = 0; i < 16; i++) {
    randomValues[i] = Math.floor(Math.random() * 256);
  }

  // Set version (4) and variant bits
  randomValues[6] = (randomValues[6] & 0x0f) | 0x40; // Version 4
  randomValues[8] = (randomValues[8] & 0x3f) | 0x80; // Variant 10

  // Convert to hex string
  const hex = Array.from(randomValues)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');

  // Format as UUID
  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    hex.slice(12, 16),
    hex.slice(16, 20),
    hex.slice(20, 32),
  ].join('-');
}