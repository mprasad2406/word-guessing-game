import React, { useState, useEffect } from "react";

/**
 * Confirmation modal for word deactivation or permanent deletion.
 * For permanent deletion, requires the admin security key.
 */
export function ConfirmDeleteModal({
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

  if (!isOpen || !word) return null;

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
      className="modal show d-block"
      tabIndex="-1"
      role="dialog"
      style={{ backgroundColor: "rgba(0, 0, 0, 0.5)" }}
    >
      <div className="modal-dialog modal-dialog-centered" role="document">
        <div className="modal-content shadow-lg border-0 rounded-4 overflow-hidden">
          <div className={`modal-header ${isPermanent ? "bg-danger" : "bg-warning"} text-white border-0 py-3`}>
            <h5 className="modal-title fw-semibold d-flex align-items-center gap-2">
              <i className={`bi ${isPermanent ? "bi-trash3-fill" : "bi-pause-circle-fill"}`}></i>
              <span>{isPermanent ? "Permanent Word Deletion" : "Deactivate Word"}</span>
            </h5>
            <button
              type="button"
              className="btn-close btn-close-white"
              aria-label="Close"
              onClick={onClose}
              disabled={isProcessing}
            ></button>
          </div>

          <form onSubmit={handleConfirm}>
            <div className="modal-body p-4">
              {error && (
                <div className="alert alert-danger small py-2 d-flex align-items-center gap-2 mb-3" role="alert">
                  <i className="bi bi-exclamation-circle-fill"></i>
                  <div>{error}</div>
                </div>
              )}

              <p className="mb-2">
                Are you sure you want to {isPermanent ? "permanently delete" : "deactivate"} the word:
              </p>
              <div className="p-3 bg-light rounded-3 text-center my-3 border">
                <span className="font-monospace fw-bold fs-4 text-uppercase text-danger">
                  {word.word}
                </span>
                <div className="small text-muted mt-1">
                  ID: #{word.id} &bull; Difficulty: {word.difficulty}
                </div>
              </div>

              {isPermanent ? (
                <div>
                  <div className="alert alert-danger-subtle small py-2 border border-danger-subtle mb-3">
                    <i className="bi bi-exclamation-triangle-fill text-danger me-1"></i>
                    <strong>Caution:</strong> This cannot be undone. Permanent deletion requires your Admin Security Key.
                  </div>

                  <div className="mb-3">
                    <label htmlFor="delete-security-key" className="form-label small fw-semibold text-secondary">
                      Admin Security Key <span className="text-danger">*</span>
                    </label>
                    <input
                      id="delete-security-key"
                      type="password"
                      className="form-control"
                      placeholder="Enter security key"
                      value={securityKey}
                      onChange={(e) => setSecurityKey(e.target.value)}
                      disabled={isProcessing}
                      autoComplete="off"
                      required
                    />
                  </div>
                </div>
              ) : (
                <p className="small text-muted mb-0">
                  Deactivating this word will prevent it from being chosen in new game sessions. Existing game history is preserved, and you can re-activate it at any time.
                </p>
              )}
            </div>

            <div className="modal-footer bg-light border-0 py-3 px-4">
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={onClose}
                disabled={isProcessing}
              >
                Cancel
              </button>
              <button
                type="submit"
                className={`btn ${isPermanent ? "btn-danger" : "btn-warning"} fw-semibold px-4 d-inline-flex align-items-center gap-2`}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <>
                    <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <i className={`bi ${isPermanent ? "bi-trash3" : "bi-pause-circle"}`}></i>
                    <span>{isPermanent ? "Delete Permanently" : "Deactivate Word"}</span>
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
