import React from "react";

/**
 * WordSummaryStrip:
 * Compact horizontal summary strip placed immediately below the page header.
 * Displays: Total Words: X · Available: Y · Inactive: Z
 * Uses green for available count and muted grey for inactive count without large icons.
 */
export function WordSummaryStrip({ summary, isLoading = false }) {
  const total = summary?.total ?? 0;
  const active = summary?.active ?? 0;
  const inactive = summary?.inactive ?? Math.max(0, total - active);

  return (
    <div className="word-summary-strip-compact" role="region" aria-label="Dictionary Summary Counts">
      <div className="summary-strip-items">
        {/* Total Words */}
        <div className="summary-item">
          <span className="summary-item-label">Total Words:</span>
          <span className="summary-item-value num-tabular">
            {isLoading ? <span className="skeleton-inline" /> : total}
          </span>
        </div>

        <span className="summary-item-separator" aria-hidden="true">·</span>

        {/* Available Words */}
        <div className="summary-item item-available">
          <span className="summary-status-dot dot-available" aria-hidden="true" />
          <span className="summary-item-label">Available:</span>
          <span className="summary-item-value value-available num-tabular">
            {isLoading ? <span className="skeleton-inline" /> : active}
          </span>
        </div>

        <span className="summary-item-separator" aria-hidden="true">·</span>

        {/* Inactive Words */}
        <div className="summary-item item-inactive">
          <span className="summary-status-dot dot-inactive" aria-hidden="true" />
          <span className="summary-item-label">Inactive:</span>
          <span className="summary-item-value value-inactive num-tabular">
            {isLoading ? <span className="skeleton-inline" /> : inactive}
          </span>
        </div>
      </div>
    </div>
  );
}
