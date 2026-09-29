import React from "react";

export function OutcomeDistributionBar({
  won = 0,
  lost = 0,
  expired = 0,
  active = 0,
}) {
  const total = won + lost + expired + active;
  if (total === 0) return null;

  const pctWon = ((won / total) * 100).toFixed(1);
  const pctLost = ((lost / total) * 100).toFixed(1);
  const pctExpired = ((expired / total) * 100).toFixed(1);
  const pctActive = ((active / total) * 100).toFixed(1);

  return (
    <div className="report-distribution-container avoid-break">
      <div className="report-dist-header">
        <div className="report-dist-title">Match Outcome Distribution</div>
        <div className="report-dist-legend">
          <span className="dist-legend-item">
            <span className="dist-dot bg-won"></span> Won: {won} ({pctWon}%)
          </span>
          <span className="dist-legend-item">
            <span className="dist-dot bg-lost"></span> Lost: {lost} ({pctLost}%)
          </span>
          <span className="dist-legend-item">
            <span className="dist-dot bg-expired"></span> Expired: {expired} ({pctExpired}%)
          </span>
          <span className="dist-legend-item">
            <span className="dist-dot bg-active"></span> Active: {active} ({pctActive}%)
          </span>
        </div>
      </div>

      <div className="dist-bar-track">
        {won > 0 && (
          <div className="dist-bar-segment bg-won" style={{ width: `${(won / total) * 100}%` }}>
            {won / total >= 0.06 ? `${pctWon}%` : ""}
          </div>
        )}
        {lost > 0 && (
          <div className="dist-bar-segment bg-lost" style={{ width: `${(lost / total) * 100}%` }}>
            {lost / total >= 0.06 ? `${pctLost}%` : ""}
          </div>
        )}
        {expired > 0 && (
          <div className="dist-bar-segment bg-expired" style={{ width: `${(expired / total) * 100}%` }}>
            {expired / total >= 0.06 ? `${pctExpired}%` : ""}
          </div>
        )}
        {active > 0 && (
          <div className="dist-bar-segment bg-active" style={{ width: `${(active / total) * 100}%` }}>
            {active / total >= 0.06 ? `${pctActive}%` : ""}
          </div>
        )}
      </div>
    </div>
  );
}

export function DailyActivityChart({ summaries = [] }) {
  const valid = summaries.filter((s) => (s.total_games || 0) > 0 || (s.games_won || 0) > 0);
  if (valid.length < 2) return null;

  const timeline = [...valid].reverse().slice(-14);
  const maxVal = Math.max(...timeline.map((s) => s.total_games || 0), 1);
  const chartHeight = 65;

  return (
    <div className="report-distribution-container avoid-break" style={{ padding: "10px 14px" }}>
      <div className="report-dist-header" style={{ marginBottom: "10px" }}>
        <div className="report-dist-title">Gameplay Activity Trend (Games Started vs Won)</div>
        <div className="report-dist-legend">
          <span className="dist-legend-item">
            <span className="dist-dot" style={{ backgroundColor: "var(--report-blue)" }}></span> Started
          </span>
          <span className="dist-legend-item">
            <span className="dist-dot bg-won"></span> Won
          </span>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "flex-end", height: `${chartHeight}px`, gap: "8px", borderBottom: "1px solid var(--report-border)", paddingBottom: "2px" }}>
        {timeline.map((item, idx) => {
          const started = item.total_games || 0;
          const won = item.games_won || 0;
          const hStarted = (started / maxVal) * (chartHeight - 16);
          const hWon = (won / maxVal) * (chartHeight - 16);
          const dateLabel = String(item.date).slice(5);

          return (
            <div key={idx} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", height: "100%", justifyContent: "flex-end" }}>
              <div style={{ display: "flex", gap: "2px", alignItems: "flex-end", height: "100%" }}>
                <div
                  style={{
                    width: "12px",
                    height: `${Math.max(2, hStarted)}px`,
                    backgroundColor: "var(--report-blue)",
                    borderRadius: "2px 2px 0 0",
                  }}
                  title={`Started: ${started}`}
                />
                <div
                  style={{
                    width: "12px",
                    height: `${Math.max(2, hWon)}px`,
                    backgroundColor: "var(--report-success)",
                    borderRadius: "2px 2px 0 0",
                  }}
                  title={`Won: ${won}`}
                />
              </div>
              <div style={{ fontSize: "8px", color: "var(--report-muted)", marginTop: "4px" }}>
                {dateLabel}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function AttemptsDistributionChart({ distribution = {} }) {
  const labels = ["1 Attempt", "2 Attempts", "3 Attempts", "4 Attempts", "5 Attempts", "6+ Attempts"];
  const keys = ["attempt_1", "attempt_2", "attempt_3", "attempt_4", "attempt_5", "attempt_gt5"];

  const counts = keys.map((k) => distribution[k] || 0);
  const totWon = counts.reduce((acc, v) => acc + v, 0);
  if (totWon === 0) return null;

  const maxVal = Math.max(...counts, 1);
  const chartHeight = 65;

  return (
    <div className="report-distribution-container avoid-break" style={{ padding: "10px 14px" }}>
      <div className="report-dist-header" style={{ marginBottom: "8px" }}>
        <div className="report-dist-title">Winning Attempts Distribution (1 to 6+ Attempts to Solve)</div>
        <div style={{ fontSize: "9.5px", color: "var(--report-muted)" }}>Total Solved: {totWon}</div>
      </div>

      <div style={{ display: "flex", alignItems: "flex-end", height: `${chartHeight}px`, gap: "12px", borderBottom: "1px solid var(--report-border)", paddingBottom: "2px" }}>
        {keys.map((k, idx) => {
          const count = distribution[k] || 0;
          const barHeight = (count / maxVal) * (chartHeight - 20);

          return (
            <div key={k} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", height: "100%", justifyContent: "flex-end" }}>
              <div style={{ fontSize: "8.5px", fontWeight: 700, color: "var(--report-primary)", marginBottom: "2px" }}>
                {count}
              </div>
              <div
                style={{
                  width: "28px",
                  height: `${Math.max(2, barHeight)}px`,
                  backgroundColor: "var(--report-blue)",
                  borderRadius: "3px 3px 0 0",
                }}
              />
              <div style={{ fontSize: "8.5px", color: "var(--report-muted)", marginTop: "4px", whiteSpace: "nowrap" }}>
                {labels[idx]}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
