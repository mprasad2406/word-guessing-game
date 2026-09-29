import React from "react";
import { Users, UserCheck, UserX, Activity } from "lucide-react";

/**
 * UserStats:
 * 4 compact, interactive summary metric cards above the user management table:
 * - Total registered users (click to reset status filter)
 * - Active accounts (click to filter ACTIVE)
 * - Blocked accounts (click to filter BLOCKED)
 * - Users active in the last 7 days (click to sort by RECENT_ACTIVITY)
 */
export function UserStats({
  stats,
  isLoading = false,
  statusFilter = "ALL",
  sortBy = "newest",
  onSelectStatFilter,
}) {
  const totalUsers = stats?.total_users ?? 0;
  const activeUsers = stats?.active_users ?? 0;
  const blockedUsers = stats?.blocked_users ?? 0;
  const active7dUsers = stats?.active_7d_users ?? 0;

  const isTotalActive = statusFilter === "ALL" && sortBy !== "recent_activity";
  const isActiveFilterActive = statusFilter === "ACTIVE";
  const isBlockedFilterActive = statusFilter === "BLOCKED";
  const isActive7dFilterActive = sortBy === "recent_activity";

  return (
    <section className="user-stats-strip" aria-label="User Account Quick Filters and Metrics">
      {/* 1. Total Registered Users */}
      <button
        type="button"
        className={`user-stat-card ${isTotalActive ? "is-selected" : ""}`}
        onClick={() => onSelectStatFilter && onSelectStatFilter("TOTAL")}
        aria-pressed={isTotalActive}
        title="View all registered users"
      >
        <div className="user-stat-icon-box icon-indigo" aria-hidden="true">
          <Users size={18} strokeWidth={2.2} />
        </div>
        <div className="user-stat-info">
          <span className="user-stat-label">Total Users</span>
          <div className="user-stat-value num-tabular">
            {isLoading ? <span className="skeleton-box metric-skeleton" /> : totalUsers}
          </div>
        </div>
      </button>

      {/* 2. Active Accounts */}
      <button
        type="button"
        className={`user-stat-card ${isActiveFilterActive ? "is-selected is-success" : ""}`}
        onClick={() => onSelectStatFilter && onSelectStatFilter("ACTIVE")}
        aria-pressed={isActiveFilterActive}
        title="Filter by Active accounts only"
      >
        <div className="user-stat-icon-box icon-green" aria-hidden="true">
          <UserCheck size={18} strokeWidth={2.2} />
        </div>
        <div className="user-stat-info">
          <span className="user-stat-label">Active Accounts</span>
          <div className="user-stat-value text-success num-tabular">
            {isLoading ? <span className="skeleton-box metric-skeleton" /> : activeUsers}
          </div>
        </div>
      </button>

      {/* 3. Blocked Accounts */}
      <button
        type="button"
        className={`user-stat-card ${isBlockedFilterActive ? "is-selected is-danger" : ""}`}
        onClick={() => onSelectStatFilter && onSelectStatFilter("BLOCKED")}
        aria-pressed={isBlockedFilterActive}
        title="Filter by Blocked accounts only"
      >
        <div className="user-stat-icon-box icon-red" aria-hidden="true">
          <UserX size={18} strokeWidth={2.2} />
        </div>
        <div className="user-stat-info">
          <span className="user-stat-label">Blocked Accounts</span>
          <div className="user-stat-value text-danger num-tabular">
            {isLoading ? <span className="skeleton-box metric-skeleton" /> : blockedUsers}
          </div>
        </div>
      </button>

      {/* 4. Active (7 Days) */}
      <button
        type="button"
        className={`user-stat-card ${isActive7dFilterActive ? "is-selected is-purple" : ""}`}
        onClick={() => onSelectStatFilter && onSelectStatFilter("RECENT_ACTIVITY")}
        aria-pressed={isActive7dFilterActive}
        title="Sort by recent activity (last 7 days active)"
      >
        <div className="user-stat-icon-box icon-blue" aria-hidden="true">
          <Activity size={18} strokeWidth={2.2} />
        </div>
        <div className="user-stat-info">
          <span className="user-stat-label">Active (7 Days)</span>
          <div className="user-stat-value text-primary num-tabular">
            {isLoading ? <span className="skeleton-box metric-skeleton" /> : active7dUsers}
          </div>
        </div>
      </button>
    </section>
  );
}
