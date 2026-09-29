import React from "react";
import { CheckCircle2, PauseCircle } from "lucide-react";

/**
 * WordStatusBadge:
 * Displays whether a word is Active (in gameplay rotation) or Inactive (paused).
 */
export function WordStatusBadge({ isActive = true }) {
  if (isActive) {
    return (
      <span className="word-badge badge-status-active" role="status" aria-label="Status: Active">
        <CheckCircle2 size={12} strokeWidth={2.5} />
        <span>Active</span>
      </span>
    );
  }

  return (
    <span className="word-badge badge-status-inactive" role="status" aria-label="Status: Inactive">
      <PauseCircle size={12} strokeWidth={2.5} />
      <span>Inactive</span>
    </span>
  );
}
