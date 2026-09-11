import React from "react";
import { formatDuration } from "../../utils/dateUtils";

/**
 * Renders the terminal game completion outcome:
 * - Won / Lost / Expired celebration or consolation banner
 * - Revealed final word
 * - Attempts and hints summary
 * - Play Again (create new game) and View History actions
 */
export function GameCompletionCard({
  status,
  finalWord,
  attemptsUsed,
  maxAttempts,
  hintsUsed,
  durationSeconds,
  onPlayAgain,
  onViewHistory,
  isStartingNewGame,
}) {
  const isWon = status === "WON";
  const isLost = status === "LOST";
  const isExpired = status === "EXPIRED";

  return (
    <div
      className={`card shadow-sm border-0 rounded-4 mb-4 text-center overflow-hidden ${
        isWon ? "border-success" : isLost ? "border-danger" : "border-secondary"
      }`}
    >
      <div
        className={`p-4 ${
          isWon
            ? "bg-success bg-opacity-10 text-success"
            : isLost
            ? "bg-danger bg-opacity-10 text-danger"
            : "bg-secondary bg-opacity-10 text-secondary"
        }`}
      >
        <div className="mb-2">
          {isWon && <i className="bi bi-trophy-fill display-3 text-success"></i>}
          {isLost && <i className="bi bi-emoji-frown-fill display-3 text-danger"></i>}
          {isExpired && <i className="bi bi-clock-history display-3 text-secondary"></i>}
        </div>
        <h3 className="fw-bold mb-1">
          {isWon && "Victory! You Guessed the Word!"}
          {isLost && "Game Over — Attempts Exhausted"}
          {isExpired && "Time Expired!"}
        </h3>
        <p className="text-muted small mb-0">
          {isWon && "Outstanding job! You cracked the word before running out of attempts."}
          {isLost && "Better luck next time! The secret word was hidden well."}
          {isExpired && "The allowed time for this game session has run out."}
        </p>
      </div>

      <div className="card-body p-4">
        {/* Revealed Secret Word */}
        {finalWord && (
          <div className="p-3 my-2 bg-light rounded-3 d-inline-block px-5 border">
            <div className="text-secondary small text-uppercase tracking-wider fw-semibold mb-1">
              The Secret Word Was
            </div>
            <div className="display-6 font-monospace fw-bold text-dark text-uppercase letter-spacing-2">
              {finalWord}
            </div>
          </div>
        )}

        {/* Stats Summary */}
        <div className="d-flex justify-content-center gap-4 my-3 text-muted small">
          <div>
            <i className="bi bi-check2-circle me-1"></i>
            Attempts Used: <strong>{attemptsUsed} / {maxAttempts}</strong>
          </div>
          <div>
            <i className="bi bi-lightbulb me-1"></i>
            Hints Used: <strong>{hintsUsed}</strong>
          </div>
          {durationSeconds != null && (
            <div>
              <i className="bi bi-clock me-1"></i>
              Time Taken: <strong>{formatDuration(durationSeconds)}</strong>
            </div>
          )}
        </div>

        {/* Action CTAs */}
        <div className="d-flex flex-wrap justify-content-center gap-3 mt-4">
          <button
            type="button"
            className="btn btn-primary px-4 py-2 fw-semibold d-inline-flex align-items-center gap-2 rounded-3 shadow-sm"
            onClick={onPlayAgain}
            disabled={isStartingNewGame}
          >
            {isStartingNewGame ? (
              <>
                <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                <span>Starting New Game...</span>
              </>
            ) : (
              <>
                <i className="bi bi-arrow-repeat fs-5"></i>
                <span>Play Again</span>
              </>
            )}
          </button>

          <button
            type="button"
            className="btn btn-outline-secondary px-4 py-2 fw-semibold d-inline-flex align-items-center gap-2 rounded-3"
            onClick={onViewHistory}
          >
            <i className="bi bi-journal-text fs-5"></i>
            <span>Game History</span>
          </button>
        </div>
      </div>
    </div>
  );
}
