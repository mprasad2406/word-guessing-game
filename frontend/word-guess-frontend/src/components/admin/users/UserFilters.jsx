import React from "react";
import { Search, X, RotateCcw } from "lucide-react";

/**
 * UserFilters:
 * Clean, responsive search and filter toolbar for the User Management table:
 * - Search by username
 * - Account status dropdown (All, Active, Blocked)
 * - Role dropdown (All, Player, Admin)
 * - Sort By dropdown (Newest, Oldest, Most Games, Highest Win Rate, Recent Activity)
 * - Clear filters action
 * - Matching count display
 */
export function UserFilters({
  searchQuery = "",
  onSearchChange,
  statusFilter = "ALL",
  onStatusChange,
  roleFilter = "ALL",
  onRoleChange,
  sortBy = "newest",
  onSortChange,
  onClearFilters,
  totalMatching = 0,
  isLoading = false,
}) {
  const isFiltered =
    Boolean(searchQuery) ||
    statusFilter !== "ALL" ||
    roleFilter !== "ALL" ||
    sortBy !== "newest";

  const activeFiltersCount =
    (searchQuery ? 1 : 0) +
    (statusFilter !== "ALL" ? 1 : 0) +
    (roleFilter !== "ALL" ? 1 : 0) +
    (sortBy !== "newest" ? 1 : 0);

  return (
    <div className="user-toolbar-card" role="search" aria-label="User search and filter toolbar">
      <div className="user-toolbar-row">
        {/* 1. Search Input */}
        <div className="user-search-wrapper">
          <Search size={15} className="search-icon" aria-hidden="true" />
          <input
            id="user-search-input"
            type="text"
            className="user-search-input"
            placeholder="Search by username..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            disabled={isLoading}
            autoComplete="off"
            aria-label="Search users by username"
          />
          {searchQuery && (
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

        {/* 2. Filters Group */}
        <div className="user-filters-group">
          {/* Status Filter */}
          <div className={`filter-select-wrapper ${statusFilter !== "ALL" ? "filter-active" : ""}`}>
            <label htmlFor="user-status-select" className="visually-hidden">
              Filter by account status
            </label>
            <select
              id="user-status-select"
              className="user-filter-select"
              value={statusFilter}
              onChange={(e) => onStatusChange(e.target.value)}
              disabled={isLoading}
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active Only</option>
              <option value="BLOCKED">Blocked Only</option>
            </select>
          </div>

          {/* Role Filter */}
          <div className={`filter-select-wrapper ${roleFilter !== "ALL" ? "filter-active" : ""}`}>
            <label htmlFor="user-role-select" className="visually-hidden">
              Filter by role
            </label>
            <select
              id="user-role-select"
              className="user-filter-select"
              value={roleFilter}
              onChange={(e) => onRoleChange(e.target.value)}
              disabled={isLoading}
            >
              <option value="ALL">All Roles</option>
              <option value="PLAYER">Player Only</option>
              <option value="ADMIN">Admin Only</option>
            </select>
          </div>

          {/* Sort By Filter */}
          <div className={`filter-select-wrapper ${sortBy !== "newest" ? "filter-active" : ""}`}>
            <label htmlFor="user-sort-select" className="visually-hidden">
              Sort users by
            </label>
            <select
              id="user-sort-select"
              className="user-filter-select"
              value={sortBy}
              onChange={(e) => onSortChange(e.target.value)}
              disabled={isLoading}
            >
              <option value="newest">Newest Joined</option>
              <option value="oldest">Oldest Joined</option>
              <option value="most_games">Most Games Played</option>
              <option value="highest_win_rate">Highest Win Rate</option>
              <option value="recent_activity">Recent Activity</option>
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
      <div className="user-toolbar-count-row">
        <span className="matching-count-text">
          {isFiltered ? (
            <>
              Found <strong className="num-tabular">{totalMatching}</strong> matching{" "}
              {totalMatching === 1 ? "user" : "users"}
            </>
          ) : (
            <>
              Total of <strong className="num-tabular">{totalMatching}</strong> registered{" "}
              {totalMatching === 1 ? "user" : "users"}
            </>
          )}
        </span>
      </div>
    </div>
  );
}
