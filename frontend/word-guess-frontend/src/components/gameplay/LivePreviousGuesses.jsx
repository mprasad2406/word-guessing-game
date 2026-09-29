import React from "react";
import { History, CheckCircle2, XCircle, HelpCircle } from "lucide-react";

/**
 * LivePreviousGuesses:
 * Compact chronological list of submitted guesses in the active match.
 * Avoids duplicating the full visual tile grid while providing clear attempt numbers,
 * exact words, outcome badges, and letter status breakdown dots.
 */
export function LivePreviousGuesses({ guesses = [] }) {
  if (!guesses || guesses.length === 0) {
    return (
      <section className="live-supporting-card previous-guesses-card" aria-label="Previous Guesses">
        <div className="supporting-card-header">
          <div className="supporting-card-title">
            <span className="supporting-icon-badge badge-blue">
              <History size={16} />
            </span>
            <h3>Attempt History</h3>
          </div>
        </div>
        <div className="supporting-card-body empty-guesses-body">
          <p className="empty-guesses-text">
            No guesses submitted yet. Enter your first word above.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="live-supporting-card previous-guesses-card" aria-label="Previous Guesses">
      <div className="supporting-card-header">
        <div className="supporting-card-title">
          <span className="supporting-icon-badge badge-blue">
            <History size={16} />
          </span>
          <h3>Attempt History</h3>
        </div>
        <span className="supporting-badge">
          {guesses.length} {guesses.length === 1 ? "attempt" : "attempts"}
        </span>
      </div>

      <div className="supporting-card-body p-0">
        <ul className="live-guesses-list" role="list">
          {guesses.map((item, idx) => {
            const attemptNum = item.attempt_number || idx + 1;
            const word = (item.guess || "").toUpperCase();
            const isCorrect = item.is_correct;
            const feedback = item.letter_feedback || [];

            return (
              <li key={attemptNum} className="live-guess-item">
                <div className="guess-item-left">
                  <span className="guess-attempt-badge num-tabular">#{attemptNum}</span>
                  <span className="guess-word-text">{word}</span>
                  
                  {/* Feedback Mini Dots */}
                  <div className="guess-feedback-dots" aria-hidden="true">
                    {feedback.map((st, i) => (
                      <span
                        key={i}
                        className={`feedback-dot dot-${st || "absent"}`}
                        title={`${word[i]}: ${st}`}
                      />
                    ))}
                  </div>
                </div>

                <div className="guess-item-right">
                  {isCorrect ? (
                    <span className="guess-result-badge badge-correct">
                      <CheckCircle2 size={13} />
                      <span>Correct</span>
                    </span>
                  ) : (
                    <span className="guess-result-badge badge-incorrect">
                      <XCircle size={13} />
                      <span>Miss</span>
                    </span>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
