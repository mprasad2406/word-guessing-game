import React from "react";
import { Link } from "react-router-dom";
import {
  History,
  Trophy,
  XCircle,
  Clock,
  PlayCircle,
  ChevronRight,
  Inbox,
  Sparkles,
  ChevronLeft,
} from "lucide-react";
import { formatJoinedDate } from "../../../utils/dateUtils";

const STATUS_FILTERS = [
  { id: "ALL", label: "All Matches" },
  { id: "WON", label: "Won" },
  { id: "LOST", label: "Lost" },
  { id: "EXPIRED", label: "Expired" },
  { id: "ACTIVE", label: "Active" },
];

export function UserGameHistory({
  gameHistory,
  statusFilter,
  onStatusFilterChange,
  currentPage,
  onPageChange,
  isLoading,
}) {
  const getStatusBadge = (status) => {
    switch (status) {
      case "WON":
        return (
          <span className="match-status-badge badge-won">
            <Trophy size={12} />
            <span>Won</span>
          </span>
        );
      case "LOST":
        return (
          <span className="match-status-badge badge-lost">
            <XCircle size={12} />
            <span>Lost</span>
          </span>
        );
      case "EXPIRED":
        return (
          <span className="match-status-badge badge-expired">
            <Clock size={12} />
            <span>Expired</span>
          </span>
        );
      case "ACTIVE":
      default:
        return (
          <span className="match-status-badge badge-active">
            <PlayCircle size={12} />
            <span>Active</span>
          </span>
        );
    }
  };

  const formatMatchDate = (dateStr) => {
    if (!dateStr) return "—";
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateStr;
    }
  };

  const items = gameHistory?.items || [];
  const total = gameHistory?.total || 0;
  const pages = gameHistory?.pages || 1;

  return (
    <div className="user-matches-card">
      {/* Card Header with Title and Filter Segment */}
      <div className="user-matches-header">
        <div className="user-matches-title-wrap">
          <History size={18} className="user-matches-icon" />
          <h2 className="user-matches-title">Match History</h2>
          <span className="user-matches-count-badge num-tabular">{total}</span>
        </div>

        {/* Filter Pills */}
        <div className="user-matches-filter-pills" role="tablist" aria-label="Filter match history">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              className={`user-match-filter-btn ${statusFilter === f.id ? "is-active" : ""}`}
              onClick={() => onStatusFilterChange(f.id)}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Card Body / Table / State */}
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
          <Inbox size={40} className="user-matches-empty-icon" />
          <h3 className="user-matches-empty-title">No matches recorded</h3>
          <p className="user-matches-empty-desc">
            {statusFilter !== "ALL"
              ? `No games found matching the "${statusFilter.toLowerCase()}" filter.`
              : "This user has not played any word guessing matches yet."}
          </p>
        </div>
      ) : (
        <div className="user-matches-table-container">
          <table className="user-matches-table">
            <thead>
              <tr>
                <th scope="col" className="col-match">Match</th>
                <th scope="col" className="col-status">Status</th>
                <th scope="col" className="col-word">Word</th>
                <th scope="col" className="col-attempts">Attempts</th>
                <th scope="col" className="col-hints">Hints</th>
                <th scope="col" className="col-date">Date & Time</th>
                <th scope="col" className="col-action text-end">Action</th>
              </tr>
            </thead>
            <tbody>
              {items.map((game, idx) => {
                const matchPublicId = game.public_id || game.id;
                return (
                  <tr key={game.id || idx} className="user-match-row">
                    <td className="col-match">
                      <span className="match-num-label num-tabular">
                        Match #{game.id}
                      </span>
                    </td>
                    <td className="col-status">{getStatusBadge(game.status)}</td>
                    <td className="col-word">
                      {game.final_word ? (
                        <span className="match-target-word">{game.final_word}</span>
                      ) : (
                        <span className="match-hidden-word">
                          {game.word_length || 5} letters (Hidden)
                        </span>
                      )}
                    </td>
                    <td className="col-attempts">
                      <span className="match-attempts-text num-tabular">
                        <strong>{game.attempts_used}</strong>
                        <span className="text-muted"> / {game.max_attempts || 6}</span>
                      </span>
                    </td>
                    <td className="col-hints">
                      <span className="match-hints-text num-tabular">
                        {game.hints_used || 0}
                      </span>
                    </td>
                    <td className="col-date">
                      <span className="match-date-text">
                        {formatMatchDate(game.started_at)}
                      </span>
                    </td>
                    <td className="col-action text-end">
                      <Link
                        to={`/player/matches/${matchPublicId}`}
                        className="btn-match-view"
                        title="View match details"
                      >
                        <span>View</span>
                        <ChevronRight size={14} />
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination Footer */}
      {!isLoading && pages > 1 && (
        <div className="user-matches-pagination">
          <div className="user-matches-pagination-info">
            Showing page <span className="num-tabular font-semibold">{currentPage}</span> of{" "}
            <span className="num-tabular font-semibold">{pages}</span>
          </div>
          <div className="user-matches-pagination-controls">
            <button
              type="button"
              className="btn-pagination"
              disabled={currentPage <= 1}
              onClick={() => onPageChange(Math.max(1, currentPage - 1))}
            >
              <ChevronLeft size={14} />
              <span>Previous</span>
            </button>
            <button
              type="button"
              className="btn-pagination"
              disabled={currentPage >= pages}
              onClick={() => onPageChange(Math.min(pages, currentPage + 1))}
            >
              <span>Next</span>
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
