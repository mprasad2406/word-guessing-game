import React, { useState } from "react";
import { BarChart2, PieChart, TrendingUp, Users, Calendar, Trophy, Gamepad2 } from "lucide-react";
import { formatReportDate } from "../../../utils/dateUtils";

/**
 * Helper to compute clean integer Y-axis ticks
 */
function computeIntegerTicks(maxVal) {
  const safeMax = Math.max(1, Math.ceil(maxVal));
  if (safeMax <= 2) {
    return [0, safeMax];
  }
  const mid = Math.ceil(safeMax / 2);
  return [0, mid, safeMax];
}

/**
 * 1. Gameplay Activity Chart (Played vs Won)
 * Supports 0 days (Empty State), 1 day (Two-Bar Comparison), and 2+ days (Grouped Bar Chart).
 */
function GameplayBarChart({ summaries = [] }) {
  const [hoveredIdx, setHoveredIdx] = useState(null);

  // Filter only items with non-empty date or valid records
  const items = [...summaries].filter((d) => d && d.date).reverse().slice(-14);

  // Scenario 1: Zero records or all zero games
  const totalMatchesInPeriod = items.reduce((acc, curr) => acc + (curr.total_games || 0), 0);
  if (items.length === 0 || totalMatchesInPeriod === 0) {
    return (
      <div className="chart-empty-state">
        <BarChart2 size={28} className="opacity-40" />
        <span>No activity recorded for this period.</span>
      </div>
    );
  }

  // Scenario 2: Exactly 1 Day of Data -> Clean, dedicated 2-bar comparison
  if (items.length === 1) {
    const single = items[0];
    const played = single.total_games || 0;
    const won = single.games_won || 0;
    const rate = played > 0 ? ((won / played) * 100).toFixed(1) : "0.0";
    const maxVal = Math.max(played, won, 1);
    const ticks = computeIntegerTicks(maxVal);

    const chartHeight = 150;
    const chartWidth = 400;
    const paddingLeft = 35;
    const paddingRight = 20;
    const paddingTop = 25;
    const paddingBottom = 30;

    const usableWidth = chartWidth - paddingLeft - paddingRight;
    const usableHeight = chartHeight - paddingTop - paddingBottom;

    const barWidth = 44;
    const spacing = 40;
    const totalBarsWidth = barWidth * 2 + spacing;
    const startX = paddingLeft + (usableWidth - totalBarsWidth) / 2;

    const playedH = maxVal > 0 ? (played / maxVal) * usableHeight : 0;
    const wonH = maxVal > 0 ? (won / maxVal) * usableHeight : 0;

    const playedY = paddingTop + usableHeight - playedH;
    const wonY = paddingTop + usableHeight - wonH;

    const playedX = startX;
    const wonX = startX + barWidth + spacing;

    return (
      <div className="single-day-activity-wrap">
        <div className="single-day-activity-meta">
          <span className="single-day-activity-date">
            <Calendar size={13} className="text-primary" />
            <span>{formatReportDate(single.date)}</span>
          </span>
          <span className="single-day-activity-summary">
            {won} won of {played} matches ({rate}% win rate)
          </span>
        </div>

        <div className="svg-chart-container" style={{ height: 150 }}>
          <svg
            className="svg-chart-svg"
            viewBox={`0 0 ${chartWidth} ${chartHeight}`}
            preserveAspectRatio="xMidYMid meet"
          >
            {/* Integer Y Grid lines */}
            {ticks.map((tickVal, i) => {
              const ratio = maxVal > 0 ? tickVal / maxVal : 0;
              const y = paddingTop + usableHeight * (1 - ratio);
              return (
                <g key={i}>
                  <line
                    x1={paddingLeft}
                    y1={y}
                    x2={chartWidth - paddingRight}
                    y2={y}
                    className="chart-grid-line"
                  />
                  <text
                    x={paddingLeft - 8}
                    y={y + 3}
                    className="chart-axis-label"
                    textAnchor="end"
                  >
                    {tickVal}
                  </text>
                </g>
              );
            })}

            {/* Played Bar (Slate) */}
            <g>
              <rect
                x={playedX}
                y={playedY}
                width={barWidth}
                height={Math.max(2, playedH)}
                className="bar-rect-played"
                rx={4}
              />
              <text
                x={playedX + barWidth / 2}
                y={playedY - 6}
                fill="#0f172a"
                fontSize="11"
                fontWeight="700"
                textAnchor="middle"
              >
                {played}
              </text>
              <text
                x={playedX + barWidth / 2}
                y={chartHeight - 10}
                className="chart-axis-label fw-bold"
                textAnchor="middle"
              >
                Played
              </text>
            </g>

            {/* Won Bar (Green) */}
            <g>
              <rect
                x={wonX}
                y={wonY}
                width={barWidth}
                height={Math.max(2, wonH)}
                className="bar-rect-won"
                rx={4}
              />
              <text
                x={wonX + barWidth / 2}
                y={wonY - 6}
                fill="#15803d"
                fontSize="11"
                fontWeight="700"
                textAnchor="middle"
              >
                {won}
              </text>
              <text
                x={wonX + barWidth / 2}
                y={chartHeight - 10}
                className="chart-axis-label fw-bold"
                textAnchor="middle"
              >
                Won
              </text>
            </g>
          </svg>
        </div>
      </div>
    );
  }

  // Scenario 3: Two or More Days of Data -> Multi-Day Grouped Bar Chart
  const maxVal = Math.max(...items.map((d) => d.total_games || 0), 1);
  const ticks = computeIntegerTicks(maxVal);

  const chartHeight = 160;
  const chartWidth = 500;
  const paddingLeft = 30;
  const paddingRight = 10;
  const paddingTop = 15;
  const paddingBottom = 25;

  const usableWidth = chartWidth - paddingLeft - paddingRight;
  const usableHeight = chartHeight - paddingTop - paddingBottom;
  const groupWidth = usableWidth / items.length;
  const barWidth = Math.min(14, groupWidth * 0.35);

  return (
    <div className="svg-chart-container">
      <svg
        className="svg-chart-svg"
        viewBox={`0 0 ${chartWidth} ${chartHeight}`}
        preserveAspectRatio="none"
      >
        {/* Y Grid lines with strictly integer ticks */}
        {ticks.map((tickVal, i) => {
          const ratio = maxVal > 0 ? tickVal / maxVal : 0;
          const y = paddingTop + usableHeight * (1 - ratio);
          return (
            <g key={i}>
              <line
                x1={paddingLeft}
                y1={y}
                x2={chartWidth - paddingRight}
                y2={y}
                className="chart-grid-line"
              />
              <text
                x={paddingLeft - 6}
                y={y + 3}
                className="chart-axis-label"
                textAnchor="end"
              >
                {tickVal}
              </text>
            </g>
          );
        })}

        {/* Grouped Bars */}
        {items.map((item, idx) => {
          const groupX = paddingLeft + idx * groupWidth;
          const centerX = groupX + groupWidth / 2;

          const played = item.total_games || 0;
          const won = item.games_won || 0;

          const playedH = maxVal > 0 ? (played / maxVal) * usableHeight : 0;
          const wonH = maxVal > 0 ? (won / maxVal) * usableHeight : 0;

          const playedY = paddingTop + usableHeight - playedH;
          const wonY = paddingTop + usableHeight - wonH;

          const dateLabel = formatReportDate(item.date).split(" ").slice(0, 2).join(" ");
          const isHovered = hoveredIdx === idx;

          return (
            <g
              key={idx}
              className="bar-group"
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
              style={{ cursor: "pointer" }}
            >
              {/* Highlight background on hover */}
              {isHovered && (
                <rect
                  x={groupX + 2}
                  y={paddingTop}
                  width={groupWidth - 4}
                  height={usableHeight}
                  fill="#f8fafc"
                  rx={4}
                />
              )}

              {/* Total Games Bar (Slate) */}
              <rect
                x={centerX - barWidth - 1}
                y={playedY}
                width={barWidth}
                height={Math.max(1, playedH)}
                className="bar-rect-played"
              />

              {/* Games Won Bar (Green) */}
              <rect
                x={centerX + 1}
                y={wonY}
                width={barWidth}
                height={Math.max(1, wonH)}
                className="bar-rect-won"
              />

              {/* X Axis Label */}
              <text
                x={centerX}
                y={chartHeight - 6}
                className="chart-axis-label"
                textAnchor="middle"
              >
                {dateLabel}
              </text>

              {/* Hover Tooltip */}
              {isHovered && (
                <g transform={`translate(${centerX}, ${Math.min(playedY, wonY) - 10})`}>
                  <rect
                    x={-50}
                    y={-24}
                    width={100}
                    height={22}
                    fill="#0f172a"
                    rx={4}
                  />
                  <text
                    x={0}
                    y={-10}
                    fill="#ffffff"
                    fontSize="9"
                    fontWeight="600"
                    textAnchor="middle"
                  >
                    {won}W / {played} Played
                  </text>
                </g>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

/**
 * 2. Multi-Segment SVG Doughnut Chart (4 Mutually Exclusive Outcomes: Won, Lost, Expired, Active)
 */
function OutcomeDoughnutChart({ summaries = [], totalGames = 0, totalWon = 0 }) {
  // Aggregate 4 outcome buckets across all daily summaries
  const won = summaries.reduce((acc, curr) => acc + (curr.games_won || 0), 0) || totalWon || 0;
  const lost = summaries.reduce((acc, curr) => acc + (curr.games_lost || 0), 0);
  const expired = summaries.reduce((acc, curr) => acc + (curr.games_expired || 0), 0);
  const active = summaries.reduce((acc, curr) => acc + (curr.games_active || 0), 0);

  const calculatedTotal = won + lost + expired + active;
  const effectiveTotal = calculatedTotal > 0 ? calculatedTotal : totalGames;

  // Never render 0% donut if no matches exist in the selected period
  if (effectiveTotal === 0) {
    return (
      <div className="chart-empty-state">
        <PieChart size={28} className="opacity-40" />
        <span>No activity recorded for this period.</span>
      </div>
    );
  }

  // Outcome percentages
  const wonPct = effectiveTotal > 0 ? (won / effectiveTotal) * 100 : 0;
  const lostPct = effectiveTotal > 0 ? (lost / effectiveTotal) * 100 : 0;
  const expiredPct = effectiveTotal > 0 ? (expired / effectiveTotal) * 100 : 0;
  const activePct = effectiveTotal > 0 ? (active / effectiveTotal) * 100 : 0;

  const size = 124;
  const strokeWidth = 14;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  // Build segments for SVG
  const categories = [
    { key: "won", label: "Won", count: won, pct: wonPct, color: "#16a34a", dotClass: "bg-won" },
    { key: "lost", label: "Lost", count: lost, pct: lostPct, color: "#dc2626", dotClass: "bg-lost" },
    { key: "expired", label: "Expired", count: expired, pct: expiredPct, color: "#64748b", dotClass: "bg-expired" },
    { key: "active", label: "Active", count: active, pct: activePct, color: "#2563eb", dotClass: "bg-active" },
  ];

  let cumulativePct = 0;
  const segments = categories.map((cat) => {
    const dashLength = (cat.pct / 100) * circumference;
    const offset = -(cumulativePct / 100) * circumference;
    cumulativePct += cat.pct;

    return {
      ...cat,
      dashLength,
      offset,
    };
  });

  return (
    <div className="doughnut-container">
      <div className="doughnut-svg-wrap">
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="doughnut-svg"
        >
          {/* Background circle track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#f1f5f9"
            strokeWidth={strokeWidth}
          />

          {/* Render 4 Segments */}
          {segments.map((seg) => {
            if (seg.count <= 0) return null;
            return (
              <circle
                key={seg.key}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke={seg.color}
                strokeWidth={strokeWidth}
                strokeDasharray={`${seg.dashLength} ${circumference}`}
                strokeDashoffset={seg.offset}
                transform={`rotate(-90 ${size / 2} ${size / 2})`}
              />
            );
          })}
        </svg>

        <div className="doughnut-center-content">
          <span className="doughnut-center-value num-tabular">
            {wonPct.toFixed(0)}%
          </span>
          <span className="doughnut-center-label">Win Rate</span>
        </div>
      </div>

      {/* Clean 4-Category Legend */}
      <div className="doughnut-legend-list">
        {categories.map((cat) => (
          <div key={cat.key} className="doughnut-legend-row">
            <div className="doughnut-legend-left">
              <span className={`legend-dot ${cat.dotClass}`} />
              <span>{cat.label}</span>
            </div>
            <span className="doughnut-legend-val num-tabular">
              {cat.count} <span className="text-muted fw-normal">({cat.pct.toFixed(0)}%)</span>
            </span>
          </div>
        ))}

        <div className="doughnut-legend-row border-top pt-2 mt-1">
          <div className="doughnut-legend-left fw-semibold text-dark">
            <span>Total Matches</span>
          </div>
          <span className="doughnut-legend-val num-tabular font-bold">{effectiveTotal}</span>
        </div>
      </div>
    </div>
  );
}

/**
 * 3. Player Participation Trend (Daily Active Users)
 * Supports 0 days (Empty State), 1 day (Single-Day Summary Card), and 2+ days (Line Trend Chart).
 */
function PlayerActivityLineChart({ summaries = [] }) {
  const [hoveredIdx, setHoveredIdx] = useState(null);

  const items = [...summaries].filter((d) => d && d.date).reverse().slice(-14);
  const totalUsersInPeriod = items.reduce((acc, curr) => acc + (curr.number_of_users || 0), 0);

  // Scenario 1: Zero records or 0 active players
  if (items.length === 0 || totalUsersInPeriod === 0) {
    return (
      <div className="chart-empty-state">
        <TrendingUp size={28} className="opacity-40" />
        <span>No activity recorded for this period.</span>
      </div>
    );
  }

  // Scenario 2: Exactly 1 Day of Data -> Compact single-day summary card (NO misleading trend line)
  if (items.length === 1) {
    const single = items[0];
    const userCount = single.number_of_users || 0;

    return (
      <div className="single-day-participation-card">
        <div className="single-day-participation-left">
          <div className="single-day-participation-icon-box">
            <Users size={22} />
          </div>
          <div className="single-day-participation-meta">
            <span className="single-day-participation-date">
              {formatReportDate(single.date)}
            </span>
            <span className="single-day-participation-sub">
              Single-day active player participation
            </span>
          </div>
        </div>

        <div className="single-day-participation-right">
          <div className="single-day-participation-stat">
            <span className="single-day-participation-val num-tabular text-primary">
              {userCount}
            </span>
            <span className="single-day-participation-label">
              {userCount === 1 ? "Unique Active Player" : "Unique Active Players"}
            </span>
          </div>
        </div>
      </div>
    );
  }

  // Scenario 3: Two or More Days of Data -> Multi-Point Area/Line Chart
  const maxUsers = Math.max(...items.map((d) => d.number_of_users || 0), 1);
  const ticks = computeIntegerTicks(maxUsers);

  const chartHeight = 140;
  const chartWidth = 600;
  const paddingLeft = 30;
  const paddingRight = 15;
  const paddingTop = 15;
  const paddingBottom = 25;

  const usableWidth = chartWidth - paddingLeft - paddingRight;
  const usableHeight = chartHeight - paddingTop - paddingBottom;
  const stepX = items.length > 1 ? usableWidth / (items.length - 1) : usableWidth / 2;

  const points = items.map((item, idx) => {
    const x = items.length > 1 ? paddingLeft + idx * stepX : paddingLeft + usableWidth / 2;
    const y = paddingTop + usableHeight - (maxUsers > 0 ? ((item.number_of_users || 0) / maxUsers) * usableHeight : 0);
    return { x, y, item, idx };
  });

  const pathD = points.reduce((acc, pt, i) => {
    return i === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`;
  }, "");

  const areaD = points.length > 1
    ? `${pathD} L ${points[points.length - 1].x} ${paddingTop + usableHeight} L ${points[0].x} ${paddingTop + usableHeight} Z`
    : "";

  return (
    <div className="svg-chart-container" style={{ height: 140 }}>
      <svg
        className="svg-chart-svg"
        viewBox={`0 0 ${chartWidth} ${chartHeight}`}
        preserveAspectRatio="none"
      >
        {/* Y Grid lines with strictly integer ticks */}
        {ticks.map((tickVal, i) => {
          const ratio = maxUsers > 0 ? tickVal / maxUsers : 0;
          const y = paddingTop + usableHeight * (1 - ratio);
          return (
            <g key={i}>
              <line
                x1={paddingLeft}
                y1={y}
                x2={chartWidth - paddingRight}
                y2={y}
                className="chart-grid-line"
              />
              <text
                x={paddingLeft - 6}
                y={y + 3}
                className="chart-axis-label"
                textAnchor="end"
              >
                {tickVal}
              </text>
            </g>
          );
        })}

        {/* Gradient Fill */}
        <defs>
          <linearGradient id="blueAreaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* Area fill under line */}
        {areaD && <path d={areaD} fill="url(#blueAreaGrad)" />}

        {/* Stroke line */}
        {pathD && points.length > 1 && (
          <path
            d={pathD}
            fill="none"
            stroke="#2563eb"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}

        {/* Interactive Dots and Labels */}
        {points.map((pt) => {
          const isHovered = hoveredIdx === pt.idx;
          const dateLabel = formatReportDate(pt.item.date).split(" ").slice(0, 2).join(" ");
          const users = pt.item.number_of_users || 0;

          return (
            <g
              key={pt.idx}
              onMouseEnter={() => setHoveredIdx(pt.idx)}
              onMouseLeave={() => setHoveredIdx(null)}
              style={{ cursor: "pointer" }}
            >
              {/* Vertical guideline on hover */}
              {isHovered && (
                <line
                  x1={pt.x}
                  y1={paddingTop}
                  x2={pt.x}
                  y2={paddingTop + usableHeight}
                  stroke="#93c5fd"
                  strokeWidth="1"
                  strokeDasharray="3 3"
                />
              )}

              {/* Data Dot */}
              <circle
                cx={pt.x}
                cy={pt.y}
                r={isHovered ? 5 : 3.5}
                fill={isHovered ? "#1d4ed8" : "#2563eb"}
                stroke="#ffffff"
                strokeWidth="1.5"
              />

              {/* X Axis Label */}
              <text
                x={pt.x}
                y={chartHeight - 6}
                className="chart-axis-label"
                textAnchor="middle"
              >
                {dateLabel}
              </text>

              {/* Hover Tooltip */}
              {isHovered && (
                <g transform={`translate(${pt.x}, ${pt.y - 12})`}>
                  <rect
                    x={-45}
                    y={-22}
                    width={90}
                    height={20}
                    fill="#0f172a"
                    rx={4}
                  />
                  <text
                    x={0}
                    y={-8}
                    fill="#ffffff"
                    fontSize="9"
                    fontWeight="600"
                    textAnchor="middle"
                  >
                    {users} {users === 1 ? "player" : "players"}
                  </text>
                </g>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

export function ReportAnalyticsSection({ summaries = [], totalGames = 0, totalWon = 0 }) {
  return (
    <div className="reports-analytics-section d-flex flex-column gap-3">
      {/* Top 2-Column Row: Gameplay Activity (Bars) + Outcome Distribution (Doughnut) */}
      <div className="reports-analytics-grid">
        {/* Card 1: Gameplay Activity */}
        <div className="reports-chart-card">
          <div className="reports-chart-header">
            <div className="chart-header-left">
              <h3 className="reports-chart-title">Gameplay Activity</h3>
              <p className="reports-chart-subtitle">Daily matches played vs. victories won</p>
            </div>
            <div className="chart-legend">
              <span className="legend-item">
                <span className="legend-dot bg-played" />
                <span>Played</span>
              </span>
              <span className="legend-item">
                <span className="legend-dot bg-won" />
                <span>Won</span>
              </span>
            </div>
          </div>
          <div className="reports-chart-body">
            <GameplayBarChart summaries={summaries} />
          </div>
        </div>

        {/* Card 2: Outcome Distribution */}
        <div className="reports-chart-card">
          <div className="reports-chart-header">
            <div className="chart-header-left">
              <h3 className="reports-chart-title">Outcome Distribution</h3>
              <p className="reports-chart-subtitle">Breakdown of Won, Lost, Expired & Active</p>
            </div>
          </div>
          <div className="reports-chart-body">
            <OutcomeDoughnutChart summaries={summaries} totalGames={totalGames} totalWon={totalWon} />
          </div>
        </div>
      </div>

      {/* Bottom Full-Width Card: Player Activity Over Time */}
      <div className="reports-chart-card line-chart-card">
        <div className="reports-chart-header">
          <div className="chart-header-left">
            <h3 className="reports-chart-title">Player Participation Trend</h3>
            <p className="reports-chart-subtitle">Daily count of active players engaging in word guessing</p>
          </div>
          <div className="chart-legend">
            <span className="legend-item">
              <span className="legend-dot bg-active" />
              <span>Active Players</span>
            </span>
          </div>
        </div>
        <div className="reports-chart-body">
          <PlayerActivityLineChart summaries={summaries} />
        </div>
      </div>
    </div>
  );
}
