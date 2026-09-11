/**
 * Gameplay service for Player game sessions.
 * Interacts with backend /api/v1/games endpoints using the centralized apiClient.
 */

import { apiClient } from "./apiClient";

export const gameplayService = {
  /**
   * Retrieve player's daily game quota.
   * @returns {Promise<{ daily_limit: number, games_played_today: number, games_remaining_today: number, can_start_game: boolean }>}
   */
  async getDailyQuota() {
    return apiClient.get("/api/v1/games/daily-quota");
  },

  /**
   * Start a new game session.
   * @returns {Promise<any>}
   */
  async startGame() {
    return apiClient.post("/api/v1/games");
  },

  /**
   * Retrieve state of an existing game session.
   * @param {number|string} gameId
   * @returns {Promise<any>}
   */
  async getGameState(gameId) {
    return apiClient.get(`/api/v1/games/${gameId}`);
  },

  /**
   * Submit a whole-word guess attempt.
   * @param {number|string} gameId
   * @param {string} guess
   * @returns {Promise<any>}
   */
  async submitGuess(gameId, guess) {
    return apiClient.post(`/api/v1/games/${gameId}/guess`, { guess });
  },

  /**
   * Request a hint for an active game session.
   * @param {number|string} gameId
   * @returns {Promise<{ hint: string, hints_used: number, hints_remaining: number }>}
   */
  async requestHint(gameId) {
    return apiClient.post(`/api/v1/games/${gameId}/hint`);
  },

  /**
   * Retrieve paginated game history for the authenticated player.
   * @param {Object} [options]
   * @param {string} [options.status] - "ACTIVE" | "WON" | "LOST" | "EXPIRED" (omit or omit if ALL)
   * @param {number} [options.page=1]
   * @param {number} [options.pageSize=10]
   * @returns {Promise<{ items: Array<any>, total: number, page: number, page_size: number, pages: number }>}
   */
  async getGameHistory({ status = null, page = 1, pageSize = 10 } = {}) {
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("page_size", String(pageSize));

    if (status && status !== "ALL") {
      params.set("status", status);
    }

    return apiClient.get(`/api/v1/games/history?${params.toString()}`);
  },
};
