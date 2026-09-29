import React, { useState, useRef, useEffect } from "react";
import { MoreHorizontal, User, History, Slash, CheckCircle2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

/**
 * UserActionsMenu:
 * Accessible 3-dot dropdown menu for User table rows:
 * - View Profile (/admin/users/:publicId)
 * - View Game History
 * - Block / Unblock User (with confirmation dialog)
 * Prevents admins from blocking their own account.
 */
export function UserActionsMenu({
  user,
  isSelf = false,
  onOpenStatusDialog,
  onViewHistory,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [openUpward, setOpenUpward] = useState(false);
  const menuRef = useRef(null);
  const buttonRef = useRef(null);
  const navigate = useNavigate();

  const publicId = user?.public_id || user?.id;
  const username = user?.username || "";
  const isActive = Boolean(user?.is_active);

  const handleToggle = () => {
    if (!isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      setOpenUpward(spaceBelow < 180);
    }
    setIsOpen((prev) => !prev);
  };

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("touchstart", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [isOpen]);

  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === "Escape" && isOpen) {
        setIsOpen(false);
        buttonRef.current?.focus();
      }
    }
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const handleViewProfile = () => {
    setIsOpen(false);
    navigate(`/admin/users/${publicId}`);
  };

  const handleViewHistory = () => {
    setIsOpen(false);
    if (onViewHistory) {
      onViewHistory(user);
    } else {
      navigate(`/admin/users/${publicId}#history`);
    }
  };

  const handleToggleBlock = () => {
    setIsOpen(false);
    if (!isSelf && onOpenStatusDialog) {
      onOpenStatusDialog(user);
    }
  };

  return (
    <div className="user-action-menu-container" ref={menuRef}>
      <button
        ref={buttonRef}
        type="button"
        className={`btn-action-menu-trigger ${isOpen ? "menu-open" : ""}`}
        onClick={handleToggle}
        aria-haspopup="true"
        aria-expanded={isOpen}
        aria-label={`Actions for user ${username}`}
        title={`Actions for user "${username}"`}
      >
        <MoreHorizontal size={18} />
      </button>

      {isOpen && (
        <div
          className={`user-action-dropdown ${openUpward ? "dropdown-upward" : "dropdown-downward"}`}
          role="menu"
          aria-orientation="vertical"
        >
          {/* 1. View Profile */}
          <button
            type="button"
            className="action-dropdown-item"
            role="menuitem"
            onClick={handleViewProfile}
          >
            <User size={14} className="item-icon" />
            <span>View Profile</span>
          </button>

          {/* 2. View Game History */}
          <button
            type="button"
            className="action-dropdown-item"
            role="menuitem"
            onClick={handleViewHistory}
          >
            <History size={14} className="item-icon" />
            <span>Game History</span>
          </button>

          {!isSelf && <div className="dropdown-divider" role="separator" />}

          {/* 3. Block / Unblock */}
          {!isSelf && (
            <button
              type="button"
              className={`action-dropdown-item ${isActive ? "item-danger" : "item-success"}`}
              role="menuitem"
              onClick={handleToggleBlock}
            >
              {isActive ? (
                <>
                  <Slash size={14} className="item-icon icon-danger" />
                  <span>Block User</span>
                </>
              ) : (
                <>
                  <CheckCircle2 size={14} className="item-icon icon-success" />
                  <span>Unblock User</span>
                </>
              )}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
