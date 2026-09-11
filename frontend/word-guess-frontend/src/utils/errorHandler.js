/**
 * Normalizes backend error responses into a consistent ApiError instance.
 */

export class ApiError extends Error {
  constructor(message, code = "UNKNOWN_ERROR", status = 0, details = null) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.status = status;
    this.details = details;
  }

  /**
   * Helper to get a flattened dictionary of field validation error messages.
   * Example: { username: "Username must contain at least 5 characters" }
   * @returns {Record<string, string>}
   */
  getFieldErrors() {
    if (!this.details || typeof this.details !== "object") {
      return {};
    }
    const result = {};
    for (const [key, value] of Object.entries(this.details)) {
      if (Array.isArray(value) && value.length > 0) {
        result[key] = value[0];
      } else if (typeof value === "string") {
        result[key] = value;
      }
    }
    return result;
  }
}

/**
 * Parses and normalizes various error types (HTTP, JSON envelope, Network).
 * @param {Response} [response]
 * @param {any} [payload]
 * @param {Error} [originalError]
 * @returns {ApiError}
 */
export function normalizeError(response, payload, originalError) {
  // If original error was already an ApiError, return it directly
  if (originalError instanceof ApiError) {
    return originalError;
  }

  // Network / Fetch failure
  if (!response && originalError) {
    return new ApiError(
      "Unable to connect to the server. Please check your network connection.",
      "NETWORK_ERROR",
      0,
      null
    );
  }

  const status = response ? response.status : 0;

  // Check if response conforms to backend ApiResponse error envelope
  if (payload && typeof payload === "object") {
    const message = payload.message || "An unexpected error occurred.";
    const code = payload.error?.code || (status === 401 ? "UNAUTHORIZED" : "API_ERROR");
    const details = payload.error?.details || null;
    return new ApiError(message, code, status, details);
  }

  // Fallback for non-JSON or raw HTTP errors
  let defaultMessage = "An unexpected server error occurred.";
  if (status === 401) defaultMessage = "Authentication required or session expired.";
  if (status === 403) defaultMessage = "Access forbidden: insufficient permissions.";
  if (status === 404) defaultMessage = "The requested resource was not found.";
  if (status === 429) defaultMessage = "Too many requests. Please slow down.";
  if (status >= 500) defaultMessage = "Internal server error. Please try again later.";

  return new ApiError(defaultMessage, "HTTP_ERROR", status, null);
}
