import React from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  Shield,
  User as UserIcon,
  Calendar,
  Clock,
  Ban,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { UserStatusIndicator } from "./UserStatusIndicator";
import { formatJoinedDate, formatRelativeTime } from "../../../utils/dateUtils";

export function UserProfileHeader({
  user,
  isSelf,
  onToggleStatus,
  isUpdatingStatus,
}) {
  if (!user) return null;

  const isBlocked = !user.is_active;

  return (
    <div className="user-profile-header-container">
      {/* Top navigation & action bar */}
      <div className="user-profile-top-bar">
        <div className="user-breadcrumb">
          <Link to="/admin/users" className="user-breadcrumb-link">
            <ArrowLeft size={14} />
            <span>Users</span>
          </Link>
          <span className="user-breadcrumb-separator">/</span>
          <span className="user-breadcrumb-current">{user.username}</span>
        </div>

        <div className="user-profile-actions">
          <Link to="/admin/users" className="btn-user-secondary btn-sm">
            <ArrowLeft size={15} />
            <span>Back to Users</span>
          </Link>
          {!isSelf && (
            <button
              type="button"
              className={isBlocked ? "btn-user-success btn-sm" : "btn-user-danger btn-sm"}
              onClick={onToggleStatus}
              disabled={isUpdatingStatus}
            >
              {isUpdatingStatus ? (
                <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" />
              ) : isBlocked ? (
                <CheckCircle2 size={15} />
              ) : (
                <Ban size={15} />
              )}
              <span>{isBlocked ? "Unblock Account" : "Block Account"}</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Profile Info Card */}
      <div className="user-profile-hero-card">
        <div className="user-profile-hero-left">
          <div className="user-profile-avatar">
            {user.username ? user.username.charAt(0).toUpperCase() : "U"}
          </div>
          <div className="user-profile-meta">
            <div className="user-profile-title-row">
              <h1 className="user-profile-username">{user.username}</h1>
              <span className={`user-role-badge ${user.role === "ADMIN" ? "badge-admin" : "badge-player"}`}>
                {user.role === "ADMIN" ? <Shield size={12} /> : <UserIcon size={12} />}
                <span>{user.role}</span>
              </span>
              <UserStatusIndicator isActive={user.is_active} />
              {isSelf && <span className="user-badge-self">Current Session</span>}
            </div>

            <div className="user-profile-subtext-row">
              <span className="user-subtext-item">
                <Calendar size={13} />
                <span>Joined {formatJoinedDate(user.created_at)}</span>
              </span>
              <span className="user-subtext-bullet">&bull;</span>
              <span className="user-subtext-item">
                <Clock size={13} />
                <span>Last active {formatRelativeTime(user.last_active_at || user.created_at)}</span>
              </span>
            </div>
          </div>
        </div>

        {isBlocked && (
          <div className="user-blocked-alert">
            <AlertTriangle size={18} className="user-blocked-alert-icon" />
            <div className="user-blocked-alert-text">
              <strong>Account Blocked</strong>
              <span>This user is restricted from signing in and participating in matches.</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
