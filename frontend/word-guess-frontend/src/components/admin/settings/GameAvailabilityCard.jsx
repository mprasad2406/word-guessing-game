import React, { useState } from "react";
import { Power, CheckCircle, AlertTriangle, X, ShieldAlert } from "lucide-react";

export function GameAvailabilityCard({ isEnabled, onChange, isSaving }) {
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const handleToggleClick = (e) => {
    // If currently enabled, opening confirmation modal before disabling
    if (isEnabled) {
      e.preventDefault();
      setShowConfirmModal(true);
    } else {
      onChange(true);
    }
  };

  const handleConfirmDisable = () => {
    setShowConfirmModal(false);
    onChange(false);
  };

  return (
    <>
      <div className="settings-card availability-card">
        <div className="availability-card-left">
          <div className={`availability-icon-box ${isEnabled ? "icon-box-active" : "icon-box-disabled"}`}>
            <Power size={20} />
          </div>
          <div className="availability-meta">
            <div className="d-flex align-items-center gap-2">
              <h3 className="settings-card-title mb-0">Game Availability</h3>
              <span className={`status-pill ${isEnabled ? "pill-enabled" : "pill-disabled"}`}>
                <span className="status-dot" />
                <span>{isEnabled ? "Enabled" : "Disabled"}</span>
              </span>
            </div>
            <p className="settings-card-subtitle mb-0">
              {isEnabled
                ? "Global gameplay is active. Players can start new matches and submit guesses."
                : "New game creation is currently paused across the platform."}
            </p>
          </div>
        </div>

        <div className="availability-card-right">
          <label className="switch-control" title={isEnabled ? "Click to disable game availability" : "Click to enable game availability"}>
            <input
              type="checkbox"
              checked={isEnabled}
              onChange={handleToggleClick}
              disabled={isSaving}
              aria-label="Toggle game availability"
            />
            <span className="switch-slider" />
          </label>
        </div>
      </div>

      {/* Confirmation Dialog when Disabling */}
      {showConfirmModal && (
        <div className="settings-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="disable-modal-title">
          <div className="settings-modal-dialog">
            <div className="settings-modal-header">
              <div className="d-flex align-items-center gap-2 text-warning">
                <ShieldAlert size={20} />
                <h4 id="disable-modal-title" className="settings-modal-title mb-0">
                  Pause Game Availability?
                </h4>
              </div>
              <button
                type="button"
                className="settings-modal-close-btn"
                onClick={() => setShowConfirmModal(false)}
                aria-label="Close dialog"
              >
                <X size={16} />
              </button>
            </div>

            <div className="settings-modal-body">
              <p className="mb-2 text-dark">
                Disabling game availability will immediately prevent players from starting new game sessions.
              </p>
              <div className="alert-callout-info">
                <p className="small mb-0 text-muted">
                  <strong>Note:</strong> In-progress matches will not be abruptly aborted, allowing active players to complete their current game session.
                </p>
              </div>
            </div>

            <div className="settings-modal-footer">
              <button
                type="button"
                className="btn-settings-cancel"
                onClick={() => setShowConfirmModal(false)}
              >
                Keep Enabled
              </button>
              <button
                type="button"
                className="btn-settings-danger"
                onClick={handleConfirmDisable}
              >
                Disable Game Availability
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
