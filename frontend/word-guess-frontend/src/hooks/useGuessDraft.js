import { useState, useCallback, useRef } from "react";
import { GuessPreparationService } from "../services/GuessPreparationService";

/**
 * useGuessDraft:
 * Centralized hook for intelligent word drafting, direct tile editing,
 * 2-click letter swapping, drag-and-drop, shuffling, copying, resetting, and undoing.
 */
export function useGuessDraft({
  wordLength = 5,
  initialDraft = "",
  onGuessSubmit,
  disabled = false,
}) {
  const safeWordLength = Math.max(1, wordLength || 5);

  const [draft, setDraftState] = useState((initialDraft || "").toUpperCase());
  const [selectedTileIndex, setSelectedTileIndex] = useState(0);
  const [swapSourceIndex, setSwapSourceIndex] = useState(null);
  const [history, setHistory] = useState([]);
  const [greenPositions, setGreenPositions] = useState({});

  const draftRef = useRef(draft);
  draftRef.current = draft;

  const pushHistory = useCallback((prevDraft) => {
    setHistory((prev) => [...prev.slice(-15), prevDraft]);
  }, []);

  /**
   * Set draft directly with history preservation
   */
  const setDraft = useCallback(
    (newVal, recordHistory = true) => {
      const sanitized = (newVal || "")
        .toUpperCase()
        .replace(/[^A-Z]/g, "")
        .slice(0, safeWordLength);

      if (recordHistory && sanitized !== draftRef.current) {
        pushHistory(draftRef.current);
      }
      setDraftState(sanitized);
    },
    [safeWordLength, pushHistory]
  );

  /**
   * Select a tile or perform a 2-click swap
   */
  const selectTile = useCallback(
    (index) => {
      if (disabled) return;
      const validIndex = Math.max(0, Math.min(safeWordLength - 1, index));

      if (swapSourceIndex === null) {
        // First click: select for focus and potential swap
        setSelectedTileIndex(validIndex);
        setSwapSourceIndex(validIndex);
      } else if (swapSourceIndex === validIndex) {
        // Clicked same tile again: cancel swap selection
        setSwapSourceIndex(null);
        setSelectedTileIndex(validIndex);
      } else {
        // Second click on different tile: execute swap / move
        const chars = draftRef.current.padEnd(safeWordLength, " ").split("");
        const srcChar = chars[swapSourceIndex] || " ";
        const targetChar = chars[validIndex] || " ";

        // Perform swap
        chars[swapSourceIndex] = targetChar;
        chars[validIndex] = srcChar;

        const updatedDraft = chars.join("").trimEnd();
        pushHistory(draftRef.current);
        setDraftState(updatedDraft);

        setSwapSourceIndex(null);
        setSelectedTileIndex(validIndex);
      }
    },
    [disabled, safeWordLength, swapSourceIndex, pushHistory]
  );

  /**
   * Cancel active swap selection
   */
  const cancelSwapSelection = useCallback(() => {
    setSwapSourceIndex(null);
  }, []);

  /**
   * Swap two specific tile indices directly (e.g. from drag & drop)
   */
  const swapTiles = useCallback(
    (sourceIdx, targetIdx) => {
      if (disabled || sourceIdx === targetIdx) return;
      if (
        sourceIdx < 0 ||
        sourceIdx >= safeWordLength ||
        targetIdx < 0 ||
        targetIdx >= safeWordLength
      ) {
        return;
      }

      const chars = draftRef.current.padEnd(safeWordLength, " ").split("");
      const srcChar = chars[sourceIdx] || " ";
      const targetChar = chars[targetIdx] || " ";

      chars[sourceIdx] = targetChar;
      chars[targetIdx] = srcChar;

      const updatedDraft = chars.join("").trimEnd();
      pushHistory(draftRef.current);
      setDraftState(updatedDraft);
      setSwapSourceIndex(null);
      setSelectedTileIndex(targetIdx);
    },
    [disabled, safeWordLength, pushHistory]
  );

  /**
   * Update character at specific tile index
   */
  const setTileLetter = useCallback(
    (index, letter) => {
      if (disabled) return;
      const validIndex = Math.max(0, Math.min(safeWordLength - 1, index));
      const cleanChar = (letter || "").toUpperCase().replace(/[^A-Z]/g, "").slice(0, 1);

      const chars = draftRef.current.padEnd(safeWordLength, " ").split("");
      chars[validIndex] = cleanChar || " ";

      const updatedDraft = chars.join("").trimEnd();
      pushHistory(draftRef.current);
      setDraftState(updatedDraft);

      // Advance focus to next tile if letter was entered
      if (cleanChar && validIndex < safeWordLength - 1) {
        setSelectedTileIndex(validIndex + 1);
        setSwapSourceIndex(null);
      }
    },
    [disabled, safeWordLength, pushHistory]
  );

  /**
   * Handle keyboard interactions on direct tile inputs
   */
  const handleKeyDownOnTile = useCallback(
    (index, e, onSubmitCallback) => {
      if (disabled) return;

      const key = e.key;

      if (/^[a-zA-Z]$/.test(key) && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        setTileLetter(index, key);
      } else if (key === "Backspace") {
        e.preventDefault();
        const chars = draftRef.current.padEnd(safeWordLength, " ").split("");
        if (chars[index] && chars[index] !== " ") {
          // Clear current
          chars[index] = " ";
          pushHistory(draftRef.current);
          setDraftState(chars.join("").trimEnd());
        } else if (index > 0) {
          // Move back and clear
          chars[index - 1] = " ";
          pushHistory(draftRef.current);
          setDraftState(chars.join("").trimEnd());
          setSelectedTileIndex(index - 1);
        }
      } else if (key === "ArrowLeft") {
        e.preventDefault();
        setSelectedTileIndex((prev) => Math.max(0, prev - 1));
        setSwapSourceIndex(null);
      } else if (key === "ArrowRight") {
        e.preventDefault();
        setSelectedTileIndex((prev) => Math.min(safeWordLength - 1, prev + 1));
        setSwapSourceIndex(null);
      } else if (key === "Delete") {
        e.preventDefault();
        const chars = draftRef.current.padEnd(safeWordLength, " ").split("");
        chars[index] = " ";
        pushHistory(draftRef.current);
        setDraftState(chars.join("").trimEnd());
      } else if (key === "Enter") {
        e.preventDefault();
        const cleanWord = draftRef.current.replace(/\s+/g, "");
        if (cleanWord.length === safeWordLength) {
          if (onSubmitCallback) {
            onSubmitCallback(cleanWord);
          } else if (onGuessSubmit) {
            onGuessSubmit(cleanWord);
          }
        }
      } else if (key === "Escape") {
        setSwapSourceIndex(null);
      }
    },
    [disabled, safeWordLength, setTileLetter, pushHistory, onGuessSubmit]
  );

  /**
   * Handle text paste event
   */
  const handlePaste = useCallback(
    (pastedText) => {
      if (disabled) return;
      const clean = (pastedText || "")
        .toUpperCase()
        .replace(/[^A-Z]/g, "")
        .slice(0, safeWordLength);

      if (clean) {
        pushHistory(draftRef.current);
        setDraftState(clean);
        setSelectedTileIndex(Math.min(safeWordLength - 1, clean.length));
        setSwapSourceIndex(null);
      }
    },
    [disabled, safeWordLength, pushHistory]
  );

  /**
   * Copy a previous guess directly into draft
   */
  const copyPrevious = useCallback(
    (guessWord) => {
      if (disabled || !guessWord) return;
      const clean = guessWord.toUpperCase().replace(/[^A-Z]/g, "").slice(0, safeWordLength);
      pushHistory(draftRef.current);
      setDraftState(clean);
      setSelectedTileIndex(Math.min(safeWordLength - 1, clean.length));
      setSwapSourceIndex(null);
    },
    [disabled, safeWordLength, pushHistory]
  );

  /**
   * Intelligent Next-Guess preparation from previous feedback
   */
  const prepareFromFeedback = useCallback(
    (guesses = []) => {
      if (disabled) return;
      const analysis = GuessPreparationService.analyzeFeedback(guesses, safeWordLength);
      if (analysis.canPrepare && analysis.suggestedDraft) {
        pushHistory(draftRef.current);
        setDraftState(analysis.suggestedDraft);
        setGreenPositions(analysis.greenPositions);
        setSelectedTileIndex(0);
        setSwapSourceIndex(null);
      }
    },
    [disabled, safeWordLength, pushHistory]
  );

  /**
   * Shuffle editable letters (preserving green locked positions)
   */
  const shuffle = useCallback(() => {
    if (disabled) return;
    const current = draftRef.current;
    if (!current || current.trim().length <= 1) return;

    const shuffled = GuessPreparationService.shuffleDraft(
      current,
      greenPositions,
      safeWordLength
    );

    pushHistory(current);
    setDraftState(shuffled);
    setSwapSourceIndex(null);
  }, [disabled, greenPositions, safeWordLength, pushHistory]);

  /**
   * Reset current unsubmitted draft
   */
  const reset = useCallback(() => {
    if (disabled || !draftRef.current) return;
    pushHistory(draftRef.current);
    setDraftState("");
    setSelectedTileIndex(0);
    setSwapSourceIndex(null);
  }, [disabled, pushHistory]);

  /**
   * Undo last draft editing action
   */
  const undo = useCallback(() => {
    if (disabled || history.length === 0) return;
    const previous = history[history.length - 1];
    setHistory((prev) => prev.slice(0, -1));
    setDraftState(previous);
    setSwapSourceIndex(null);
    setSelectedTileIndex(Math.min(safeWordLength - 1, previous.length));
  }, [disabled, history, safeWordLength]);

  // Derived state
  const cleanDraft = draft.replace(/\s+/g, "");
  const isComplete = cleanDraft.length === safeWordLength;
  const canUndo = history.length > 0;
  const canReset = cleanDraft.length > 0;
  const canShuffle = cleanDraft.length >= 2;

  return {
    draft,
    setDraft,
    selectedTileIndex,
    setSelectedTileIndex,
    swapSourceIndex,
    selectTile,
    cancelSwapSelection,
    swapTiles,
    setTileLetter,
    handleKeyDownOnTile,
    handlePaste,
    copyPrevious,
    prepareFromFeedback,
    shuffle,
    reset,
    undo,
    greenPositions,
    isComplete,
    canUndo,
    canReset,
    canShuffle,
  };
}
