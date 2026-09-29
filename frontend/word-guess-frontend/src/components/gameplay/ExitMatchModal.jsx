import React, { useEffect } from "react";
import { LogOut, X, ShieldCheck } from "lucide-react";

/**
 * ExitMatchModal:
 * Confirmation dialog when clicking Exit Game.
 * Reassures the player that the game session is automatically saved and resumable.
 */
export function ExitMatchModal({
  isOpen,
  onConfirm,
  onCancel,
}) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen) {
        onCancel();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  return (
    <div
      className="modal-backdrop-custom"
      role="presentation"
      onClick={onCancel}
    >
      <div
        className="modal-card-custom"
        role="dialog"
        aria-modal="true"
        aria-labelledby="exit-modal-title"
        aria-describedby="exit-modal-desc"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header-custom">
          <div className="modal-icon-badge badge-neutral">
            <LogOut size={22} strokeWidth={2.2} />
          </div>
          <button
            type="button"
            className="btn-modal-close"
            onClick={onCancel}
            aria-label="Close dialog"
          >
            <X size={18} />
          </button>
        </div>

        <div className="modal-body-custom">
          <h2 id="exit-modal-title" className="modal-title-custom">
            Leave this match?
          </h2>
          <p id="exit-modal-desc" className="modal-desc-custom">
            Your match progress is automatically saved on the server. You can resume this session anytime from the Lobby or Game History.
          </p>

          <div className="modal-reassurance-box">
            <ShieldCheck size={16} className="reassurance-icon" />
            <span>Active timer (if any) and guesses are securely preserved.</span>
          </div>
        </div>

        <div className="modal-footer-custom">
          <button
            type="button"
            className="btn-modal-cancel"
            onClick={onCancel}
          >
            Stay in Game
          </button>
          <button
            type="button"
            className="btn-modal-confirm-neutral"
            onClick={onConfirm}
            autoFocus
          >
            Exit to Lobby
          </button>
        </div>
      </div>
    </div>
  );
}
