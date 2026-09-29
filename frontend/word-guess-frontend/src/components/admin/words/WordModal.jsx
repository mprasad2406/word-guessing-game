import React, { useEffect, useState, useRef } from "react";
import { X, Plus, Pencil, AlertCircle, Save, Check } from "lucide-react";

/**
 * WordModal:
 * Professional modal form for creating and editing dictionary words.
 * Features inline validation, hint character counter, dirty-state discard checks,
 * and keyboard accessibility.
 */
export function WordModal({
  isOpen,
  onClose,
  onSave,
  editingWord,
  isSaving = false,
}) {
  const isEditMode = Boolean(editingWord);

  const [word, setWord] = useState("");
  const [hint, setHint] = useState("");
  const [difficulty, setDifficulty] = useState("MEDIUM");
  const [isActive, setIsActive] = useState(true);

  const [errors, setErrors] = useState({});
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);

  const initialValuesRef = useRef({ word: "", hint: "", difficulty: "MEDIUM", isActive: true });

  useEffect(() => {
    if (isOpen) {
      if (editingWord) {
        const initial = {
          word: editingWord.word || "",
          hint: editingWord.hint || "",
          difficulty: editingWord.difficulty || "MEDIUM",
          isActive: editingWord.is_active !== undefined ? editingWord.is_active : true,
        };
        setWord(initial.word);
        setHint(initial.hint);
        setDifficulty(initial.difficulty);
        setIsActive(initial.isActive);
        initialValuesRef.current = initial;
      } else {
        const initial = { word: "", hint: "", difficulty: "MEDIUM", isActive: true };
        setWord("");
        setHint("");
        setDifficulty("MEDIUM");
        setIsActive(true);
        initialValuesRef.current = initial;
      }
      setErrors({});
      setShowDiscardConfirm(false);
    }
  }, [isOpen, editingWord]);

  // Check if form has unsaved modifications
  const isDirty =
    word !== initialValuesRef.current.word ||
    hint !== initialValuesRef.current.hint ||
    difficulty !== initialValuesRef.current.difficulty ||
    isActive !== initialValuesRef.current.isActive;

  const handleAttemptClose = () => {
    if (isSaving) return;
    if (isDirty && !showDiscardConfirm) {
      setShowDiscardConfirm(true);
    } else {
      onClose();
    }
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen && !isSaving) {
        handleAttemptClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isSaving, isDirty, showDiscardConfirm]);

  if (!isOpen) return null;

  const validate = () => {
    const newErrors = {};
    const trimmedWord = word.trim();

    if (!trimmedWord) {
      newErrors.word = "Word is required.";
    } else if (trimmedWord.length < 2 || trimmedWord.length > 50) {
      newErrors.word = "Word must be between 2 and 50 letters.";
    } else if (!/^[a-zA-Z]+$/.test(trimmedWord)) {
      newErrors.word = "Word must contain letters only (no spaces, numbers, or symbols).";
    }

    if (hint && hint.length > 255) {
      newErrors.hint = "Hint cannot exceed 255 characters.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSaving) return;

    if (!validate()) return;

    const payload = {
      word: word.trim().toLowerCase(),
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
      className="modal-backdrop-custom"
      role="presentation"
      onClick={handleAttemptClose}
    >
      <div
        className="modal-card-custom word-modal-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="word-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="modal-header-custom">
          <div className="d-flex align-items-center gap-2">
            <div className="modal-icon-badge badge-primary">
              {isEditMode ? <Pencil size={20} /> : <Plus size={20} />}
            </div>
            <div>
              <h2 id="word-modal-title" className="modal-title-custom">
                {isEditMode ? `Edit Word: ${editingWord.word?.toUpperCase()}` : "Add New Word"}
              </h2>
              <p className="modal-subtitle-custom">
                {isEditMode
                  ? "Update vocabulary word, clue, and difficulty settings."
                  : "Add a secret word entry to the game dictionary."}
              </p>
            </div>
          </div>

          <button
            type="button"
            className="btn-modal-close"
            onClick={handleAttemptClose}
            disabled={isSaving}
            aria-label="Close dialog"
          >
            <X size={18} />
          </button>
        </div>

        {/* Discard Changes Warning Alert */}
        {showDiscardConfirm && (
          <div className="discard-warning-banner" role="alert">
            <AlertCircle size={15} className="flex-shrink-0" />
            <div className="discard-warning-text">
              <span>You have unsaved changes. Discard them?</span>
            </div>
            <div className="discard-actions">
              <button
                type="button"
                className="btn-discard-cancel"
                onClick={() => setShowDiscardConfirm(false)}
              >
                Keep Editing
              </button>
              <button
                type="button"
                className="btn-discard-confirm"
                onClick={onClose}
              >
                Discard
              </button>
            </div>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} noValidate>
          <div className="word-form-body">
            {/* Word Input */}
            <div className="form-group-custom">
              <label htmlFor="modal-word-input" className="form-label-custom">
                Word <span className="text-danger">*</span>
              </label>
              <input
                id="modal-word-input"
                type="text"
                className={`form-input-custom font-monospace text-uppercase ${
                  errors.word ? "input-error" : ""
                }`}
                placeholder="e.g. ELEPHANT"
                value={word}
                onChange={(e) => {
                  setWord(e.target.value.toUpperCase());
                  if (errors.word) setErrors((prev) => ({ ...prev, word: null }));
                }}
                disabled={isSaving}
                maxLength={50}
                autoComplete="off"
                autoFocus={!isEditMode}
                required
                aria-describedby={errors.word ? "word-error-msg" : "word-help-msg"}
              />
              {errors.word ? (
                <span id="word-error-msg" className="form-error-msg">
                  <AlertCircle size={13} />
                  <span>{errors.word}</span>
                </span>
              ) : (
                <span id="word-help-msg" className="form-help-text">
                  Alphabetic letters only (2 to 50 characters). Casing will be normalized.
                </span>
              )}
            </div>

            {/* Difficulty Level */}
            <div className="form-group-custom">
              <label htmlFor="modal-difficulty-select" className="form-label-custom">
                Difficulty Level <span className="text-danger">*</span>
              </label>
              <select
                id="modal-difficulty-select"
                className="form-select-custom"
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                disabled={isSaving}
              >
                <option value="EASY">Easy</option>
                <option value="MEDIUM">Medium</option>
                <option value="HARD">Hard</option>
              </select>
            </div>

            {/* Clue / Hint */}
            <div className="form-group-custom">
              <div className="d-flex justify-content-between align-items-center mb-1">
                <label htmlFor="modal-hint-input" className="form-label-custom mb-0">
                  Clue / Hint (Optional)
                </label>
                <span className="char-counter num-tabular">
                  {hint.length} / 255
                </span>
              </div>
              <textarea
                id="modal-hint-input"
                className={`form-textarea-custom ${errors.hint ? "input-error" : ""}`}
                placeholder="e.g. A large mammal with tusks and a trunk"
                value={hint}
                onChange={(e) => {
                  setHint(e.target.value);
                  if (errors.hint) setErrors((prev) => ({ ...prev, hint: null }));
                }}
                disabled={isSaving}
                maxLength={255}
                rows={2}
                aria-describedby={errors.hint ? "hint-error-msg" : "hint-help-msg"}
              />
              {errors.hint ? (
                <span id="hint-error-msg" className="form-error-msg">
                  <AlertCircle size={13} />
                  <span>{errors.hint}</span>
                </span>
              ) : (
                <span id="hint-help-msg" className="form-help-text">
                  Clue revealed to players when requesting a hint during gameplay.
                </span>
              )}
            </div>

            {/* Availability Toggle */}
            <div className="form-toggle-row">
              <label className="switch-container" htmlFor="modal-active-switch">
                <input
                  type="checkbox"
                  id="modal-active-switch"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  disabled={isSaving}
                />
                <span className="switch-slider" />
              </label>
              <label htmlFor="modal-active-switch" className="toggle-label-text">
                <strong>Active for Gameplay</strong>
                <span>Eligible to be selected as secret target word for new matches.</span>
              </label>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="modal-footer-custom">
            <button
              type="button"
              className="btn-modal-cancel"
              onClick={handleAttemptClose}
              disabled={isSaving}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-modal-confirm-primary"
              disabled={isSaving}
            >
              {isSaving ? (
                <>
                  <span className="submit-spinner" aria-hidden="true" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save size={15} />
                  <span>{isEditMode ? "Save Changes" : "Add Word"}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
