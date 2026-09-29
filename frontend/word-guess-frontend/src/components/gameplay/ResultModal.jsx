import React, { useEffect } from "react";
import { Trophy, XCircle, Clock, RotateCcw, Home, History, Check } from "lucide-react";
import { formatDuration } from "../../utils/dateUtils";
import "./ResultModal.css";

/**
 * ResultModal:
 * Displays a clean, professional completion dialog only when a live gameplay session finishes.
 * Supported states:
 * - WON: Trophy icon, "Congratulations!", "You guessed the word correctly."
 * - LOST: X-circle icon, "Game Over", "You've used all available attempts."
 * - EXPIRED: Clock icon, "Time Expired", "The time limit for this game has expired."
 * Actions:
 * - Return to Lobby (onOk -> /player)
 * - Play Again (onPlayAgain -> creates new game)
 * - View Game History (onViewHistory -> /player/history)
 */
export function ResultModal({
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
  // Handle ESC key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen && !isStartingNewGame) {
        onOk?.();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isStartingNewGame, onOk]);

  if (!isOpen) return null;

  const isWon = status === "WON";
  const isExpired = status === "EXPIRED";

  const getHeaderConfig = () => {
    if (isWon) {
      return {
        badgeClass: "status-won",
        icon: <Trophy size={32} strokeWidth={2.2} />,
        title: "Congratulations!",
        desc: "You guessed the word correctly.",
      };
    }
    if (isExpired) {
      return {
        badgeClass: "status-expired",
        icon: <Clock size={32} strokeWidth={2.2} />,
        title: "Time Expired",
        desc: "The time limit for this game has expired.",
      };
    }
    return {
      badgeClass: "status-lost",
      icon: <XCircle size={32} strokeWidth={2.2} />,
      title: "Game Over",
      desc: "You've used all available attempts.",
    };
  };

  const header = getHeaderConfig();
  const wordLetters = (finalWord || "").toUpperCase().split("");

  return (
    <div
      className="result-modal-backdrop"
      role="presentation"
      onClick={() => !isStartingNewGame && onOk?.()}
    >
      <div
        className="result-modal-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="result-modal-title"
        aria-describedby="result-modal-desc"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="result-modal-header">
          <div className={`result-icon-badge ${header.badgeClass}`}>
            {header.icon}
          </div>
          <h2 id="result-modal-title" className="result-modal-title">
            {header.title}
          </h2>
          <p id="result-modal-desc" className="result-modal-desc">
            {header.desc}
          </p>
        </div>

        {/* Body */}
        <div className="result-modal-body">
          {wordLetters.length > 0 && (
            <div className="result-word-container">
              <span className="result-word-label">The Secret Word Was</span>
              <div className="result-word-tiles" aria-label={`Secret word: ${finalWord}`}>
                {wordLetters.map((letter, idx) => (
                  <div key={idx} className="result-word-tile">
                    {letter}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="result-stats-row">
            <div className="result-stat-item">
              <span>Attempts:</span>
              <strong>
                {attemptsUsed} / {maxAttempts}
              </strong>
            </div>

            {durationSeconds != null && (
              <div className="result-stat-item">
                <span>Duration:</span>
                <strong>{formatDuration(durationSeconds)}</strong>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="result-modal-footer">
          {onPlayAgain && (
            <button
              type="button"
              className="btn-result-primary"
              onClick={onPlayAgain}
              disabled={isStartingNewGame}
              autoFocus
            >
              {isStartingNewGame ? (
                <>
                  <span
                    className="spinner-border spinner-border-sm"
                    role="status"
                    aria-hidden="true"
                  ></span>
                  <span>Starting New Game...</span>
                </>
              ) : (
                <>
                  <RotateCcw size={16} />
                  <span>Play Again</span>
                </>
              )}
            </button>
          )}

          <div className="result-secondary-actions">
            <button
              type="button"
              className="btn-result-secondary"
              onClick={onOk}
              disabled={isStartingNewGame}
            >
              <Home size={15} />
              <span>Return to Lobby</span>
            </button>

            {onViewHistory && (
              <button
                type="button"
                className="btn-result-secondary"
                onClick={onViewHistory}
                disabled={isStartingNewGame}
              >
                <History size={15} />
                <span>View History</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
