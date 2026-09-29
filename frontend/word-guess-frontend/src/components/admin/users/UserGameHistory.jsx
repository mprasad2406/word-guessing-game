import React from "react";
import { Link } from "react-router-dom";
import {
  History,
  Trophy,
  XCircle,
  Clock,
  PlayCircle,
  Eye,
  Search,
  X,
  ChevronLeft,
  ChevronRight,
  Inbox,
  Layers,
} from "lucide-react";
import { formatJoinedDate, formatRelativeTime } from "../../../utils/dateUtils";
import { adminPaths } from "../../../routes/paths";

/**
 * AttemptDots:
 * Standardized 5-dot visual representation of attempts used (e.g. ● ● ● ● ○).
 * For historical matches with >5 attempts, displays 5 filled dots while preserving
 * the actual recorded count in the numerical ratio and tooltip.
 */
function AttemptDots({ attemptsUsed = 0, maxAttempts = 5, status = "ACTIVE" }) {
  const DISPLAY_DOTS = 5;
  const used = Math.max(0, attemptsUsed || 0);
  const total = Math.max(1, maxAttempts || 5);
  const isWon = status === "WON";

  const dots = [];
  for (let i = 0; i < DISPLAY_DOTS; i++) {
    let dotClass = "attempt-dot-empty";

    if (isWon) {
      if (used <= DISPLAY_DOTS) {
        // Solved within the first 5 attempts: green on winning attempt
        if (i === used - 1) {
          dotClass = "attempt-dot-won";
        } else if (i < used - 1) {
          dotClass = "attempt-dot-filled";
        }
      } else {
        // Historical win on attempt > 5: all 5 displayed dots are filled slate
        dotClass = "attempt-dot-filled";
      }
    } else {
      // Defeat, Expired, or In-Progress: fill dots up to used count (capped at 5)
      if (i < used) {
        dotClass = "attempt-dot-filled";
      }
    }

    dots.push(
      <span
        key={i}
        className={`attempt-dot ${dotClass}`}
        aria-hidden="true"
      />
    );
  }

  const tooltip = `${used} of 5 attempts ${isWon ? "(Solved)" : "used"}`;

  return (
    <div className="attempt-dots-wrap" title={tooltip} aria-label={tooltip}>
      <div className="attempt-dots-container">{dots}</div>
      <span className="attempt-dots-count num-tabular">
        {used}/5
      </span>
    </div>
  );
}

export function UserGameHistory({
  userId,
  userStats,
  gameHistory,
  statusFilter,
  onStatusFilterChange,
  searchTerm,
  onSearchChange,
  currentPage,
  onPageChange,
  isLoading,
}) {
  const getStatusBadge = (status) => {
    switch (status) {
      case "WON":
        return (
          <span className="match-status-badge badge-won" title="Victory: Solved the hidden word">
            <Trophy size={13} className="badge-icon text-success" />
            <span>Won</span>
          </span>
        );
      case "LOST":
        return (
          <span className="match-status-badge badge-lost" title="Defeat: Attempts exhausted">
            <XCircle size={13} className="badge-icon text-danger" />
            <span>Lost</span>
          </span>
        );
      case "EXPIRED":
        return (
          <span className="match-status-badge badge-expired" title="Expired: Time limit reached">
            <Clock size={13} className="badge-icon text-muted" />
            <span>Expired</span>
          </span>
        );
      case "ACTIVE":
      default:
        return (
          <span className="match-status-badge badge-active" title="In Progress: Active match">
            <PlayCircle size={13} className="badge-icon text-primary" />
            <span>Active</span>
          </span>
        );
    }
  };

  const formatMatchDate = (dateStr) => {
    if (!dateStr) return { relative: "—", exact: "" };
    try {
      const d = new Date(dateStr);
      return {
        relative: formatRelativeTime(dateStr),
        exact: d.toLocaleString(undefined, {
          month: "short",
          day: "numeric",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }),
      };
    } catch {
      return { relative: dateStr, exact: dateStr };
    }
  };

  const rawItems = gameHistory?.items || [];
  const total = gameHistory?.total || 0;
  const pages = gameHistory?.pages || 1;
  const pageSize = gameHistory?.page_size || 10;

  // Filter items locally by search term if present
  const items = searchTerm && searchTerm.trim()
    ? rawItems.filter((g) => {
        const term = searchTerm.toLowerCase().trim();
        const wordMatch = g.final_word && g.final_word.toLowerCase().includes(term);
        const idMatch = String(g.id).includes(term) || (g.public_id && g.public_id.toLowerCase().includes(term));
        return wordMatch || idMatch;
      })
    : rawItems;

  const startIdx = total === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endIdx = Math.min(currentPage * pageSize, total);

  const filters = [
    {
      id: "ALL",
      label: "All Matches",
      icon: <Layers size={13} />,
      count: userStats?.total_games,
    },
    {
      id: "WON",
      label: "Victories",
      icon: <Trophy size={13} />,
      count: userStats?.games_won,
    },
    {
      id: "LOST",
      label: "Defeats",
      icon: <XCircle size={13} />,
      count: userStats?.games_lost,
    },
    {
      id: "EXPIRED",
      label: "Expired",
      icon: <Clock size={13} />,
      count: userStats?.games_expired,
    },
    {
      id: "ACTIVE",
      label: "Active",
      icon: <PlayCircle size={13} />,
      count: userStats?.active_games,
    },
  ];

  return (
    <div className="user-matches-card">
      {/* 1. Header with Title, Segmented Filters, and Search */}
      <div className="user-matches-header">
        <div className="user-matches-title-wrap">
          <History size={18} className="user-matches-icon" aria-hidden="true" />
          <h2 className="user-matches-title">Match History</h2>
          <span className="user-matches-count-badge num-tabular" title="Total matches count">
            {total}
          </span>
        </div>

        {/* Toolbar: Segmented Filters + Search Bar */}
        <div className="user-matches-toolbar">
          {/* Segmented Controls */}
          <div className="user-matches-filter-pills" role="tablist" aria-label="Filter match history">
            {filters.map((f) => (
              <button
                key={f.id}
                type="button"
                role="tab"
                aria-selected={statusFilter === f.id}
                className={`user-match-filter-btn ${statusFilter === f.id ? "is-active" : ""}`}
                onClick={() => onStatusFilterChange(f.id)}
              >
                <span className="filter-btn-icon">{f.icon}</span>
                <span>{f.label}</span>
                {typeof f.count === "number" && (
                  <span className="filter-count-badge num-tabular">{f.count}</span>
                )}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="user-matches-search-wrap">
            <Search size={14} className="search-icon" aria-hidden="true" />
            <input
              type="text"
              className="user-matches-search-input"
              placeholder="Search target word or match #..."
              value={searchTerm || ""}
              onChange={(e) => onSearchChange(e.target.value)}
              aria-label="Search match history"
            />
            {searchTerm && (
              <button
                type="button"
                className="btn-clear-search"
                onClick={() => onSearchChange("")}
                aria-label="Clear search"
              >
                <X size={12} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 2. Body / Table / Empty State */}
      {isLoading ? (
        <div className="user-matches-loading">
          <div className="user-table-skeleton-rows">
            {[1, 2, 3, 4, 5].map((n) => (
              <div key={n} className="user-table-skeleton-row" />
            ))}
          </div>
        </div>
      ) : items.length === 0 ? (
        <div className="user-matches-empty">
          <Inbox size={40} className="user-matches-empty-icon" aria-hidden="true" />
          <h3 className="user-matches-empty-title">No matches found</h3>
          <p className="user-matches-empty-desc">
            {searchTerm
              ? `No matches found matching "${searchTerm}".`
              : statusFilter !== "ALL"
              ? `No games found matching the "${statusFilter.toLowerCase()}" filter.`
              : "This player has not participated in any word guessing matches yet."}
          </p>
          {(searchTerm || statusFilter !== "ALL") && (
            <button
              type="button"
              className="btn-user-secondary btn-sm mt-2"
              onClick={() => {
                onSearchChange("");
                onStatusFilterChange("ALL");
              }}
            >
              Reset Filters
            </button>
          )}
        </div>
      ) : (
        <div className="user-matches-table-container">
          <table className="user-matches-table">
            <thead>
              <tr>
                <th scope="col" className="col-match">Match</th>
                <th scope="col" className="col-result">Result</th>
                <th scope="col" className="col-attempts">Attempts</th>
                <th scope="col" className="col-date">Date</th>
                <th scope="col" className="col-action text-end">Action</th>
              </tr>
            </thead>
            <tbody>
              {items.map((game, idx) => {
                const matchIdentifier = game.public_id || game.id;
                const dateMeta = formatMatchDate(game.started_at);
                const wordLabel = game.final_word ? game.final_word.toUpperCase() : "Active Match";

                return (
                  <tr key={game.id || idx} className="user-match-row">
                    {/* 1. MATCH: Prominent Target Word + Match # underneath (two separate lines) */}
                    <td className="col-match">
                      <div className="match-identity-wrap">
                        <span className="match-identity-word">
                          {game.final_word ? game.final_word.toUpperCase() : `${game.word_length || 5} LETTERS`}
                        </span>
                        <span className="match-identity-num">#{game.id}</span>
                      </div>
                    </td>

                    {/* 2. Result Badge */}
                    <td className="col-result">
                      {getStatusBadge(game.status)}
                    </td>

                    {/* 3. Attempts Meter */}
                    <td className="col-attempts">
                      <AttemptDots
                        attemptsUsed={game.attempts_used}
                        maxAttempts={game.max_attempts}
                        status={game.status}
                      />
                    </td>

                    {/* 4. Date */}
                    <td className="col-date">
                      <span className="match-date-text" title={dateMeta.exact}>
                        {dateMeta.relative}
                      </span>
                    </td>

                    {/* 5. Action */}
                    <td className="col-action text-end">
                      <Link
                        to={adminPaths.userMatchDetail(userId, matchIdentifier)}
                        className="btn-match-icon-view"
                        aria-label={`View Match for ${wordLabel} (#${game.id})`}
                        title="View Match"
                      >
                        <Eye size={15} />
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* 3. Pagination Footer: Left result range, Right navigation */}
      {!isLoading && total > 0 && (
        <div className="user-matches-pagination">
          <div className="user-matches-pagination-info">
            Showing <span className="num-tabular font-semibold">{startIdx}</span>–
            <span className="num-tabular font-semibold">{endIdx}</span> of{" "}
            <span className="num-tabular font-semibold">{total}</span> matches
          </div>

          {pages > 1 && (
            <div className="user-matches-pagination-controls">
              <button
                type="button"
                className="btn-pagination"
                disabled={currentPage <= 1}
                onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                aria-label="Previous page"
              >
                <ChevronLeft size={14} />
                <span>Prev</span>
              </button>

              <div className="pagination-page-indicator num-tabular">
                {currentPage} / {pages}
              </div>

              <button
                type="button"
                className="btn-pagination"
                disabled={currentPage >= pages}
                onClick={() => onPageChange(Math.min(pages, currentPage + 1))}
                aria-label="Next page"
              >
                <span>Next</span>
                <ChevronRight size={14} />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
