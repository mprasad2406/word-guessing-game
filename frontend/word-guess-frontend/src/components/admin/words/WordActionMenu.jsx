import React, { useState, useRef, useEffect } from "react";
import { MoreHorizontal, Pencil, FileText, Pause, Play, Trash2 } from "lucide-react";

/**
 * WordActionMenu:
 * Accessible 3-dot action dropdown menu for each table row.
 * Includes: Edit Word, View Details, Activate / Deactivate, Delete Word.
 */
export function WordActionMenu({
  word,
  onEdit,
  onViewDetails,
  onToggleActive,
  onDelete,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [openUpward, setOpenUpward] = useState(false);
  const menuRef = useRef(null);
  const buttonRef = useRef(null);

  const isActive = Boolean(word?.is_active);
  const wordText = (word?.word || "").toUpperCase();

  const handleToggle = () => {
    if (!isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      setOpenUpward(spaceBelow < 180);
    }
    setIsOpen((prev) => !prev);
  };

  // Close when clicking outside
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

  // Handle escape key
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

  const handleAction = (callback) => {
    setIsOpen(false);
    if (callback) callback(word);
  };

  return (
    <div className="word-action-menu-container" ref={menuRef}>
      <button
        ref={buttonRef}
        type="button"
        className={`btn-action-menu-trigger ${isOpen ? "menu-open" : ""}`}
        onClick={handleToggle}
        aria-haspopup="true"
        aria-expanded={isOpen}
        aria-label={`Actions for word ${wordText}`}
        title={`Actions for word "${wordText}"`}
      >
        <MoreHorizontal size={18} />
      </button>

      {isOpen && (
        <div
          className={`word-action-dropdown ${openUpward ? "dropdown-upward" : "dropdown-downward"}`}
          role="menu"
          aria-orientation="vertical"
        >
          {/* 1. View Details */}
          {onViewDetails && (
            <button
              type="button"
              className="action-dropdown-item item-view"
              role="menuitem"
              onClick={() => handleAction(onViewDetails)}
            >
              <FileText size={14} className="item-icon icon-primary" />
              <span>View Details</span>
            </button>
          )}

          {/* 2. Edit Word */}
          <button
            type="button"
            className="action-dropdown-item item-edit"
            role="menuitem"
            onClick={() => handleAction(onEdit)}
          >
            <Pencil size={14} className="item-icon" />
            <span>Edit Word</span>
          </button>

          {/* 3. Activate / Deactivate */}
          <button
            type="button"
            className={`action-dropdown-item ${isActive ? "item-deactivate" : "item-activate"}`}
            role="menuitem"
            onClick={() => handleAction(onToggleActive)}
          >
            {isActive ? (
              <>
                <Pause size={14} className="item-icon icon-warning" />
                <span>Deactivate</span>
              </>
            ) : (
              <>
                <Play size={14} className="item-icon icon-success" />
                <span>Activate</span>
              </>
            )}
          </button>

          <div className="dropdown-divider" role="separator" />

          {/* 4. Delete Word */}
          <button
            type="button"
            className="action-dropdown-item item-delete"
            role="menuitem"
            onClick={() => handleAction(onDelete)}
          >
            <Trash2 size={14} className="item-icon icon-danger" />
            <span>Delete Word</span>
          </button>
        </div>
      )}
    </div>
  );
}
