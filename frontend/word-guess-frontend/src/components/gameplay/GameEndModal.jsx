import React from "react";
import { formatDuration } from "../../utils/dateUtils";

/**
 * GameEndModal renders a completion popup when the game is won or lost:
 * - Win: Congratulatory message
 * - Loss: "Better luck next time" message
 * - Expired: "Time Expired" message
 * - OK button to stop the game session UI and navigate to the lobby.
 */
export function GameEndModal({
  isOpen,
  status,
  finalWord,
  attemptsUsed,
  maxAttempts,
  durationSeconds,
  onOk,
  onPlayAgain,
  onViewHistory,
  isStartingNewGame = false,
}) {
  if (!isOpen) return null;

  const isWon = status === "WON";
  const isExpired = status === "EXPIRED";

  const getHeaderBg = () => {
    if (isWon) return "bg-success text-white";
    if (isExpired) return "bg-dark text-white";
    return "bg-danger text-white";
  };

  const getHeaderIcon = () => {
    if (isWon) return <i className="bi bi-trophy-fill display-3"></i>;
    if (isExpired) return <i className="bi bi-clock-history display-3 text-warning"></i>;
    return <i className="bi bi-emoji-frown-fill display-3"></i>;
  };

  const getHeaderTitle = () => {
    if (isWon) return "🎉 Congratulations!";
    if (isExpired) return "⏰ Time Expired!";
    return "Better luck next time!";
  };

  const getHeaderSubtitle = () => {
    if (isWon) return "You guessed the word correctly and won the game!";
    if (isExpired) return "The time limit has expired for this game session. Better luck next time!";
    return "You have used all attempts without solving the secret word.";
  };

  return (
    <div
      className="modal fade show d-block"
      tabIndex="-1"
      role="dialog"
      aria-modal="true"
      style={{ backgroundColor: "rgba(0, 0, 0, 0.65)", zIndex: 1060 }}
    >
      <div className="modal-dialog modal-dialog-centered" role="document">
        <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden text-center">
          {/* Header Banner */}
          <div className={`p-4 ${getHeaderBg()}`}>
            <div className="mb-2">{getHeaderIcon()}</div>
            <h3 className="fw-bold mb-1">{getHeaderTitle()}</h3>
            <p className="mb-0 small opacity-90">{getHeaderSubtitle()}</p>
          </div>

          {/* Modal Body */}
          <div className="modal-body p-4">
            {finalWord && (
              <div className="p-3 my-2 bg-light rounded-3 d-inline-block px-4 border">
                <div className="text-secondary small text-uppercase fw-semibold mb-1">
                  The Secret Word Was
                </div>
                <div className="display-6 font-monospace fw-bold text-dark text-uppercase letter-spacing-2">
                  {finalWord}
                </div>
              </div>
            )}

            <div className="d-flex justify-content-center gap-4 text-muted small mt-3">
              <div>
                <i className="bi bi-bullseye me-1"></i>
                Attempts: <strong>{attemptsUsed} / {maxAttempts}</strong>
              </div>
              {durationSeconds != null && (
                <div>
                  <i className="bi bi-clock me-1"></i>
                  Time: <strong>{formatDuration(durationSeconds)}</strong>
                </div>
              )}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="modal-footer border-0 justify-content-center gap-2 pb-4 pt-0">
            <button
              type="button"
              className="btn btn-primary px-4 py-2 fw-bold rounded-3 shadow-sm"
              onClick={onOk}
              autoFocus
            >
              <i className="bi bi-check-lg me-1"></i> OK
            </button>

            {onPlayAgain && (
              <button
                type="button"
                className="btn btn-outline-success px-3 py-2 fw-semibold rounded-3"
                onClick={onPlayAgain}
                disabled={isStartingNewGame}
              >
                {isStartingNewGame ? "Starting..." : "Play Again"}
              </button>
            )}

            {onViewHistory && (
              <button
                type="button"
                className="btn btn-outline-secondary px-3 py-2 fw-semibold rounded-3"
                onClick={onViewHistory}
              >
                History
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
