/**
 * Storage utility for managing authentication tokens.
 * Persists access and refresh tokens in browser storage.
 */

const TOKEN_KEY = "guess_word_auth_token";
const REFRESH_TOKEN_KEY = "guess_word_refresh_token";

export const storage = {
  /**
   * Retrieve the stored JWT access token.
   * @returns {string | null}
   */
  getToken: () => {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  },

  /**
   * Store the JWT access token.
   * @param {string} token
   */
  setToken: (token) => {
    try {
      if (token) {
        localStorage.setItem(TOKEN_KEY, token);
      }
    } catch (e) {
      console.error("Failed to persist token to storage", e);
    }
  },

  /**
   * Retrieve the stored JWT refresh token.
   * @returns {string | null}
   */
  getRefreshToken: () => {
    try {
      return localStorage.getItem(REFRESH_TOKEN_KEY);
    } catch {
      return null;
    }
  },

  /**
   * Store the JWT refresh token.
   * @param {string} refreshToken
   */
  setRefreshToken: (refreshToken) => {
    try {
      if (refreshToken) {
        localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
      }
    } catch (e) {
      console.error("Failed to persist refresh token to storage", e);
    }
  },

  /**
   * Store both access and refresh tokens.
   * @param {string} token
   * @param {string} [refreshToken]
   */
  setTokens: (token, refreshToken) => {
    try {
      if (token) {
        localStorage.setItem(TOKEN_KEY, token);
      }
      if (refreshToken) {
        localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
      }
    } catch (e) {
      console.error("Failed to persist tokens to storage", e);
    }
  },

  /**
   * Remove the stored JWT access token.
   */
  removeToken: () => {
    try {
      localStorage.removeItem(TOKEN_KEY);
    } catch (e) {
      console.error("Failed to remove token from storage", e);
    }
  },

  /**
   * Clear all auth session data.
   */
  clearAuth: () => {
    try {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(REFRESH_TOKEN_KEY);
    } catch (e) {
      console.error("Failed to clear auth storage", e);
    }
  },
};

