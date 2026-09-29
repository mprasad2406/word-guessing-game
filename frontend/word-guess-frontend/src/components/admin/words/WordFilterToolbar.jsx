import React from "react";
import { Search, X, Filter, RotateCcw } from "lucide-react";

/**
 * WordFilterToolbar:
 * Structured search and filter bar for the word management table.
 * Contains dominant search input, status filter, difficulty filter, active filter indicators,
 * and clear filters action.
 */
export function WordFilterToolbar({
  searchTerm = "",
  onSearchChange,
  statusFilter = "ALL",
  onStatusChange,
  difficultyFilter = "ALL",
  onDifficultyChange,
  onClearFilters,
  totalMatching = 0,
  isLoading = false,
}) {
  const isFiltered =
    Boolean(searchTerm) || statusFilter !== "ALL" || difficultyFilter !== "ALL";

  const activeFiltersCount =
    (statusFilter !== "ALL" ? 1 : 0) + (difficultyFilter !== "ALL" ? 1 : 0);

  return (
    <div className="word-toolbar-card" role="search" aria-label="Word search and filters">
      <div className="word-toolbar-row">
        {/* Dominant Search Input */}
        <div className="word-search-wrapper">
          <Search size={15} className="search-icon" aria-hidden="true" />
          <input
            id="word-search-input"
            type="text"
            className="word-search-input"
            placeholder="Search words or clues..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            disabled={isLoading}
            autoComplete="off"
            aria-label="Search dictionary words or clues"
          />
          {searchTerm && (
            <button
              type="button"
              className="btn-search-clear"
              onClick={() => onSearchChange("")}
              aria-label="Clear search input"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Filter Controls Group */}
        <div className="word-filters-group">
          {/* Status Filter */}
          <div className={`filter-select-wrapper ${statusFilter !== "ALL" ? "filter-active" : ""}`}>
            <label htmlFor="status-filter-select" className="visually-hidden">
              Filter by status
            </label>
            <select
              id="status-filter-select"
              className="word-filter-select"
              value={statusFilter}
              onChange={(e) => onStatusChange(e.target.value)}
              disabled={isLoading}
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active Only</option>
              <option value="INACTIVE">Inactive Only</option>
            </select>
          </div>

          {/* Difficulty Filter */}
          <div className={`filter-select-wrapper ${difficultyFilter !== "ALL" ? "filter-active" : ""}`}>
            <label htmlFor="difficulty-filter-select" className="visually-hidden">
              Filter by difficulty
            </label>
            <select
              id="difficulty-filter-select"
              className="word-filter-select"
              value={difficultyFilter}
              onChange={(e) => onDifficultyChange(e.target.value)}
              disabled={isLoading}
            >
              <option value="ALL">All Difficulties</option>
              <option value="EASY">Easy</option>
              <option value="MEDIUM">Medium</option>
              <option value="HARD">Hard</option>
            </select>
          </div>

          {/* Clear Filters Button */}
          {isFiltered && (
            <button
              type="button"
              className="btn-clear-filters"
              onClick={onClearFilters}
              disabled={isLoading}
              aria-label="Reset all search queries and filters"
            >
              <RotateCcw size={13} />
              <span>Clear</span>
              {activeFiltersCount > 0 && (
                <span className="clear-filter-count">({activeFiltersCount})</span>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Matching Count Strip */}
      <div className="word-toolbar-count-row">
        <span className="matching-count-text">
          {isFiltered ? (
            <>
              Found <strong className="num-tabular">{totalMatching}</strong> matching{" "}
              {totalMatching === 1 ? "word" : "words"}
            </>
          ) : (
            <>
              Total of <strong className="num-tabular">{totalMatching}</strong>{" "}
              {totalMatching === 1 ? "word" : "words"} in dictionary
            </>
          )}
        </span>
      </div>
    </div>
  );
}
