import React, { useEffect } from "react";
import { AlertTriangle, CheckCircle2, Slash, X } from "lucide-react";

/**
 * AccountActionDialog:
 * Confirmation dialog for blocking or unblocking user access.
 * Displays clear explanation of consequences and handles keyboard escape.
 */
export function AccountActionDialog({
  isOpen,
  onClose,
  onConfirm,
  user,
  isProcessing = false,
}) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen && !isProcessing) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isProcessing, onClose]);

  if (!isOpen || !user) return null;

  const isBlocking = Boolean(user.is_active);
  const username = user.username || "this user";

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (isProcessing) return;
    await onConfirm(user, !isBlocking);
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
        aria-labelledby="account-action-dialog-title"
        aria-describedby="account-action-dialog-desc"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header-custom">
          <div className={`modal-icon-badge ${isBlocking ? "badge-danger" : "badge-primary"}`}>
            {isBlocking ? <Slash size={20} /> : <CheckCircle2 size={20} />}
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

        <form onSubmit={handleFormSubmit}>
          <div className="modal-body-custom">
            <h2 id="account-action-dialog-title" className="modal-title-custom">
              {isBlocking ? "Block user access?" : "Unblock user access?"}
            </h2>

            <div className="delete-target-preview">
              <span className="target-word-badge">{username}</span>
              <span className="target-meta">Role: {user.role}</span>
            </div>

            <p id="account-action-dialog-desc" className="modal-desc-custom">
              {isBlocking ? (
                <>
                  Blocking <strong>{username}</strong> will immediately revoke their access.
                  They will not be able to log in or start new game sessions until unblocked.
                </>
              ) : (
                <>
                  Unblocking <strong>{username}</strong> will restore their account permissions
                  and allow them to log in and play matches normally.
                </>
              )}
            </p>
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
              className={isBlocking ? "btn-modal-confirm-danger" : "btn-modal-confirm-primary"}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <span>Processing...</span>
              ) : isBlocking ? (
                <span>Block User</span>
              ) : (
                <span>Unblock User</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
