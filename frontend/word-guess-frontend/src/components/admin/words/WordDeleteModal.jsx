import React, { useState, useEffect } from "react";
import { AlertTriangle, Pause, Trash2, X, Lock } from "lucide-react";

/**
 * WordDeleteModal:
 * Confirmation dialog for word deactivation or permanent deletion with security key.
 */
export function WordDeleteModal({
  isOpen,
  onClose,
  onConfirm,
  word,
  isPermanent = false,
  isProcessing = false,
}) {
  const [securityKey, setSecurityKey] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen) {
      setSecurityKey("");
      setError("");
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen && !isProcessing) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isProcessing, onClose]);

  if (!isOpen || !word) return null;

  const wordText = (word.word || "").toUpperCase();

  const handleConfirm = async (e) => {
    e.preventDefault();
    setError("");

    if (isPermanent && !securityKey.trim()) {
      setError("Admin security key is required for permanent deletion.");
      return;
    }

    const success = await onConfirm(word.id, securityKey.trim());
    if (success) {
      setSecurityKey("");
      onClose();
    }
  };

  return (
    <div
      className="modal-backdrop-custom"
      role="presentation"
      onClick={() => !isProcessing && onClose()}
    >
      <div
        className="modal-card-custom"
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-modal-title"
        aria-describedby="delete-modal-desc"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header-custom">
          <div className={`modal-icon-badge ${isPermanent ? "badge-danger" : "badge-warning"}`}>
            {isPermanent ? <Trash2 size={22} /> : <Pause size={22} />}
          </div>
          <button
            type="button"
            className="btn-modal-close"
            onClick={onClose}
            disabled={isProcessing}
            aria-label="Close dialog"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleConfirm}>
          <div className="modal-body-custom">
            <h2 id="delete-modal-title" className="modal-title-custom">
              {isPermanent ? "Delete word?" : "Deactivate word?"}
            </h2>

            <div className="delete-target-preview">
              <span className="target-word-badge">{wordText}</span>
              <span className="target-meta">
                {word.word.length} letters · {word.difficulty}
              </span>
            </div>

            <p id="delete-modal-desc" className="modal-desc-custom">
              {isPermanent ? (
                <>
                  This action will permanently remove the word from the dictionary.
                  Existing player history records will be preserved.
                </>
              ) : (
                <>
                  Deactivating this word will make it unavailable for future gameplay sessions.
                  Existing match records remain unaffected, and you can re-activate it at any time.
                </>
              )}
            </p>

            {isPermanent && (
              <div className="security-key-field-group">
                <label htmlFor="admin-security-key-input" className="form-label-custom">
                  Admin Security Key <span className="text-danger">*</span>
                </label>
                <div className="security-input-box">
                  <Lock size={15} className="security-icon" />
                  <input
                    id="admin-security-key-input"
                    type="password"
                    className={`form-input-custom ${error ? "input-error" : ""}`}
                    placeholder="Enter security key to confirm"
                    value={securityKey}
                    onChange={(e) => {
                      setSecurityKey(e.target.value);
                      if (error) setError("");
                    }}
                    disabled={isProcessing}
                    autoComplete="off"
                    autoFocus
                    required
                  />
                </div>
              </div>
            )}

            {error && (
              <div className="form-error-banner" role="alert">
                <AlertTriangle size={14} className="flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}
          </div>

          <div className="modal-footer-custom">
            <button
              type="button"
              className="btn-modal-cancel"
              onClick={onClose}
              disabled={isProcessing}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={isPermanent ? "btn-modal-confirm-danger" : "btn-modal-confirm-warning"}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <span>Processing...</span>
              ) : isPermanent ? (
                <span>Delete Word</span>
              ) : (
                <span>Deactivate</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
