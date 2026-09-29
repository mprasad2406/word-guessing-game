/**
 * User Management service for Administrators.
 * Interacts with /api/v1/admin/users endpoints via centralized apiClient.
 */

import { apiClient } from "./apiClient";

export const userService = {
  /**
   * Retrieve high-level overview user metrics.
   * @returns {Promise<{ total_users: number, active_users: number, blocked_users: number, active_7d_users: number }>}
   */
  async getOverviewStats() {
    return apiClient.get("/api/v1/admin/users/stats/overview");
  },

  /**
   * List paginated users with stats summary, filters, and sorting.
   * @param {Object} [options]
   * @param {string|null} [options.role] - "PLAYER" | "ADMIN"
   * @param {boolean|null} [options.isActive]
   * @param {string|null} [options.search]
   * @param {string|null} [options.sortBy] - "newest" | "oldest" | "most_games" | "highest_win_rate" | "recent_activity"
   * @param {number} [options.page=1]
   * @param {number} [options.pageSize=20]
   * @returns {Promise<{ items: Array<any>, total: number, page: number, page_size: number, pages: number }>}
   */
  async listUsers({
    role = null,
    isActive = null,
    search = null,
    sortBy = "newest",
    page = 1,
    pageSize = 20,
  } = {}) {
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

    if (sortBy) {
      params.set("sort_by", sortBy);
    }

    return apiClient.get(`/api/v1/admin/users?${params.toString()}`);
  },

  /**
   * Retrieve detailed user profile, stats, and gameplay metrics by identifier (public_id or ID).
   * @param {number|string} userIdentifier
   * @returns {Promise<any>}
   */
  async getUserDetails(userIdentifier) {
    return apiClient.get(`/api/v1/admin/users/${userIdentifier}`);
  },

  /**
   * Block or unblock a user account.
   * @param {number|string} userIdentifier
   * @param {boolean} isActive
   * @returns {Promise<any>}
   */
  async updateUserStatus(userIdentifier, isActive) {
    return apiClient.patch(`/api/v1/admin/users/${userIdentifier}/status`, {
      is_active: isActive,
    });
  },

  /**
   * Retrieve paginated match history for a specific user.
   * @param {number|string} userIdentifier
   * @param {Object} [options]
   * @param {string|null} [options.status]
   * @param {number} [options.page=1]
   * @param {number} [options.pageSize=20]
   * @returns {Promise<{ items: Array<any>, total: number, page: number, page_size: number, pages: number }>}
   */
  async getUserGameHistory(userIdentifier, { status = null, page = 1, pageSize = 20 } = {}) {
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("page_size", String(pageSize));

    if (status && status !== "ALL") {
      params.set("status", status);
    }

    return apiClient.get(`/api/v1/admin/users/${userIdentifier}/games?${params.toString()}`);
  },
};
