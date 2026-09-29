/**
 * Centralized application route path helpers.
 * Prevents scattering URL construction across multiple components.
 */

export const playerPaths = {
  lobby: () => "/player",
  history: () => "/player/history",
  matchDetails: (publicId) => `/player/matches/${publicId}`,
  legacyGame: (gameId) => `/player/game/${gameId}`,
};

export const adminPaths = {
  dashboard: () => "/admin",
  reports: () => "/admin/reports",
  users: () => "/admin/users",
  userDetail: (userId) => `/admin/users/${userId}`,
  userMatchDetail: (userId, matchId) => `/admin/users/${userId}/matches/${matchId}`,
  words: () => "/admin/words",
  settings: () => "/admin/settings",
};

export const authPaths = {
  login: () => "/login",
  register: () => "/register",
};
