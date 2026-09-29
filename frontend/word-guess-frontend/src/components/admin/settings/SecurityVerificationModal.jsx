import React, { useState } from "react";
import { Lock, Eye, EyeOff, X, ShieldCheck, Loader2 } from "lucide-react";

export function SecurityVerificationModal({
  isOpen,
  onClose,
  onConfirm,
  isSaving,
  errorMessage,
  modifiedFieldsList = [],
}) {
  const [key, setKey] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!key.trim()) return;
    onConfirm(key.trim());
  };

  const handleClose = () => {
    setKey("");
    setShowPassword(false);
    onClose();
  };

  return (
    <div className="settings-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="sec-modal-title">
      <div className="settings-modal-dialog">
        {/* Header */}
        <div className="settings-modal-header">
          <div className="d-flex align-items-center gap-2">
            <div className="settings-sec-icon-box">
              <Lock size={18} />
            </div>
            <div>
              <h4 id="sec-modal-title" className="settings-modal-title mb-0">
                Admin Authorization Required
              </h4>
              <p className="settings-modal-subtitle mb-0">
                Security verification for critical configuration updates
              </p>
            </div>
          </div>
          <button
            type="button"
            className="settings-modal-close-btn"
            onClick={handleClose}
            disabled={isSaving}
            aria-label="Close verification modal"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit}>
          <div className="settings-modal-body">
            <p className="small text-secondary mb-2">
              You are updating critical platform parameters. Enter your <strong>Admin Security Key</strong> to authorize and apply this configuration:
            </p>

            {modifiedFieldsList.length > 0 && (
              <div className="modified-fields-summary mb-3">
                <span className="modified-fields-title">Modified Parameters:</span>
                <div className="modified-fields-tags">
                  {modifiedFieldsList.map((item, i) => (
                    <span key={i} className="modified-field-tag">
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Error banner if key rejected */}
            {errorMessage && (
              <div className="alert-callout-error mb-3" role="alert">
                <span className="small">{errorMessage}</span>
              </div>
            )}

            {/* Security Key Input */}
            <div className="sec-input-group">
              <label htmlFor="admin-sec-key" className="settings-field-label">
                Admin Security Key <span className="text-danger">*</span>
              </label>
              <div className="sec-input-wrap">
                <input
                  id="admin-sec-key"
                  type={showPassword ? "text" : "password"}
                  className="sec-input"
                  placeholder="Enter security key"
                  value={key}
                  onChange={(e) => setKey(e.target.value)}
                  disabled={isSaving}
                  autoFocus
                  autoComplete="off"
                  required
                />
                <button
                  type="button"
                  className="sec-toggle-visibility-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide security key" : "Show security key"}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="settings-modal-footer">
            <button
              type="button"
              className="btn-settings-cancel"
              onClick={handleClose}
              disabled={isSaving}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-settings-primary"
              disabled={isSaving || !key.trim()}
            >
              {isSaving ? (
                <>
                  <Loader2 size={15} className="spin-icon" />
                  <span>Verifying & Saving...</span>
                </>
              ) : (
                <>
                  <ShieldCheck size={15} />
                  <span>Authorize & Save</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
