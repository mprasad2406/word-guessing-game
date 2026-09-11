import React, { useState } from "react";

/**
 * Form for submitting whole-word guesses.
 * Enforces uppercase display, alphabetic characters, and exact word length.
 * Disables during submission or after game ends.
 */
export function GuessForm({
  wordLength,
  disabled,
  isSubmitting,
  currentGuess,
  onGuessChange,
  onGuessSubmit,
}) {
  const [localGuess, setLocalGuess] = useState("");
  const [validationError, setValidationError] = useState("");

  const isControlled = currentGuess !== undefined;
  const activeValue = isControlled ? currentGuess : localGuess;
  const trimmedGuess = (activeValue || "").trim();
  const currentLength = trimmedGuess.length;

  const handleInputChange = (e) => {
    const val = e.target.value.toUpperCase();
    // Allow only alphabetic letters
    if (val === "" || /^[A-Z]+$/.test(val)) {
      if (isControlled && onGuessChange) {
        onGuessChange(val);
      } else {
        setLocalGuess(val);
      }
      if (validationError) setValidationError("");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (disabled || isSubmitting) return;

    if (!trimmedGuess) {
      setValidationError("Please enter a word guess.");
      return;
    }

    if (!/^[A-Z]+$/.test(trimmedGuess)) {
      setValidationError("Guess must contain letters only.");
      return;
    }

    if (trimmedGuess.length !== wordLength) {
      setValidationError(`Guess must be exactly ${wordLength} letters long (currently ${trimmedGuess.length}).`);
      return;
    }

    setValidationError("");
    const success = await onGuessSubmit(trimmedGuess.toLowerCase());
    if (success) {
      if (isControlled && onGuessChange) {
        onGuessChange("");
      } else {
        setLocalGuess("");
      }
    }
  };

  const isExactLength = currentLength === wordLength;

  return (
    <div className="card shadow-sm border-0 rounded-3 mb-4">
      <div className="card-header bg-white py-3 border-0">
        <h5 className="mb-0 fw-semibold d-flex align-items-center gap-2">
          <i className="bi bi-keyboard text-primary"></i>
          <span>Make a Guess</span>
        </h5>
      </div>
      <div className="card-body pt-0 pb-4 px-4">
        <form onSubmit={handleSubmit} noValidate>
          <div className="mb-3">
            <label htmlFor="whole-word-guess" className="form-label small text-muted">
              Type your complete <strong>{wordLength}-letter</strong> guess (A-Z):
            </label>
            <div className="input-group input-group-lg">
              <span className="input-group-text bg-light text-muted">
                <i className="bi bi-chat-square-text"></i>
              </span>
              <input
                id="whole-word-guess"
                type="text"
                className={`form-control font-monospace text-uppercase fw-semibold ${
                  validationError ? "is-invalid" : ""
                }`}
                placeholder={`ENTER ${wordLength}-LETTER WORD`}
                value={activeValue}
                onChange={handleInputChange}
                disabled={disabled || isSubmitting}
                maxLength={wordLength}
                autoComplete="off"
                autoFocus
              />
              <button
                type="submit"
                className="btn btn-primary px-4 fw-semibold d-flex align-items-center gap-2"
                disabled={disabled || isSubmitting || !isExactLength}
              >
                {isSubmitting ? (
                  <>
                    <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                    <span>Submitting...</span>
                  </>
                ) : (
                  <>
                    <i className="bi bi-arrow-right-circle"></i>
                    <span>Submit Guess</span>
                  </>
                )}
              </button>
            </div>

            {/* Helper & validation feedback */}
            <div className="d-flex justify-content-between align-items-center mt-1">
              <div>
                {validationError && (
                  <span className="text-danger small fw-medium">
                    <i className="bi bi-exclamation-circle me-1"></i>
                    {validationError}
                  </span>
                )}
              </div>
              <div className="small text-muted ms-auto">
                <span className={isExactLength ? "text-success fw-bold" : ""}>
                  {currentLength} / {wordLength}
                </span>{" "}
                letters
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
