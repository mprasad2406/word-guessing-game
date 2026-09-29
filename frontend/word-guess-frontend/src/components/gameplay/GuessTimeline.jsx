import React, { useState } from "react";
import { Clock, Check, X, ChevronDown, ChevronUp } from "lucide-react";
import { calculateAttemptElapsedSec, formatDuration } from "../../utils/dateUtils";

/**
 * GuessTimeline:
 * Provides a chronological breakdown of each recorded attempt with letter chips and elapsed timestamps.
 * Supports optional collapsible behavior for admin inspection views.
 */
export function GuessTimeline({
  guesses = [],
  startedAt = null,
  completedAt = null,
  collapsible = false,
  defaultOpen = true,
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  if (!guesses || guesses.length === 0) return null;

  return (
    <div className="card shadow-sm border-0 rounded-4 overflow-hidden bg-white mb-4">
      <div
        className={`card-header bg-white py-3 px-4 border-bottom d-flex justify-content-between align-items-center ${
          collapsible ? "cursor-pointer user-select-none" : ""
        }`}
        onClick={collapsible ? () => setIsOpen((prev) => !prev) : undefined}
        role={collapsible ? "button" : undefined}
        aria-expanded={collapsible ? isOpen : undefined}
      >
        <h3
          className="mb-0 fw-bold text-dark d-flex align-items-center gap-2"
          style={{ fontSize: "1.0625rem" }}
        >
          <Clock size={18} className="text-primary" />
          <span>Attempt-by-Attempt Breakdown</span>
        </h3>

        <div className="d-flex align-items-center gap-2">
          <span
            className="badge bg-light text-secondary border px-2.5 py-1"
            style={{ fontSize: "0.75rem", fontWeight: "700" }}
          >
            {guesses.length} Attempt{guesses.length === 1 ? "" : "s"}
          </span>

          {collapsible && (
            <button
              type="button"
              className="btn btn-sm btn-link text-secondary p-0 ms-1 d-flex align-items-center"
              aria-label={isOpen ? "Collapse breakdown" : "Expand breakdown"}
              tabIndex={-1}
            >
              {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </button>
          )}
        </div>
      </div>

      {isOpen && (
        <div className="card-body p-0">
          <div className="list-group list-group-flush">
            {guesses.map((item, index) => {
              const attemptNum = item.attempt_number || index + 1;
              const guessWord = (item.guess || "").toUpperCase();
              const feedback = item.letter_feedback || [];
              const isCorrect = item.is_correct;

              // Calculate elapsed time from start
              const elapsedSec = calculateAttemptElapsedSec(
                item.created_at,
                startedAt,
                completedAt
              );

              return (
                <div
                  key={attemptNum}
                  className="list-group-item p-3 px-4 d-flex flex-wrap justify-content-between align-items-center gap-3 border-bottom"
                >
                  {/* Left: Attempt Number & Guess Word with Letter Badges */}
                  <div className="d-flex flex-wrap align-items-center gap-3">
                    <span
                      className="badge bg-light text-secondary border rounded-pill px-2.5 py-1 font-monospace"
                      style={{ fontSize: "0.8125rem", fontWeight: "700" }}
                    >
                      #{attemptNum}
                    </span>

                    {/* Letter Chips */}
                    <div className="d-flex gap-1.5 align-items-center">
                      {guessWord.split("").map((letter, idx) => {
                        const status = feedback[idx] || "absent";
                        let bg = "#475569";
                        let label = "Absent";

                        if (status === "correct") {
                          bg = "#15803d";
                          label = "Correct";
                        } else if (status === "present") {
                          bg = "#d97706";
                          label = "Present";
                        }

                        return (
                          <span
                            key={idx}
                            style={{
                              width: "28px",
                              height: "28px",
                              borderRadius: "6px",
                              backgroundColor: bg,
                              color: "#ffffff",
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontWeight: "800",
                              fontSize: "0.875rem",
                            }}
                            title={`${letter} (${label})`}
                          >
                            {letter}
                          </span>
                        );
                      })}
                    </div>
                  </div>

                  {/* Right: Status & Timing (Clearly labeled as elapsed time since start) */}
                  <div className="d-flex align-items-center gap-3">
                    {elapsedSec != null && (
                      <span
                        className="small text-muted font-monospace d-inline-flex align-items-center gap-1"
                        title={`Elapsed time since match began: ${formatDuration(elapsedSec)}`}
                      >
                        <span style={{ fontSize: "0.6875rem", color: "#94a3b8" }}>Elapsed:</span>
                        <span>+{formatDuration(elapsedSec)}</span>
                      </span>
                    )}

                    {isCorrect ? (
                      <span
                        className="badge d-inline-flex align-items-center gap-1 px-2.5 py-1"
                        style={{
                          backgroundColor: "#dcfce7",
                          color: "#15803d",
                          border: "1px solid #bbf7d0",
                          fontSize: "0.75rem",
                          fontWeight: "700",
                        }}
                      >
                        <Check size={12} strokeWidth={3} />
                        <span>Solved</span>
                      </span>
                    ) : (
                      <span
                        className="badge d-inline-flex align-items-center gap-1 px-2.5 py-1"
                        style={{
                          backgroundColor: "#f1f5f9",
                          color: "#64748b",
                          border: "1px solid #e2e8f0",
                          fontSize: "0.75rem",
                          fontWeight: "600",
                        }}
                      >
                        <X size={12} strokeWidth={2.5} />
                        <span>Incorrect</span>
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
