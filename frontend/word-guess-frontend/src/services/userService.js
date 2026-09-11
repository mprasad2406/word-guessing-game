/**
 * User Management service for Administrators.
 * Interacts with /api/v1/admin/users endpoints via centralized apiClient.
 */

import { apiClient } from "./apiClient";

export const userService = {
  /**
   * List paginated users with stats summary and filters.
   * @param {Object} [options]
   * @param {string|null} [options.role] - "PLAYER" | "ADMIN"
   * @param {boolean|null} [options.isActive]
   * @param {string|null} [options.search]
   * @param {number} [options.page=1]
   * @param {number} [options.pageSize=20]
   * @returns {Promise<{ items: Array<any>, total: number, page: number, page_size: number, pages: number }>}
   */
  async listUsers({ role = null, isActive = null, search = null, page = 1, pageSize = 20 } = {}) {
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("page_size", String(pageSize));

    if (role && role !== "ALL") {
      params.set("role", role);
    }

    if (isActive !== null && isActive !== undefined && isActive !== "ALL") {
      params.set("is_active", String(isActive));
    }

    if (search && search.trim()) {
      params.set("search", search.trim());
    }

    return apiClient.get(`/api/v1/admin/users?${params.toString()}`);
  },

  /**
   * Retrieve detailed user profile, stats, and gameplay metrics.
   * @param {number|string} userId
   * @returns {Promise<any>}
   */
  async getUserDetails(userId) {
    return apiClient.get(`/api/v1/admin/users/${userId}`);
  },

  /**
   * Block or unblock a user account.
   * @param {number|string} userId
   * @param {boolean} isActive
   * @returns {Promise<any>}
   */
  async updateUserStatus(userId, isActive) {
    return apiClient.patch(`/api/v1/admin/users/${userId}/status`, {
      is_active: isActive,
    });
  },

  /**
   * Retrieve paginated match history for a specific user.
   * @param {number|string} userId
   * @param {Object} [options]
   * @param {string|null} [options.status]
   * @param {number} [options.page=1]
   * @param {number} [options.pageSize=20]
   * @returns {Promise<{ items: Array<any>, total: number, page: number, page_size: number, pages: number }>}
   */
  async getUserGameHistory(userId, { status = null, page = 1, pageSize = 20 } = {}) {
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("page_size", String(pageSize));

    if (status && status !== "ALL") {
      params.set("status", status);
    }

    return apiClient.get(`/api/v1/admin/users/${userId}/games?${params.toString()}`);
  },
};
