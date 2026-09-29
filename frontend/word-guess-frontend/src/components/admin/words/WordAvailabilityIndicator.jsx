import React from "react";
import { Pause } from "lucide-react";

/**
 * WordAvailabilityIndicator:
 * Communicates word availability directly through the word itself:
 * - Active: Dark green text (#15803D), subtle green background (#F0FDF4), small status dot.
 * - Inactive: Muted grey text (#64748B), light-grey background (#F1F5F9), small pause icon.
 * Includes accessible text for screen readers.
 */
export function WordAvailabilityIndicator({ word, isActive = true }) {
  const displayWord = (word || "").toUpperCase();

  return (
    <div
      className={`word-availability-pill ${isActive ? "status-available" : "status-inactive"}`}
      title={isActive ? `Word "${displayWord}" is available for gameplay` : `Word "${displayWord}" is inactive`}
    >
      <span className="word-availability-dot" aria-hidden="true">
        {isActive ? (
          <span className="dot-circle" />
        ) : (
          <Pause size={10} strokeWidth={3} className="pause-icon" />
        )}
      </span>
      <span className="word-text-display">{displayWord}</span>
      <span className="visually-hidden">
        {isActive ? " (Available for gameplay)" : " (Inactive)"}
      </span>
    </div>
  );
}
