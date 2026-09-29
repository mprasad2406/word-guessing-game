import React from "react";
import { Check, RotateCcw, ShieldCheck, Loader2, AlertCircle } from "lucide-react";

export function SettingsStickyBar({
  hasChanges,
  isCriticalModified,
  onDiscard,
  onSave,
  isSaving,
  validationError,
}) {
  if (!hasChanges) return null;

  return (
    <div className="settings-sticky-bar-wrap" role="region" aria-label="Unsaved settings actions">
      <div className="settings-sticky-bar">
        {/* Left Indicator */}
        <div className="sticky-bar-left">
          <div className="d-flex align-items-center gap-2">
            <span className="sticky-unsaved-dot" />
            <span className="sticky-unsaved-text">Unsaved Changes</span>
          </div>

          {isCriticalModified && (
            <span className="sticky-verification-badge">
              <ShieldCheck size={13} />
              <span>Security key required on save</span>
            </span>
          )}

          {validationError && (
            <span className="sticky-error-badge" title={validationError}>
              <AlertCircle size={13} />
              <span>{validationError}</span>
            </span>
          )}
        </div>

        {/* Right Actions */}
        <div className="sticky-bar-right">
          <button
            type="button"
            className="btn-sticky-discard"
            onClick={onDiscard}
            disabled={isSaving}
          >
            <RotateCcw size={14} />
            <span>Discard Changes</span>
          </button>

          <button
            type="button"
            className="btn-sticky-save"
            onClick={onSave}
            disabled={isSaving || Boolean(validationError)}
          >
            {isSaving ? (
              <>
                <Loader2 size={14} className="spin-icon" />
                <span>Saving...</span>
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
  );
}
