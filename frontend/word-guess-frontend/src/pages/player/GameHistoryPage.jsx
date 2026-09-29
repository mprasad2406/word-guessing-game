import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  Play,
  Home,
  ChevronRight,
  ChevronLeft,
  Filter,
  Trophy,
  XCircle,
  Clock,
  Activity,
  ArrowRight,
  Inbox,
  AlertTriangle,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import { gameplayService } from "../../services/gameplayService";
import { formatServerDate, formatDuration } from "../../utils/dateUtils";
import { playerPaths } from "../../routes/paths";
import "./GameHistory.css";

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

  // Start New Game Modal State
  const [showStartModal, setShowStartModal] = useState(false);
  const [isStartingGame, setIsStartingGame] = useState(false);

  const navigate = useNavigate();

  // Close modal on Escape key press
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && showStartModal && !isStartingGame) {
        setShowStartModal(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showStartModal, isStartingGame]);

  const loadHistory = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await gameplayService.getGameHistory({
        status: statusFilter,
        page: currentPage,
        pageSize: 10,
      });
      setHistoryData(response);
    } catch (err) {
      console.error("Failed to load history:", err);
      setError(err?.message || "Failed to load game history. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, [statusFilter, currentPage]);

  const handleFilterChange = (status) => {
    setStatusFilter(status);
    setCurrentPage(1); // Reset to first page on filter change
  };

  const handleStartGame = async () => {
    if (isStartingGame) return;

    setIsStartingGame(true);
    try {
      const newGame = await gameplayService.startGame();
      setShowStartModal(false);
      toast.success("Game created! Let's guess the word!");
      navigate(playerPaths.matchDetails(newGame.public_id));
    } catch (err) {
      console.error("Failed to create game:", err);
      const errMsg =
        err?.message || "Failed to start a new game session. Please try again later.";
      toast.error(errMsg);
      setShowStartModal(false);
    } finally {
      setIsStartingGame(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "WON":
        return (
          <span className="game-status-badge status-won">
            <Trophy size={13} strokeWidth={2.5} />
            <span>Won</span>
          </span>
        );
      case "LOST":
        return (
          <span className="game-status-badge status-lost">
            <XCircle size={13} strokeWidth={2.5} />
            <span>Lost</span>
          </span>
        );
      case "EXPIRED":
        return (
          <span className="game-status-badge status-expired">
            <Clock size={13} strokeWidth={2.5} />
            <span>Expired</span>
          </span>
        );
      case "ACTIVE":
      default:
        return (
          <span className="game-status-badge status-active">
            <Activity size={13} strokeWidth={2.5} />
            <span>Active</span>
          </span>
        );
    }
  };

  const getEmptyStateConfig = () => {
    switch (statusFilter) {
      case "WON":
        return {
          icon: <Trophy size={26} />,
          title: "No wins yet",
          desc: "Your winning game sessions will appear here once you solve a secret word.",
          actionText: "View All Games",
          actionHandler: () => handleFilterChange("ALL"),
        };
      case "LOST":
        return {
          icon: <XCircle size={26} />,
          title: "No lost games",
          desc: "You don't have any games marked as lost.",
          actionText: "View All Games",
          actionHandler: () => handleFilterChange("ALL"),
        };
      case "EXPIRED":
        return {
          icon: <Clock size={26} />,
          title: "No expired games",
          desc: "You don't have any expired game sessions.",
          actionText: "View All Games",
          actionHandler: () => handleFilterChange("ALL"),
        };
      case "ACTIVE":
        return {
          icon: <Activity size={26} />,
          title: "No active games",
          desc: "You don't have any games currently in progress.",
          actionText: "Play New Game",
          actionHandler: () => setShowStartModal(true),
        };
      case "ALL":
      default:
        return {
          icon: <Inbox size={26} />,
          title: "No games played yet",
          desc: "Your completed and active game sessions will appear here.",
          actionText: "Start Your First Game",
          actionHandler: () => setShowStartModal(true),
        };
    }
  };

  const emptyState = getEmptyStateConfig();

  return (
    <div className="history-container">
      {/* 1. Page Header Section */}
      <section className="history-header-section" aria-label="Page Header">
        <div className="history-header-left">
          <nav className="history-breadcrumb" aria-label="Breadcrumb">
            <Link to="/player">
              <Home size={14} />
              <span>Lobby</span>
            </Link>
            <ChevronRight size={13} className="history-breadcrumb-separator" />
            <span className="history-breadcrumb-current" aria-current="page">
              Game History
            </span>
          </nav>
          <h1 className="history-page-title">Your Game History</h1>
          <p className="history-page-subtitle">
            Review your previous games, track your results and revisit individual sessions.
          </p>
        </div>

        <button
          type="button"
          className="btn-play-new-game"
          onClick={() => setShowStartModal(true)}
          aria-label="Play New Game"
        >
          <Play size={16} fill="#FFFFFF" />
          <span>Play New Game</span>
        </button>
      </section>

      {/* 2. Filter Toolbar (Segmented Controls) */}
      <section className="history-filter-card" aria-label="Filter Toolbar">
        <div className="filter-toolbar">
          <span className="filter-label-text">
            <Filter size={15} />
            <span>Filter by:</span>
          </span>

          <div
            className="filter-buttons-scroll"
            role="toolbar"
            aria-label="Filter games by status"
          >
            {[
              { id: "ALL", label: "All Games" },
              { id: "WON", label: "Won" },
              { id: "LOST", label: "Lost" },
              { id: "EXPIRED", label: "Expired" },
              { id: "ACTIVE", label: "Active" },
            ].map(({ id, label }) => (
              <button
                key={id}
                type="button"
                className={`filter-btn ${statusFilter === id ? "active" : ""}`}
                onClick={() => handleFilterChange(id)}
                aria-pressed={statusFilter === id}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* 3. Error Alert */}
      {error && (
        <div className="history-alert-danger" role="alert">
          <div className="d-flex align-items-center gap-2">
            <AlertTriangle size={20} className="flex-shrink-0" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            className="btn-retry-history"
            onClick={loadHistory}
          >
            <RotateCcw size={14} />
            <span>Retry</span>
          </button>
        </div>
      )}

      {/* 4. Table & Cards Section */}
      <section className="history-table-card" aria-label="Game History List">
        {isLoading ? (
          <>
            {/* Desktop / Tablet Skeleton Table */}
            <div className="table-responsive-custom">
              <table className="game-history-table">
                <thead>
                  <tr>
                    <th scope="col">Played On</th>
                    <th scope="col">Status</th>
                    <th scope="col">Word</th>
                    <th scope="col">Attempts</th>
                    <th scope="col">Hints</th>
                    <th scope="col">Duration</th>
                    <th scope="col" style={{ textAlign: "right" }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {[1, 2, 3, 4, 5].map((item) => (
                    <tr key={item}>
                      <td>
                        <span className="skeleton-shimmer" style={{ width: "120px", height: "16px" }}></span>
                      </td>
                      <td>
                        <span className="skeleton-shimmer" style={{ width: "70px", height: "22px", borderRadius: "9999px" }}></span>
                      </td>
                      <td>
                        <span className="skeleton-shimmer" style={{ width: "75px", height: "20px" }}></span>
                      </td>
                      <td>
                        <span className="skeleton-shimmer" style={{ width: "40px", height: "16px" }}></span>
                      </td>
                      <td>
                        <span className="skeleton-shimmer" style={{ width: "20px", height: "16px" }}></span>
                      </td>
                      <td>
                        <span className="skeleton-shimmer" style={{ width: "50px", height: "16px" }}></span>
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <span className="skeleton-shimmer" style={{ width: "65px", height: "30px", borderRadius: "8px" }}></span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Skeleton Cards */}
            <div className="history-mobile-cards-list">
              {[1, 2, 3].map((item) => (
                <div key={item} className="history-mobile-card">
                  <div className="mobile-card-top-row">
                    <span className="skeleton-shimmer" style={{ width: "90px", height: "18px" }}></span>
                    <span className="skeleton-shimmer" style={{ width: "65px", height: "22px", borderRadius: "9999px" }}></span>
                  </div>
                  <div>
                    <span className="skeleton-shimmer" style={{ width: "85px", height: "22px" }}></span>
                  </div>
                  <div className="mobile-card-stats-grid">
                    <div className="mobile-stat-item">
                      <span className="skeleton-shimmer" style={{ width: "50px", height: "12px", marginBottom: "4px" }}></span>
                      <span className="skeleton-shimmer" style={{ width: "40px", height: "14px" }}></span>
                    </div>
                    <div className="mobile-stat-item">
                      <span className="skeleton-shimmer" style={{ width: "50px", height: "12px", marginBottom: "4px" }}></span>
                      <span className="skeleton-shimmer" style={{ width: "20px", height: "14px" }}></span>
                    </div>
                    <div className="mobile-stat-item">
                      <span className="skeleton-shimmer" style={{ width: "50px", height: "12px", marginBottom: "4px" }}></span>
                      <span className="skeleton-shimmer" style={{ width: "45px", height: "14px" }}></span>
                    </div>
                  </div>
                  <div className="mobile-card-bottom-row">
                    <span className="skeleton-shimmer" style={{ width: "100%", height: "36px", borderRadius: "8px" }}></span>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : historyData.items.length === 0 ? (
          <div className="history-empty-state-card">
            <div className="empty-state-icon-circle">{emptyState.icon}</div>
            <h2 className="empty-state-title">{emptyState.title}</h2>
            <p className="empty-state-desc">{emptyState.desc}</p>
            <button
              type="button"
              className="btn-empty-action"
              onClick={emptyState.actionHandler}
            >
              <span>{emptyState.actionText}</span>
              <ArrowRight size={14} />
            </button>
          </div>
        ) : (
          <>
            {/* Desktop / Tablet Data Table */}
            <div className="table-responsive-custom">
              <table className="game-history-table">
                <thead>
                  <tr>
                    <th scope="col">Played On</th>
                    <th scope="col">Status</th>
                    <th scope="col">Word</th>
                    <th scope="col">Attempts</th>
                    <th scope="col">Hints</th>
                    <th scope="col">Duration</th>
                    <th scope="col" style={{ textAlign: "right" }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {historyData.items.map((game) => (
                    <tr key={game.public_id || game.id}>
                      <td>
                        <span className="date-cell-text">
                          {formatServerDate(game.started_at)}
                        </span>
                      </td>
                      <td>{getStatusBadge(game.status)}</td>
                      <td>
                        {game.final_word ? (
                          <span className="word-display-revealed">
                            {game.final_word}
                          </span>
                        ) : (
                          <span className="word-display-hidden">
                            {game.word_length || 5} letters (Hidden)
                          </span>
                        )}
                      </td>
                      <td>
                        <span className="num-tabular">
                          {game.attempts_used} / {game.max_attempts}
                        </span>
                      </td>
                      <td>
                        <span className="text-tabular-muted">
                          {game.hints_used}
                        </span>
                      </td>
                      <td>
                        <span className="text-tabular-muted">
                          {game.duration_seconds != null
                            ? formatDuration(game.duration_seconds)
                            : "—"}
                        </span>
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <Link
                          to={playerPaths.matchDetails(game.public_id)}
                          className="btn-table-view"
                          aria-label={`${game.status === "ACTIVE" ? "Resume" : "View"} match details`}
                        >
                          <span>{game.status === "ACTIVE" ? "Resume" : "View"}</span>
                          <ChevronRight size={14} />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card Layout (Under 768px) */}
            <div className="history-mobile-cards-list">
              {historyData.items.map((game) => (
                <div key={game.public_id || game.id} className="history-mobile-card">
                  <div className="mobile-card-top-row">
                    <span className="date-cell-text" style={{ fontSize: "0.8125rem", color: "#64748b", fontWeight: "600" }}>
                      {formatServerDate(game.started_at)}
                    </span>
                    {getStatusBadge(game.status)}
                  </div>

                  <div>
                    {game.final_word ? (
                      <span className="word-display-revealed">
                        {game.final_word}
                      </span>
                    ) : (
                      <span className="word-display-hidden">
                        {game.word_length || 5} letters (Hidden)
                      </span>
                    )}
                  </div>

                  <div className="mobile-card-stats-grid">
                    <div className="mobile-stat-item">
                      <span className="mobile-stat-label">Attempts</span>
                      <span className="mobile-stat-value">
                        {game.attempts_used} / {game.max_attempts}
                      </span>
                    </div>
                    <div className="mobile-stat-item">
                      <span className="mobile-stat-label">Hints Used</span>
                      <span className="mobile-stat-value">{game.hints_used}</span>
                    </div>
                    <div className="mobile-stat-item">
                      <span className="mobile-stat-label">Duration</span>
                      <span className="mobile-stat-value">
                        {game.duration_seconds != null
                          ? formatDuration(game.duration_seconds)
                          : "—"}
                      </span>
                    </div>
                  </div>

                  <div className="mobile-card-bottom-row">
                    <Link
                      to={playerPaths.matchDetails(game.public_id)}
                      className="btn-table-view w-100 justify-content-center"
                    >
                      <span>{game.status === "ACTIVE" ? "Resume Game" : "View Details"}</span>
                      <ChevronRight size={14} />
                    </Link>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination Controls */}
            {historyData.pages > 1 && (
              <div className="history-pagination-footer">
                <span className="pagination-info-text">
                  Showing page <strong>{historyData.page}</strong> of{" "}
                  <strong>{historyData.pages}</strong> ({historyData.total} total games)
                </span>

                <nav className="pagination-nav" aria-label="Game history pagination">
                  <button
                    type="button"
                    className="pagination-control-btn"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    aria-label="Previous Page"
                  >
                    <ChevronLeft size={16} />
                  </button>

                  {Array.from({ length: historyData.pages }, (_, i) => i + 1)
                    .filter(
                      (p) =>
                        p === 1 ||
                        p === historyData.pages ||
                        Math.abs(p - currentPage) <= 2
                    )
                    .map((pageNum, idx, arr) => {
                      const prev = arr[idx - 1];
                      const showEllipsis = prev && pageNum - prev > 1;

                      return (
                        <React.Fragment key={pageNum}>
                          {showEllipsis && (
                            <span className="pagination-ellipsis" aria-hidden="true">
                              ...
                            </span>
                          )}
                          <button
                            type="button"
                            className={`pagination-control-btn ${
                              currentPage === pageNum ? "active" : ""
                            }`}
                            onClick={() => setCurrentPage(pageNum)}
                            aria-current={currentPage === pageNum ? "page" : undefined}
                          >
                            {pageNum}
                          </button>
                        </React.Fragment>
                      );
                    })}

                  <button
                    type="button"
                    className="pagination-control-btn"
                    onClick={() =>
                      setCurrentPage((p) => Math.min(historyData.pages, p + 1))
                    }
                    disabled={currentPage === historyData.pages}
                    aria-label="Next Page"
                  >
                    <ChevronRight size={16} />
                  </button>
                </nav>
              </div>
            )}
          </>
        )}
      </section>

      {/* Start New Game Confirmation Modal */}
      {showStartModal && (
        <div
          className="modal-backdrop-custom"
          role="presentation"
          onClick={() => !isStartingGame && setShowStartModal(false)}
        >
          <div
            className="modal-dialog-custom"
            role="dialog"
            aria-modal="true"
            aria-labelledby="start-modal-title"
            aria-describedby="start-modal-description"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-content-custom">
              <div className="modal-icon-badge primary">
                <Sparkles size={26} strokeWidth={2.2} />
              </div>
              <h2 id="start-modal-title" className="modal-title-custom">
                Start a new game?
              </h2>
              <p id="start-modal-description" className="modal-desc-custom">
                You'll have 5 attempts to guess the secret 5-letter word. Ready to begin?
              </p>
              <div className="modal-actions-custom">
                <button
                  type="button"
                  className="modal-btn-cancel"
                  onClick={() => setShowStartModal(false)}
                  disabled={isStartingGame}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="modal-btn-confirm-primary"
                  onClick={handleStartGame}
                  disabled={isStartingGame}
                  autoFocus
                >
                  {isStartingGame ? (
                    <>
                      <span
                        className="spinner-border spinner-border-sm"
                        role="status"
                        aria-hidden="true"
                      ></span>
                      <span>Starting...</span>
                    </>
                  ) : (
                    <>
                      <Play size={16} fill="#FFFFFF" />
                      <span>Start Game</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
