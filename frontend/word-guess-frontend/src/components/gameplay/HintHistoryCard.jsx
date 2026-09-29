import React from "react";
import { Lightbulb, Info } from "lucide-react";

/**
 * HintHistoryCard:
 * Displays revealed hints or an informative note if no hints were used.
 */
export function HintHistoryCard({ gameState }) {
  if (!gameState) return null;

  const { revealed_hint, hints_used, max_hints } = gameState;
  const hasHint = Boolean(revealed_hint);

  return (
    <div className="card shadow-sm border-0 rounded-4 p-4 bg-white mb-4">
      <div className="d-flex align-items-center justify-content-between pb-3 mb-3 border-bottom">
        <div className="d-flex align-items-center gap-2">
          <div
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "8px",
              backgroundColor: "#fef3c7",
              color: "#d97706",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Lightbulb size={18} />
          </div>
          <h3 className="mb-0 fw-bold text-dark" style={{ fontSize: "1.0625rem" }}>
            Hint History
          </h3>
        </div>

        <span className="badge bg-light text-secondary border px-2.5 py-1" style={{ fontSize: "0.75rem", fontWeight: "700" }}>
          {hints_used} / {max_hints} Used
        </span>
      </div>

      {hasHint ? (
        <div
          className="p-3 rounded-3"
          style={{ backgroundColor: "#fffbeb", border: "1px solid #fef3c7" }}
        >
          <div className="d-flex align-items-center gap-1.5 text-warning fw-bold small text-uppercase mb-1" style={{ color: "#b45309" }}>
            <Lightbulb size={14} />
            <span>Unlocked Clue</span>
          </div>
          <p className="mb-0 fw-semibold text-dark" style={{ fontSize: "0.9375rem", fontStyle: "italic" }}>
            "{revealed_hint}"
          </p>
        </div>
      ) : (
        <div className="d-flex align-items-start gap-2.5 text-muted p-2" style={{ fontSize: "0.875rem" }}>
          <Info size={16} className="text-secondary flex-shrink-0 mt-0.5" />
          <span>No hints were requested during this game session.</span>
        </div>
      )}
    </div>
  );
}
