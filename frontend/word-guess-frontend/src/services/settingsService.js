/**
 * Game settings management service for administrators.
 * Uses centralized apiClient for /api/v1/admin/game-settings endpoints.
 */

import { apiClient } from "./apiClient";

export const settingsService = {
  /**
   * Retrieve current global game settings.
   * @returns {Promise<any>}
   */
  async getGameSettings() {
    return apiClient.get("/api/v1/admin/game-settings");
  },

  /**
   * Update game settings.
   * If modifying critical fields, security_key must be supplied.
   * @param {Object} payload
   * @returns {Promise<any>}
   */
  async updateGameSettings(payload) {
    return apiClient.patch("/api/v1/admin/game-settings", payload);
  },
};
