import React from "react";
import { Sparkles, Shuffle, ArrowRight } from "lucide-react";
import { GuessPreparationService } from "../../services/GuessPreparationService";

/**
 * IntelligentSuggestionBanner:
 * Non-intrusive banner analyzing feedback from previous guesses.
 * Provides optional "Prepare Next Guess" and "Shuffle Unconfirmed" actions.
 */
export function IntelligentSuggestionBanner({
  guesses = [],
  wordLength = 5,
  onPrepareDraft,
  onShuffle,
  disabled = false,
}) {
  if (!guesses || guesses.length === 0) return null;

  const analysis = GuessPreparationService.analyzeFeedback(guesses, wordLength);
  if (!analysis.canPrepare) return null;

  const { isAllLettersFound, greenCount, orangeCount } = analysis;

  return (
    <div
      className={`intelligent-suggestion-card ${isAllLettersFound ? "all-letters-found" : ""}`}
      role="region"
      aria-label="Intelligent Guess Preparation"
    >
      <div className="suggestion-text-group">
        <span className="suggestion-icon-badge">
          <Sparkles size={14} />
        </span>
        <div className="suggestion-message">
          {isAllLettersFound ? (
            <span>
              <strong>All {wordLength} letters found!</strong> Rearrange the remaining positions to solve the word.
            </span>
          ) : (
            <span>
              Previous feedback: <strong>{greenCount}</strong> confirmed spot{greenCount === 1 ? "" : "s"}
              {orangeCount > 0 && (
                <> and <strong>{orangeCount}</strong> present letter{orangeCount === 1 ? "" : "s"}</>
              )}.
            </span>
          )}
        </div>
      </div>

      <div className="suggestion-actions">
        <button
          type="button"
          className="btn-suggestion-prepare"
          onClick={onPrepareDraft}
          disabled={disabled}
          aria-label="Prepare draft from previous feedback"
        >
          <span>Prepare Draft</span>
          <ArrowRight size={13} />
        </button>

        {isAllLettersFound && onShuffle && (
          <button
            type="button"
            className="btn-suggestion-shuffle"
            onClick={onShuffle}
            disabled={disabled}
            aria-label="Shuffle unconfirmed letters"
          >
            <Shuffle size={13} />
            <span>Shuffle Positions</span>
          </button>
        )}
      </div>
    </div>
  );
}
