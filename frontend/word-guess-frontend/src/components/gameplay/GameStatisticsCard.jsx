import React from "react";
import { BarChart3, Target, Lightbulb, Clock, CheckCircle2, Calendar } from "lucide-react";
import { formatServerDate, parseServerDate, formatDuration } from "../../utils/dateUtils";

/**
 * GameStatisticsCard:
 * Displays a structured breakdown of session statistics and metrics.
 */
export function GameStatisticsCard({ gameState }) {
  if (!gameState) return null;

  const {
    status,
    attempts_used,
    max_attempts,
    hints_used,
    max_hints,
    started_at,
    completed_at,
  } = gameState;

  // Calculate duration
  let durationSec = gameState.duration_seconds != null ? gameState.duration_seconds : null;
  if (durationSec == null && completed_at && started_at) {
    const start = parseServerDate(started_at)?.getTime();
    const end = parseServerDate(completed_at)?.getTime();
    if (start && end) {
      durationSec = Math.max(0, Math.floor((end - start) / 1000));
    }
  }

  return (
    <div className="card shadow-sm border-0 rounded-4 p-4 bg-white mb-4">
      <div className="d-flex align-items-center gap-2 pb-3 mb-3 border-bottom">
        <div
          style={{
            width: "32px",
            height: "32px",
            borderRadius: "8px",
            backgroundColor: "#eff6ff",
            color: "#2563eb",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <BarChart3 size={18} />
        </div>
        <h3 className="mb-0 fw-bold text-dark" style={{ fontSize: "1.0625rem" }}>
          Session Statistics
        </h3>
      </div>

      <div className="d-flex flex-column">
        {/* Attempts */}
        <div className="d-flex justify-content-between align-items-center py-2.5 border-bottom">
          <div className="d-flex align-items-center gap-2 text-muted" style={{ fontSize: "0.875rem" }}>
            <Target size={15} />
            <span>Attempts Used</span>
          </div>
          <span className="fw-bold text-dark font-monospace" style={{ fontSize: "0.9375rem" }}>
            {attempts_used} / {max_attempts}
          </span>
        </div>

        {/* Hints */}
        <div className="d-flex justify-content-between align-items-center py-2.5 border-bottom">
          <div className="d-flex align-items-center gap-2 text-muted" style={{ fontSize: "0.875rem" }}>
            <Lightbulb size={15} />
            <span>Hints Used</span>
          </div>
          <span className="fw-bold text-dark font-monospace" style={{ fontSize: "0.9375rem" }}>
            {hints_used} {max_hints > 0 ? `/ ${max_hints}` : ""}
          </span>
        </div>

        {/* Duration */}
        <div className="d-flex justify-content-between align-items-center py-2.5 border-bottom">
          <div className="d-flex align-items-center gap-2 text-muted" style={{ fontSize: "0.875rem" }}>
            <Clock size={15} />
            <span>Total Duration</span>
          </div>
          <span className="fw-bold text-dark font-monospace" style={{ fontSize: "0.9375rem" }}>
            {durationSec != null ? formatDuration(durationSec) : "—"}
          </span>
        </div>

        {/* Status */}
        <div className="d-flex justify-content-between align-items-center py-2.5 border-bottom">
          <div className="d-flex align-items-center gap-2 text-muted" style={{ fontSize: "0.875rem" }}>
            <CheckCircle2 size={15} />
            <span>Final Result</span>
          </div>
          <span className="fw-bold text-dark text-capitalize" style={{ fontSize: "0.875rem" }}>
            {status?.toLowerCase()}
          </span>
        </div>

        {/* Started */}
        <div className="d-flex justify-content-between align-items-center py-2.5 border-bottom">
          <div className="d-flex align-items-center gap-2 text-muted" style={{ fontSize: "0.875rem" }}>
            <Calendar size={15} />
            <span>Start Time</span>
          </div>
          <span className="text-dark" style={{ fontSize: "0.8125rem" }}>
            {formatServerDate(started_at)}
          </span>
        </div>

        {/* Completed */}
        {completed_at && (
          <div className="d-flex justify-content-between align-items-center py-2.5">
            <div className="d-flex align-items-center gap-2 text-muted" style={{ fontSize: "0.875rem" }}>
              <Calendar size={15} />
              <span>Completion Time</span>
            </div>
            <span className="text-dark" style={{ fontSize: "0.8125rem" }}>
              {formatServerDate(completed_at)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
