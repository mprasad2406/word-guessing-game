import React from "react";
import { Users, Gamepad2, Trophy, HelpCircle } from "lucide-react";

/**
 * Circular Win-Rate Ring Progress SVG
 */
function WinRateRing({ percentage = 0, size = 36, strokeWidth = 3.5 }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const validPct = Math.min(100, Math.max(0, percentage || 0));
  const strokeDashoffset = circumference - (validPct / 100) * circumference;

  return (
    <div className="win-rate-ring-wrap" style={{ width: size, height: size }}>
      <svg
        className="win-rate-ring-svg"
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
      >
        <circle
          className="win-rate-ring-bg"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
        />
        <circle
          className="win-rate-ring-fill"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <span className="win-rate-ring-label">{Math.round(validPct)}%</span>
    </div>
  );
}

export function ReportKpiGrid({
  totalPlayers = 0,
  totalGames = 0,
  totalWon = 0,
  totalGuesses = 0,
  winRate = 0,
  daysCount = 0,
}) {
  const numericWinRate = typeof winRate === "number" ? winRate : parseFloat(winRate) || 0;

  return (
    <div className="reports-kpi-grid">
      {/* 1. Active Players Card */}
      <div className="report-kpi-card">
        <div className="report-kpi-top">
          <span className="report-kpi-title" title="Total unique active players in selected period">
            Active Players
          </span>
          <div className="report-kpi-icon-wrap icon-blue">
            <Users size={16} />
          </div>
        </div>
        <div className="report-kpi-value-row">
          <span className="report-kpi-value num-tabular">{totalPlayers}</span>
        </div>
        <div className="report-kpi-baseline-row">
          <span className="report-kpi-meta">
            <span>{daysCount > 0 ? `Across ${daysCount} recorded ${daysCount === 1 ? "day" : "days"}` : "Distinct players active"}</span>
          </span>
        </div>
      </div>

      {/* 2. Games Played Card */}
      <div className="report-kpi-card">
        <div className="report-kpi-top">
          <span className="report-kpi-title" title="Total game sessions initiated in selected period">
            Games Played
          </span>
          <div className="report-kpi-icon-wrap icon-indigo">
            <Gamepad2 size={16} />
          </div>
        </div>
        <div className="report-kpi-value-row">
          <span className="report-kpi-value num-tabular">{totalGames}</span>
        </div>
        <div className="report-kpi-baseline-row">
          <span className="report-kpi-meta">
            <span className="text-success font-semibold">{totalWon} won</span>
            <span className="report-meta-bullet">&bull;</span>
            <span>{totalGames - totalWon} unsolved</span>
          </span>
        </div>
      </div>

      {/* 3. Victories Card */}
      <div className="report-kpi-card">
        <div className="report-kpi-top">
          <span className="report-kpi-title" title="Total successful word guesses completed">
            Victories
          </span>
          <div className="report-kpi-icon-wrap icon-green">
            <Trophy size={16} />
          </div>
        </div>
        <div className="report-kpi-value-row">
          <span className="report-kpi-value num-tabular text-success">{totalWon}</span>
        </div>
        <div className="report-kpi-baseline-row">
          <span className="report-kpi-meta">
            <span>{totalGames > 0 ? `${numericWinRate.toFixed(1)}% success rate` : "No matches played"}</span>
          </span>
        </div>
      </div>

      {/* 4. Win Rate Card with SVG Progress Ring */}
      <div className="report-kpi-card">
        <div className="report-kpi-top">
          <span className="report-kpi-title" title="Percentage of games successfully solved">
            Win Rate
          </span>
          <WinRateRing percentage={numericWinRate} />
        </div>
        <div className="report-kpi-value-row">
          <span className="report-kpi-value num-tabular">{numericWinRate.toFixed(1)}%</span>
        </div>
        <div className="report-kpi-baseline-row">
          <span className="report-kpi-meta">
            <span>{totalWon} of {totalGames} matches won</span>
          </span>
        </div>
      </div>
    </div>
  );
}
