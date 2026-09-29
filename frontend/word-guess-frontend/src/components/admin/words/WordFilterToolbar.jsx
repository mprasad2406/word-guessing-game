import React from "react";
import { Search, X, RotateCcw, ArrowUpDown } from "lucide-react";

/**
 * WordFilterToolbar:
 * Compact search, filter, and sorting toolbar for Word Management:
 * - Search by word or clue with clear button
 * - Status dropdown (All, Available, Inactive)
 * - Difficulty dropdown (All, Easy, Medium, Hard)
 * - Sort dropdown (A-Z, Z-A, Difficulty, Newest, Oldest)
 * - Clear Filters action
 * - Active filter chips with quick dismiss
 */
export function WordFilterToolbar({
  searchTerm = "",
  onSearchChange,
  statusFilter = "ALL",
  onStatusChange,
  difficultyFilter = "ALL",
  onDifficultyChange,
  sortBy = "alphabetical_asc",
  onSortChange,
  onClearFilters,
  totalMatching = 0,
  isLoading = false,
}) {
  const isFiltered =
    Boolean(searchTerm) ||
    statusFilter !== "ALL" ||
    difficultyFilter !== "ALL" ||
    (sortBy && sortBy !== "alphabetical_asc" && sortBy !== "id_desc");

  return (
    <div className="word-toolbar-card" role="search" aria-label="Word search and filters">
      <div className="word-toolbar-row">
        {/* 1. Search Input */}
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

        {/* 2. Filter & Sort Controls Group */}
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
              <option value="ACTIVE">Available Only</option>
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

          {/* Sort Selector */}
          {onSortChange && (
            <div className="filter-select-wrapper">
              <label htmlFor="word-sort-select" className="visually-hidden">
                Sort words by
              </label>
              <select
                id="word-sort-select"
                className="word-filter-select"
                value={sortBy}
                onChange={(e) => onSortChange(e.target.value)}
                disabled={isLoading}
              >
                <option value="alphabetical_asc">Alphabetical (A–Z)</option>
                <option value="alphabetical_desc">Alphabetical (Z–A)</option>
                <option value="difficulty">Difficulty Level</option>
                <option value="newest">Newest Added</option>
                <option value="oldest">Oldest Added</option>
              </select>
            </div>
          )}

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
            </button>
          )}
        </div>
      </div>

      {/* 3. Filter Chips (Rendered only when filters are active) */}
      {isFiltered && (
        <div className="word-filter-chips-row">
          <span className="filter-chips-label">Active:</span>
          {searchTerm && (
            <span className="filter-chip">
              <span>Search: "{searchTerm}"</span>
              <button
                type="button"
                className="btn-chip-remove"
                onClick={() => onSearchChange("")}
                aria-label="Remove search filter"
              >
                <X size={11} />
              </button>
            </span>
          )}
          {statusFilter !== "ALL" && (
            <span className="filter-chip">
              <span>Status: {statusFilter === "ACTIVE" ? "Available" : "Inactive"}</span>
              <button
                type="button"
                className="btn-chip-remove"
                onClick={() => onStatusChange("ALL")}
                aria-label="Remove status filter"
              >
                <X size={11} />
              </button>
            </span>
          )}
          {difficultyFilter !== "ALL" && (
            <span className="filter-chip">
              <span>Difficulty: {difficultyFilter}</span>
              <button
                type="button"
                className="btn-chip-remove"
                onClick={() => onDifficultyChange("ALL")}
                aria-label="Remove difficulty filter"
              >
                <X size={11} />
              </button>
            </span>
          )}
        </div>
      )}

      {/* 4. Matching Count Strip */}
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
