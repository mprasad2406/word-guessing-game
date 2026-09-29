import React from "react";
import { parseServerDate, formatSeconds, formatDuration } from "../../utils/dateUtils";

/**
 * Renders the top-level status of the game session:
 * - Status badge (Active, Won, Lost, Expired)
 * - Word length & masked pattern representation
 * - Attempts used vs maximum attempts
 * - Hints quota
 * - Real-time session timings & countdown timer
 */
export function GameStatusCard({ gameState, timeRemaining, elapsedSeconds }) {
  if (!gameState) return null;

  const {
    status,
    word_length,
    masked_pattern,
    attempts_used,
    max_attempts,
    remaining_attempts,
    hints_used,
    max_hints,
    hints_remaining,
    time_limit_seconds,
    started_at,
    completed_at,
  } = gameState;

  const getStatusBadge = () => {
    switch (status) {
      case "WON":
        return <span className="badge bg-success fs-6"><i className="bi bi-trophy-fill me-1"></i> Won</span>;
      case "LOST":
        return <span className="badge bg-danger fs-6"><i className="bi bi-x-circle-fill me-1"></i> Lost</span>;
      case "EXPIRED":
        return <span className="badge bg-secondary fs-6"><i className="bi bi-clock-history me-1"></i> Expired</span>;
      case "ACTIVE":
      default:
        return <span className="badge bg-primary fs-6"><i className="bi bi-play-circle-fill me-1"></i> In Progress</span>;
    }
  };

  const attemptsPercentage = Math.min(100, Math.round((attempts_used / (max_attempts || 1)) * 100));

  // Timing metrics
  const isTimeLimited = time_limit_seconds && time_limit_seconds > 0;
  const currentRemaining = timeRemaining != null ? timeRemaining : (gameState.time_remaining_seconds ?? (isTimeLimited ? time_limit_seconds : 0));
  const timePercentage = isTimeLimited
    ? Math.max(0, Math.min(100, Math.round((currentRemaining / time_limit_seconds) * 100)))
    : 100;

  // Completed duration
  let completedDurationSec = null;
  if (completed_at && started_at) {
    const start = parseServerDate(started_at)?.getTime();
    const end = parseServerDate(completed_at)?.getTime();
    if (start && end) {
      completedDurationSec = Math.max(0, Math.floor((end - start) / 1000));
    }
  }

  return (
    <div className="card shadow-sm border-0 rounded-3 mb-4">
      <div className="card-body p-4">
        <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3 pb-2 border-bottom">
          <div className="d-flex align-items-center gap-2">
            <span className="text-muted small text-uppercase fw-semibold">Live Word Match</span>
            {getStatusBadge()}
          </div>
          <div className="text-muted small">
            <i className="bi bi-fonts me-1"></i>
            <strong>{word_length}</strong> letters target
          </div>
        </div>

        {/* Word Display Area */}
        <div className="text-center py-3 my-2 bg-light rounded-3">
          <div className="text-muted small mb-2 text-uppercase tracking-wider">
            {status === "ACTIVE" ? "Hidden Word" : "Target Word"}
          </div>
          <div
            className="font-monospace fw-bold fs-2 text-primary"
            style={{ letterSpacing: "0.4rem", wordBreak: "break-all" }}
            aria-label={`Target word pattern: ${masked_pattern}`}
          >
            {masked_pattern}
          </div>
          <div className="small text-muted mt-2">
            {status === "ACTIVE" ? (
              <span>Guess the complete <strong>{word_length}-letter</strong> word</span>
            ) : (
              <span>Game completed</span>
            )}
          </div>
        </div>

        {/* Metrics Bar - 3 Columns: Attempts, Hints, Timing */}
        <div className="row g-3 mt-2">
          {/* Attempts metric */}
          <div className="col-12 col-md-4">
            <div className="p-3 bg-light bg-opacity-75 rounded-3 border border-light-subtle h-100">
              <div className="d-flex justify-content-between align-items-center mb-1">
                <span className="small fw-semibold text-secondary">
                  <i className="bi bi-bullseye me-1"></i>Attempts
                </span>
                <span className="small fw-bold">
                  {attempts_used} / {max_attempts}
                  <span className="text-muted fw-normal ms-1">({remaining_attempts} left)</span>
                </span>
              </div>
              <div className="progress" style={{ height: "6px" }} role="progressbar" aria-valuenow={attemptsPercentage} aria-valuemin="0" aria-valuemax="100">
                <div
                  className={`progress-bar ${
                    attemptsPercentage >= 80 ? "bg-danger" : attemptsPercentage >= 50 ? "bg-warning" : "bg-primary"
                  }`}
                  style={{ width: `${attemptsPercentage}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Hints metric */}
          <div className="col-12 col-md-4">
            <div className="p-3 bg-light bg-opacity-75 rounded-3 border border-light-subtle h-100">
              <div className="d-flex justify-content-between align-items-center mb-1">
                <span className="small fw-semibold text-secondary">
                  <i className="bi bi-lightbulb me-1"></i>Hints
                </span>
                <span className="small fw-bold">
                  {hints_used} / {max_hints}
                  <span className="text-muted fw-normal ms-1">({hints_remaining} left)</span>
                </span>
              </div>
              <div className="progress" style={{ height: "6px" }} role="progressbar" aria-valuenow={(hints_used / (max_hints || 1)) * 100} aria-valuemin="0" aria-valuemax="100">
                <div
                  className="progress-bar bg-info"
                  style={{ width: `${(hints_used / (max_hints || 1)) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Timing / Countdown metric */}
          <div className="col-12 col-md-4">
            <div
              className={`p-3 rounded-3 border h-100 ${
                status === "ACTIVE" && isTimeLimited && currentRemaining <= 30
                  ? "bg-danger bg-opacity-10 border-danger-subtle"
                  : "bg-light bg-opacity-75 border-light-subtle"
              }`}
            >
              <div className="d-flex justify-content-between align-items-center mb-1">
                <span className="small fw-semibold text-secondary">
                  <i className={`bi ${status === "ACTIVE" ? "bi-stopwatch" : "bi-clock-history"} me-1`}></i>
                  {status === "ACTIVE" ? (isTimeLimited ? "Time Left" : "Elapsed") : "Duration"}
                </span>
                <span
                  className={`small fw-bold font-monospace ${
                    status === "ACTIVE" && isTimeLimited
                      ? currentRemaining <= 30
                        ? "text-danger"
                        : currentRemaining <= 60
                        ? "text-warning"
                        : "text-success"
                      : "text-dark"
                  }`}
                >
                  {status === "ACTIVE" ? (
                    isTimeLimited ? (
                      formatSeconds(currentRemaining)
                    ) : (
                      formatSeconds(elapsedSeconds || 0)
                    )
                  ) : (
                    formatDuration(completedDurationSec)
                  )}
                  {status === "ACTIVE" && isTimeLimited && (
                    <span className="text-muted fw-normal ms-1 small">
                      / {formatSeconds(time_limit_seconds)}
                    </span>
                  )}
                </span>
              </div>

              {/* Progress bar for time limit */}
              {status === "ACTIVE" && isTimeLimited ? (
                <div className="progress" style={{ height: "6px" }} role="progressbar" aria-valuenow={timePercentage} aria-valuemin="0" aria-valuemax="100">
                  <div
                    className={`progress-bar ${
                      currentRemaining <= 30
                        ? "bg-danger"
                        : currentRemaining <= 60
                        ? "bg-warning"
                        : "bg-success"
                    }`}
                    style={{ width: `${timePercentage}%`, transition: "width 1s linear" }}
                  ></div>
                </div>
              ) : (
                <div className="small text-muted" style={{ fontSize: "0.75rem" }}>
                  {status === "ACTIVE" ? "No time limit" : status === "EXPIRED" ? "Expired (Time ran out)" : "Session finished"}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
