import React from "react";
import { BookOpen, CheckCircle2, PauseCircle } from "lucide-react";

/**
 * WordSummaryStrip (DictionaryStats):
 * 3 compact, interactive summary metric indicators:
 * - Total Words: BookOpen icon and count (click to reset status filter)
 * - Available: Green CheckCircle2 icon and count (click to filter ACTIVE)
 * - Inactive: Gray PauseCircle icon and count (click to filter INACTIVE)
 */
export function WordSummaryStrip({
  summary,
  isLoading = false,
  statusFilter = "ALL",
  onStatusFilterChange,
}) {
  const total = summary?.total ?? 0;
  const active = summary?.active ?? 0;
  const inactive = summary?.inactive ?? Math.max(0, total - active);

  const isTotalActive = statusFilter === "ALL";
  const isAvailableActive = statusFilter === "ACTIVE";
  const isInactiveActive = statusFilter === "INACTIVE";

  return (
    <div className="word-summary-interactive-grid" role="region" aria-label="Dictionary Quick Filters & Counts">
      {/* 1. Total Words */}
      <button
        type="button"
        className={`word-summary-card ${isTotalActive ? "is-selected" : ""}`}
        onClick={() => onStatusFilterChange && onStatusFilterChange("ALL")}
        aria-pressed={isTotalActive}
        title="View all dictionary words"
      >
        <div className="word-summary-icon-box icon-indigo" aria-hidden="true">
          <BookOpen size={18} strokeWidth={2.2} />
        </div>
        <div className="word-summary-info">
          <span className="word-summary-label">Total Words</span>
          <div className="word-summary-value num-tabular">
            {isLoading ? <span className="skeleton-inline" /> : total}
          </div>
        </div>
      </button>

      {/* 2. Available Words */}
      <button
        type="button"
        className={`word-summary-card ${isAvailableActive ? "is-selected is-success" : ""}`}
        onClick={() => onStatusFilterChange && onStatusFilterChange(isAvailableActive ? "ALL" : "ACTIVE")}
        aria-pressed={isAvailableActive}
        title="Filter by available words (active in gameplay)"
      >
        <div className="word-summary-icon-box icon-green" aria-hidden="true">
          <CheckCircle2 size={18} strokeWidth={2.2} />
        </div>
        <div className="word-summary-info">
          <span className="word-summary-label">Available</span>
          <div className="word-summary-value text-success num-tabular">
            {isLoading ? <span className="skeleton-inline" /> : active}
          </div>
        </div>
      </button>

      {/* 3. Inactive Words */}
      <button
        type="button"
        className={`word-summary-card ${isInactiveActive ? "is-selected is-muted" : ""}`}
        onClick={() => onStatusFilterChange && onStatusFilterChange(isInactiveActive ? "ALL" : "INACTIVE")}
        aria-pressed={isInactiveActive}
        title="Filter by inactive words (disabled from gameplay)"
      >
        <div className="word-summary-icon-box icon-gray" aria-hidden="true">
          <PauseCircle size={18} strokeWidth={2.2} />
        </div>
        <div className="word-summary-info">
          <span className="word-summary-label">Inactive</span>
          <div className="word-summary-value text-secondary num-tabular">
            {isLoading ? <span className="skeleton-inline" /> : inactive}
          </div>
        </div>
      </button>
    </div>
  );
}
