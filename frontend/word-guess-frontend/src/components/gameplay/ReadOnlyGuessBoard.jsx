import React from "react";
import { Check, RefreshCw, X, AlertCircle } from "lucide-react";

/**
 * ReadOnlyGuessBoard:
 * Displays the submitted guesses in a clean, non-interactive Wordle board with color legend.
 */
export function ReadOnlyGuessBoard({
  guesses = [],
  maxAttempts = 5,
  wordLength = 5,
  status = "COMPLETED",
}) {
  const safeMaxAttempts = Math.max(1, maxAttempts || 5);
  const safeWordLength = Math.max(1, wordLength || 5);

  if (!guesses || guesses.length === 0) {
    return (
      <div className="card shadow-sm border-0 rounded-4 p-4 text-center bg-white">
        <div className="d-flex flex-column align-items-center py-4 text-muted">
          <AlertCircle size={36} className="text-secondary opacity-50 mb-2" />
          <h6 className="fw-bold text-dark mb-1">No Guesses Submitted</h6>
          <p className="small mb-0 text-muted" style={{ maxWidth: "340px" }}>
            {status === "EXPIRED"
              ? "The time limit expired before any whole-word guesses were recorded."
              : "No word attempts were submitted for this game session."}
          </p>
        </div>
      </div>
    );
  }

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
        const letterStatus = feedback[c] || "absent";

        let bgColor = "#475569"; // Slate gray
        let borderColor = "#475569";
        let ariaLabel = `${letter || "Empty"}`;

        if (letterStatus === "correct") {
          bgColor = "#15803d"; // Green
          borderColor = "#15803d";
          ariaLabel = `${letter}, correct position`;
        } else if (letterStatus === "present") {
          bgColor = "#d97706"; // Orange
          borderColor = "#d97706";
          ariaLabel = `${letter}, present in word but wrong position`;
        } else {
          bgColor = "#475569"; // Gray
          borderColor = "#475569";
          ariaLabel = `${letter}, not in word`;
        }

        tiles.push(
          <div
            key={c}
            className="readonly-tile"
            style={{
              width: "52px",
              height: "52px",
              fontSize: "1.5rem",
              fontWeight: "800",
              borderRadius: "8px",
              backgroundColor: bgColor,
              border: `2px solid ${borderColor}`,
              color: "#ffffff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              userSelect: "none",
              boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
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
    } else {
      // Unused decorative row
      const tiles = [];
      for (let c = 0; c < safeWordLength; c++) {
        tiles.push(
          <div
            key={c}
            style={{
              width: "52px",
              height: "52px",
              borderRadius: "8px",
              backgroundColor: "#f8fafc",
              border: "1.5px dashed #cbd5e1",
              userSelect: "none",
            }}
            aria-hidden="true"
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
    <div className="card shadow-sm border-0 rounded-4 p-4 bg-white mb-4 text-center">
      <div className="d-flex align-items-center justify-content-between pb-3 mb-3 border-bottom">
        <h3 className="mb-0 fw-bold text-dark text-start" style={{ fontSize: "1.0625rem" }}>
          Word Guessing Board
        </h3>
        <span className="badge bg-light text-secondary border px-2.5 py-1" style={{ fontSize: "0.75rem", fontWeight: "700" }}>
          {guesses.length} / {safeMaxAttempts} Rows
        </span>
      </div>

      <div className="wordle-grid-container my-2" role="grid" aria-label="Completed Wordle Grid">
        {rows}
      </div>

      {/* Accessible Color Legend */}
      <div className="d-flex justify-content-center flex-wrap gap-3 pt-3 border-top" style={{ fontSize: "0.8125rem" }}>
        <div className="d-flex align-items-center gap-1.5" style={{ color: "#15803d", fontWeight: "600" }}>
          <span
            style={{
              width: "14px",
              height: "14px",
              backgroundColor: "#15803d",
              borderRadius: "3px",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#ffffff",
            }}
          >
            <Check size={10} strokeWidth={3} />
          </span>
          <span>Correct Spot</span>
        </div>

        <div className="d-flex align-items-center gap-1.5" style={{ color: "#d97706", fontWeight: "600" }}>
          <span
            style={{
              width: "14px",
              height: "14px",
              backgroundColor: "#d97706",
              borderRadius: "3px",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#ffffff",
            }}
          >
            <RefreshCw size={10} strokeWidth={3} />
          </span>
          <span>Wrong Spot</span>
        </div>

        <div className="d-flex align-items-center gap-1.5" style={{ color: "#475569", fontWeight: "600" }}>
          <span
            style={{
              width: "14px",
              height: "14px",
              backgroundColor: "#475569",
              borderRadius: "3px",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#ffffff",
            }}
          >
            <X size={10} strokeWidth={3} />
          </span>
          <span>Not in Word</span>
        </div>
      </div>
    </div>
  );
}
