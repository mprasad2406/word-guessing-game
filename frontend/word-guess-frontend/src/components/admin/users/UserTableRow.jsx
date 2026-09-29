import React from "react";
import { Link } from "react-router-dom";
import { Shield, User as UserIcon, Trophy } from "lucide-react";
import { UserStatusIndicator } from "./UserStatusIndicator";
import { UserActionsMenu } from "./UserActionsMenu";
import { formatRelativeTime, formatJoinedDate } from "../../../utils/dateUtils";

/**
 * UserTableRow:
 * High information-density table row for User Management:
 * | User | Role | Status (Green/Red Dot) | Games | Win Rate (Pct + Progress Bar + Trophy) | Last Active | Joined | Actions |
 */
export function UserTableRow({
  user,
  isSelf = false,
  onOpenStatusDialog,
  onViewHistory,
}) {
  if (!user) return null;

  const publicId = user.public_id || user.id;
  const username = user.username || "";
  const initial = username.charAt(0).toUpperCase() || "U";
  const totalGames = user.total_games ?? 0;
  const gamesWon = user.games_won ?? 0;
  const winRate = typeof user.win_rate === "number" ? Math.round(user.win_rate * 10) / 10 : 0;
  
  const rawLastActive = user.last_active_at || user.updated_at;
  const lastActiveRelative = formatRelativeTime(rawLastActive);
  const lastActiveExact = rawLastActive ? new Date(rawLastActive).toLocaleString() : "Never";
  
  const rawJoined = user.created_at;
  const joinedDateText = formatJoinedDate(rawJoined);
  const joinedDateExact = rawJoined ? new Date(rawJoined).toLocaleString() : "—";

  // Determine win rate bar color
  const getWinRateClass = (rate, games) => {
    if (games === 0) return "rate-empty";
    if (rate >= 50) return "rate-high";
    if (rate >= 25) return "rate-med";
    return "rate-low";
  };

  const winRateClass = getWinRateClass(winRate, totalGames);

  return (
    <tr className={`user-table-row ${!user.is_active ? "row-inactive" : ""}`}>
      {/* 1. User (Avatar + Monogram + Username) */}
      <td className="cell-user">
        <div className="user-profile-cell">
          <div className="user-avatar-circle" aria-hidden="true">
            {initial}
          </div>
          <div className="user-info-text">
            <Link
              to={`/admin/users/${publicId}`}
              className="user-name-link"
              title={`View ${username}'s profile & game history`}
            >
              <span>{username}</span>
            </Link>
            {isSelf && <span className="badge-self" title="Currently logged in administrator">You</span>}
          </div>
        </div>
      </td>

      {/* 2. Role (Purple for Admin, Blue/Slate for Player) */}
      <td className="cell-role">
        <span className={`user-role-label ${user.role === "ADMIN" ? "role-admin" : "role-player"}`}>
          {user.role === "ADMIN" ? (
            <>
              <Shield size={12} strokeWidth={2.4} />
              <span>Admin</span>
            </>
          ) : (
            <>
              <UserIcon size={12} strokeWidth={2.4} />
              <span>Player</span>
            </>
          )}
        </span>
      </td>

      {/* 3. Account Status (Small dot + label matching Word Management) */}
      <td className="cell-status">
        <UserStatusIndicator isActive={Boolean(user.is_active)} />
      </td>

      {/* 4. Games Played */}
      <td className="cell-games">
        <span className="num-tabular font-medium text-slate-800">
          {totalGames}
        </span>
      </td>

      {/* 5. Win Rate: Percentage + Thin Progress Bar + Trophy Wins (Dash for 0 completed games) */}
      <td className="cell-winrate">
        {totalGames === 0 ? (
          <div className="winrate-empty-state" title="No completed games yet">
            <span className="text-muted">—</span>
          </div>
        ) : (
          <div
            className="winrate-compact-cell"
            title={`${winRate.toFixed(1)}% win rate (${gamesWon} won out of ${totalGames} games)`}
          >
            <div className="winrate-compact-top">
              <span className={`winrate-pct-val num-tabular ${winRateClass}`}>
                {winRate.toFixed(1)}%
              </span>
              <span className="winrate-wins-badge num-tabular">
                <Trophy size={11} className="trophy-icon" aria-hidden="true" />
                <span>{gamesWon}</span>
              </span>
            </div>
            <div className="winrate-bar-track" aria-hidden="true">
              <div
                className={`winrate-bar-fill ${winRateClass}`}
                style={{ width: `${Math.min(100, Math.max(0, winRate))}%` }}
              />
            </div>
          </div>
        )}
      </td>

      {/* 6. Last Active (Relative timestamp with exact tooltip) */}
      <td className="cell-last-active">
        <span className="text-secondary small cursor-help" title={`Last active: ${lastActiveExact}`}>
          {lastActiveRelative}
        </span>
      </td>

      {/* 7. Joined Date */}
      <td className="cell-joined">
        <span className="text-secondary small cursor-help" title={`Account created: ${joinedDateExact}`}>
          {joinedDateText}
        </span>
      </td>

      {/* 8. Actions (Compact 3-Dot Menu) */}
      <td className="cell-actions">
        <UserActionsMenu
          user={user}
          isSelf={isSelf}
          onOpenStatusDialog={onOpenStatusDialog}
          onViewHistory={onViewHistory}
        />
      </td>
    </tr>
  );
}
