import React from "react";
import { Link } from "react-router-dom";
import {
  Trophy,
  XCircle,
  Clock,
  PlayCircle,
  Eye,
  Layers,
  Inbox,
  User as UserIcon,
  Search,
} from "lucide-react";
import { formatReportDate } from "../../../utils/dateUtils";
import { adminPaths } from "../../../routes/paths";

/**
 * Standardized 5-dot attempt indicator
 */
function AttemptDots({ attemptsUsed = 0, maxAttempts = 5, status = "ACTIVE" }) {
  const DISPLAY_DOTS = 5;
  const used = Math.max(0, attemptsUsed || 0);
  const isWon = status === "WON";

  const dots = [];
  for (let i = 0; i < DISPLAY_DOTS; i++) {
    let dotClass = "attempt-dot-empty";

    if (isWon) {
      if (used <= DISPLAY_DOTS) {
        if (i === used - 1) {
          dotClass = "attempt-dot-won";
        } else if (i < used - 1) {
          dotClass = "attempt-dot-filled";
        }
      } else {
        dotClass = "attempt-dot-filled";
      }
    } else {
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

  return (
    <div
      className="attempt-dots-wrap"
      title={`${used} of 5 attempts ${isWon ? "(Solved)" : "used"}`}
    >
      <div className="attempt-dots-container">{dots}</div>
      <span className="attempt-dots-count num-tabular">
        {used}/5
      </span>
    </div>
  );
}

export function DailySessionLogsDrawer({
  date,
  sessions = [],
  total = 0,
  isLoading = false,
  page = 1,
  pages = 1,
  onPageChange,
  statusFilter = "ALL",
  onStatusChange,
  searchTerm = "",
  onSearchChange,
}) {
  const getStatusBadge = (status) => {
    switch (status) {
      case "WON":
        return (
          <span className="match-status-badge badge-won" title="Victory: Solved the hidden word">
            <Trophy size={12} className="badge-icon text-success" />
            <span>Won</span>
          </span>
        );
      case "LOST":
        return (
          <span className="match-status-badge badge-lost" title="Defeat: Attempts exhausted">
            <XCircle size={12} className="badge-icon text-danger" />
            <span>Lost</span>
          </span>
        );
      case "EXPIRED":
        return (
          <span className="match-status-badge badge-expired" title="Expired: Time limit reached">
            <Clock size={12} className="badge-icon text-muted" />
            <span>Expired</span>
          </span>
        );
      case "ACTIVE":
      default:
        return (
          <span className="match-status-badge badge-active" title="In Progress: Active match">
            <PlayCircle size={12} className="badge-icon text-primary" />
            <span>Active</span>
          </span>
        );
    }
  };

  const formatSessionTime = (dateStr) => {
    if (!dateStr) return "—";
    try {
      const d = new Date(dateStr);
      return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } catch {
      return dateStr;
    }
  };

  const statusOptions = [
    { label: "All", value: "ALL" },
    { label: "Won", value: "WON" },
    { label: "Lost", value: "LOST" },
    { label: "Expired", value: "EXPIRED" },
    { label: "Active", value: "ACTIVE" },
  ];

  return (
    <div className="session-logs-panel">
      {/* Header Toolbar */}
      <div className="session-logs-panel-header">
        <div className="session-logs-panel-title">
          <Layers size={14} className="text-primary" />
          <span>Detailed Match Sessions for {formatReportDate(date)}</span>
          <span className="session-logs-count-badge num-tabular">
            {total} {total === 1 ? "session" : "sessions"}
          </span>
        </div>

        {/* Filter Controls (Status pills + Search) */}
        <div className="session-logs-toolbar-actions d-flex align-items-center gap-2 flex-wrap">
          {/* Status Pills */}
          <div className="session-status-filter-group">
            {statusOptions.map((opt) => (
              <button
                key={opt.value}
                type="button"
                className={`session-status-pill ${statusFilter === opt.value ? "is-active" : ""}`}
                onClick={() => onStatusChange && onStatusChange(opt.value)}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Search by username */}
          <div className="session-search-box">
            <Search size={12} className="session-search-icon" />
            <input
              type="text"
              className="session-search-input"
              placeholder="Filter player..."
              value={searchTerm}
              onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
              aria-label="Filter player in session logs"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="session-logs-table-wrap">
        {isLoading ? (
          <div className="py-4 text-center">
            <div className="spinner-border spinner-border-sm text-primary" role="status" />
            <span className="ms-2 small text-muted">Loading session logs...</span>
          </div>
        ) : sessions.length === 0 ? (
          <div className="p-4 text-center text-muted small">
            <Inbox size={24} className="opacity-40 d-block mx-auto mb-1" />
            <span>No session records logged matching the criteria for this date.</span>
          </div>
        ) : (
          <table className="session-logs-table">
            <thead>
              <tr>
                <th scope="col" style={{ width: "25%" }}>Player</th>
                <th scope="col" style={{ width: "20%" }}>Target Word</th>
                <th scope="col" style={{ width: "15%" }}>Result</th>
                <th scope="col" style={{ width: "20%" }}>Attempts</th>
                <th scope="col" style={{ width: "12%" }}>Time</th>
                <th scope="col" style={{ width: "8%" }} className="text-end">Action</th>
              </tr>
            </thead>
            <tbody>
              {sessions.map((s) => {
                const playerIdentifier = s.player_public_id || s.player_id;
                const matchIdentifier = s.session_public_id || s.session_id;

                return (
                  <tr key={s.session_id}>
                    {/* 1. Player */}
                    <td>
                      <Link
                        to={adminPaths.userDetail(playerIdentifier)}
                        className="d-inline-flex align-items-center gap-1 fw-semibold text-dark text-decoration-none"
                      >
                        <UserIcon size={12} className="text-muted" />
                        <span>{s.username}</span>
                      </Link>
                    </td>

                    {/* 2. Target Word */}
                    <td>
                      <span className="session-word-tag">
                        {s.target_word || "—"}
                      </span>
                    </td>

                    {/* 3. Result Badge */}
                    <td>{getStatusBadge(s.status)}</td>

                    {/* 4. Attempts (5 Standardized Dots) */}
                    <td>
                      <AttemptDots
                        attemptsUsed={s.attempts_used}
                        maxAttempts={s.max_attempts}
                        status={s.status}
                      />
                    </td>

                    {/* 5. Time */}
                    <td className="text-muted num-tabular">
                      {formatSessionTime(s.started_at)}
                    </td>

                    {/* 6. Action (Direct link to Match Inspection) */}
                    <td className="text-end">
                      <Link
                        to={adminPaths.userMatchDetail(playerIdentifier, matchIdentifier)}
                        className="btn-match-icon-view"
                        title="Inspect Match"
                        aria-label={`Inspect match for ${s.username}`}
                      >
                        <Eye size={13} />
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination for session logs if multi-page */}
      {!isLoading && pages > 1 && (
        <div className="d-flex justify-content-between align-items-center pt-1">
          <span className="text-muted small">
            Page <strong className="text-dark num-tabular">{page}</strong> of{" "}
            <strong className="text-dark num-tabular">{pages}</strong> ({total} total)
          </span>
          <div className="btn-group btn-group-sm">
            <button
              type="button"
              className="btn btn-outline-secondary btn-sm py-0 px-2"
              disabled={page <= 1}
              onClick={() => onPageChange(page - 1)}
            >
              Prev
            </button>
            <button
              type="button"
              className="btn btn-outline-secondary btn-sm py-0 px-2"
              disabled={page >= pages}
              onClick={() => onPageChange(page + 1)}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
