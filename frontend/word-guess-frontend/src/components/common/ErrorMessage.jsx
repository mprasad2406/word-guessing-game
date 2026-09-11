import React from "react";

export function ErrorMessage({ error, onDismiss }) {
  if (!error) return null;

  const message = typeof error === "string" ? error : error?.message || "An unexpected error occurred.";
  const details = error?.details;

  return (
    <div className="error-banner" role="alert">
      <div className="error-banner-header">
        <span className="error-icon" aria-hidden="true">⚠️</span>
        <div className="error-text">
          <strong className="error-message">{message}</strong>
          {details && typeof details === "object" && Object.keys(details).length > 0 && (
            <ul className="error-details-list">
              {Object.entries(details).map(([field, errs]) => (
                <li key={field}>
                  <span className="error-field-name">{field}:</span>{" "}
                  {Array.isArray(errs) ? errs.join(", ") : String(errs)}
                </li>
              ))}
            </ul>
          )}
        </div>
        {onDismiss && (
          <button
            type="button"
            className="error-dismiss-btn"
            onClick={onDismiss}
            aria-label="Dismiss error"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
}
