/**
 * Frontend validation helpers for User Authentication.
 */

export const ALLOWED_SPECIAL_CHARS = ["$", "%", "*", "&"];

/**
 * Validate username format:
 * - 5 to 12 characters
 * - Letters, numbers, and underscore only (no other special characters or spaces)
 * - Uppercase and lowercase are optional
 * @param {string} username
 * @returns {{ isValid: boolean, error?: string }}
 */
export function validateUsername(username) {
  if (!username || typeof username !== "string") {
    return { isValid: false, error: "Username is required." };
  }

  const trimmed = username.trim();
  if (trimmed.length < 5) {
    return { isValid: false, error: "Minimum 5 characters required for username." };
  }

  if (trimmed.length > 12) {
    return { isValid: false, error: "12 characters is the limit for username." };
  }

  if (!/^[a-zA-Z0-9_]+$/.test(trimmed)) {
    return {
      isValid: false,
      error: "Username can only contain letters, numbers, and underscores (_).",
    };
  }

  return { isValid: true };
}

/**
 * Validate password format:
 * - 5 to 16 characters
 * - Must contain alphabetic character
 * - Must contain numeric character (0-9)
 * - Must contain at least one special character (any punctuation or symbol)
 * @param {string} password
 * @returns {{ isValid: boolean, error?: string }}
 */
export function validatePassword(password) {
  if (!password || typeof password !== "string") {
    return { isValid: false, error: "Password is required." };
  }

  if (password.length < 5) {
    return { isValid: false, error: "Minimum 5 characters required for password." };
  }

  if (password.length > 16) {
    return { isValid: false, error: "16 characters is the limit for password." };
  }

  if (!/[a-zA-Z]/.test(password)) {
    return { isValid: false, error: "Password must contain at least one letter." };
  }

  if (!/[0-9]/.test(password)) {
    return { isValid: false, error: "Password must contain at least one number." };
  }

  // Any non-alphanumeric character (e.g. $, %, *, &, @, !, #, ?, _, -, etc.)
  if (!/[^a-zA-Z0-9\s]/.test(password)) {
    return {
      isValid: false,
      error: "Password must contain at least one special character (e.g. $, %, *, &, @, !).",
    };
  }

  return { isValid: true };
}
