import React, { useState, useRef, useEffect } from "react";
import { Info, AlertTriangle, X } from "lucide-react";

/**
 * CluePopover:
 * Interactive clue preview component:
 * - Truncated single-line clue with Info icon
 * - Clicking the text or icon reveals the complete definition in a lightweight popover without navigating away
 * - Subtle warning indicator if no clue is set
 */
export function CluePopover({ clue, word, onOpenDrawer }) {
  const [isOpen, setIsOpen] = useState(false);
  const popoverRef = useRef(null);
  const triggerRef = useRef(null);

  const hasClue = Boolean(clue && clue.trim());

  useEffect(() => {
    function handleClickOutside(e) {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target) &&
        triggerRef.current &&
        !triggerRef.current.contains(e.target)
      ) {
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
    function handleKeyDown(e) {
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    }
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  if (!hasClue) {
    return (
      <div className="clue-cell-empty" title="No clue configured for this word">
        <AlertTriangle size={13} className="text-warning" aria-hidden="true" />
        <span className="clue-empty-text">No clue set</span>
      </div>
    );
  }

  return (
    <div className="clue-popover-container">
      <button
        ref={triggerRef}
        type="button"
        className={`clue-preview-trigger ${isOpen ? "popover-active" : ""}`}
        onClick={() => setIsOpen((prev) => !prev)}
        title="Click to view complete definition"
        aria-expanded={isOpen}
      >
        <Info size={14} className="clue-info-icon" aria-hidden="true" />
        <span className="clue-preview-text text-truncate">{clue}</span>
      </button>

      {isOpen && (
        <div ref={popoverRef} className="clue-popover-card" role="tooltip">
          <div className="clue-popover-header">
            <span className="clue-popover-word-title">{word} Definition</span>
            <button
              type="button"
              className="btn-clue-popover-close"
              onClick={() => setIsOpen(false)}
              aria-label="Close definition popup"
            >
              <X size={13} />
            </button>
          </div>
          <div className="clue-popover-body">
            <p className="clue-popover-text">{clue}</p>
          </div>
          {onOpenDrawer && (
            <div className="clue-popover-footer">
              <button
                type="button"
                className="btn-clue-view-drawer"
                onClick={() => {
                  setIsOpen(false);
                  onOpenDrawer();
                }}
              >
                View full word statistics &rarr;
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
