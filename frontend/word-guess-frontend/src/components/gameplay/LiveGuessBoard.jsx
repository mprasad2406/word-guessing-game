import React, { useEffect, useState, useRef } from "react";
import { Check, RefreshCw, X, Copy, ArrowLeftRight } from "lucide-react";

/**
 * LiveGuessBoard:
 * Interactive Wordle board supporting:
 * - Direct tile focus, typing, backspace, arrow navigation
 * - 2-click letter swapping & Drag-and-Drop rearrangement
 * - Row-level "Copy to Draft" buttons on completed rows
 * - Staggered flip reveal animations for completed guesses
 * - Accessible color feedback legend
 */
export function LiveGuessBoard({
  guesses = [],
  maxAttempts = 5,
  wordLength = 5,
  draft = "",
  selectedTileIndex = 0,
  swapSourceIndex = null,
  onSelectTile,
  onKeyDownTile,
  onPasteTile,
  onSwapTiles,
  onCopyRow,
  isGameActive = true,
  isShaking = false,
  disabled = false,
}) {
  const safeMaxAttempts = Math.max(1, maxAttempts || 5);
  const safeWordLength = Math.max(1, wordLength || 5);

  const [animatingRowIndex, setAnimatingRowIndex] = useState(-1);
  const [draggedTileIndex, setDraggedTileIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);
  const prevGuessesLengthRef = useRef(guesses.length);
  const activeTileRefs = useRef([]);

  // Staggered reveal animation when a new guess is submitted
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

  // Focus active tile when selectedTileIndex changes
  useEffect(() => {
    if (isGameActive && !disabled && selectedTileIndex != null) {
      const el = activeTileRefs.current[selectedTileIndex];
      if (el && document.activeElement !== el && document.activeElement?.id !== "live-word-input") {
        el.focus();
      }
    }
  }, [selectedTileIndex, isGameActive, disabled]);

  // Drag and Drop handlers
  const handleDragStart = (e, index) => {
    if (disabled) return;
    setDraggedTileIndex(index);
    e.dataTransfer.setData("text/plain", index.toString());
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (dragOverIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (e, targetIndex) => {
    e.preventDefault();
    setDragOverIndex(null);
    const sourceIdxStr = e.dataTransfer.getData("text/plain");
    const sourceIdx = parseInt(sourceIdxStr, 10);
    if (!isNaN(sourceIdx) && sourceIdx !== targetIndex && onSwapTiles) {
      onSwapTiles(sourceIdx, targetIndex);
    }
    setDraggedTileIndex(null);
  };

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
        <div key={r} className="board-row-container completed-row-container">
          <div className="board-row completed-row" role="row">
            {tiles}
          </div>

          {/* Row-level Copy to Draft action */}
          {isGameActive && onCopyRow && (
            <button
              type="button"
              className="btn-row-copy"
              onClick={() => onCopyRow(guessWord)}
              title={`Copy "${guessWord}" to current draft`}
              aria-label={`Copy "${guessWord}" to current draft`}
            >
              <Copy size={13} />
              <span className="row-copy-label">Copy</span>
            </button>
          )}
        </div>
      );
    } else if (r === guesses.length && isGameActive) {
      // Active Interactive Editable Row
      const chars = draft.padEnd(safeWordLength, " ").split("");
      const tiles = [];

      for (let c = 0; c < safeWordLength; c++) {
        const letter = chars[c] && chars[c] !== " " ? chars[c] : "";
        const isSelected = selectedTileIndex === c;
        const isSwapSource = swapSourceIndex === c;
        const isDragOver = dragOverIndex === c;
        const isFilled = Boolean(letter);

        tiles.push(
          <div
            key={c}
            ref={(el) => (activeTileRefs.current[c] = el)}
            className={`board-tile tile-active ${isFilled ? "tile-filled" : "tile-empty"} ${
              isSelected ? "tile-selected" : ""
            } ${isSwapSource ? "tile-swap-source" : ""} ${isDragOver ? "tile-drag-over" : ""}`}
            tabIndex={disabled ? -1 : 0}
            role="gridcell"
            aria-selected={isSelected}
            aria-label={
              letter
                ? `Position ${c + 1}: ${letter}. Press a letter key to replace, Backspace to delete, or click another tile to swap.`
                : `Position ${c + 1}: empty. Press a letter key to enter.`
            }
            onClick={() => onSelectTile?.(c)}
            onKeyDown={(e) => onKeyDownTile?.(c, e)}
            onPaste={(e) => {
              const text = e.clipboardData?.getData("text") || "";
              onPasteTile?.(text);
            }}
            draggable={!disabled && isFilled}
            onDragStart={(e) => handleDragStart(e, c)}
            onDragOver={(e) => handleDragOver(e, c)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, c)}
          >
            <span className="tile-letter">{letter}</span>
            {isSwapSource && (
              <span className="tile-swap-indicator-badge">
                <ArrowLeftRight size={10} />
              </span>
            )}
          </div>
        );
      }

      rows.push(
        <div key={r} className="board-row-container active-row-container">
          <div
            className={`board-row active-row ${isShaking ? "row-shake-animate" : ""}`}
            role="row"
            aria-current="true"
          >
            {tiles}
          </div>
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
            aria-label={`Unused row position ${c + 1}`}
          />
        );
      }

      rows.push(
        <div key={r} className="board-row-container future-row-container">
          <div className="board-row future-row" role="row">
            {tiles}
          </div>
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
