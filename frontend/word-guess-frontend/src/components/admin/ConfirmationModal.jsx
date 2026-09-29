import React, { useEffect } from "react";
import { AlertTriangle, X, Info } from "lucide-react";

/**
 * ConfirmationModal:
 * Reusable modal for consequential administrative operations (blocking users, deleting items, etc.).
 */
export function ConfirmationModal({
  isOpen,
  title = "Confirm Action",
  description = "Are you sure you want to proceed with this operation?",
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "danger", // "danger" | "warning" | "primary"
  icon: CustomIcon,
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
        aria-labelledby="confirm-modal-title"
        aria-describedby="confirm-modal-desc"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header-custom">
          <div className={`modal-icon-badge badge-${variant}`}>
            {CustomIcon ? (
              <CustomIcon size={22} strokeWidth={2.2} />
            ) : variant === "danger" || variant === "warning" ? (
              <AlertTriangle size={22} strokeWidth={2.2} />
            ) : (
              <Info size={22} strokeWidth={2.2} />
            )}
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
          <h2 id="confirm-modal-title" className="modal-title-custom">
            {title}
          </h2>
          <p id="confirm-modal-desc" className="modal-desc-custom">
            {description}
          </p>
        </div>

        <div className="modal-footer-custom">
          <button
            type="button"
            className="btn-modal-cancel"
            onClick={onCancel}
            disabled={isLoading}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            className={`btn-modal-confirm-${variant}`}
            onClick={onConfirm}
            disabled={isLoading}
            autoFocus
          >
            {isLoading ? (
              <span>Processing...</span>
            ) : (
              <span>{confirmLabel}</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
