import React, { useEffect, useState, useRef } from "react";
import { Check, RefreshCw, X } from "lucide-react";

/**
 * LiveGuessBoard:
 * Cohesive Wordle guessing grid with active typing integration,
 * sequential reveal animations, and accessible feedback indicators.
 */
export function LiveGuessBoard({
  guesses = [],
  maxAttempts = 5,
  wordLength = 5,
  currentGuess = "",
  isGameActive = true,
  isShaking = false,
}) {
  const safeMaxAttempts = Math.max(1, maxAttempts || 5);
  const safeWordLength = Math.max(1, wordLength || 5);

  // Track newly added guess index to apply sequential flip animation
  const [animatingRowIndex, setAnimatingRowIndex] = useState(-1);
  const prevGuessesLengthRef = useRef(guesses.length);

  useEffect(() => {
    if (guesses.length > prevGuessesLengthRef.current) {
      const newRowIdx = guesses.length - 1;
      setAnimatingRowIndex(newRowIdx);
      const timer = setTimeout(() => {
        setAnimatingRowIndex(-1);
      }, 1500);
      return () => clearTimeout(timer);
    }
    prevGuessesLengthRef.current = guesses.length;
  }, [guesses.length]);

  const rows = [];

  for (let r = 0; r < safeMaxAttempts; r++) {
    if (r < guesses.length) {
      // Completed Guess Row
      const guessItem = guesses[r];
      const guessWord = (guessItem.guess || "").toUpperCase();
      const feedback = guessItem.letter_feedback || [];
      const isAnimating = r === animatingRowIndex;

      const tiles = [];
      for (let c = 0; c < safeWordLength; c++) {
        const letter = guessWord[c] || "";
        const status = feedback[c] || "absent";

        let statusClass = "tile-absent";
        let ariaStatus = "not in word";
        if (status === "correct") {
          statusClass = "tile-correct";
          ariaStatus = "correct position";
        } else if (status === "present") {
          statusClass = "tile-present";
          ariaStatus = "present in word, wrong position";
        }

        const animationDelay = isAnimating ? `${c * 120}ms` : "0ms";

        tiles.push(
          <div
            key={c}
            className={`board-tile tile-completed ${statusClass} ${isAnimating ? "tile-flip-animate" : ""}`}
            style={{ animationDelay }}
            aria-label={`${letter}, ${ariaStatus}`}
          >
            <span className="tile-letter">{letter}</span>
          </div>
        );
      }

      rows.push(
        <div key={r} className="board-row completed-row" role="row">
          {tiles}
        </div>
      );
    } else if (r === guesses.length && isGameActive) {
      // Active Interactive Typing Row
      const typed = (currentGuess || "").toUpperCase();
      const tiles = [];

      for (let c = 0; c < safeWordLength; c++) {
        const letter = typed[c] || "";
        const isActiveCurrent = c === typed.length && typed.length < safeWordLength;
        const isFilled = Boolean(letter);

        tiles.push(
          <div
            key={c}
            className={`board-tile tile-active ${isFilled ? "tile-filled" : "tile-empty"} ${
              isActiveCurrent ? "tile-cursor" : ""
            }`}
            aria-label={letter ? `${letter}, typed` : `Empty position ${c + 1} of ${safeWordLength}`}
          >
            <span className="tile-letter">{letter}</span>
          </div>
        );
      }

      rows.push(
        <div
          key={r}
          className={`board-row active-row ${isShaking ? "row-shake-animate" : ""}`}
          role="row"
          aria-current="true"
        >
          {tiles}
        </div>
      );
    } else {
      // Future Empty Row
      const tiles = [];
      for (let c = 0; c < safeWordLength; c++) {
        tiles.push(
          <div
            key={c}
            className="board-tile tile-future"
            aria-label={`Unused position ${c + 1}`}
          />
        );
      }

      rows.push(
        <div key={r} className="board-row future-row" role="row">
          {tiles}
        </div>
      );
    }
  }

  return (
    <div className="live-board-wrapper">
      <div className="live-board-grid" role="grid" aria-label="Wordle Guessing Board">
        {rows}
      </div>

      {/* Accessible Feedback Legend */}
      <div className="board-feedback-legend" aria-label="Color feedback key">
        <div className="legend-item legend-correct">
          <span className="legend-icon-box">
            <Check size={11} strokeWidth={3} />
          </span>
          <span className="legend-text">Correct Spot</span>
        </div>
        <div className="legend-item legend-present">
          <span className="legend-icon-box">
            <RefreshCw size={11} strokeWidth={3} />
          </span>
          <span className="legend-text">Wrong Spot</span>
        </div>
        <div className="legend-item legend-absent">
          <span className="legend-icon-box">
            <X size={11} strokeWidth={3} />
          </span>
          <span className="legend-text">Not in Word</span>
        </div>
      </div>
    </div>
  );
}
