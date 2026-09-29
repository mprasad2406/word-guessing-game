import React from "react";

/**
 * WordDifficultyBadge:
 * Semantic badge displaying word difficulty:
 * - EASY: Green (#15803D)
 * - MEDIUM: Amber (#D97706)
 * - HARD: Red (#DC2626)
 */
export function WordDifficultyBadge({ difficulty = "MEDIUM" }) {
  const normalized = (difficulty || "MEDIUM").toUpperCase();

  let colorClass = "badge-difficulty-medium";
  let label = "Medium";

  if (normalized === "EASY") {
    colorClass = "badge-difficulty-easy";
    label = "Easy";
  } else if (normalized === "HARD") {
    colorClass = "badge-difficulty-hard";
    label = "Hard";
  }

  return (
    <span className={`word-badge ${colorClass}`} role="status" aria-label={`Difficulty: ${label}`}>
      <span className="badge-dot" aria-hidden="true" />
      <span>{label}</span>
    </span>
  );
}
