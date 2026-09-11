import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { securityService } from "../../services/securityService";

/**
 * Modal to configure or rotate the Admin Security Key.
 */
export function SecurityKeyModal({ isOpen, onClose, isInitialized, onKeyUpdated }) {
  const [currentKey, setCurrentKey] = useState("");
  const [newKey, setNewKey] = useState("");
  const [confirmKey, setConfirmKey] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen) {
      setCurrentKey("");
      setNewKey("");
      setConfirmKey("");
      setError("");
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (isInitialized && !currentKey) {
      setError("Please enter your current security key.");
      return;
    }

    if (!newKey || newKey.length < 8) {
      setError("New security key must be at least 8 characters long.");
      return;
    }

    if (newKey !== confirmKey) {
      setError("New security keys do not match.");
      return;
    }

    setIsSaving(true);
    try {
      await securityService.setSecurityKey({
        currentSecurityKey: isInitialized ? currentKey : undefined,
        newSecurityKey: newKey,
      });
      toast.success(
        isInitialized
          ? "Admin security key rotated successfully!"
          : "Admin security key initialized successfully!"
      );
      if (onKeyUpdated) onKeyUpdated();
      onClose();
    } catch (err) {
      const errMsg = err?.message || "Failed to update security key.";
      setError(errMsg);
      toast.error(errMsg);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      className="modal show d-block"
      tabIndex="-1"
      role="dialog"
      style={{ backgroundColor: "rgba(0, 0, 0, 0.5)" }}
    >
      <div className="modal-dialog modal-dialog-centered" role="document">
        <div className="modal-content shadow-lg border-0 rounded-4 overflow-hidden">
          <div className="modal-header bg-dark text-white border-0 py-3">
            <h5 className="modal-title fw-semibold d-flex align-items-center gap-2">
              <i className="bi bi-shield-lock-fill text-warning"></i>
              <span>{isInitialized ? "Rotate Security Key" : "Set Admin Security Key"}</span>
            </h5>
            <button
              type="button"
              className="btn-close btn-close-white"
              aria-label="Close"
              onClick={onClose}
              disabled={isSaving}
            ></button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="modal-body p-4">
              {error && (
                <div className="alert alert-danger small py-2 d-flex align-items-center gap-2 mb-3" role="alert">
                  <i className="bi bi-exclamation-circle-fill"></i>
                  <div>{error}</div>
                </div>
              )}

              <p className="small text-muted mb-3">
                The security key is an Argon2id-protected passphrase required to execute critical administrative operations (such as permanently deleting words or modifying core gameplay policies).
              </p>

              {isInitialized && (
                <div className="mb-3">
                  <label htmlFor="current-sec-key" className="form-label small fw-semibold text-secondary">
                    Current Security Key <span className="text-danger">*</span>
                  </label>
                  <input
                    id="current-sec-key"
                    type="password"
                    className="form-control"
                    placeholder="Enter current security key"
                    value={currentKey}
                    onChange={(e) => setCurrentKey(e.target.value)}
                    disabled={isSaving}
                    autoComplete="off"
                    required
                  />
                </div>
              )}

              <div className="mb-3">
                <label htmlFor="new-sec-key" className="form-label small fw-semibold text-secondary">
                  New Security Key (min 8 characters) <span className="text-danger">*</span>
                </label>
                <input
                  id="new-sec-key"
                  type="password"
                  className="form-control"
                  placeholder="Enter new security key"
                  value={newKey}
                  onChange={(e) => setNewKey(e.target.value)}
                  disabled={isSaving}
                  autoComplete="new-password"
                  minLength={8}
                  required
                />
              </div>

              <div className="mb-3">
                <label htmlFor="confirm-sec-key" className="form-label small fw-semibold text-secondary">
                  Confirm New Security Key <span className="text-danger">*</span>
                </label>
                <input
                  id="confirm-sec-key"
                  type="password"
                  className="form-control"
                  placeholder="Repeat new security key"
                  value={confirmKey}
                  onChange={(e) => setConfirmKey(e.target.value)}
                  disabled={isSaving}
                  autoComplete="new-password"
                  minLength={8}
                  required
                />
              </div>
            </div>

            <div className="modal-footer bg-light border-0 py-3 px-4">
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={onClose}
                disabled={isSaving}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-dark fw-semibold px-4 d-inline-flex align-items-center gap-2"
                disabled={isSaving}
              >
                {isSaving ? (
                  <>
                    <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <i className="bi bi-shield-check"></i>
                    <span>{isInitialized ? "Update Key" : "Set Key"}</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
