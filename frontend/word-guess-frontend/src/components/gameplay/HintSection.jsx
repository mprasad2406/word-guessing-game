import React, { useState } from "react";
import { Lightbulb, Info, Lock, CheckCircle2 } from "lucide-react";
import { HintConfirmModal } from "./HintConfirmModal";

/**
 * HintSection:
 * Compact supporting card displaying hint availability, unlocked clue content,
 * and opening the confirmation modal before consuming a hint.
 */
export function HintSection({
  revealedHint,
  hintsUsed = 0,
  maxHints = 1,
  hintsRemaining = 1,
  isGameActive = true,
  isRequestingHint = false,
  onRequestHint,
}) {
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const hasRevealedHint = Boolean(revealedHint);
  const canRequest = isGameActive && hintsRemaining > 0 && !hasRevealedHint;

  const handleOpenConfirm = () => {
    if (canRequest && !isRequestingHint) {
      setShowConfirmModal(true);
    }
  };

  const handleConfirmHint = async () => {
    setShowConfirmModal(false);
    await onRequestHint();
  };

  return (
    <>
      <section className="live-supporting-card hint-card" aria-label="Word Hint">
        <div className="supporting-card-header">
          <div className="supporting-card-title">
            <span className="supporting-icon-badge badge-amber">
              <Lightbulb size={16} />
            </span>
            <h3>Word Hint</h3>
          </div>
          <span className="supporting-badge">
            {hintsRemaining} of {maxHints} left
          </span>
        </div>

        <div className="supporting-card-body">
          {hasRevealedHint ? (
            <div className="hint-unlocked-banner" role="region" aria-label="Unlocked clue">
              <div className="hint-unlocked-header">
                <CheckCircle2 size={15} className="hint-success-icon" />
                <span className="hint-label-title">Unlocked Clue</span>
              </div>
              <p className="hint-text-content">{revealedHint}</p>
            </div>
          ) : (
            <div className="hint-locked-container">
              <p className="hint-prompt-text">
                Need a clue? Reveal a subtle definition or association for this word without losing attempts.
              </p>

              {canRequest ? (
                <button
                  type="button"
                  className="btn-request-hint"
                  onClick={handleOpenConfirm}
                  disabled={isRequestingHint || !isGameActive}
                  aria-label="Request a clue for this word"
                >
                  <Lightbulb size={16} />
                  <span>Request Hint</span>
                </button>
              ) : maxHints === 0 ? (
                <div className="hint-disabled-notice">
                  <Lock size={14} />
                  <span>Hints are disabled for this match.</span>
                </div>
              ) : hintsRemaining === 0 ? (
                <div className="hint-disabled-notice">
                  <Info size={14} />
                  <span>No hints remaining for this session.</span>
                </div>
              ) : null}
            </div>
          )}
        </div>
      </section>

      {/* Confirmation Dialog before consuming a limited hint */}
      <HintConfirmModal
        isOpen={showConfirmModal}
        remainingHints={hintsRemaining}
        onConfirm={handleConfirmHint}
        onCancel={() => setShowConfirmModal(false)}
        isLoading={isRequestingHint}
      />
    </>
  );
}
