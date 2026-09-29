import React from "react";
import { Users, Trophy, ChevronDown, ChevronUp, Inbox } from "lucide-react";
import { formatReportDate } from "../../../utils/dateUtils";
import { DailySessionLogsDrawer } from "./DailySessionLogsDrawer";

export function DailyReportTable({
  summaries = [],
  total = 0,
  page = 1,
  pages = 1,
  pageSize = 20,
  isLoading = false,
  onPageChange,
  expandedDate,
  onToggleExpandDate,
  detailsData,
  isDetailsLoading,
  onDetailsPageChange,
  drawerStatusFilter,
  onDrawerStatusChange,
  drawerSearchTerm,
  onDrawerSearchChange,
}) {
  const startIdx = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const endIdx = Math.min(page * pageSize, total);

  return (
    <div className="reports-table-card">
      <div className="reports-table-container">
        <table className="reports-table">
          <thead>
            <tr>
              <th scope="col" className="col-date">Date</th>
              <th scope="col" className="col-players">Players</th>
              <th scope="col" className="col-played">Played</th>
              <th scope="col" className="col-won">Won</th>
              <th scope="col" className="col-winrate">Win Rate</th>
              <th scope="col" className="col-actions text-end">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan="6" className="py-5 text-center">
                  <div className="spinner-border spinner-border-sm text-primary" role="status" />
                  <span className="ms-2 small text-muted">Loading daily reports...</span>
                </td>
              </tr>
            ) : summaries.length === 0 ? (
              <tr>
                <td colSpan="6" className="text-center py-5 text-muted">
                  <Inbox size={32} className="opacity-40 d-block mx-auto mb-2" />
                  <span>No gameplay records found for the selected period.</span>
                </td>
              </tr>
            ) : (
              summaries.map((row) => {
                const isExpanded = expandedDate === row.date;
                const winRateVal = typeof row.win_rate === "number" ? row.win_rate : parseFloat(row.win_rate) || 0;
                const isLowWinRate = winRateVal < 40;

                return (
                  <React.Fragment key={row.date}>
                    <tr className={`report-row ${isExpanded ? "is-expanded" : ""}`}>
                      {/* 1. Date */}
                      <td className="col-date">
                        <span className="report-date-cell">
                          {formatReportDate(row.date)}
                        </span>
                      </td>

                      {/* 2. Active Players */}
                      <td className="col-players">
                        <span className="report-players-cell">
                          <Users size={13} className="text-primary" />
                          <span className="num-tabular font-medium">{row.number_of_users}</span>
                        </span>
                      </td>

                      {/* 3. Played */}
                      <td className="col-played">
                        <span className="num-tabular font-medium text-dark">{row.total_games}</span>
                      </td>

                      {/* 4. Won */}
                      <td className="col-won">
                        <span className="report-won-cell">
                          <Trophy size={13} className="text-success" />
                          <span className="num-tabular">{row.games_won}</span>
                        </span>
                      </td>

                      {/* 5. Win Rate Progress Bar */}
                      <td className="col-winrate">
                        <div className="winrate-progress-wrap" title={`${row.games_won} won of ${row.total_games} games`}>
                          <div className="winrate-progress-bar">
                            <div
                              className={`winrate-progress-fill ${isLowWinRate ? "fill-low" : ""}`}
                              style={{ width: `${Math.min(100, Math.max(0, winRateVal))}%` }}
                            />
                          </div>
                          <span className="winrate-progress-label num-tabular">
                            {row.total_games > 0 ? `${winRateVal.toFixed(1)}%` : "—"}
                          </span>
                        </div>
                      </td>

                      {/* 6. Actions (Expand/Collapse logs) */}
                      <td className="col-actions text-end">
                        <button
                          type="button"
                          className={`btn-toggle-logs ${isExpanded ? "is-active" : ""}`}
                          onClick={() => onToggleExpandDate(row.date)}
                          title={isExpanded ? "Hide session logs" : "View detailed match sessions"}
                          aria-expanded={isExpanded}
                          aria-label={`Toggle session logs for ${formatReportDate(row.date)}`}
                        >
                          <span>{isExpanded ? "Hide" : "Logs"}</span>
                          {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                        </button>
                      </td>
                    </tr>

                    {/* Expanded Session Logs Panel */}
                    {isExpanded && (
                      <tr className="session-logs-drawer-row">
                        <td colSpan="6">
                          <DailySessionLogsDrawer
                            date={row.date}
                            sessions={detailsData.sessions}
                            total={detailsData.total}
                            page={detailsData.page}
                            pages={detailsData.pages}
                            isLoading={isDetailsLoading}
                            onPageChange={(p) => onDetailsPageChange(row.date, p)}
                            statusFilter={drawerStatusFilter}
                            onStatusChange={onDrawerStatusChange}
                            searchTerm={drawerSearchTerm}
                            onSearchChange={onDrawerSearchChange}
                          />
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {!isLoading && total > 0 && (
        <div className="card-footer bg-white d-flex justify-content-between align-items-center py-2 px-3 border-top">
          <span className="text-muted small">
            Showing <strong className="text-dark num-tabular">{startIdx}</strong>–
            <strong className="text-dark num-tabular">{endIdx}</strong> of{" "}
            <strong className="text-dark num-tabular">{total}</strong> days
          </span>

          {pages > 1 && (
            <div className="d-flex align-items-center gap-1">
              <button
                type="button"
                className="btn-pagination"
                disabled={page <= 1}
                onClick={() => onPageChange(page - 1)}
              >
                Prev
              </button>
              <span className="pagination-page-indicator num-tabular">
                {page} / {pages}
              </span>
              <button
                type="button"
                className="btn-pagination"
                disabled={page >= pages}
                onClick={() => onPageChange(page + 1)}
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
