import React from "react";

/**
 * UserStatusIndicator:
 * Clean, lightweight status indicator matching Word Management:
 * - Active: Small green dot with "Active" label
 * - Blocked: Small red dot with "Blocked" label
 */
export function UserStatusIndicator({ isActive = true, className = "" }) {
  return (
    <div
      className={`user-status-indicator-wrap ${isActive ? "is-active" : "is-blocked"} ${className}`}
      title={isActive ? "Account is active and permitted to play" : "Account is blocked and cannot sign in"}
    >
      <span className="status-dot" aria-hidden="true" />
      <span className="status-label-text">{isActive ? "Active" : "Blocked"}</span>
    </div>
  );
}
