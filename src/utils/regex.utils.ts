/* =====================================================
   Regex / Validation Helpers
===================================================== */

/**
 * Allows safe UI text:
 * letters, numbers, spaces, &, -, _, :, (), commas, dots, apostrophes
 */
export const TITLE_REGEX = /^[A-Za-z0-9 &_,()\-:.']+$/;

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
