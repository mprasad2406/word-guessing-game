import React from "react";
import { BookOpen, SearchX, Plus, RotateCcw, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { WordTableRow } from "./WordTableRow";
import { WordAvailabilityIndicator } from "./WordAvailabilityIndicator";
import { WordDifficultyBadge } from "./WordDifficultyBadge";
import { WordActionMenu } from "./WordActionMenu";

/**
 * WordTable:
 * 4-column dictionary management table with interactive column sorting,
 * legend, responsive cards, skeleton loading rows, and empty state fallbacks.
 */
export function WordTable({
  words = [],
  isLoading = false,
  isFiltered = false,
  sortField = "id",
  sortDirection = "desc",
  onSort,
  onClearFilters,
  onAddWord,
  onEditWord,
  onToggleActive,
  onDeleteWord,
}) {
  const renderSortIcon = (field) => {
    if (sortField !== field) {
      return <ArrowUpDown size={12} className="sort-icon-neutral" aria-hidden="true" />;
    }
    return sortDirection === "asc" ? (
      <ArrowUp size={12} className="sort-icon-active" aria-hidden="true" />
    ) : (
      <ArrowDown size={12} className="sort-icon-active" aria-hidden="true" />
    );
  };

  const getAriaSort = (field) => {
    if (sortField !== field) return "none";
    return sortDirection === "asc" ? "ascending" : "descending";
  };

  return (
    <div className="word-table-card">
      {/* Table Legend Header */}
      <div className="word-table-legend-bar">
        <span className="legend-label">Legend:</span>
        <div className="legend-item">
          <span className="legend-dot dot-available" aria-hidden="true" />
          <span>Available for gameplay</span>
        </div>
        <div className="legend-item">
          <span className="legend-dot dot-inactive" aria-hidden="true" />
          <span>Inactive</span>
        </div>
      </div>

      {/* Desktop & Tablet Table View */}
      <div className="table-responsive-wrapper">
        <table className="admin-word-table">
          <thead>
            <tr>
              {/* 1. WORD (Sortable) */}
              <th scope="col" className="th-word" aria-sort={getAriaSort("word")}>
                <button
                  type="button"
                  className="th-sort-button"
                  onClick={() => onSort && onSort("word")}
                  aria-label="Sort by Word"
                >
                  <span>Word</span>
                  {renderSortIcon("word")}
                </button>
              </th>

              {/* 2. DIFFICULTY (Sortable) */}
              <th scope="col" className="th-difficulty" aria-sort={getAriaSort("difficulty")}>
                <button
                  type="button"
                  className="th-sort-button"
                  onClick={() => onSort && onSort("difficulty")}
                  aria-label="Sort by Difficulty"
                >
                  <span>Difficulty</span>
                  {renderSortIcon("difficulty")}
                </button>
              </th>

              {/* 3. CLUE / HINT (Sortable) */}
              <th scope="col" className="th-hint" aria-sort={getAriaSort("hint")}>
                <button
                  type="button"
                  className="th-sort-button"
                  onClick={() => onSort && onSort("hint")}
                  aria-label="Sort by Clue"
                >
                  <span>Clue / Hint</span>
                  {renderSortIcon("hint")}
                </button>
              </th>

              {/* 4. ACTIONS */}
              <th scope="col" className="th-actions">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              // Skeleton Loading Rows
              Array.from({ length: 6 }).map((_, idx) => (
                <tr key={idx} className="skeleton-row" aria-hidden="true">
                  <td>
                    <span className="skeleton-box" style={{ width: "100px", height: "26px", borderRadius: "6px" }} />
                  </td>
                  <td>
                    <span className="skeleton-box" style={{ width: "70px", height: "22px", borderRadius: "9999px" }} />
                  </td>
                  <td>
                    <span className="skeleton-box" style={{ width: "220px", height: "16px" }} />
                  </td>
                  <td className="text-end">
                    <span className="skeleton-box" style={{ width: "32px", height: "32px", borderRadius: "6px", marginLeft: "auto" }} />
                  </td>
                </tr>
              ))
            ) : words.length === 0 ? (
              // Empty State
              <tr>
                <td colSpan={4} className="table-empty-cell">
                  {isFiltered ? (
                    <div className="empty-state-content">
                      <div className="empty-icon-circle">
                        <SearchX size={26} className="text-secondary opacity-75" />
                      </div>
                      <h3 className="empty-state-heading">No matching words found</h3>
                      <p className="empty-state-subtext">
                        No vocabulary words match your search or filter settings.
                      </p>
                      {onClearFilters && (
                        <button
                          type="button"
                          className="btn-empty-clear"
                          onClick={onClearFilters}
                          aria-label="Clear active filters"
                        >
                          <RotateCcw size={14} />
                          <span>Clear Filters</span>
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="empty-state-content">
                      <div className="empty-icon-circle icon-indigo-bg">
                        <BookOpen size={26} className="text-primary" />
                      </div>
                      <h3 className="empty-state-heading">No words in dictionary</h3>
                      <p className="empty-state-subtext">
                        Your game dictionary is currently empty. Add your first word to begin matches.
                      </p>
                      {onAddWord && (
                        <button
                          type="button"
                          className="btn-empty-add"
                          onClick={onAddWord}
                          aria-label="Add your first word"
                        >
                          <Plus size={15} strokeWidth={2.5} />
                          <span>Add First Word</span>
                        </button>
                      )}
                    </div>
                  )}
                </td>
              </tr>
            ) : (
              // Word Rows
              words.map((word) => (
                <WordTableRow
                  key={word.id}
                  word={word}
                  onEdit={onEditWord}
                  onToggleActive={onToggleActive}
                  onDelete={onDeleteWord}
                />
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Card List View (Visible on small screens) */}
      <div className="word-mobile-cards-list">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, idx) => (
            <div key={idx} className="word-mobile-card skeleton-row">
              <div className="mobile-card-top">
                <span className="skeleton-box" style={{ width: "90px", height: "24px" }} />
                <span className="skeleton-box" style={{ width: "60px", height: "20px" }} />
              </div>
              <span className="skeleton-box" style={{ width: "100%", height: "16px" }} />
            </div>
          ))
        ) : words.length === 0 ? (
          <div className="table-empty-cell p-4">
            <p className="empty-state-subtext mb-0">No words found.</p>
          </div>
        ) : (
          words.map((word) => (
            <div
              key={word.id}
              className={`word-mobile-card ${!word.is_active ? "card-inactive" : ""}`}
            >
              <div className="mobile-card-top">
                <WordAvailabilityIndicator word={word.word} isActive={Boolean(word.is_active)} />
                <div className="d-flex align-items-center gap-2">
                  <WordDifficultyBadge difficulty={word.difficulty} />
                  <WordActionMenu
                    word={word}
                    onEdit={onEditWord}
                    onToggleActive={onToggleActive}
                    onDelete={onDeleteWord}
                  />
                </div>
              </div>
              <div className="mobile-card-clue">
                <span className="mobile-clue-label">Clue:</span>
                <span className="mobile-clue-text">{word.hint || "No definition set"}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
