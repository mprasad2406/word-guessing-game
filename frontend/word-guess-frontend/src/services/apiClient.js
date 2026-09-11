/**
 * Centralized fetch-based API client.
 * Handles base URLs, token injection, response envelope unwrapping, and error normalization.
 * Includes automatic token refresh on 401 Unauthorized / token expiration, and automatic logout if refresh fails.
 */

import { normalizeError } from "../utils/errorHandler";
import { storage } from "../utils/storage";

const BASE_URL = (import.meta.env.VITE_API_BASE_URL || "http://localhost:8000").replace(/\/$/, "");

let isRefreshing = false;
let refreshSubscribers = [];

function subscribeTokenRefresh(cb) {
  refreshSubscribers.push(cb);
}

function onRefreshed(newAccessToken) {
  refreshSubscribers.forEach((cb) => cb(newAccessToken));
  refreshSubscribers = [];
}

function onRefreshFailed() {
  refreshSubscribers.forEach((cb) => cb(null));
  refreshSubscribers = [];
}

/**
 * Dispatches session expired event to trigger clean logout & redirection.
 */
function handleSessionExpired(message = "Your session has expired. Please sign in again.") {
  storage.clearAuth();
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("auth:session-expired", {
        detail: { message },
      })
    );
  }
}

/**
 * Attempts to obtain a new access token using the stored refresh token.
 * Returns new access_token or null on failure.
 */
async function performTokenRefresh() {
  const refreshToken = storage.getRefreshToken();
  if (!refreshToken) {
    return null;
  }

  try {
    const refreshUrl = `${BASE_URL}/api/v1/auth/refresh`;
    const response = await fetch(refreshUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });

    if (!response.ok) {
      return null;
    }

    const payload = await response.json();
    if (payload && payload.success && payload.data && payload.data.access_token) {
      const { access_token, refresh_token: newRefreshToken } = payload.data;
      storage.setTokens(access_token, newRefreshToken || refreshToken);
      return access_token;
    }
    return null;
  } catch (err) {
    console.error("Token refresh request failed:", err);
    return null;
  }
}

/**
 * Core request method.
 * @param {string} endpoint e.g. "/api/v1/auth/login"
 * @param {RequestInit & { token?: string, _retry?: boolean }} [options]
 * @returns {Promise<any>} Unwrapped data payload from backend ApiResponse
 */
async function request(endpoint, options = {}) {
  const { token, headers = {}, body, _retry = false, ...customConfig } = options;

  const url = endpoint.startsWith("http") ? endpoint : `${BASE_URL}${endpoint.startsWith("/") ? "" : "/"}${endpoint}`;

  const resolvedToken = token !== undefined ? token : storage.getToken();

  const defaultHeaders = {
    Accept: "application/json",
    ...(body ? { "Content-Type": "application/json" } : {}),
    ...(resolvedToken ? { Authorization: `Bearer ${resolvedToken}` } : {}),
    ...headers,
  };

  const config = {
    method: "GET",
    ...customConfig,
    headers: defaultHeaders,
    ...(body ? { body: typeof body === "string" ? body : JSON.stringify(body) } : {}),
  };

  let response;
  let payload = null;

  try {
    response = await fetch(url, config);
    const contentType = response.headers.get("content-type");

    if (contentType && contentType.includes("application/json")) {
      payload = await response.json();
    } else {
      const text = await response.text();
      payload = text ? { message: text } : null;
    }
  } catch (networkError) {
    throw normalizeError(null, null, networkError);
  }

  // Check for 401 Unauthorized / Token Expiration
  const isAuthEndpoint =
    endpoint.includes("/api/v1/auth/login") ||
    endpoint.includes("/api/v1/auth/register") ||
    endpoint.includes("/api/v1/auth/refresh");

  if (response.status === 401 && !isAuthEndpoint && !_retry) {
    const storedRefreshToken = storage.getRefreshToken();

    if (storedRefreshToken) {
      if (isRefreshing) {
        // Another request is currently refreshing the token; queue this request
        return new Promise((resolve, reject) => {
          subscribeTokenRefresh((newAccessToken) => {
            if (newAccessToken) {
              resolve(request(endpoint, { ...options, token: newAccessToken, _retry: true }));
            } else {
              reject(normalizeError(response, payload));
            }
          });
        });
      }

      // Start token refresh process
      isRefreshing = true;
      const newAccessToken = await performTokenRefresh();
      isRefreshing = false;

      if (newAccessToken) {
        onRefreshed(newAccessToken);
        return request(endpoint, { ...options, token: newAccessToken, _retry: true });
      } else {
        onRefreshFailed();
        handleSessionExpired();
      }
    } else {
      // No refresh token available -> automatically log out
      handleSessionExpired();
    }
  }

  // Check for Account Blocked / Inactive
  if (
    response.status === 403 &&
    (payload?.error?.code === "USER_INACTIVE" ||
      payload?.message?.toLowerCase().includes("blocked") ||
      payload?.message?.toLowerCase().includes("inactive"))
  ) {
    storage.clearAuth();
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("auth:account-blocked", {
          detail: { message: payload?.message || "Account is blocked. Please contact the administrator." },
        })
      );
    }
  }

  // If HTTP status is not OK or the backend envelope indicates failure
  if (!response.ok || (payload && payload.success === false)) {
    throw normalizeError(response, payload);
  }

  // If the backend envelope exists and has a data property, unwrap it
  if (payload && typeof payload === "object" && "success" in payload && "data" in payload) {
    return payload.data;
  }

  return payload;
}

export const apiClient = {
  get: (endpoint, options) => request(endpoint, { method: "GET", ...options }),
  post: (endpoint, body, options) => request(endpoint, { method: "POST", body, ...options }),
  patch: (endpoint, body, options) => request(endpoint, { method: "PATCH", body, ...options }),
  delete: (endpoint, options) => request(endpoint, { method: "DELETE", ...options }),
  request,
};

