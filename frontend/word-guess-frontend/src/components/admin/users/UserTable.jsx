import React from "react";
import { Link } from "react-router-dom";
import { Users, SearchX, RotateCcw } from "lucide-react";
import { UserTableRow } from "./UserTableRow";
import { UserStatusIndicator } from "./UserStatusIndicator";
import { UserActionsMenu } from "./UserActionsMenu";
import { formatRelativeTime, formatJoinedDate } from "../../../utils/dateUtils";

/**
 * UserTable:
 * Modern 8-column user management table with skeleton rows, empty states,
 * and responsive mobile card view.
 */
export function UserTable({
  users = [],
  currentAdminId,
  isLoading = false,
  isFiltered = false,
  onClearFilters,
  onOpenStatusDialog,
}) {
  return (
    <div className="user-table-card">
      <div className="table-responsive-wrapper">
        <table className="admin-user-table">
          <thead>
            <tr>
              <th scope="col" className="th-user">User</th>
              <th scope="col" className="th-role">Role</th>
              <th scope="col" className="th-account">Account</th>
              <th scope="col" className="th-games">Games</th>
              <th scope="col" className="th-winrate">Win Rate</th>
              <th scope="col" className="th-last-active">Last Active</th>
              <th scope="col" className="th-joined">Joined</th>
              <th scope="col" className="th-actions">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              // Skeleton loading rows
              Array.from({ length: 6 }).map((_, idx) => (
                <tr key={idx} className="skeleton-row" aria-hidden="true">
                  <td>
                    <div className="d-flex align-items-center gap-2">
                      <span className="skeleton-box" style={{ width: "34px", height: "34px", borderRadius: "50%" }} />
                      <span className="skeleton-box" style={{ width: "90px", height: "16px" }} />
                    </div>
                  </td>
                  <td>
                    <span className="skeleton-box" style={{ width: "55px", height: "20px", borderRadius: "4px" }} />
                  </td>
                  <td>
                    <span className="skeleton-box" style={{ width: "65px", height: "20px", borderRadius: "4px" }} />
                  </td>
                  <td>
                    <span className="skeleton-box" style={{ width: "40px", height: "16px" }} />
                  </td>
                  <td>
                    <span className="skeleton-box" style={{ width: "80px", height: "16px" }} />
                  </td>
                  <td>
                    <span className="skeleton-box" style={{ width: "70px", height: "16px" }} />
                  </td>
                  <td>
                    <span className="skeleton-box" style={{ width: "75px", height: "16px" }} />
                  </td>
                  <td className="text-end">
                    <span className="skeleton-box" style={{ width: "32px", height: "32px", borderRadius: "6px", marginLeft: "auto" }} />
                  </td>
                </tr>
              ))
            ) : users.length === 0 ? (
              // Empty state
              <tr>
                <td colSpan={8} className="table-empty-cell">
                  {isFiltered ? (
                    <div className="empty-state-content">
                      <div className="empty-icon-circle">
                        <SearchX size={26} className="text-secondary opacity-75" />
                      </div>
                      <h3 className="empty-state-heading">No matching users found</h3>
                      <p className="empty-state-subtext">
                        No registered accounts match your active search, role, or status filters.
                      </p>
                      {onClearFilters && (
                        <button
                          type="button"
                          className="btn-empty-clear"
                          onClick={onClearFilters}
                          aria-label="Clear active filters"
                        >
                          <RotateCcw size={14} />
                          <span>Clear Filters</span>
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="empty-state-content">
                      <div className="empty-icon-circle icon-indigo-bg">
                        <Users size={26} className="text-primary" />
                      </div>
                      <h3 className="empty-state-heading">No registered accounts</h3>
                      <p className="empty-state-subtext">
                        No user accounts are currently registered in the system.
                      </p>
                    </div>
                  )}
                </td>
              </tr>
            ) : (
              // User Rows
              users.map((user) => {
                const isSelf = user.id === currentAdminId;
                return (
                  <UserTableRow
                    key={user.public_id || user.id}
                    user={user}
                    isSelf={isSelf}
                    onOpenStatusDialog={onOpenStatusDialog}
                  />
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards List View (Visible on small screens) */}
      <div className="user-mobile-cards-list">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, idx) => (
            <div key={idx} className="user-mobile-card skeleton-row">
              <div className="mobile-card-top">
                <span className="skeleton-box" style={{ width: "120px", height: "24px" }} />
                <span className="skeleton-box" style={{ width: "50px", height: "20px" }} />
              </div>
              <span className="skeleton-box" style={{ width: "100%", height: "16px" }} />
            </div>
          ))
        ) : users.length === 0 ? (
          <div className="table-empty-cell p-4">
            <p className="empty-state-subtext mb-0">No users found.</p>
          </div>
        ) : (
          users.map((user) => {
            const isSelf = user.id === currentAdminId;
            const publicId = user.public_id || user.id;
            const initial = user.username?.charAt(0).toUpperCase() || "U";
            const winRate = typeof user.win_rate === "number" ? user.win_rate.toFixed(1) : "0.0";

            return (
              <div
                key={user.public_id || user.id}
                className={`user-mobile-card ${!user.is_active ? "card-inactive" : ""}`}
              >
                <div className="mobile-card-top">
                  <div className="d-flex align-items-center gap-2">
                    <div className="user-avatar-circle" aria-hidden="true">
                      {initial}
                    </div>
                    <div>
                      <Link to={`/admin/users/${publicId}`} className="user-name-link">
                        <span>{user.username}</span>
                        {isSelf && <span className="badge-self">You</span>}
                      </Link>
                      <div className="mobile-meta-text">
                        <span>Joined {formatJoinedDate(user.created_at)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="d-flex align-items-center gap-2">
                    <UserStatusIndicator isActive={Boolean(user.is_active)} />
                    <UserActionsMenu
                      user={user}
                      isSelf={isSelf}
                      onOpenStatusDialog={onOpenStatusDialog}
                    />
                  </div>
                </div>

                <div className="mobile-card-stats-grid">
                  <div className="mobile-stat-box">
                    <span className="mobile-stat-label">Role</span>
                    <span className="mobile-stat-value">{user.role}</span>
                  </div>
                  <div className="mobile-stat-box">
                    <span className="mobile-stat-label">Games</span>
                    <span className="mobile-stat-value num-tabular">{user.total_games}</span>
                  </div>
                  <div className="mobile-stat-box">
                    <span className="mobile-stat-label">Win Rate</span>
                    <span className="mobile-stat-value text-success num-tabular">{winRate}%</span>
                  </div>
                  <div className="mobile-stat-box">
                    <span className="mobile-stat-label">Last Active</span>
                    <span className="mobile-stat-value">{formatRelativeTime(user.last_active_at || user.updated_at)}</span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
