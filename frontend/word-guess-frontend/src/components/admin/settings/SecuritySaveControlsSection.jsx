import React from "react";
import { ShieldCheck, Check, RotateCcw, Loader2, AlertCircle, Save } from "lucide-react";

export function SecuritySaveControlsSection({
  hasChanges,
  isCriticalModified,
  onDiscard,
  onSave,
  isSaving,
  validationError,
  modifiedFieldsCount = 0,
}) {
  return (
    <div className="settings-card security-save-card">
      <div className="settings-card-header">
        <div className="d-flex align-items-center gap-2">
          <div className="settings-header-icon-box">
            <Save size={18} />
          </div>
          <div>
            <h3 className="settings-card-title mb-0">Security & Save Controls</h3>
            <p className="settings-card-subtitle mb-0">
              Review unsaved modifications, authenticate critical parameter updates, and persist settings
            </p>
          </div>
        </div>
      </div>

      <div className="settings-card-body">
        <div className="save-controls-content">
          <div className="save-controls-status-area">
            {hasChanges ? (
              <div className="d-flex flex-column gap-1">
                <div className="d-flex align-items-center gap-2">
                  <span className="unsaved-status-badge">
                    <span className="status-dot-pulse" />
                    <span>{modifiedFieldsCount} Unsaved Modification{modifiedFieldsCount !== 1 ? "s" : ""}</span>
                  </span>
                  {isCriticalModified && (
                    <span className="security-required-pill">
                      <ShieldCheck size={13} />
                      <span>Security Key Required on Save</span>
                    </span>
                  )}
                </div>
                <p className="save-status-hint mb-0">
                  {isCriticalModified
                    ? "Critical parameters were modified (attempts, hints, word lengths, timer, difficulty mode, scoring, daily limit, or game availability). Admin security key verification is required."
                    : "Player experience options were modified. Click 'Save Configuration' to immediately persist changes."}
                </p>
              </div>
            ) : (
              <div className="d-flex align-items-center gap-2">
                <span className="saved-status-badge">
                  <Check size={14} className="text-success" />
                  <span>All Configuration Settings Saved</span>
                </span>
                <span className="text-xs text-muted">
                  Current settings are live and active for all gameplay sessions.
                </span>
              </div>
            )}

            {validationError && (
              <div className="validation-error-banner mt-2">
                <AlertCircle size={15} />
                <span>{validationError}</span>
              </div>
            )}
          </div>

          <div className="save-controls-actions">
            <button
              type="button"
              className="btn btn-outline-secondary btn-sm discard-btn"
              onClick={onDiscard}
              disabled={!hasChanges || isSaving}
            >
              <RotateCcw size={14} />
              <span>Discard Changes</span>
            </button>

            <button
              type="button"
              className="btn btn-primary btn-sm save-main-btn"
              onClick={onSave}
              disabled={!hasChanges || isSaving || Boolean(validationError)}
            >
              {isSaving ? (
                <>
                  <Loader2 size={14} className="spin-icon" />
                  <span>Saving Changes...</span>
                </>
              ) : (
                <>
                  <Check size={14} />
                  <span>Save Configuration</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
