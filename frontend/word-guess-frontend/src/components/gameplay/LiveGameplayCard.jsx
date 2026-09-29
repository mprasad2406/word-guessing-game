import React, { useState } from "react";
import { Sparkles, HelpCircle } from "lucide-react";
import { LiveGuessBoard } from "./LiveGuessBoard";
import { LiveGuessInput } from "./LiveGuessInput";

/**
 * LiveGameplayCard:
 * Cohesive single-card layout holding the instruction header,
 * the guessing board, feedback legend, and synchronized word-entry input.
 */
export function LiveGameplayCard({
  gameState,
  currentGuess,
  onGuessChange,
  onGuessSubmit,
  isSubmittingGuess,
  isGameActive,
}) {
  const [isShaking, setIsShaking] = useState(false);

  if (!gameState) return null;

  const {
    guesses = [],
    max_attempts = 5,
    word_length = 5,
  } = gameState;

  const triggerShake = () => {
    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 500);
  };

  return (
    <section className="live-gameplay-card" aria-label="Word Guessing Area">
      <div className="gameplay-card-header">
        <div className="gameplay-header-text">
          <div className="gameplay-instruction-badge">
            <Sparkles size={13} />
            <span>Target Word</span>
          </div>
          <p className="gameplay-instruction-text">
            Guess the <strong>{word_length}-letter</strong> secret word in <strong>{max_attempts}</strong> attempts.
          </p>
        </div>
      </div>

      {/* Synchronized Guessing Board */}
      <div className="gameplay-board-section">
        <LiveGuessBoard
          guesses={guesses}
          maxAttempts={max_attempts}
          wordLength={word_length}
          currentGuess={currentGuess}
          isGameActive={isGameActive}
          isShaking={isShaking}
        />
      </div>

      {/* Word Entry Input & Submit Action */}
      {isGameActive && (
        <div className="gameplay-input-section">
          <LiveGuessInput
            wordLength={word_length}
            currentGuess={currentGuess}
            onGuessChange={onGuessChange}
            onGuessSubmit={onGuessSubmit}
            isSubmitting={isSubmittingGuess}
            disabled={!isGameActive}
            previousGuesses={guesses}
            onTriggerShake={triggerShake}
          />
        </div>
      )}
    </section>
  );
}
