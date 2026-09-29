import React, { useState } from "react";
import { ChevronDown, ChevronUp, Info } from "lucide-react";
import { WordAvailabilityIndicator } from "./WordAvailabilityIndicator";
import { WordDifficultyBadge } from "./WordDifficultyBadge";
import { WordActionMenu } from "./WordActionMenu";
import { parseServerDate } from "../../../utils/dateUtils";

/**
 * Helper to determine if a clue is a generic placeholder vs a meaningful definition.
 */
function checkIsGenericClue(clue) {
  if (!clue || typeof clue !== "string") return true;
  const trimmed = clue.trim().toLowerCase();
  if (!trimmed || trimmed === "none" || trimmed === "no clue provided") return true;
  if (/^a?\s*\d+[\s-]letter\s+word(\s*\((easy|medium|hard)\))?$/i.test(trimmed)) return true;
  if (/^\d+[\s-]letters?(\s*\((easy|medium|hard)\))?$/i.test(trimmed)) return true;
  return false;
}

/**
 * WordTableRow:
 * Streamlined 4-column table row:
 * | WORD (Color-coded) | DIFFICULTY | CLUE / HINT | ACTIONS (3-Dot Menu) |
 */
export function WordTableRow({
  word,
  onEdit,
  onToggleActive,
  onDelete,
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!word) return null;

  const isActive = Boolean(word.is_active);
  const hintText = word.hint || "";
  const isGeneric = checkIsGenericClue(hintText);
  const isLongHint = hintText.length > 60;

  const formattedDate = word.created_at
    ? parseServerDate(word.created_at)?.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : null;

  return (
    <>
      <tr className={`word-table-row ${!isActive ? "row-inactive" : ""} ${isExpanded ? "row-expanded" : ""}`}>
        {/* 1. WORD (Color-coded availability indicator) */}
        <td className="cell-word">
          <WordAvailabilityIndicator word={word.word} isActive={isActive} />
        </td>

        {/* 2. DIFFICULTY */}
        <td className="cell-difficulty">
          <WordDifficultyBadge difficulty={word.difficulty} />
        </td>

        {/* 3. CLUE / HINT */}
        <td className="cell-hint">
          {isGeneric ? (
            <div className="clue-generic-wrapper">
              <span className="generic-clue-badge">Generic clue</span>
              <span className="clue-text generic-text" title={hintText}>
                {hintText || "No definition set"}
              </span>
            </div>
          ) : (
            <div className="clue-meaningful-wrapper">
              <span className="clue-text meaningful-text" title={hintText}>
                {hintText}
              </span>
              {isLongHint && (
                <button
                  type="button"
                  className="btn-toggle-hint-expand"
                  onClick={() => setIsExpanded(!isExpanded)}
                  aria-expanded={isExpanded}
                  aria-label={isExpanded ? "Collapse clue" : "Expand clue"}
                >
                  {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                  <span>{isExpanded ? "Less" : "More"}</span>
                </button>
              )}
            </div>
          )}
        </td>

        {/* 4. ACTIONS (3-Dot Menu) */}
        <td className="cell-actions">
          <WordActionMenu
            word={word}
            onEdit={onEdit}
            onToggleActive={onToggleActive}
            onDelete={onDelete}
          />
        </td>
      </tr>

      {/* Expandable Clue & Metadata Panel */}
      {isExpanded && (
        <tr className="word-expanded-details-row">
          <td colSpan={4}>
            <div className="expanded-details-panel">
              <div className="expanded-details-header">
                <Info size={14} className="text-primary" />
                <span className="expanded-title">Full Clue & Word Metadata</span>
              </div>
              <p className="expanded-hint-content">{hintText}</p>
              <div className="expanded-meta-row">
                <span className="meta-item">
                  Length: <strong className="num-tabular">{word.word?.length} letters</strong>
                </span>
                <span className="meta-item">
                  Internal ID: <strong className="num-tabular">#{word.id}</strong>
                </span>
                {formattedDate && (
                  <span className="meta-item">
                    Added: <strong>{formattedDate}</strong>
                  </span>
                )}
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
