import React from "react";

/**
 * Renders the hint section for active gameplay:
 * - Revealed hint text (if unlocked)
 * - Request Hint button with quota status and loading state
 * - Exhausted hint feedback
 */
export function HintPanel({
  revealedHint,
  hintsUsed,
  maxHints,
  hintsRemaining,
  isGameActive,
  isRequestingHint,
  onRequestHint,
}) {
  const hasRevealedHint = Boolean(revealedHint);
  const canRequestHint = isGameActive && hintsRemaining > 0 && !hasRevealedHint;

  return (
    <div className="card shadow-sm border-0 rounded-3 mb-4">
      <div className="card-body p-4">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h5 className="mb-0 fw-semibold d-flex align-items-center gap-2">
            <i className="bi bi-lightbulb text-warning"></i>
            <span>Word Hint</span>
          </h5>
          <span className="badge bg-light text-dark border">
            {hintsRemaining} hint{hintsRemaining === 1 ? "" : "s"} left
          </span>
        </div>

        {/* Revealed Hint Box */}
        {hasRevealedHint ? (
          <div className="alert alert-warning mb-0 border-0 d-flex align-items-start gap-3 rounded-3">
            <i className="bi bi-info-circle-fill text-warning fs-5 mt-1"></i>
            <div>
              <div className="fw-semibold small text-uppercase text-secondary mb-1">Revealed Clue</div>
              <div className="text-dark fs-6">{revealedHint}</div>
            </div>
          </div>
        ) : (
          <div className="text-center py-3 bg-light rounded-3">
            <p className="text-muted small mb-3">
              Need a clue? You can unlock a hint for this secret word.
            </p>
            {canRequestHint ? (
              <button
                type="button"
                className="btn btn-outline-warning text-dark fw-semibold px-4 d-inline-flex align-items-center gap-2"
                onClick={onRequestHint}
                disabled={isRequestingHint || !isGameActive}
              >
                {isRequestingHint ? (
                  <>
                    <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                    <span>Retrieving hint...</span>
                  </>
                ) : (
                  <>
                    <i className="bi bi-lightbulb-fill text-warning"></i>
                    <span>Request Hint</span>
                  </>
                )}
              </button>
            ) : maxHints === 0 ? (
              <span className="text-muted small">
                <i className="bi bi-slash-circle me-1"></i>
                Hints are disabled for this game session.
              </span>
            ) : hintsRemaining === 0 ? (
              <span className="text-muted small">
                <i className="bi bi-x-circle me-1"></i>
                Maximum hints reached for this session.
              </span>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
