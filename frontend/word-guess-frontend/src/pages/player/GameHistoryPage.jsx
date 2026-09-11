import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { PageLoader } from "../../components/common/PageLoader";
import { gameplayService } from "../../services/gameplayService";
import { formatServerDate, formatDuration } from "../../utils/dateUtils";

export function GameHistoryPage() {
  const [historyData, setHistoryData] = useState({
    items: [],
    total: 0,
    page: 1,
    page_size: 10,
    pages: 1,
  });
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;

    async function loadHistory() {
      setIsLoading(true);
      setError(null);

      try {
        const response = await gameplayService.getGameHistory({
          status: statusFilter,
          page: currentPage,
          pageSize: 10,
        });

        if (isMounted) {
          setHistoryData(response);
        }
      } catch (err) {
        if (isMounted) {
          console.error("Failed to load history:", err);
          setError(err?.message || "Failed to load game history.");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadHistory();

    return () => {
      isMounted = false;
    };
  }, [statusFilter, currentPage]);

  const handleFilterChange = (status) => {
    setStatusFilter(status);
    setCurrentPage(1); // Reset to first page on filter change
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "WON":
        return <span className="badge bg-success-subtle text-success border border-success-subtle px-2 py-1"><i className="bi bi-trophy-fill me-1"></i> Won</span>;
      case "LOST":
        return <span className="badge bg-danger-subtle text-danger border border-danger-subtle px-2 py-1"><i className="bi bi-x-circle-fill me-1"></i> Lost</span>;
      case "EXPIRED":
        return <span className="badge bg-secondary-subtle text-secondary border border-secondary-subtle px-2 py-1"><i className="bi bi-clock-history me-1"></i> Expired</span>;
      case "ACTIVE":
      default:
        return <span className="badge bg-primary-subtle text-primary border border-primary-subtle px-2 py-1"><i className="bi bi-play-circle-fill me-1"></i> Active</span>;
    }
  };

  return (
    <div className="container py-4" style={{ maxWidth: "1000px" }}>
      {/* Header */}
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
        <div>
          <nav aria-label="breadcrumb">
            <ol className="breadcrumb mb-1">
              <li className="breadcrumb-item">
                <Link to="/player" className="text-decoration-none">
                  <i className="bi bi-house-door me-1"></i>Lobby
                </Link>
              </li>
              <li className="breadcrumb-item active" aria-current="page">
                Game History
              </li>
            </ol>
          </nav>
          <h2 className="fw-bold mb-0">Your Game History</h2>
        </div>

        <Link to="/player" className="btn btn-primary d-inline-flex align-items-center gap-2">
          <i className="bi bi-play-fill fs-5"></i>
          <span>Play New Game</span>
        </Link>
      </div>

      {/* Filter Tabs */}
      <div className="card shadow-sm border-0 rounded-3 mb-4">
        <div className="card-body p-3">
          <div className="d-flex flex-wrap gap-2 align-items-center">
            <span className="small text-muted fw-semibold me-2">Filter by Status:</span>
            {["ALL", "WON", "LOST", "EXPIRED", "ACTIVE"].map((status) => (
              <button
                key={status}
                type="button"
                className={`btn btn-sm ${
                  statusFilter === status
                    ? "btn-primary fw-semibold"
                    : "btn-outline-secondary"
                } rounded-pill px-3`}
                onClick={() => handleFilterChange(status)}
              >
                {status === "ALL" ? "All Games" : status.charAt(0) + status.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="alert alert-danger d-flex align-items-center gap-2 mb-4" role="alert">
          <i className="bi bi-exclamation-triangle-fill"></i>
          <div>{error}</div>
        </div>
      )}

      {/* Table Content */}
      <div className="card shadow-sm border-0 rounded-3 overflow-hidden">
        {isLoading ? (
          <div className="p-5">
            <PageLoader text="Loading your match history..." />
          </div>
        ) : historyData.items.length === 0 ? (
          <div className="text-center py-5 px-3">
            <i className="bi bi-inbox fs-1 text-secondary opacity-50 d-block mb-3"></i>
            <h5 className="fw-semibold text-secondary">No games found</h5>
            <p className="text-muted small mb-4">
              {statusFilter !== "ALL"
                ? `You don't have any games marked as ${statusFilter.toLowerCase()}.`
                : "You haven't played any games yet. Start guessing now!"}
            </p>
            <Link to="/player" className="btn btn-primary px-4">
              Start Your First Game
            </Link>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light text-secondary small text-uppercase">
                <tr>
                  <th scope="col" className="ps-4">Game #</th>
                  <th scope="col">Status</th>
                  <th scope="col">Word</th>
                  <th scope="col">Attempts</th>
                  <th scope="col">Hints</th>
                  <th scope="col">Duration</th>
                  <th scope="col">Date Played</th>
                  <th scope="col" className="text-end pe-4">Action</th>
                </tr>
              </thead>
              <tbody>
                {historyData.items.map((game) => (
                  <tr key={game.id}>
                    <td className="ps-4 fw-semibold font-monospace">#{game.id}</td>
                    <td>{getStatusBadge(game.status)}</td>
                    <td>
                      {game.final_word ? (
                        <span className="font-monospace fw-bold text-uppercase text-dark">
                          {game.final_word}
                        </span>
                      ) : (
                        <span className="text-muted small">
                          {game.word_length} letters (Hidden)
                        </span>
                      )}
                    </td>
                    <td>
                      <span className="small">
                        <strong>{game.attempts_used}</strong> / {game.max_attempts}
                      </span>
                    </td>
                    <td>
                      <span className="small text-muted">{game.hints_used}</span>
                    </td>
                    <td>
                      <span className="small text-muted font-monospace">
                        {game.duration_seconds != null ? formatDuration(game.duration_seconds) : "—"}
                      </span>
                    </td>
                    <td className="small text-muted">{formatServerDate(game.started_at)}</td>
                    <td className="text-end pe-4">
                      <Link
                        to={`/player/game/${game.id}`}
                        className="btn btn-sm btn-outline-primary d-inline-flex align-items-center gap-1"
                      >
                        <span>{game.status === "ACTIVE" ? "Resume" : "View"}</span>
                        <i className="bi bi-chevron-right"></i>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {!isLoading && historyData.pages > 1 && (
          <div className="card-footer bg-white border-top py-3 d-flex flex-wrap justify-content-between align-items-center gap-2">
            <div className="small text-muted">
              Showing page <strong>{historyData.page}</strong> of <strong>{historyData.pages}</strong> ({historyData.total} total games)
            </div>

            <nav aria-label="Game history pagination">
              <ul className="pagination pagination-sm mb-0">
                <li className={`page-item ${currentPage === 1 ? "disabled" : ""}`}>
                  <button
                    type="button"
                    className="page-link"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </button>
                </li>

                {Array.from({ length: historyData.pages }, (_, i) => i + 1)
                  .filter((p) => p === 1 || p === historyData.pages || Math.abs(p - currentPage) <= 2)
                  .map((pageNum, idx, arr) => {
                    const prev = arr[idx - 1];
                    const showEllipsis = prev && pageNum - prev > 1;

                    return (
                      <React.Fragment key={pageNum}>
                        {showEllipsis && (
                          <li className="page-item disabled">
                            <span className="page-link">...</span>
                          </li>
                        )}
                        <li className={`page-item ${currentPage === pageNum ? "active" : ""}`}>
                          <button
                            type="button"
                            className="page-link"
                            onClick={() => setCurrentPage(pageNum)}
                          >
                            {pageNum}
                          </button>
                        </li>
                      </React.Fragment>
                    );
                  })}

                <li className={`page-item ${currentPage === historyData.pages ? "disabled" : ""}`}>
                  <button
                    type="button"
                    className="page-link"
                    onClick={() => setCurrentPage((p) => Math.min(historyData.pages, p + 1))}
                    disabled={currentPage === historyData.pages}
                  >
                    Next
                  </button>
                </li>
              </ul>
            </nav>
          </div>
        )}
      </div>
    </div>
  );
}
