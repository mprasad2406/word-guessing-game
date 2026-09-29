import React, { useEffect } from "react";
import { Lightbulb, X } from "lucide-react";

/**
 * HintConfirmModal:
 * Confirmation dialog before consuming a hint.
 * Reassures the player of their remaining count and prevents accidental clicks.
 */
export function HintConfirmModal({
  isOpen,
  remainingHints = 1,
  onConfirm,
  onCancel,
  isLoading = false,
}) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen && !isLoading) {
        onCancel();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isLoading, onCancel]);

  if (!isOpen) return null;

  return (
    <div
      className="modal-backdrop-custom"
      role="presentation"
      onClick={() => !isLoading && onCancel()}
    >
      <div
        className="modal-card-custom"
        role="dialog"
        aria-modal="true"
        aria-labelledby="hint-modal-title"
        aria-describedby="hint-modal-desc"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header-custom">
          <div className="modal-icon-badge badge-amber">
            <Lightbulb size={24} strokeWidth={2.2} />
          </div>
          <button
            type="button"
            className="btn-modal-close"
            onClick={onCancel}
            disabled={isLoading}
            aria-label="Close dialog"
          >
            <X size={18} />
          </button>
        </div>

        <div className="modal-body-custom">
          <h2 id="hint-modal-title" className="modal-title-custom">
            Use a hint?
          </h2>
          <p id="hint-modal-desc" className="modal-desc-custom">
            You have <strong>{remainingHints}</strong> hint{remainingHints === 1 ? "" : "s"} remaining.
            Would you like to reveal a clue for this secret word?
          </p>
        </div>

        <div className="modal-footer-custom">
          <button
            type="button"
            className="btn-modal-cancel"
            onClick={onCancel}
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn-modal-confirm-amber"
            onClick={onConfirm}
            disabled={isLoading}
            autoFocus
          >
            {isLoading ? (
              <>
                <span className="submit-spinner" aria-hidden="true" />
                <span>Unlocking...</span>
              </>
            ) : (
              <>
                <Lightbulb size={16} />
                <span>Reveal Hint</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
