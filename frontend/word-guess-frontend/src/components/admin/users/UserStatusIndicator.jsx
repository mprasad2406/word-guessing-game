import React from "react";

/**
 * UserStatusIndicator:
 * Understated status indicator for user accounts:
 * - Active: Small green dot with "Active" text
 * - Blocked: Small muted red dot with "Blocked" text
 */
export function UserStatusIndicator({ isActive = true }) {
  return (
    <span
      className={`user-status-badge ${isActive ? "status-active" : "status-blocked"}`}
      title={isActive ? "Account is active" : "Account is blocked"}
    >
      <span className="status-dot" aria-hidden="true" />
      <span>{isActive ? "Active" : "Blocked"}</span>
    </span>
  );
}
