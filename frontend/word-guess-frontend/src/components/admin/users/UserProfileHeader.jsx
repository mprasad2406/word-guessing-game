import React, { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import {
  ArrowLeft,
  Shield,
  User as UserIcon,
  Calendar,
  Clock,
  MoreHorizontal,
  Slash,
  CheckCircle2,
  Copy,
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
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const buttonRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("touchstart", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [menuOpen]);

  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === "Escape" && menuOpen) {
        setMenuOpen(false);
        buttonRef.current?.focus();
      }
    }
    if (menuOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [menuOpen]);

  if (!user) return null;

  const isBlocked = !user.is_active;
  const publicId = user.public_id || user.id;

  const handleCopyId = () => {
    setMenuOpen(false);
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(String(publicId));
      toast.success("User ID copied to clipboard!");
    }
  };

  const handleActionClick = () => {
    setMenuOpen(false);
    if (onToggleStatus) {
      onToggleStatus();
    }
  };

  return (
    <div className="user-profile-header-container">
      {/* Top navigation bar */}
      <div className="user-profile-top-bar">
        <div className="user-breadcrumb">
          <Link to="/admin/users" className="user-breadcrumb-link">
            Users
          </Link>
          <span className="user-breadcrumb-separator">/</span>
          <span className="user-breadcrumb-current">{user.username}</span>
        </div>

        <div className="user-profile-actions">
          <Link to="/admin/users" className="btn-user-secondary btn-sm" aria-label="Back to Users list">
            <ArrowLeft size={15} />
            <span>Back to Users</span>
          </Link>

          {/* Secondary Actions Overflow Menu */}
          <div className="user-action-menu-container" ref={menuRef}>
            <button
              ref={buttonRef}
              type="button"
              className={`btn-action-menu-trigger ${menuOpen ? "menu-open" : ""}`}
              onClick={() => setMenuOpen((prev) => !prev)}
              aria-haspopup="true"
              aria-expanded={menuOpen}
              aria-label={`Actions for user ${user.username}`}
              title="More user actions"
            >
              <MoreHorizontal size={18} />
            </button>

            {menuOpen && (
              <div
                className="user-action-dropdown dropdown-downward"
                role="menu"
                aria-orientation="vertical"
              >
                <button
                  type="button"
                  className="action-dropdown-item"
                  role="menuitem"
                  onClick={handleCopyId}
                >
                  <Copy size={14} className="item-icon" />
                  <span>Copy User ID</span>
                </button>

                {!isSelf && <div className="dropdown-divider" role="separator" />}

                {!isSelf && (
                  <button
                    type="button"
                    className={`action-dropdown-item ${isBlocked ? "item-success" : "item-danger"}`}
                    role="menuitem"
                    onClick={handleActionClick}
                    disabled={isUpdatingStatus}
                  >
                    {isBlocked ? (
                      <>
                        <CheckCircle2 size={14} className="item-icon icon-success" />
                        <span>Unblock Account</span>
                      </>
                    ) : (
                      <>
                        <Slash size={14} className="item-icon icon-danger" />
                        <span>Block Account</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Profile Info Card */}
      <div className="user-profile-hero-card">
        <div className="user-profile-hero-left">
          <div className="user-profile-avatar" aria-hidden="true">
            {user.username ? user.username.charAt(0).toUpperCase() : "U"}
          </div>

          <div className="user-profile-meta">
            <div className="user-profile-title-row">
              <h1 className="user-profile-username">{user.username}</h1>

              <span
                className={`user-role-badge ${
                  user.role === "ADMIN" ? "badge-admin" : "badge-player"
                }`}
              >
                {user.role === "ADMIN" ? <Shield size={12} /> : <UserIcon size={12} />}
                <span>{user.role}</span>
              </span>

              <UserStatusIndicator isActive={user.is_active} />

              {isSelf && <span className="user-badge-self">Current Session</span>}
            </div>

            <div className="user-profile-subtext-row">
              <span className="user-subtext-item" title={user.created_at ? new Date(user.created_at).toLocaleString() : ""}>
                <Calendar size={13} />
                <span>Joined {formatJoinedDate(user.created_at)}</span>
              </span>
              <span className="user-subtext-bullet" aria-hidden="true">&bull;</span>
              <span
                className="user-subtext-item"
                title={user.last_active_at || user.created_at ? new Date(user.last_active_at || user.created_at).toLocaleString() : ""}
              >
                <Clock size={13} />
                <span>Last active {formatRelativeTime(user.last_active_at || user.created_at)}</span>
              </span>
            </div>
          </div>
        </div>

        {isBlocked && (
          <div className="user-blocked-alert" role="alert">
            <AlertTriangle size={18} className="user-blocked-alert-icon" />
            <div className="user-blocked-alert-text">
              <strong>Account Blocked</strong>
              <span>This user is currently restricted from signing in and playing matches.</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
