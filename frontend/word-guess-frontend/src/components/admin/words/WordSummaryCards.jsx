import React from "react";
import { BookOpen, CheckCircle2, PauseCircle } from "lucide-react";

/**
 * WordSummaryCards:
 * Compact overview metric cards showing dictionary totals:
 * - Total Words
 * - Active Words
 * - Inactive Words
 */
export function WordSummaryCards({ summary, isLoading = false }) {
  const total = summary?.total ?? 0;
  const active = summary?.active ?? 0;
  const inactive = summary?.inactive ?? Math.max(0, total - active);

  return (
    <section className="word-summary-strip" aria-label="Dictionary Overview Metrics">
      {/* 1. Total Words */}
      <div className="summary-metric-card">
        <div className="summary-icon-box icon-indigo">
          <BookOpen size={16} strokeWidth={2.2} />
        </div>
        <div className="summary-info">
          <span className="summary-label">Total Words</span>
          <div className="summary-value num-tabular">
            {isLoading ? <span className="skeleton-box metric-skeleton" /> : total}
          </div>
        </div>
      </div>

      {/* 2. Active Words */}
      <div className="summary-metric-card">
        <div className="summary-icon-box icon-green">
          <CheckCircle2 size={16} strokeWidth={2.2} />
        </div>
        <div className="summary-info">
          <span className="summary-label">Active Words</span>
          <div className="summary-value num-tabular">
            {isLoading ? <span className="skeleton-box metric-skeleton" /> : active}
          </div>
        </div>
      </div>

      {/* 3. Inactive Words */}
      <div className="summary-metric-card">
        <div className="summary-icon-box icon-slate">
          <PauseCircle size={16} strokeWidth={2.2} />
        </div>
        <div className="summary-info">
          <span className="summary-label">Inactive Words</span>
          <div className="summary-value num-tabular">
            {isLoading ? <span className="skeleton-box metric-skeleton" /> : inactive}
          </div>
        </div>
      </div>
    </section>
  );
}
