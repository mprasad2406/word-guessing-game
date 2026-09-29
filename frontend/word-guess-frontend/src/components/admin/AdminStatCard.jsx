import React from "react";

/**
 * AdminStatCard:
 * Compact metric card displaying operational counts and system states.
 * Uses consistent icon containers, typography, padding, and skeleton loaders.
 */
export function AdminStatCard({
  icon: Icon,
  iconColorClass = "icon-blue",
  label,
  value,
  supportingText,
  isStateValue = false,
  stateType = "neutral", // "success" | "warning" | "danger" | "neutral"
  isLoading = false,
}) {
  if (isLoading) {
    return (
      <div className="admin-stat-card skeleton-card" aria-hidden="true">
        <div className="stat-card-top">
          <span className="skeleton-box stat-icon-skeleton" />
        </div>
        <div className="stat-card-body">
          <span className="skeleton-box stat-label-skeleton" />
          <span className="skeleton-box stat-value-skeleton" />
          <span className="skeleton-box stat-subtext-skeleton" />
        </div>
      </div>
    );
  }

  return (
    <div className={`admin-stat-card ${isStateValue ? `state-card-${stateType}` : ""}`}>
      <div className="stat-card-top">
        <div className={`stat-icon-wrapper ${iconColorClass}`}>
          {Icon && <Icon size={18} strokeWidth={2.2} />}
        </div>
      </div>

      <div className="stat-card-body">
        <span className="stat-label">{label}</span>
        <div className={`stat-value ${isStateValue ? `state-text-${stateType}` : "num-tabular"}`}>
          {value}
        </div>
        {supportingText && (
          <div className="stat-supporting-text">{supportingText}</div>
        )}
      </div>
    </div>
  );
}
