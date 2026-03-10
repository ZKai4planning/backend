/* =====================================================
   Regex / Validation Helpers
===================================================== */

/**
 * Validates safe UI title text.
 * Allows:
 * - Letters (A–Z, a–z)
 * - Spaces
 * - Special characters: &, -, _, :, (, ), comma, period, apostrophe, and forward slash (/)
 */
export const TITLE_REGEX = /^[A-Za-z &_,()\-:.'\/]+$/;

/**
 * Prevent HTML / script injection
 */
export const NO_HTML_REGEX = /<[^>]*>/;

/**
 * Prevent spam like "aaaaaaa"
 */
export const REPEATED_CHAR_REGEX = /(.)\1{2,}/;

/**
 * Normalize whitespace
 */
export const normalizeWhitespace = (value: string) =>
   value.replace(/\s+/g, " ").trim();

/**
 * Full name: letters, spaces, dots, apostrophes, hyphens
 */
export const NAME_REGEX = /^[A-Za-z\s.'-]+$/;

/** Phone number: 6 to 15 digits
 */
export const PHONE_REGEX = /^[0-9]{6,15}$/;

/**
 * Country code: + followed by 1 to 4 digits
 */
export const COUNTRY_CODE_REGEX = /^\+[1-9]{1,4}$/;

/** Postal code: letters, numbers, spaces, hyphens, 3 to 10 characters
 */
export const POSTAL_REGEX = /^[A-Za-z0-9\s\-]{3,10}$/;
