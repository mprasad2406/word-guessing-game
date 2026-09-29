import React from "react";
import { Trophy, XCircle, Clock, Activity, Calendar, Award } from "lucide-react";
import { formatServerDate } from "../../utils/dateUtils";

/**
 * GameSummaryCard:
 * Displays a compact overview of the game ID, status badge, revealed secret word, and timestamps.
 */
export function GameSummaryCard({ gameState }) {
  if (!gameState) return null;

  const { id, status, final_word, started_at, completed_at, word_length } = gameState;

  const getStatusBadge = () => {
    switch (status) {
      case "WON":
        return (
          <span
            className="badge d-inline-flex align-items-center gap-1.5 px-3 py-1.5 rounded-pill"
            style={{ backgroundColor: "#dcfce7", color: "#15803d", border: "1px solid #bbf7d0", fontSize: "0.8125rem", fontWeight: "700" }}
          >
            <Trophy size={14} strokeWidth={2.5} />
            <span>Won</span>
          </span>
        );
      case "LOST":
        return (
          <span
            className="badge d-inline-flex align-items-center gap-1.5 px-3 py-1.5 rounded-pill"
            style={{ backgroundColor: "#fee2e2", color: "#dc2626", border: "1px solid #fecaca", fontSize: "0.8125rem", fontWeight: "700" }}
          >
            <XCircle size={14} strokeWidth={2.5} />
            <span>Lost</span>
          </span>
        );
      case "EXPIRED":
        return (
          <span
            className="badge d-inline-flex align-items-center gap-1.5 px-3 py-1.5 rounded-pill"
            style={{ backgroundColor: "#fef3c7", color: "#d97706", border: "1px solid #fde68a", fontSize: "0.8125rem", fontWeight: "700" }}
          >
            <Clock size={14} strokeWidth={2.5} />
            <span>Expired</span>
          </span>
        );
      case "ACTIVE":
      default:
        return (
          <span
            className="badge d-inline-flex align-items-center gap-1.5 px-3 py-1.5 rounded-pill"
            style={{ backgroundColor: "#eff6ff", color: "#2563eb", border: "1px solid #bfdbfe", fontSize: "0.8125rem", fontWeight: "700" }}
          >
            <Activity size={14} strokeWidth={2.5} />
            <span>Active</span>
          </span>
        );
    }
  };

  const wordLetters = final_word ? final_word.toUpperCase().split("") : [];

  return (
    <div className="card shadow-sm border-0 rounded-4 p-4 bg-white mb-4">
      {/* Top Header Row */}
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 pb-3 border-bottom">
        <div>
          <span className="text-uppercase text-muted fw-bold" style={{ fontSize: "0.75rem", letterSpacing: "0.06em" }}>
            Overview
          </span>
          <h2 className="fw-bold text-dark mb-0" style={{ fontSize: "1.25rem" }}>
            Match Summary
          </h2>
        </div>
        <div>{getStatusBadge()}</div>
      </div>

      {/* Secret Word Showcase Box */}
      <div className="text-center py-4 my-3 rounded-4" style={{ backgroundColor: "#f8fafc", border: "1px solid #e2e8f0" }}>
        <div className="text-muted small fw-bold text-uppercase mb-2" style={{ letterSpacing: "0.06em" }}>
          {final_word ? "Secret Word" : "Target Word"}
        </div>

        {final_word ? (
          <div className="d-flex justify-content-center gap-2">
            {wordLetters.map((letter, idx) => (
              <div
                key={idx}
                style={{
                  width: "44px",
                  height: "44px",
                  borderRadius: "8px",
                  backgroundColor: "#ffffff",
                  border: "2px solid #2563eb",
                  color: "#2563eb",
                  fontWeight: "800",
                  fontSize: "1.25rem",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 2px 4px rgba(37,99,235,0.1)",
                }}
              >
                {letter}
              </div>
            ))}
          </div>
        ) : (
          <div className="d-flex justify-content-center gap-2">
            {Array.from({ length: word_length || 5 }).map((_, idx) => (
              <div
                key={idx}
                style={{
                  width: "44px",
                  height: "44px",
                  borderRadius: "8px",
                  backgroundColor: "#ffffff",
                  border: "2px dashed #94a3b8",
                  color: "#94a3b8",
                  fontWeight: "800",
                  fontSize: "1.25rem",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                ?
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Dates Row */}
      <div className="row g-2 pt-1 text-muted" style={{ fontSize: "0.875rem" }}>
        <div className="col-sm-6 d-flex align-items-center gap-2">
          <Calendar size={15} className="text-secondary" />
          <span>Started:</span>
          <strong className="text-dark">{formatServerDate(started_at)}</strong>
        </div>

        <div className="col-sm-6 d-flex align-items-center gap-2">
          <Award size={15} className="text-secondary" />
          <span>Ended:</span>
          <strong className="text-dark">
            {completed_at ? formatServerDate(completed_at) : "In Progress"}
          </strong>
        </div>
      </div>
    </div>
  );
}
