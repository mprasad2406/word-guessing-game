import React from "react";
import { Users, UserCheck, UserX, Activity } from "lucide-react";

/**
 * UserStats:
 * 4 compact summary metric cards above the user management table:
 * - Total registered users
 * - Active accounts
 * - Blocked accounts
 * - Users active in the last 7 days
 */
export function UserStats({ stats, isLoading = false }) {
  const totalUsers = stats?.total_users ?? 0;
  const activeUsers = stats?.active_users ?? 0;
  const blockedUsers = stats?.blocked_users ?? 0;
  const active7dUsers = stats?.active_7d_users ?? 0;

  return (
    <section className="user-stats-strip" aria-label="User Account Summary Metrics">
      {/* 1. Total Registered Users */}
      <div className="user-stat-card">
        <div className="user-stat-icon-box icon-indigo">
          <Users size={18} strokeWidth={2.2} />
        </div>
        <div className="user-stat-info">
          <span className="user-stat-label">Total Users</span>
          <div className="user-stat-value num-tabular">
            {isLoading ? <span className="skeleton-box metric-skeleton" /> : totalUsers}
          </div>
        </div>
      </div>

      {/* 2. Active Accounts */}
      <div className="user-stat-card">
        <div className="user-stat-icon-box icon-green">
          <UserCheck size={18} strokeWidth={2.2} />
        </div>
        <div className="user-stat-info">
          <span className="user-stat-label">Active Accounts</span>
          <div className="user-stat-value text-success num-tabular">
            {isLoading ? <span className="skeleton-box metric-skeleton" /> : activeUsers}
          </div>
        </div>
      </div>

      {/* 3. Blocked Accounts */}
      <div className="user-stat-card">
        <div className="user-stat-icon-box icon-red">
          <UserX size={18} strokeWidth={2.2} />
        </div>
        <div className="user-stat-info">
          <span className="user-stat-label">Blocked Accounts</span>
          <div className="user-stat-value text-danger num-tabular">
            {isLoading ? <span className="skeleton-box metric-skeleton" /> : blockedUsers}
          </div>
        </div>
      </div>

      {/* 4. Active (7 Days) */}
      <div className="user-stat-card">
        <div className="user-stat-icon-box icon-blue">
          <Activity size={18} strokeWidth={2.2} />
        </div>
        <div className="user-stat-info">
          <span className="user-stat-label">Active (7 Days)</span>
          <div className="user-stat-value text-primary num-tabular">
            {isLoading ? <span className="skeleton-box metric-skeleton" /> : active7dUsers}
          </div>
        </div>
      </div>
    </section>
  );
}
