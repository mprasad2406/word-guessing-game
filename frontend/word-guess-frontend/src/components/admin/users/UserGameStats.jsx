import React from "react";
import {
  Trophy,
  Swords,
  XCircle,
  Clock,
  Sparkles,
  Flame,
  CheckCircle2,
} from "lucide-react";

export function UserGameStats({ user }) {
  if (!user) return null;

  const totalGames = user.total_games || 0;
  const wonGames = user.games_won || 0;
  const lostGames = user.games_lost || 0;
  const expiredGames = user.games_expired || 0;
  const activeGames = user.active_games || 0;
  const winRate = typeof user.win_rate === "number" ? user.win_rate : 0;
  const avgAttempts = user.average_attempts || (totalGames > 0 ? (user.attempts_used_total / totalGames).toFixed(1) : "0.0");
  const hintsUsed = user.hints_used_total || 0;
  const streak = user.current_streak || 0;
  const avgDuration = user.average_duration_seconds ? `${Math.round(user.average_duration_seconds)}s` : "—";

  return (
    <div className="user-detail-stats-grid">
      {/* 1. Total Games */}
      <div className="user-detail-stat-card">
        <div className="user-detail-stat-header">
          <span className="user-detail-stat-title">Total Matches</span>
          <div className="user-detail-stat-icon-wrap icon-primary">
            <Swords size={16} />
          </div>
        </div>
        <div className="user-detail-stat-value num-tabular">{totalGames}</div>
        <div className="user-detail-stat-subtext">
          {activeGames > 0 ? (
            <span className="text-warning-bold">{activeGames} currently in progress</span>
          ) : (
            <span>All matches concluded</span>
          )}
        </div>
      </div>

      {/* 2. Victories & Win Rate */}
      <div className="user-detail-stat-card">
        <div className="user-detail-stat-header">
          <span className="user-detail-stat-title">Victories & Win Rate</span>
          <div className="user-detail-stat-icon-wrap icon-success">
            <Trophy size={16} />
          </div>
        </div>
        <div className="user-detail-stat-value-row">
          <span className="user-detail-stat-value text-success-bold num-tabular">{wonGames}</span>
          <span className="user-detail-stat-badge badge-success num-tabular">{winRate}%</span>
        </div>
        <div className="user-detail-stat-subtext">
          <span>{wonGames} victorious out of {totalGames} matches</span>
        </div>
      </div>

      {/* 3. Losses & Expired */}
      <div className="user-detail-stat-card">
        <div className="user-detail-stat-header">
          <span className="user-detail-stat-title">Losses & Expired</span>
          <div className="user-detail-stat-icon-wrap icon-danger">
            <XCircle size={16} />
          </div>
        </div>
        <div className="user-detail-stat-value text-danger-bold num-tabular">
          {lostGames + expiredGames}
        </div>
        <div className="user-detail-stat-subtext num-tabular">
          <span>{lostGames} defeated &bull; {expiredGames} expired</span>
        </div>
      </div>

      {/* 4. Efficiency & Activity */}
      <div className="user-detail-stat-card">
        <div className="user-detail-stat-header">
          <span className="user-detail-stat-title">Averages & Streak</span>
          <div className="user-detail-stat-icon-wrap icon-info">
            <Flame size={16} />
          </div>
        </div>
        <div className="user-detail-stat-value-row">
          <span className="user-detail-stat-value num-tabular">{avgAttempts}</span>
          <span className="user-detail-stat-unit">avg attempts</span>
        </div>
        <div className="user-detail-stat-subtext num-tabular">
          <span>{hintsUsed} hints used &bull; {streak > 0 ? `${streak} win streak` : "0 streak"}</span>
        </div>
      </div>
    </div>
  );
}
