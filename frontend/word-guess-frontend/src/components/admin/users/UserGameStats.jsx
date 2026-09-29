import React from "react";
import {
  Gamepad2,
  Trophy,
  XCircle,
  Clock,
  Flame,
  Lightbulb,
  CheckCircle2,
  Activity,
} from "lucide-react";

/**
 * CircularWinRateRing:
 * Compact 34px SVG circular progress ring indicating win rate %.
 */
function CircularWinRateRing({ percentage = 0 }) {
  const radius = 12;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.min(100, Math.max(0, percentage));
  const offset = circumference - (clamped / 100) * circumference;

  return (
    <div className="win-rate-ring-wrap" title={`Win Rate: ${clamped}%`}>
      <svg className="win-rate-ring-svg" width="34" height="34" viewBox="0 0 34 34">
        <circle
          className="win-rate-ring-bg"
          cx="17"
          cy="17"
          r={radius}
          strokeWidth="3"
        />
        <circle
          className="win-rate-ring-fill"
          cx="17"
          cy="17"
          r={radius}
          strokeWidth="3"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform="rotate(-90 17 17)"
        />
      </svg>
      <span className="win-rate-ring-label num-tabular">{clamped}%</span>
    </div>
  );
}

export function UserGameStats({ user }) {
  if (!user) return null;

  const totalGames = user.total_games || 0;
  const wonGames = user.games_won || 0;
  const lostGames = user.games_lost || 0;
  const expiredGames = user.games_expired || 0;
  const activeGames = user.active_games || 0;
  const completedGames = wonGames + lostGames + expiredGames;
  const winRate = typeof user.win_rate === "number" ? Math.round(user.win_rate * 10) / 10 : 0;
  const avgAttempts = user.average_attempts
    ? Number(user.average_attempts).toFixed(1)
    : totalGames > 0
    ? (user.attempts_used_total / totalGames).toFixed(1)
    : "0.0";
  const hintsUsed = user.hints_used_total || 0;
  const streak = user.current_streak || 0;

  return (
    <div className="user-detail-stats-grid" role="region" aria-label="Player Performance Metrics">
      {/* 1. Total Matches */}
      <div className="user-detail-stat-card">
        <div className="user-detail-stat-header">
          <span className="user-detail-stat-title">Total Matches</span>
          <div className="user-detail-stat-icon-wrap icon-primary" aria-hidden="true">
            <Gamepad2 size={15} />
          </div>
        </div>

        <div className="user-detail-stat-metric-row">
          <span className="user-detail-stat-value num-tabular">{totalGames}</span>
        </div>

        <div className="user-detail-stat-baseline-row">
          <span className="stat-inline-meta text-muted">
            <CheckCircle2 size={12} className="text-secondary" />
            <span className="num-tabular">{completedGames} completed</span>
          </span>
          {activeGames > 0 && (
            <>
              <span className="stat-bullet">&bull;</span>
              <span className="stat-inline-meta text-primary font-semibold">
                <span className="num-tabular">{activeGames} active</span>
              </span>
            </>
          )}
        </div>
      </div>

      {/* 2. Victories */}
      <div className="user-detail-stat-card">
        <div className="user-detail-stat-header">
          <span className="user-detail-stat-title">Victories</span>
          <div className="user-detail-stat-icon-wrap icon-success" aria-hidden="true">
            <Trophy size={15} />
          </div>
        </div>

        <div className="user-detail-stat-metric-row">
          <span className="user-detail-stat-value text-success num-tabular">{wonGames}</span>
        </div>

        <div className="user-detail-stat-baseline-row">
          <span className="stat-inline-meta text-muted">
            <span className="num-tabular font-semibold text-success">{winRate}%</span>
            <span>victory rate</span>
          </span>
        </div>
      </div>

      {/* 3. Losses & Expired */}
      <div className="user-detail-stat-card">
        <div className="user-detail-stat-header">
          <span className="user-detail-stat-title">Losses & Expired</span>
          <div className="user-detail-stat-icon-wrap icon-danger" aria-hidden="true">
            <XCircle size={15} />
          </div>
        </div>

        <div className="user-detail-stat-metric-row">
          <span className="user-detail-stat-value text-danger num-tabular">
            {lostGames + expiredGames}
          </span>
        </div>

        <div className="user-detail-stat-baseline-row">
          <span className="stat-inline-meta text-danger">
            <XCircle size={12} />
            <span className="num-tabular">{lostGames} defeats</span>
          </span>
          <span className="stat-bullet">&bull;</span>
          <span className="stat-inline-meta text-muted">
            <Clock size={12} />
            <span className="num-tabular">{expiredGames} expired</span>
          </span>
        </div>
      </div>

      {/* 4. Averages & Streak */}
      <div className="user-detail-stat-card">
        <div className="user-detail-stat-header">
          <span className="user-detail-stat-title">Averages & Streak</span>
          <div className="user-detail-stat-icon-wrap icon-info" aria-hidden="true">
            <Activity size={15} />
          </div>
        </div>

        <div className="user-detail-stat-metric-row">
          <span className="user-detail-stat-value num-tabular">
            {avgAttempts}
            <span className="user-detail-stat-unit">avg attempts</span>
          </span>
        </div>

        <div className="user-detail-stat-baseline-row">
          <span className="stat-inline-meta text-muted">
            <Lightbulb size={12} className="text-warning" />
            <span className="num-tabular">{hintsUsed} hints</span>
          </span>
          <span className="stat-bullet">&bull;</span>
          <span className="stat-inline-meta text-muted">
            <Flame size={12} className={streak > 0 ? "text-warning" : "text-muted"} />
            <span className="num-tabular">{streak} streak</span>
          </span>
        </div>
      </div>
    </div>
  );
}
