/**
 * Admin Reporting Service.
 * Interacts with /api/v1/admin/reports endpoints via centralized apiClient.
 */

import { apiClient } from "./apiClient";

export const adminReportService = {
  /**
   * Fetch paginated daily gameplay reports.
   * @param {Object} [options]
   * @param {string|null} [options.date] - "YYYY-MM-DD"
   * @param {string|null} [options.startDate]
   * @param {string|null} [options.endDate]
   * @param {number} [options.page=1]
   * @param {number} [options.pageSize=20]
   * @returns {Promise<{ summaries: Array<any>, total: number, page: number, page_size: number, pages: number }>}
   */
  async getDailyReports({ date = null, startDate = null, endDate = null, page = 1, pageSize = 20 } = {}) {
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("page_size", String(pageSize));

    if (date) params.set("date", date);
    if (startDate) params.set("start_date", startDate);
    if (endDate) params.set("end_date", endDate);

    return apiClient.get(`/api/v1/admin/reports/daily?${params.toString()}`);
  },

  /**
   * Fetch paginated detailed session logs for a specific day.
   * @param {string} targetDate - "YYYY-MM-DD"
   * @param {Object} [options]
   * @param {number} [options.page=1]
   * @param {number} [options.pageSize=20]
   * @returns {Promise<{ date: string, sessions: Array<any>, total: number, page: number, page_size: number, pages: number }>}
   */
  async getDailyDetails(targetDate, { page = 1, pageSize = 20 } = {}) {
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("page_size", String(pageSize));

    return apiClient.get(`/api/v1/admin/reports/daily/${targetDate}/details?${params.toString()}`);
  },

  /**
   * Fetch paginated user performance reports grouped by user and date.
   * @param {Object} [options]
   * @param {number|string|null} [options.userId]
   * @param {string|null} [options.date]
   * @param {string|null} [options.startDate]
   * @param {string|null} [options.endDate]
   * @param {number} [options.page=1]
   * @param {number} [options.pageSize=20]
   * @returns {Promise<{ summaries: Array<any>, total: number, page: number, page_size: number, pages: number }>}
   */
  async getUserReports({ userId = null, date = null, startDate = null, endDate = null, page = 1, pageSize = 20 } = {}) {
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("page_size", String(pageSize));

    if (userId && userId !== "ALL") params.set("user_id", String(userId));
    if (date) params.set("date", date);
    if (startDate) params.set("start_date", startDate);
    if (endDate) params.set("end_date", endDate);

    return apiClient.get(`/api/v1/admin/reports/users?${params.toString()}`);
  },
};
