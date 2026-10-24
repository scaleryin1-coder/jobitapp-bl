/**
 * Standard Phone Number Utilities for JOBit
 * Enforces consistent E.164 normalization (+91XXXXXXXXXX) and multi-format database query variants.
 */

/**
 * Normalizes any phone number input to standard E.164 format with country code (+91XXXXXXXXXX).
 * Removes all non-digit characters, extracts the 10-digit mobile number, and prepends '+91'.
 *
 * @param {string|number} phone - Raw input phone number
 * @returns {string} Standard E.164 format (e.g. "+919876543210")
 */
export function normalizePhoneNumber(phone) {
  if (!phone) return '';
  const digits = String(phone).replace(/\D/g, '');
  const tenDigits = digits.slice(-10);
  if (!tenDigits || tenDigits.length !== 10) {
    return String(phone).trim();
  }
  return `+91${tenDigits}`;
}

/**
 * Extracts pure 10-digit mobile number without country code or formatting.
 *
 * @param {string|number} phone
 * @returns {string} 10-digit string (e.g. "9876543210")
 */
export function getCleanTenDigits(phone) {
  if (!phone) return '';
  return String(phone).replace(/\D/g, '').slice(-10);
}

/**
 * Returns all common format variants for database lookup so accounts created
 * with legacy formats (with spaces, without country code, etc.) are reliably matched.
 *
 * @param {string|number} phone
 * @returns {string[]} Array of query variants
 */
export function getPhoneLookupVariants(phone) {
  const tenDigits = getCleanTenDigits(phone);
  if (!tenDigits || tenDigits.length !== 10) {
    const raw = String(phone || '').trim();
    return raw ? [raw] : [];
  }

  return [
    `+91${tenDigits}`,                                  // Standard E.164: +919876543210
    `+91 ${tenDigits}`,                                 // With space: +91 9876543210
    tenDigits,                                          // 10 digits: 9876543210
    `91${tenDigits}`,                                   // Country code no plus: 919876543210
    `+91 ${tenDigits.slice(0, 5)} ${tenDigits.slice(5)}` // Spaced pair: +91 98765 43210
  ];
}
