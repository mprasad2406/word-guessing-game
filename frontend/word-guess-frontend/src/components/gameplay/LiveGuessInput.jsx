import React, { useState, useRef } from "react";
import { Check, AlertCircle } from "lucide-react";

/**
 * LiveGuessInput:
 * Clean, synchronized text field positioned directly beneath the guessing board.
 * Synchronized with the active interactive tiles and central draft state.
 */
export function LiveGuessInput({
  wordLength = 5,
  draft = "",
  onDraftChange,
  onGuessSubmit,
  isSubmitting = false,
  disabled = false,
  previousGuesses = [],
  onTriggerShake,
}) {
  const [validationError, setValidationError] = useState("");
  const inputRef = useRef(null);

  const safeWordLength = Math.max(1, wordLength || 5);
  const cleanDraft = (draft || "").replace(/\s+/g, "").toUpperCase();
  const currentLength = cleanDraft.length;
  const isExactLength = currentLength === safeWordLength;

  const handleInputChange = (e) => {
    const rawVal = e.target.value.toUpperCase();
    if (rawVal === "" || /^[A-Z]+$/.test(rawVal)) {
      if (rawVal.length <= safeWordLength) {
        onDraftChange(rawVal);
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

    if (!cleanDraft) {
      setValidationError(`Please enter a ${safeWordLength}-letter word.`);
      onTriggerShake?.();
      inputRef.current?.focus();
      return;
    }

    if (cleanDraft.length < safeWordLength) {
      setValidationError(`Enter a complete ${safeWordLength}-letter word (${cleanDraft.length}/${safeWordLength}).`);
      onTriggerShake?.();
      inputRef.current?.focus();
      return;
    }

    if (!/^[A-Z]+$/.test(cleanDraft)) {
      setValidationError("Only letters A–Z are allowed.");
      onTriggerShake?.();
      inputRef.current?.focus();
      return;
    }

    // Check duplicate guess in this session
    const isAlreadyGuessed = previousGuesses.some(
      (g) => (g.guess || "").toUpperCase() === cleanDraft
    );
    if (isAlreadyGuessed) {
      setValidationError(`"${cleanDraft}" has already been submitted in this match.`);
      onTriggerShake?.();
      inputRef.current?.focus();
      return;
    }

    setValidationError("");
    const success = await onGuessSubmit(cleanDraft.toLowerCase());
    if (success) {
      onDraftChange("");
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
              placeholder={`Type or click tiles (${safeWordLength} letters)`}
              value={cleanDraft}
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
                <Check size={16} strokeWidth={2.5} />
                <span>Submit Guess</span>
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
