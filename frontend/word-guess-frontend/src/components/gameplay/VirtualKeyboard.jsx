import React, { useMemo, useState } from "react";
import { Keyboard, Delete, CornerDownLeft, ChevronDown, ChevronUp } from "lucide-react";

const QWERTY_ROWS = [
  ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
  ["A", "S", "D", "F", "G", "H", "J", "K", "L"],
  ["ENTER", "Z", "X", "C", "V", "B", "N", "M", "BACKSPACE"],
];

/**
 * VirtualKeyboard:
 * Interactive, full QWERTY on-screen keyboard for active gameplay.
 * Features:
 * - Dynamic color status marking based on previous guesses:
 *   - Green: Correct letter & position
 *   - Orange/Amber: Letter present in word, wrong position
 *   - Gray: Letter absent from word
 * - Collapsible toggle with memory
 * - Fully clickable letter, Enter, and Backspace keys
 */
export function VirtualKeyboard({
  guesses = [],
  onKeyClick,
  onBackspace,
  onSubmit,
  disabled = false,
  isSubmitting = false,
}) {
  const [isOpen, setIsOpen] = useState(true);

  // Compute status map for letters A-Z based on previous guesses
  const keyStatuses = useMemo(() => {
    const statuses = {};

    if (!Array.isArray(guesses)) return statuses;

    guesses.forEach((guessItem) => {
      const word = (guessItem.guess || "").toUpperCase();
      const feedback = guessItem.letter_feedback || [];

      for (let i = 0; i < word.length; i++) {
        const char = word[i];
        const status = feedback[i];

        if (!char || !status) continue;

        // Correct (Green) has the highest priority
        if (status === "correct") {
          statuses[char] = "correct";
        }
        // Present (Orange/Amber) applies only if not already marked correct
        else if (status === "present") {
          if (statuses[char] !== "correct") {
            statuses[char] = "present";
          }
        }
        // Absent (Gray) applies only if not already marked correct or present
        else if (status === "absent") {
          if (!statuses[char]) {
            statuses[char] = "absent";
          }
        }
      }
    });

    return statuses;
  }, [guesses]);

  const handleKeyClick = (key) => {
    if (disabled || isSubmitting) return;

    if (key === "ENTER") {
      onSubmit?.();
    } else if (key === "BACKSPACE" || key === "⌫") {
      onBackspace?.();
    } else {
      onKeyClick?.(key);
    }
  };

  return (
    <div className="virtual-keyboard-wrapper" aria-label="On-Screen Keyboard">
      {/* Keyboard Header / Toggle Bar */}
      <div className="keyboard-header-bar">
        <button
          type="button"
          className="btn-toggle-keyboard"
          onClick={() => setIsOpen((prev) => !prev)}
          aria-expanded={isOpen}
          title={isOpen ? "Hide On-Screen Keyboard" : "Show On-Screen Keyboard"}
        >
          <Keyboard size={16} />
          <span className="keyboard-toggle-label">On-Screen Keyboard</span>
          <span className="keyboard-toggle-badge">
            {isOpen ? "Visible" : "Hidden"}
          </span>
          {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>

        {/* Legend Indicators */}
        <div className="keyboard-mini-legend" aria-hidden="true">
          <span className="kb-legend-item">
            <span className="kb-legend-dot dot-correct" /> Green = Correct
          </span>
          <span className="kb-legend-item">
            <span className="kb-legend-dot dot-present" /> Orange = In Word
          </span>
          <span className="kb-legend-item">
            <span className="kb-legend-dot dot-absent" /> Gray = Absent
          </span>
        </div>
      </div>

      {/* Expandable Keyboard Grid */}
      {isOpen && (
        <div className="virtual-keyboard-body" role="group" aria-label="Virtual QWERTY Keyboard">
          {QWERTY_ROWS.map((row, rowIdx) => (
            <div key={`kb-row-${rowIdx}`} className="virtual-keyboard-row">
              {row.map((key) => {
                const isEnter = key === "ENTER";
                const isBackspace = key === "BACKSPACE";
                const status = keyStatuses[key] || "default";

                let keyClasses = "virtual-key";
                if (isEnter) keyClasses += " key-enter";
                else if (isBackspace) keyClasses += " key-backspace";
                else keyClasses += ` key-${status}`;

                return (
                  <button
                    key={key}
                    type="button"
                    className={keyClasses}
                    onClick={() => handleKeyClick(key)}
                    disabled={disabled || isSubmitting}
                    aria-label={
                      isEnter
                        ? "Submit Guess"
                        : isBackspace
                        ? "Backspace"
                        : `Letter ${key}, status: ${status}`
                    }
                  >
                    {isEnter ? (
                      <span className="key-action-content">
                        <span>ENTER</span>
                        <CornerDownLeft size={13} />
                      </span>
                    ) : isBackspace ? (
                      <span className="key-action-content">
                        <Delete size={16} />
                      </span>
                    ) : (
                      key
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
