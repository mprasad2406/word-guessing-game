/**
 * Admin Security Key service.
 * Uses centralized apiClient for /api/v1/admin/security endpoints.
 */

import { apiClient } from "./apiClient";

export const securityService = {
  /**
   * Check whether the admin security key has been initialized.
   * @returns {Promise<{ is_initialized: boolean, updated_at: string|null }>}
   */
  async getSecurityStatus() {
    return apiClient.get("/api/v1/admin/security/status");
  },

  /**
   * Initialize or rotate the admin security key.
   * @param {Object} payload - { currentSecurityKey?: string, newSecurityKey: string }
   * @returns {Promise<{ is_initialized: boolean, updated_at: string|null }>}
   */
  async setSecurityKey({ currentSecurityKey, newSecurityKey }) {
    const payload = {
      new_security_key: newSecurityKey,
    };
    if (currentSecurityKey) {
      payload.current_security_key = currentSecurityKey;
    }
    return apiClient.post("/api/v1/admin/security/secret-key", payload);
  },
};
