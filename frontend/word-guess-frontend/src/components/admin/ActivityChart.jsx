import React, { useState } from "react";
import { parseServerDate } from "../../utils/dateUtils";

/**
 * ActivityChart:
 * Accessible visual bar chart displaying daily match volume (Total Games vs Games Won).
 * Features hover tooltips, date formatting, value indicators, and tabular figures.
 */
export function ActivityChart({ summaries = [], isLoading = false }) {
  const [hoveredIndex, setHoveredIndex] = useState(null);

  if (isLoading) {
    return (
      <div className="activity-chart-skeleton" aria-hidden="true">
        <div className="chart-skeleton-bars">
          {[40, 75, 55, 90, 60, 80, 45].map((h, i) => (
            <div key={i} className="chart-skeleton-col">
              <span className="skeleton-box" style={{ height: `${h}%`, width: "24px" }} />
              <span className="skeleton-box" style={{ height: "12px", width: "32px", marginTop: "8px" }} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Reverse so older date is on the left and newest date is on the right
  const chartData = [...summaries].slice(0, 7).reverse();

  if (chartData.length === 0) {
    return (
      <div className="activity-chart-empty">
        <p className="empty-chart-text">No activity data available for the chart.</p>
      </div>
    );
  }

  // Find maximum total games for Y-axis scaling (min scale 5)
  const maxVolume = Math.max(5, ...chartData.map((d) => d.total_games || 0));

  const formatShortDate = (dateStr) => {
    if (!dateStr) return "";
    const parsed = parseServerDate(dateStr);
    if (!parsed) return dateStr.slice(5); // fallback to MM-DD
    return parsed.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  return (
    <div className="activity-chart-wrapper" role="region" aria-label="Recent Gameplay Activity Chart">
      {/* Legend */}
      <div className="chart-legend-row">
        <div className="legend-item">
          <span className="legend-swatch swatch-total" />
          <span className="legend-label">Total Matches</span>
        </div>
        <div className="legend-item">
          <span className="legend-swatch swatch-won" />
          <span className="legend-label">Matches Won</span>
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="chart-bars-container">
        {chartData.map((item, index) => {
          const total = item.total_games || 0;
          const won = item.games_won || 0;
          const totalHeightPercent = Math.max(6, Math.round((total / maxVolume) * 100));
          const wonHeightPercent = total > 0 ? Math.max(4, Math.round((won / maxVolume) * 100)) : 0;
          const isHovered = hoveredIndex === index;

          return (
            <div
              key={item.date || index}
              className={`chart-bar-group ${isHovered ? "group-hovered" : ""}`}
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
              tabIndex={0}
              role="group"
              aria-label={`${item.date}: ${total} total matches, ${won} matches won, ${item.win_rate}% win rate`}
            >
              {/* Tooltip on hover/focus */}
              {isHovered && (
                <div className="chart-tooltip" role="tooltip">
                  <div className="tooltip-date">{formatShortDate(item.date)}</div>
                  <div className="tooltip-stat">
                    <span>Total:</span> <strong>{total}</strong>
                  </div>
                  <div className="tooltip-stat">
                    <span>Won:</span> <strong>{won}</strong>
                  </div>
                  <div className="tooltip-stat">
                    <span>Win Rate:</span> <strong>{typeof item.win_rate === "number" ? `${item.win_rate.toFixed(1)}%` : `${item.win_rate}%`}</strong>
                  </div>
                </div>
              )}

              {/* Bar Stack */}
              <div className="bar-track">
                {/* Total Matches Bar */}
                <div
                  className="bar-column bar-total"
                  style={{ height: `${totalHeightPercent}%` }}
                >
                  <span className="bar-value-label num-tabular">{total > 0 ? total : ""}</span>
                </div>

                {/* Matches Won Bar (Nested overlay) */}
                {won > 0 && (
                  <div
                    className="bar-column bar-won"
                    style={{ height: `${wonHeightPercent}%` }}
                  />
                )}
              </div>

              {/* Date Label */}
              <span className="bar-date-label">{formatShortDate(item.date)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
