import React from "react";
import { Link } from "react-router-dom";
import { UserStatusIndicator } from "./UserStatusIndicator";
import { UserActionsMenu } from "./UserActionsMenu";
import { formatRelativeTime, formatJoinedDate } from "../../../utils/dateUtils";

/**
 * UserTableRow:
 * Streamlined 8-column table row for User Management table:
 * | User | Role | Account | Games | Win Rate | Last Active | Joined | Actions |
 */
export function UserTableRow({
  user,
  isSelf = false,
  onOpenStatusDialog,
}) {
  if (!user) return null;

  const publicId = user.public_id || user.id;
  const username = user.username || "";
  const initial = username.charAt(0).toUpperCase() || "U";
  const totalGames = user.total_games ?? 0;
  const gamesWon = user.games_won ?? 0;
  const winRate = typeof user.win_rate === "number" ? user.win_rate.toFixed(1) : "0.0";
  const lastActiveText = formatRelativeTime(user.last_active_at || user.updated_at);
  const joinedDateText = formatJoinedDate(user.created_at);

  return (
    <tr className={`user-table-row ${!user.is_active ? "row-inactive" : ""}`}>
      {/* 1. User (Avatar + Username) */}
      <td className="cell-user">
        <div className="user-profile-cell">
          <div className="user-avatar-circle" aria-hidden="true">
            {initial}
          </div>
          <div className="user-info-text">
            <Link
              to={`/admin/users/${publicId}`}
              className="user-name-link"
              title={`View ${username}'s profile`}
            >
              <span>{username}</span>
              {isSelf && <span className="badge-self">You</span>}
            </Link>
          </div>
        </div>
      </td>

      {/* 2. Role */}
      <td className="cell-role">
        <span className={`user-role-label ${user.role === "ADMIN" ? "role-admin" : "role-player"}`}>
          {user.role === "ADMIN" ? "Admin" : "Player"}
        </span>
      </td>

      {/* 3. Account Status */}
      <td className="cell-status">
        <UserStatusIndicator isActive={Boolean(user.is_active)} />
      </td>

      {/* 4. Games Played */}
      <td className="cell-games">
        <span className="num-tabular font-medium text-slate-800">
          {totalGames}
        </span>
      </td>

      {/* 5. Win Rate */}
      <td className="cell-winrate">
        <div className="winrate-display">
          <span className="winrate-pct num-tabular">{winRate}%</span>
          <span className="winrate-subtext num-tabular">({gamesWon} won)</span>
        </div>
      </td>

      {/* 6. Last Active */}
      <td className="cell-last-active">
        <span className="text-secondary small">{lastActiveText}</span>
      </td>

      {/* 7. Joined */}
      <td className="cell-joined">
        <span className="text-secondary small">{joinedDateText}</span>
      </td>

      {/* 8. Actions (3-Dot Menu) */}
      <td className="cell-actions">
        <UserActionsMenu
          user={user}
          isSelf={isSelf}
          onOpenStatusDialog={onOpenStatusDialog}
        />
      </td>
    </tr>
  );
}
