import React from "react";

/**
 * DifficultyMeter:
 * Compact 3-segment visual meter for word difficulty with descriptive tooltips:
 * - Easy: 1 filled segment (Green, "Easy: 1 of 3 difficulty level")
 * - Medium: 2 filled segments (Amber, "Medium: 2 of 3 difficulty level")
 * - Hard: 3 filled segments (Red, "Hard: 3 of 3 difficulty level")
 */
export function DifficultyMeter({ difficulty = "MEDIUM", showLabel = true, className = "" }) {
  const diffUpper = String(difficulty || "MEDIUM").toUpperCase();

  let level = 2;
  let colorClass = "diff-medium";
  let label = "Medium";
  let tooltip = "Medium: 2 of 3 difficulty level";

  if (diffUpper === "EASY") {
    level = 1;
    colorClass = "diff-easy";
    label = "Easy";
    tooltip = "Easy: 1 of 3 difficulty level";
  } else if (diffUpper === "HARD") {
    level = 3;
    colorClass = "diff-hard";
    label = "Hard";
    tooltip = "Hard: 3 of 3 difficulty level";
  }

  return (
    <div
      className={`difficulty-meter-wrap ${colorClass} ${className}`}
      title={tooltip}
      aria-label={tooltip}
    >
      <div className="diff-segments" aria-hidden="true">
        <span className={`diff-segment ${level >= 1 ? "is-filled" : ""}`} />
        <span className={`diff-segment ${level >= 2 ? "is-filled" : ""}`} />
        <span className={`diff-segment ${level >= 3 ? "is-filled" : ""}`} />
      </div>
      {showLabel && <span className="diff-label">{label}</span>}
    </div>
  );
}
