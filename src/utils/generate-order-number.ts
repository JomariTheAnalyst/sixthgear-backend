/**
 * Order Number Generator Utility
 *
 * Generates custom order numbers in format: SIX-000123
 * Uses Medusa's display_id as the base number
 */

/**
 * Generate custom order number in format: SIX-000123
 *
 * @param displayId - The numeric display_id from Medusa
 * @returns Formatted order number (e.g., "SIX-000123")
 *
 * @example
 * generateOrderNumber(1) // "SIX-000001"
 * generateOrderNumber(123) // "SIX-000123"
 * generateOrderNumber(999999) // "SIX-999999"
 */
export function generateOrderNumber(displayId: number): string {
  // Pad with zeros to 6 digits
  const paddedNumber = String(displayId).padStart(6, "0");
  return `SIX-${paddedNumber}`;
}

/**
 * Parse order number back to display_id
 * Useful for order lookup by custom order number
 *
 * @param orderNumber - Custom order number (e.g., "SIX-000123")
 * @returns Numeric display_id or null if invalid format
 *
 * @example
 * parseOrderNumber("SIX-000123") // 123
 * parseOrderNumber("SIX-000001") // 1
 * parseOrderNumber("invalid") // null
 */
export function parseOrderNumber(orderNumber: string): number | null {
  // Match format: SIX-XXXXXX (6 digits)
  const match = orderNumber.match(/^SIX-(\d{6})$/);
  if (!match) return null;

  return parseInt(match[1], 10);
}

/**
 * Validate if a string is a valid custom order number
 *
 * @param orderNumber - String to validate
 * @returns True if valid format, false otherwise
 *
 * @example
 * isValidOrderNumber("SIX-000123") // true
 * isValidOrderNumber("SIX-123") // false (not 6 digits)
 * isValidOrderNumber("INVALID") // false
 */
export function isValidOrderNumber(orderNumber: string): boolean {
  return /^SIX-\d{6}$/.test(orderNumber);
}
