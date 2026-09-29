import React from "react";
import { Target, Lightbulb, Clock, Timer } from "lucide-react";
import { formatSeconds } from "../../utils/dateUtils";

/**
 * MatchDashboardCards:
 * Three compact status cards displayed immediately above the guessing board.
 * 1. Attempts: Used, max, remaining
 * 2. Hints: Used, remaining, total
 * 3. Time: Live countdown in MM:SS with tabular numerals and green/amber/red urgency states.
 */
export function MatchDashboardCards({
  attemptsUsed = 0,
  maxAttempts = 5,
  remainingAttempts = 5,
  hintsUsed = 0,
  maxHints = 1,
  hintsRemaining = 1,
  timeRemaining = null,
  timeLimitSeconds = null,
  elapsedSeconds = 0,
}) {
  const safeMaxAttempts = Math.max(1, maxAttempts || 5);
  const attemptsPercent = Math.min(100, Math.round((attemptsUsed / safeMaxAttempts) * 100));

  const safeMaxHints = Math.max(1, maxHints || 1);
  const hintsPercent = Math.min(100, Math.round((hintsUsed / safeMaxHints) * 100));

  const isTimeLimited = timeLimitSeconds && timeLimitSeconds > 0;
  const currentRemaining = timeRemaining != null ? timeRemaining : (isTimeLimited ? timeLimitSeconds : 0);

  // Urgency state for countdown: normal (>60s), approaching (31-60s), critical (<=30s)
  let timerUrgency = "normal";
  if (isTimeLimited) {
    if (currentRemaining <= 30) {
      timerUrgency = "critical";
    } else if (currentRemaining <= 60) {
      timerUrgency = "approaching";
    }
  }

  const timePercent = isTimeLimited
    ? Math.max(0, Math.min(100, Math.round((currentRemaining / timeLimitSeconds) * 100)))
    : 100;

  return (
    <section className="match-dashboard-grid" aria-label="Game Status Indicators">
      {/* 1. Attempts Card */}
      <div className="status-card">
        <div className="status-card-header">
          <div className="status-card-label">
            <span className="status-icon-badge badge-blue">
              <Target size={15} />
            </span>
            <span>Attempts</span>
          </div>
          <span className="status-card-badge">
            {remainingAttempts} remaining
          </span>
        </div>

        <div className="status-card-value-row">
          <span className="status-value num-tabular">
            {attemptsUsed} <span className="status-value-max">/ {maxAttempts}</span>
          </span>
        </div>

        <div
          className="status-progress-track"
          role="progressbar"
          aria-valuenow={attemptsUsed}
          aria-valuemin="0"
          aria-valuemax={maxAttempts}
          aria-label={`Attempts used: ${attemptsUsed} of ${maxAttempts}`}
        >
          <div
            className={`status-progress-fill fill-attempts ${
              attemptsPercent >= 80 ? "critical" : attemptsPercent >= 60 ? "warning" : "primary"
            }`}
            style={{ width: `${attemptsPercent}%` }}
          />
        </div>
      </div>

      {/* 2. Hints Card */}
      <div className="status-card">
        <div className="status-card-header">
          <div className="status-card-label">
            <span className="status-icon-badge badge-amber">
              <Lightbulb size={15} />
            </span>
            <span>Hints</span>
          </div>
          <span className="status-card-badge">
            {hintsRemaining} available
          </span>
        </div>

        <div className="status-card-value-row">
          <span className="status-value num-tabular">
            {hintsUsed} <span className="status-value-max">/ {maxHints}</span>
          </span>
        </div>

        <div
          className="status-progress-track"
          role="progressbar"
          aria-valuenow={hintsUsed}
          aria-valuemin="0"
          aria-valuemax={maxHints}
          aria-label={`Hints used: ${hintsUsed} of ${maxHints}`}
        >
          <div
            className="status-progress-fill fill-hints"
            style={{ width: `${hintsPercent}%` }}
          />
        </div>
      </div>

      {/* 3. Time Card */}
      <div className={`status-card timer-card ${timerUrgency}`}>
        <div className="status-card-header">
          <div className="status-card-label">
            <span className={`status-icon-badge badge-timer ${timerUrgency}`}>
              {isTimeLimited ? <Timer size={15} /> : <Clock size={15} />}
            </span>
            <span>{isTimeLimited ? "Time Left" : "Elapsed Time"}</span>
          </div>
          {isTimeLimited && (
            <span className={`status-card-badge badge-urgency ${timerUrgency}`}>
              {timerUrgency === "critical"
                ? "Critical"
                : timerUrgency === "approaching"
                ? "Low Time"
                : "Active"}
            </span>
          )}
        </div>

        <div className="status-card-value-row">
          <span className={`status-value timer-display num-tabular ${timerUrgency}`}>
            {isTimeLimited ? formatSeconds(currentRemaining) : formatSeconds(elapsedSeconds)}
            {isTimeLimited && (
              <span className="status-value-max"> / {formatSeconds(timeLimitSeconds)}</span>
            )}
          </span>
        </div>

        {isTimeLimited ? (
          <div
            className="status-progress-track"
            role="progressbar"
            aria-valuenow={currentRemaining}
            aria-valuemin="0"
            aria-valuemax={timeLimitSeconds}
            aria-label={`Time remaining: ${formatSeconds(currentRemaining)}`}
          >
            <div
              className={`status-progress-fill fill-timer ${timerUrgency}`}
              style={{ width: `${timePercent}%` }}
            />
          </div>
        ) : (
          <div className="status-subtext-note">No time limit</div>
        )}
      </div>
    </section>
  );
}
