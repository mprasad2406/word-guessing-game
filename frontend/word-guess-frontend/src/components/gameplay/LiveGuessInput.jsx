import React, { useState, useRef, useEffect } from "react";
import { ArrowRight, AlertCircle } from "lucide-react";

/**
 * LiveGuessInput:
 * Clean, modern word-entry input positioned directly below the guessing board.
 * Synchronized with the board's active row, providing instant character counting,
 * validation feedback, loading state, and keyboard support.
 */
export function LiveGuessInput({
  wordLength = 5,
  currentGuess = "",
  onGuessChange,
  onGuessSubmit,
  isSubmitting = false,
  disabled = false,
  previousGuesses = [],
  onTriggerShake,
}) {
  const [validationError, setValidationError] = useState("");
  const inputRef = useRef(null);

  const safeWordLength = Math.max(1, wordLength || 5);
  const trimmed = (currentGuess || "").trim().toUpperCase();
  const currentLength = trimmed.length;
  const isExactLength = currentLength === safeWordLength;

  // Auto-focus input on mount or when submission completes
  useEffect(() => {
    if (!disabled && !isSubmitting && inputRef.current) {
      inputRef.current.focus();
    }
  }, [disabled, isSubmitting]);

  const handleInputChange = (e) => {
    const rawVal = e.target.value.toUpperCase();
    // Enforce alphabetic letters only
    if (rawVal === "" || /^[A-Z]+$/.test(rawVal)) {
      if (rawVal.length <= safeWordLength) {
        onGuessChange(rawVal);
        if (validationError) setValidationError("");
      }
    } else {
      setValidationError("Only letters A–Z are allowed.");
      onTriggerShake?.();
    }
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (disabled || isSubmitting) return;

    if (!trimmed) {
      setValidationError(`Please enter a ${safeWordLength}-letter word.`);
      onTriggerShake?.();
      inputRef.current?.focus();
      return;
    }

    if (trimmed.length < safeWordLength) {
      setValidationError(`Enter a complete ${safeWordLength}-letter word (${trimmed.length}/${safeWordLength}).`);
      onTriggerShake?.();
      inputRef.current?.focus();
      return;
    }

    if (!/^[A-Z]+$/.test(trimmed)) {
      setValidationError("Only letters A–Z are allowed.");
      onTriggerShake?.();
      inputRef.current?.focus();
      return;
    }

    // Check duplicate guess in this session
    const isAlreadyGuessed = previousGuesses.some(
      (g) => (g.guess || "").toUpperCase() === trimmed
    );
    if (isAlreadyGuessed) {
      setValidationError(`"${trimmed}" has already been submitted in this match.`);
      onTriggerShake?.();
      inputRef.current?.focus();
      return;
    }

    setValidationError("");
    const success = await onGuessSubmit(trimmed.toLowerCase());
    if (success) {
      onGuessChange("");
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !isSubmitting && !disabled) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <form className="live-guess-form" onSubmit={handleSubmit} noValidate>
      <div className="live-input-container">
        <div className="live-input-row">
          <div className="live-input-wrapper">
            <input
              ref={inputRef}
              id="live-word-input"
              type="text"
              className={`live-word-input ${validationError ? "input-invalid" : ""}`}
              placeholder={`Enter a ${safeWordLength}-letter word`}
              value={trimmed}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              disabled={disabled || isSubmitting}
              maxLength={safeWordLength}
              autoComplete="off"
              spellCheck="false"
              autoCapitalize="characters"
              aria-label={`Enter a ${safeWordLength}-letter word guess`}
              aria-describedby={validationError ? "guess-validation-msg" : undefined}
            />

            <div className="live-char-counter num-tabular" aria-live="polite">
              <span className={isExactLength ? "counter-complete" : ""}>
                {currentLength}
              </span>
              <span className="counter-separator">/</span>
              <span className="counter-total">{safeWordLength}</span>
            </div>
          </div>

          <button
            type="submit"
            className="btn-live-submit"
            disabled={disabled || isSubmitting || !isExactLength}
            aria-label="Submit Word Guess"
          >
            {isSubmitting ? (
              <>
                <span className="submit-spinner" aria-hidden="true" />
                <span>Submitting...</span>
              </>
            ) : (
              <>
                <span>Submit Guess</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </div>

        {/* Validation Error Banner */}
        {validationError && (
          <div
            id="guess-validation-msg"
            className="live-validation-error"
            role="alert"
          >
            <AlertCircle size={14} className="error-icon" />
            <span>{validationError}</span>
          </div>
        )}
      </div>
    </form>
  );
}
