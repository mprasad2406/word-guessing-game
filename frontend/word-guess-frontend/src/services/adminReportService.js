/**
 * Admin Reporting Service.
 * Interacts with /api/v1/admin/reports endpoints via centralized apiClient and handles PDF downloads.
 */

import { apiClient } from "./apiClient";
import { storage } from "../utils/storage";

const BASE_URL = (import.meta.env.VITE_API_BASE_URL || "http://localhost:8000").replace(/\/$/, "");

/**
 * Helper to download binary PDF stream from server and trigger browser download.
 * @param {string} endpoint
 * @param {string} defaultFilename
 * @returns {Promise<string>} Downloaded filename
 */
async function downloadPdfBlob(endpoint, defaultFilename = "Report.pdf") {
  const token = storage.getToken();
  const url = `${BASE_URL}${endpoint}`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      Accept: "application/pdf, application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (!response.ok) {
    let errorMsg = "Failed to generate PDF report.";
    try {
      const errJson = await response.json();
      if (errJson?.message) errorMsg = errJson.message;
      else if (errJson?.error?.message) errorMsg = errJson.error.message;
    } catch {
      // ignore
    }
    throw new Error(errorMsg);
  }

  // Extract filename from Content-Disposition header if available
  let filename = defaultFilename;
  const disposition = response.headers.get("Content-Disposition");
  if (disposition && disposition.includes("filename=")) {
    const match = disposition.match(/filename="?([^"]+)"?/);
    if (match && match[1]) {
      filename = match[1];
    }
  }

  const blob = await response.blob();
  const blobUrl = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = blobUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(blobUrl);

  return filename;
}

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
   * @param {string|null} [options.status]
   * @param {string|null} [options.search]
   * @param {number} [options.page=1]
   * @param {number} [options.pageSize=10]
   * @returns {Promise<{ date: string, sessions: Array<any>, total: number, page: number, page_size: number, pages: number }>}
   */
  async getDailyDetails(targetDate, { status = null, search = null, page = 1, pageSize = 10 } = {}) {
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("page_size", String(pageSize));

    if (status && status !== "ALL") params.set("status", status);
    if (search && search.trim()) params.set("search", search.trim());

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

  /**
   * Export Daily Activity Report as professional PDF.
   * @param {Object} [options]
   * @param {string|null} [options.date]
   * @param {string|null} [options.startDate]
   * @param {string|null} [options.endDate]
   * @param {boolean} [options.summaryOnly]
   * @param {string|null} [options.password]
   * @returns {Promise<string>} Downloaded filename
   */
  async downloadDailyPdfReport({
    date = null,
    startDate = null,
    endDate = null,
    summaryOnly = false,
    password = null,
  } = {}) {
    const params = new URLSearchParams();
    if (date) params.set("date", date);
    if (startDate) params.set("start_date", startDate);
    if (endDate) params.set("end_date", endDate);
    if (summaryOnly) params.set("summary_only", "true");
    if (password) params.set("password", password);

    const qs = params.toString();
    const endpoint = `/api/v1/admin/reports/pdf/daily${qs ? `?${qs}` : ""}`;
    return downloadPdfBlob(endpoint, "Daily_Report.pdf");
  },

  /**
   * Export Player Performance Report as professional PDF.
   * @param {Object} options
   * @param {string|number} options.player - username, public_id, or user_id
   * @param {string|null} [options.date]
   * @param {string|null} [options.startDate]
   * @param {string|null} [options.endDate]
   * @param {boolean} [options.summaryOnly]
   * @param {string|null} [options.password]
   * @returns {Promise<string>} Downloaded filename
   */
  async downloadPlayerPdfReport({
    player,
    date = null,
    startDate = null,
    endDate = null,
    summaryOnly = false,
    password = null,
  }) {
    if (!player) {
      throw new Error("Please select a player to generate the report.");
    }
    const params = new URLSearchParams();
    params.set("player", String(player));
    if (date) params.set("date", date);
    if (startDate) params.set("start_date", startDate);
    if (endDate) params.set("end_date", endDate);
    if (summaryOnly) params.set("summary_only", "true");
    if (password) params.set("password", password);

    const qs = params.toString();
    const endpoint = `/api/v1/admin/reports/pdf/player?${qs}`;
    return downloadPdfBlob(endpoint, `Player_Report_${player}.pdf`);
  },

  /**
   * Fetch complete daily report dataset for frontend React PDF rendering.
   * @param {Object} [options]
   * @param {string|null} [options.date]
   * @param {string|null} [options.startDate]
   * @param {string|null} [options.endDate]
   * @param {boolean} [options.summaryOnly]
   * @returns {Promise<any>}
   */
  async getDailyReportData({ date = null, startDate = null, endDate = null, summaryOnly = false } = {}) {
    const params = new URLSearchParams();
    if (date) params.set("date", date);
    if (startDate) params.set("start_date", startDate);
    if (endDate) params.set("end_date", endDate);
    if (summaryOnly) params.set("summary_only", "true");

    const qs = params.toString();
    return apiClient.get(`/api/v1/admin/reports/data/daily${qs ? `?${qs}` : ""}`);
  },

  /**
   * Fetch complete player report dataset for frontend React PDF rendering.
   * @param {Object} options
   * @param {string|number} options.player
   * @param {string|null} [options.date]
   * @param {string|null} [options.startDate]
   * @param {string|null} [options.endDate]
   * @param {boolean} [options.summaryOnly]
   * @returns {Promise<any>}
   */
  async getPlayerReportData({ player, date = null, startDate = null, endDate = null, summaryOnly = false }) {
    if (!player) {
      throw new Error("Please select a player.");
    }
    const params = new URLSearchParams();
    params.set("player", String(player));
    if (date) params.set("date", date);
    if (startDate) params.set("start_date", startDate);
    if (endDate) params.set("end_date", endDate);
    if (summaryOnly) params.set("summary_only", "true");

    const qs = params.toString();
    return apiClient.get(`/api/v1/admin/reports/data/player?${qs}`);
  },
};

