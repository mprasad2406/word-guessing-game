/**
 * Authentication service for communicating with backend auth endpoints.
 */

import { apiClient } from "./apiClient";

export const authService = {
  /**
   * Authenticate user credentials and retrieve access token.
   * @param {string} username
   * @param {string} password
   * @returns {Promise<{ access_token: string, token_type: string, expires_in: number, user: { id: number, username: string, role: "PLAYER"|"ADMIN", is_active: boolean } }>}
   */
  login: async (username, password) => {
    return await apiClient.post("/api/v1/auth/login", {
      username,
      password,
    });
  },

  /**
   * Register a new player account.
   * @param {string} username
   * @param {string} password
   * @returns {Promise<{ id: number, username: string, role: "PLAYER"|"ADMIN", is_active: boolean }>}
   */
  register: async (username, password) => {
    return await apiClient.post("/api/v1/auth/register", {
      username,
      password,
    });
  },

  /**
   * Check if a username is available.
   * @param {string} username
   * @returns {Promise<{ username: string, available: boolean }>}
   */
  checkUsernameAvailability: async (username) => {
    return await apiClient.get(`/api/v1/auth/check-username?username=${encodeURIComponent(username)}`);
  },

  /**
   * Retrieve the currently authenticated user profile from backend using the stored token.
   * @returns {Promise<{ id: number, username: string, role: "PLAYER"|"ADMIN", is_active: boolean, created_at: string }>}
   */
  getCurrentUser: async () => {
    return await apiClient.get("/api/v1/auth/me");
  },

  /**
   * Request new access token using a refresh token.
   * @param {string} refreshToken
   * @returns {Promise<{ access_token: string, token_type: string, expires_in: number, refresh_token: string, user: any }>}
   */
  refreshToken: async (refreshToken) => {
    return await apiClient.post("/api/v1/auth/refresh", {
      refresh_token: refreshToken,
    });
  },
};

