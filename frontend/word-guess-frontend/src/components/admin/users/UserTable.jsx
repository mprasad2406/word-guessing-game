import React from "react";
import { Link } from "react-router-dom";
import { Users, SearchX, RotateCcw, Trophy } from "lucide-react";
import { UserTableRow } from "./UserTableRow";
import { UserStatusIndicator } from "./UserStatusIndicator";
import { UserActionsMenu } from "./UserActionsMenu";

/**
 * UserTable:
 * Modern, high information-density 8-column user management table with
 * skeleton rows, empty states, and compact mobile card view.
 */
export function UserTable({
  users = [],
  currentAdminId,
  isLoading = false,
  isFiltered = false,
  onClearFilters,
  onOpenStatusDialog,
  onViewHistory,
}) {
  const adminId = typeof currentAdminId === "object" ? currentAdminId?.id : currentAdminId;

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
                      <span className="skeleton-box" style={{ width: "30px", height: "30px", borderRadius: "50%" }} />
                      <span className="skeleton-box" style={{ width: "80px", height: "14px" }} />
                    </div>
                  </td>
                  <td>
                    <span className="skeleton-box" style={{ width: "50px", height: "18px", borderRadius: "4px" }} />
                  </td>
                  <td>
                    <span className="skeleton-box" style={{ width: "60px", height: "18px", borderRadius: "4px" }} />
                  </td>
                  <td>
                    <span className="skeleton-box" style={{ width: "30px", height: "14px" }} />
                  </td>
                  <td>
                    <span className="skeleton-box" style={{ width: "70px", height: "14px" }} />
                  </td>
                  <td>
                    <span className="skeleton-box" style={{ width: "60px", height: "14px" }} />
                  </td>
                  <td>
                    <span className="skeleton-box" style={{ width: "65px", height: "14px" }} />
                  </td>
                  <td className="text-end">
                    <span className="skeleton-box" style={{ width: "28px", height: "28px", borderRadius: "6px", marginLeft: "auto" }} />
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
                        <SearchX size={24} className="text-secondary opacity-75" />
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
                          <RotateCcw size={13} />
                          <span>Clear Filters</span>
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="empty-state-content">
                      <div className="empty-icon-circle icon-indigo-bg">
                        <Users size={24} className="text-primary" />
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
                const isSelf = user.id === adminId;
                return (
                  <UserTableRow
                    key={user.public_id || user.id}
                    user={user}
                    isSelf={isSelf}
                    onOpenStatusDialog={onOpenStatusDialog}
                    onViewHistory={onViewHistory}
                  />
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Card List View (Compact essential info: Username, Status, Win Rate, Actions) */}
      <div className="user-mobile-cards-list">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, idx) => (
            <div key={idx} className="user-mobile-card skeleton-row">
              <div className="mobile-card-main">
                <span className="skeleton-box" style={{ width: "100px", height: "20px" }} />
                <span className="skeleton-box" style={{ width: "60px", height: "18px" }} />
              </div>
            </div>
          ))
        ) : users.length === 0 ? (
          <div className="table-empty-cell p-4">
            <p className="empty-state-subtext mb-0">No users found.</p>
          </div>
        ) : (
          users.map((user) => {
            const isSelf = user.id === adminId;
            const publicId = user.public_id || user.id;
            const initial = user.username?.charAt(0).toUpperCase() || "U";
            const totalGames = user.total_games ?? 0;
            const gamesWon = user.games_won ?? 0;
            const winRate = typeof user.win_rate === "number" ? Math.round(user.win_rate * 10) / 10 : 0;

            return (
              <div
                key={user.public_id || user.id}
                className={`user-mobile-card ${!user.is_active ? "card-inactive" : ""}`}
              >
                <div className="mobile-card-main">
                  {/* Avatar + Username */}
                  <div className="mobile-user-info">
                    <div className="user-avatar-circle" aria-hidden="true">
                      {initial}
                    </div>
                    <div className="mobile-user-name-wrap">
                      <Link to={`/admin/users/${publicId}`} className="user-name-link">
                        <span>{user.username}</span>
                      </Link>
                      {isSelf && <span className="badge-self">You</span>}
                    </div>
                  </div>

                  {/* Status, Win Rate & 3-Dot Actions */}
                  <div className="mobile-user-right-group">
                    <UserStatusIndicator isActive={Boolean(user.is_active)} />
                    
                    <div className="mobile-winrate-pill" title={`${winRate.toFixed(1)}% win rate (${gamesWon} won)`}>
                      {totalGames === 0 ? (
                        <span className="text-muted">—</span>
                      ) : (
                        <>
                          <Trophy size={11} className="trophy-icon" aria-hidden="true" />
                          <span className="num-tabular font-semibold">{winRate.toFixed(0)}%</span>
                        </>
                      )}
                    </div>

                    <UserActionsMenu
                      user={user}
                      isSelf={isSelf}
                      onOpenStatusDialog={onOpenStatusDialog}
                      onViewHistory={onViewHistory}
                    />
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
