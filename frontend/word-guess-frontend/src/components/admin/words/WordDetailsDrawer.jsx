import React, { useEffect } from "react";
import {
  X,
  Edit2,
  Power,
  Trash2,
  CheckCircle2,
  PauseCircle,
  HelpCircle,
  Trophy,
  Swords,
  Flame,
  Calendar,
  Clock,
  ShieldAlert,
  BarChart2,
} from "lucide-react";
import { DifficultyMeter } from "./DifficultyMeter";
import { formatJoinedDate, formatRelativeTime } from "../../../utils/dateUtils";

/**
 * WordDetailsDrawer:
 * Slide-over side panel displaying comprehensive metadata, full clue,
 * gameplay usage statistics (appearances, solve rate, avg attempts),
 * and administrative action controls for a selected dictionary word.
 */
export function WordDetailsDrawer({
  isOpen,
  onClose,
  word,
  onEdit,
  onToggleActive,
  onDelete,
}) {
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    }
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  if (!isOpen || !word) return null;

  const isActive = Boolean(word.is_active);
  const wordLength = word.word ? word.word.length : (word.length || 5);
  const wordText = (word.word || "").toUpperCase();

  // Usage statistics from backend or derived
  const appearances = word.appearance_count ?? 0;
  const solveRate = word.solve_rate !== null && word.solve_rate !== undefined ? `${word.solve_rate}%` : "—";
  const avgAttempts = word.average_attempts !== null && word.average_attempts !== undefined ? `${word.average_attempts}` : "—";

  return (
    <div className="drawer-overlay" role="presentation" onClick={onClose}>
      <div
        className="drawer-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="drawer-word-title"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div className="drawer-header">
          <div className="drawer-header-left">
            <div className="drawer-title-row">
              <h2 id="drawer-word-title" className="drawer-word-title">
                {wordText}
              </h2>
              <span
                className={`drawer-status-pill ${isActive ? "status-active" : "status-inactive"}`}
              >
                {isActive ? (
                  <>
                    <CheckCircle2 size={12} strokeWidth={2.4} />
                    <span>Available</span>
                  </>
                ) : (
                  <>
                    <PauseCircle size={12} strokeWidth={2.4} />
                    <span>Inactive</span>
                  </>
                )}
              </span>
            </div>
            <span className="drawer-subtitle">
              {wordLength} Letters &bull; Dictionary Item #{word.id || "—"}
            </span>
          </div>

          <button
            type="button"
            className="btn-drawer-close"
            onClick={onClose}
            aria-label="Close word details drawer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Drawer Content */}
        <div className="drawer-body">
          {/* 1. Gameplay Usage Statistics Section */}
          <div className="drawer-section">
            <div className="drawer-section-header">
              <span className="drawer-section-label">Gameplay Usage Statistics</span>
              <BarChart2 size={13} className="text-secondary" />
            </div>
            <div className="drawer-usage-stats-grid">
              <div className="drawer-usage-stat-card">
                <div className="drawer-usage-icon-wrap icon-indigo">
                  <Swords size={14} />
                </div>
                <div className="drawer-usage-info">
                  <span className="drawer-usage-value num-tabular">{appearances}</span>
                  <span className="drawer-usage-label">Appearances</span>
                </div>
              </div>

              <div className="drawer-usage-stat-card">
                <div className="drawer-usage-icon-wrap icon-green">
                  <Trophy size={14} />
                </div>
                <div className="drawer-usage-info">
                  <span className="drawer-usage-value text-success num-tabular">{solveRate}</span>
                  <span className="drawer-usage-label">Solve Rate</span>
                </div>
              </div>

              <div className="drawer-usage-stat-card">
                <div className="drawer-usage-icon-wrap icon-amber">
                  <Flame size={14} />
                </div>
                <div className="drawer-usage-info">
                  <span className="drawer-usage-value text-dark num-tabular">{avgAttempts}</span>
                  <span className="drawer-usage-label">Avg Attempts</span>
                </div>
              </div>
            </div>
          </div>

          {/* 2. Difficulty Section */}
          <div className="drawer-section">
            <span className="drawer-section-label">Difficulty Rating</span>
            <div className="drawer-diff-box">
              <DifficultyMeter difficulty={word.difficulty} showLabel={true} />
              <span className="drawer-diff-note">
                Determines letter selection algorithm weighting in match rounds.
              </span>
            </div>
          </div>

          {/* 3. Clue / Hint Section */}
          <div className="drawer-section">
            <div className="drawer-section-header">
              <span className="drawer-section-label">In-Game Clue</span>
              <HelpCircle size={14} className="text-secondary" />
            </div>
            <div className="drawer-clue-card">
              {word.hint && word.hint.trim() ? (
                <p className="drawer-clue-text">{word.hint}</p>
              ) : (
                <div className="drawer-no-clue">
                  <ShieldAlert size={16} className="text-warning" />
                  <span>No clue has been configured for this word.</span>
                </div>
              )}
            </div>
          </div>

          {/* 4. Word Properties & Metadata */}
          <div className="drawer-section">
            <span className="drawer-section-label">Dictionary Metadata</span>
            <div className="drawer-meta-grid">
              <div className="drawer-meta-item">
                <span className="drawer-meta-label">Length</span>
                <span className="drawer-meta-value num-tabular">{wordLength} Characters</span>
              </div>
              <div className="drawer-meta-item">
                <span className="drawer-meta-label">Status</span>
                <span className={`drawer-meta-value ${isActive ? "text-success" : "text-secondary"}`}>
                  {isActive ? "Active in Rotation" : "Paused / Disabled"}
                </span>
              </div>
              {word.created_at && (
                <div className="drawer-meta-item">
                  <span className="drawer-meta-label">Added Date</span>
                  <span className="drawer-meta-value">{formatJoinedDate(word.created_at)}</span>
                </div>
              )}
              {word.updated_at && (
                <div className="drawer-meta-item">
                  <span className="drawer-meta-label">Last Modified</span>
                  <span className="drawer-meta-value">{formatRelativeTime(word.updated_at)}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Drawer Action Controls */}
        <div className="drawer-footer">
          <button
            type="button"
            className="btn-drawer-action btn-drawer-edit"
            onClick={() => {
              onClose();
              onEdit(word);
            }}
          >
            <Edit2 size={14} />
            <span>Edit Word</span>
          </button>

          <button
            type="button"
            className={`btn-drawer-action ${isActive ? "btn-drawer-toggle-off" : "btn-drawer-toggle-on"}`}
            onClick={() => {
              onClose();
              onToggleActive(word);
            }}
          >
            {isActive ? (
              <>
                <PauseCircle size={14} />
                <span>Deactivate</span>
              </>
            ) : (
              <>
                <Power size={14} />
                <span>Activate</span>
              </>
            )}
          </button>

          <button
            type="button"
            className="btn-drawer-action btn-drawer-delete"
            onClick={() => {
              onClose();
              onDelete(word);
            }}
            title="Permanently remove word from dictionary"
          >
            <Trash2 size={14} />
            <span>Delete</span>
          </button>
        </div>
      </div>
    </div>
  );
}
