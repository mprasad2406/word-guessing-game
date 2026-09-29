/**
 * Word management service for administrators.
 * Uses centralized apiClient for /api/v1/admin/words endpoints.
 */

import { apiClient } from "./apiClient";

export const wordService = {
  /**
   * List paginated words with optional filters.
   * @param {Object} [options]
   * @param {boolean|null} [options.isActive]
   * @param {string|null} [options.difficulty] - "EASY" | "MEDIUM" | "HARD"
   * @param {number} [options.page=1]
   * @param {number} [options.pageSize=20]
   * @returns {Promise<{ items: Array<any>, total: number, page: number, page_size: number, pages: number }>}
   */
  async listWords({ isActive = null, difficulty = null, page = 1, pageSize = 20 } = {}) {
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("page_size", String(pageSize));

    if (isActive !== null && isActive !== undefined && isActive !== "ALL") {
      params.set("is_active", String(isActive));
    }

    if (difficulty && difficulty !== "ALL") {
      params.set("difficulty", difficulty);
    }

    return apiClient.get(`/api/v1/admin/words?${params.toString()}`);
  },

  /**
   * Fetch all words across all pages for comprehensive filtering and sorting.
   * @param {Object} [options]
   * @param {boolean|null} [options.isActive]
   * @param {string|null} [options.difficulty]
   * @returns {Promise<{ items: Array<any>, total: number }>}
   */
  async fetchAllWords({ isActive = null, difficulty = null } = {}) {
    let allItems = [];
    let page = 1;
    let totalPages = 1;
    let totalCount = 0;

    while (page <= totalPages && page <= 20) {
      const res = await this.listWords({
        isActive,
        difficulty,
        page,
        pageSize: 100,
      });

      if (res && Array.isArray(res.items)) {
        allItems = allItems.concat(res.items);
        totalCount = res.total || allItems.length;
        totalPages = res.pages || 1;
      } else {
        break;
      }
      page++;
    }

    return { items: allItems, total: totalCount };
  },

  /**
   * Get single word by ID.
   * @param {number|string} wordId
   * @returns {Promise<any>}
   */
  async getWord(wordId) {
    return apiClient.get(`/api/v1/admin/words/${wordId}`);
  },

  /**
   * Create a new word entry.
   * @param {Object} payload - { word, hint, difficulty, is_active }
   * @returns {Promise<any>}
   */
  async createWord(payload) {
    return apiClient.post("/api/v1/admin/words", payload);
  },

  /**
   * Update an existing word.
   * @param {number|string} wordId
   * @param {Object} payload - { word?, hint?, difficulty?, is_active? }
   * @returns {Promise<any>}
   */
  async updateWord(wordId, payload) {
    return apiClient.patch(`/api/v1/admin/words/${wordId}`, payload);
  },

  /**
   * Soft-delete (deactivate) a word.
   * @param {number|string} wordId
   * @returns {Promise<any>}
   */
  async deactivateWord(wordId) {
    return apiClient.delete(`/api/v1/admin/words/${wordId}`);
  },

  /**
   * Permanently delete a word (requires security key).
   * @param {number|string} wordId
   * @param {string} securityKey
   * @returns {Promise<any>}
   */
  async permanentDeleteWord(wordId, securityKey) {
    return apiClient.post(`/api/v1/admin/words/${wordId}/permanent-delete`, {
      security_key: securityKey,
    });
  },
};
