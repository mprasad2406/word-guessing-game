import React, { useEffect, useState } from "react";

/**
 * Modal form for creating and editing words in the dictionary.
 */
export function WordModal({ isOpen, onClose, onSave, editingWord, isSaving }) {
  const [word, setWord] = useState("");
  const [hint, setHint] = useState("");
  const [difficulty, setDifficulty] = useState("MEDIUM");
  const [isActive, setIsActive] = useState(true);
  const [error, setError] = useState("");

  const isEditMode = Boolean(editingWord);

  useEffect(() => {
    if (isOpen) {
      if (editingWord) {
        setWord(editingWord.word || "");
        setHint(editingWord.hint || "");
        setDifficulty(editingWord.difficulty || "MEDIUM");
        setIsActive(editingWord.is_active !== undefined ? editingWord.is_active : true);
      } else {
        setWord("");
        setHint("");
        setDifficulty("MEDIUM");
        setIsActive(true);
      }
      setError("");
    }
  }, [isOpen, editingWord]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const trimmedWord = word.trim();
    if (!trimmedWord) {
      setError("Word is required.");
      return;
    }

    if (trimmedWord.length < 2 || trimmedWord.length > 50) {
      setError("Word must be between 2 and 50 letters.");
      return;
    }

    if (!/^[a-zA-Z]+$/.test(trimmedWord)) {
      setError("Word must contain alphabetic letters only (no spaces, numbers, or symbols).");
      return;
    }

    if (hint && hint.length > 255) {
      setError("Hint cannot exceed 255 characters.");
      return;
    }

    const payload = {
      word: trimmedWord.toLowerCase(),
      hint: hint.trim() || null,
      difficulty,
      is_active: isActive,
    };

    const success = await onSave(payload, editingWord?.id);
    if (success) {
      onClose();
    }
  };

  return (
    <div
      className="modal show d-block"
      tabIndex="-1"
      role="dialog"
      style={{ backgroundColor: "rgba(0, 0, 0, 0.5)" }}
    >
      <div className="modal-dialog modal-dialog-centered" role="document">
        <div className="modal-content shadow-lg border-0 rounded-4 overflow-hidden">
          <div className="modal-header bg-primary text-white border-0 py-3">
            <h5 className="modal-title fw-semibold">
              <i className={`bi ${isEditMode ? "bi-pencil-square" : "bi-plus-circle"} me-2`}></i>
              {isEditMode ? "Edit Word" : "Add New Word"}
            </h5>
            <button
              type="button"
              className="btn-close btn-close-white"
              aria-label="Close"
              onClick={onClose}
              disabled={isSaving}
            ></button>
          </div>

          <form onSubmit={handleSubmit} noValidate>
            <div className="modal-body p-4">
              {error && (
                <div className="alert alert-danger small py-2 d-flex align-items-center gap-2 mb-3" role="alert">
                  <i className="bi bi-exclamation-circle-fill"></i>
                  <div>{error}</div>
                </div>
              )}

              {/* Word Input */}
              <div className="mb-3">
                <label htmlFor="word-input" className="form-label small fw-semibold text-secondary">
                  Word <span className="text-danger">*</span>
                </label>
                <input
                  id="word-input"
                  type="text"
                  className="form-control font-monospace text-uppercase"
                  placeholder="e.g. ELEPHANT"
                  value={word}
                  onChange={(e) => setWord(e.target.value)}
                  disabled={isSaving}
                  maxLength={50}
                  required
                  autoFocus
                />
                <div className="form-text small">
                  Alphabetic letters only (2 to 50 characters). Casing will be normalized to lowercase.
                </div>
              </div>

              {/* Hint Input */}
              <div className="mb-3">
                <label htmlFor="hint-input" className="form-label small fw-semibold text-secondary">
                  Clue / Hint (Optional)
                </label>
                <input
                  id="hint-input"
                  type="text"
                  className="form-control"
                  placeholder="e.g. A large mammal with tusks and a trunk"
                  value={hint}
                  onChange={(e) => setHint(e.target.value)}
                  disabled={isSaving}
                  maxLength={255}
                />
                <div className="form-text small">
                  Will be shown to players when they request a hint during active gameplay.
                </div>
              </div>

              {/* Difficulty Selection */}
              <div className="mb-3">
                <label htmlFor="difficulty-select" className="form-label small fw-semibold text-secondary">
                  Difficulty Level
                </label>
                <select
                  id="difficulty-select"
                  className="form-select"
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value)}
                  disabled={isSaving}
                >
                  <option value="EASY">Easy</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HARD">Hard</option>
                </select>
              </div>

              {/* Active Toggle */}
              <div className="form-check form-switch mt-3">
                <input
                  className="form-check-input"
                  type="checkbox"
                  role="switch"
                  id="is-active-switch"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  disabled={isSaving}
                />
                <label className="form-check-label small fw-semibold text-secondary" htmlFor="is-active-switch">
                  Active for gameplay (Eligible for game selection)
                </label>
              </div>
            </div>

            <div className="modal-footer bg-light border-0 py-3 px-4">
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={onClose}
                disabled={isSaving}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary fw-semibold px-4 d-inline-flex align-items-center gap-2"
                disabled={isSaving}
              >
                {isSaving ? (
                  <>
                    <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <i className="bi bi-check2"></i>
                    <span>{isEditMode ? "Update Word" : "Add Word"}</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
