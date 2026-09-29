import React from "react";
import { Check, Pause } from "lucide-react";
import { DifficultyMeter } from "./DifficultyMeter";
import { CluePopover } from "./CluePopover";
import { WordActionMenu } from "./WordActionMenu";

/**
 * WordTableRow:
 * Compact, highly scannable 4-column table row:
 * | Word (Status Dot + Text) | Difficulty (3-Bar Meter) | Clue (1-Line + Popover) | Actions (3-Dot Menu) |
 */
export function WordTableRow({
  word,
  onOpenDrawer,
  onEdit,
  onToggleActive,
  onDelete,
}) {
  if (!word) return null;

  const isActive = Boolean(word.is_active);
  const wordText = (word.word || "").toUpperCase();
  const hintText = word.hint || "";

  return (
    <tr className={`word-table-row ${!isActive ? "row-inactive" : ""}`}>
      {/* 1. WORD: Prominent uppercase word with small availability dot / pause icon */}
      <td className="cell-word">
        <button
          type="button"
          className="btn-word-name-cell"
          onClick={() => onOpenDrawer && onOpenDrawer(word)}
          title={`Click to view details for "${wordText}"`}
        >
          <span
            className={`word-status-indicator-dot ${isActive ? "dot-active" : "dot-inactive"}`}
            aria-hidden="true"
          >
            {isActive ? (
              <span className="dot-active-core" />
            ) : (
              <Pause size={9} strokeWidth={3} className="dot-pause-icon" />
            )}
          </span>
          <span className={`word-text-label ${isActive ? "text-active" : "text-inactive"}`}>
            {wordText}
          </span>
        </button>
      </td>

      {/* 2. DIFFICULTY: 3-level visual meter (Green / Amber / Red) */}
      <td className="cell-difficulty">
        <DifficultyMeter difficulty={word.difficulty} showLabel={true} />
      </td>

      {/* 3. CLUE: 1-line preview with interactive CluePopover */}
      <td className="cell-hint">
        <CluePopover
          clue={hintText}
          word={wordText}
          onOpenDrawer={() => onOpenDrawer && onOpenDrawer(word)}
        />
      </td>

      {/* 4. ACTIONS: Compact 3-Dot Menu */}
      <td className="cell-actions">
        <WordActionMenu
          word={word}
          onEdit={onEdit}
          onViewDetails={() => onOpenDrawer && onOpenDrawer(word)}
          onToggleActive={onToggleActive}
          onDelete={onDelete}
        />
      </td>
    </tr>
  );
}
