import React from "react";

/**
 * WordleGrid renders the dynamic N x M letter grid:
 * - Rows: maxAttempts (default 5)
 * - Columns: wordLength (default 5)
 * - Highlights submitted letters:
 *    - Green (#198754): correct position
 *    - Orange (#fd7e14): present in word, wrong position
 *    - Grey (#6c757d): not in word
 * - Displays active typing row and empty future rows.
 */
export function WordleGrid({
  guesses = [],
  maxAttempts = 5,
  wordLength = 5,
  currentGuess = "",
  isGameActive = true,
}) {
  const safeMaxAttempts = Math.max(1, maxAttempts || 5);
  const safeWordLength = Math.max(1, wordLength || 5);
  const rows = [];

  for (let r = 0; r < safeMaxAttempts; r++) {
    if (r < guesses.length) {
      // Completed guess row
      const guessItem = guesses[r];
      const guessWord = (guessItem.guess || "").toUpperCase();
      const feedback = guessItem.letter_feedback || [];

      const tiles = [];
      for (let c = 0; c < safeWordLength; c++) {
        const letter = guessWord[c] || "";
        const status = feedback[c] || "neutral";

        let bgColor = "#6c757d"; // default grey
        let borderColor = "#6c757d";
        let ariaLabel = `${letter || "Empty"}`;

        if (status === "correct") {
          bgColor = "#198754"; // Green
          borderColor = "#198754";
          ariaLabel = `${letter}, correct position`;
        } else if (status === "present") {
          bgColor = "#fd7e14"; // Orange
          borderColor = "#fd7e14";
          ariaLabel = `${letter}, present but wrong position`;
        } else if (status === "absent") {
          bgColor = "#6c757d"; // Grey
          borderColor = "#6c757d";
          ariaLabel = `${letter}, not in word`;
        } else {
          // Fallback / neutral
          bgColor = "#495057";
          borderColor = "#495057";
          ariaLabel = `${letter}, recorded`;
        }

        tiles.push(
          <div
            key={c}
            className="wordle-tile text-white fw-bold d-flex align-items-center justify-content-center shadow-sm"
            style={{
              width: "58px",
              height: "58px",
              fontSize: "1.75rem",
              borderRadius: "8px",
              backgroundColor: bgColor,
              border: `2px solid ${borderColor}`,
              transition: "transform 0.2s ease, background-color 0.3s ease",
              userSelect: "none",
            }}
            aria-label={ariaLabel}
          >
            {letter}
          </div>
        );
      }
      rows.push(
        <div key={r} className="d-flex justify-content-center gap-2 mb-2" role="row">
          {tiles}
        </div>
      );
    } else if (r === guesses.length && isGameActive) {
      // Active typing row
      const typed = (currentGuess || "").toUpperCase();
      const tiles = [];
      for (let c = 0; c < safeWordLength; c++) {
        const letter = typed[c] || "";
        const isActive = c === typed.length && typed.length < safeWordLength;

        tiles.push(
          <div
            key={c}
            className={`wordle-tile fw-bold d-flex align-items-center justify-content-center ${
              letter ? "border-primary text-primary" : "border-secondary-subtle text-dark"
            }`}
            style={{
              width: "58px",
              height: "58px",
              fontSize: "1.75rem",
              borderRadius: "8px",
              backgroundColor: letter ? "#f8f9fa" : "#ffffff",
              border: isActive ? "2px solid #0d6efd" : "2px solid #dee2e6",
              boxShadow: isActive ? "0 0 0 3px rgba(13,110,253,0.25)" : "none",
              transition: "all 0.15s ease",
              userSelect: "none",
            }}
            aria-label={letter ? `${letter}, typed` : "Empty letter box"}
          >
            {letter}
          </div>
        );
      }
      rows.push(
        <div key={r} className="d-flex justify-content-center gap-2 mb-2" role="row">
          {tiles}
        </div>
      );
    } else {
      // Empty future row
      const tiles = [];
      for (let c = 0; c < safeWordLength; c++) {
        tiles.push(
          <div
            key={c}
            className="wordle-tile d-flex align-items-center justify-content-center"
            style={{
              width: "58px",
              height: "58px",
              borderRadius: "8px",
              backgroundColor: "#ffffff",
              border: "2px solid #e9ecef",
              userSelect: "none",
            }}
            aria-label="Empty letter box"
          />
        );
      }
      rows.push(
        <div key={r} className="d-flex justify-content-center gap-2 mb-2" role="row">
          {tiles}
        </div>
      );
    }
  }

  return (
    <div className="wordle-grid-container mb-4" role="grid" aria-label="Word Guessing Grid">
      {rows}
    </div>
  );
}
