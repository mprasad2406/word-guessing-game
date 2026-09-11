import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { AdminPageHeader } from "../../components/admin/AdminPageHeader";
import { PageLoader } from "../../components/common/PageLoader";
import { useAuth } from "../../context/AuthContext";
import { userService } from "../../services/userService";

export function UserDetailPage() {
  const { userId } = useParams();
  const { user: currentAdmin } = useAuth();

  const [userDetails, setUserDetails] = useState(null);
  const [gameHistory, setGameHistory] = useState({
    items: [],
    total: 0,
    page: 1,
    page_size: 10,
    pages: 1,
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [isLoading, setIsLoading] = useState(true);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Load user profile & overview
  const loadUserDetails = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await userService.getUserDetails(userId);
      setUserDetails(data);
    } catch (err) {
      console.error("Failed to load user details:", err);
      setError(err?.message || "Failed to load user profile.");
    } finally {
      setIsLoading(false);
    }
  };

  // Load user game history
  const loadUserHistory = async () => {
    setIsHistoryLoading(true);
    try {
      const historyRes = await userService.getUserGameHistory(userId, {
        status: statusFilter === "ALL" ? null : statusFilter,
        page: currentPage,
        pageSize: 10,
      });
      setGameHistory(historyRes);
    } catch (err) {
      console.error("Failed to load user games:", err);
    } finally {
      setIsHistoryLoading(false);
    }
  };

  useEffect(() => {
    loadUserDetails();
  }, [userId]);

  useEffect(() => {
    if (userId) {
      loadUserHistory();
    }
  }, [userId, statusFilter, currentPage]);

  const handleToggleStatus = async () => {
    if (!userDetails || isUpdatingStatus) return;

    const newStatus = !userDetails.is_active;
    setIsUpdatingStatus(true);
    try {
      const updated = await userService.updateUserStatus(userDetails.id, newStatus);
      setUserDetails(updated);
      toast.success(
        `User '${userDetails.username}' has been ${newStatus ? "unblocked" : "blocked"} successfully.`
      );
    } catch (err) {
      toast.error(err?.message || "Failed to update user status.");
    } finally {
      setIsUpdatingStatus(false);
    }
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

  const formatDate = (dateStr) => {
    if (!dateStr) return "—";
    try {
      return new Date(dateStr).toLocaleDateString(undefined, {
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

  if (isLoading) {
    return (
      <div className="container-fluid py-5 px-md-4">
        <PageLoader text="Loading user profile and statistics..." />
      </div>
    );
  }

  if (error || !userDetails) {
    return (
      <div className="container py-5" style={{ maxWidth: "600px" }}>
        <div className="card shadow-sm border-0 rounded-4 text-center p-4">
          <i className="bi bi-exclamation-triangle-fill text-warning display-4 mb-3"></i>
          <h4 className="fw-bold mb-2">User Not Found</h4>
          <p className="text-muted mb-4">{error || "The requested user profile does not exist."}</p>
          <Link to="/admin/users" className="btn btn-primary px-4">
            <i className="bi bi-arrow-left me-2"></i>Return to User Management
          </Link>
        </div>
      </div>
    );
  }

  const isSelf = userDetails.id === currentAdmin?.id;

  return (
    <div className="container-fluid py-4 px-md-4" style={{ maxWidth: "1200px" }}>
      <AdminPageHeader
        title={`User: ${userDetails.username}`}
        subtitle={`Detailed gameplay breakdown and activity logs for user #${userDetails.id}.`}
        breadcrumbItem={
          <>
            <Link to="/admin/users" className="text-decoration-none">
              Users
            </Link>{" "}
            / #{userDetails.id}
          </>
        }
        actions={
          <div className="d-flex align-items-center gap-2">
            <Link to="/admin/users" className="btn btn-outline-secondary btn-sm">
              <i className="bi bi-arrow-left me-1"></i>Back to Users
            </Link>
            {!isSelf && (
              <button
                type="button"
                className={`btn btn-sm ${
                  userDetails.is_active ? "btn-outline-danger" : "btn-success"
                } d-inline-flex align-items-center gap-1`}
                onClick={handleToggleStatus}
                disabled={isUpdatingStatus}
              >
                {isUpdatingStatus ? (
                  <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                ) : (
                  <i className={`bi ${userDetails.is_active ? "bi-slash-circle" : "bi-check-circle"}`}></i>
                )}
                <span>{userDetails.is_active ? "Block User" : "Unblock User"}</span>
              </button>
            )}
          </div>
        }
      />

      {/* Profile Overview Card */}
      <div className="card shadow-sm border-0 rounded-4 mb-4 overflow-hidden">
        <div className="card-body p-4">
          <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
            <div className="d-flex align-items-center gap-3">
              <div
                className="rounded-circle bg-primary bg-opacity-10 text-primary d-flex align-items-center justify-content-center fw-bold display-6"
                style={{ width: "64px", height: "64px" }}
              >
                {userDetails.username.charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="d-flex align-items-center gap-2">
                  <h3 className="fw-bold mb-0">{userDetails.username}</h3>
                  <span className={`badge ${userDetails.role === "ADMIN" ? "bg-dark" : "bg-primary"}`}>
                    {userDetails.role}
                  </span>
                  {userDetails.is_active ? (
                    <span className="badge bg-success-subtle text-success border border-success-subtle">
                      <i className="bi bi-check-circle-fill me-1"></i> Active
                    </span>
                  ) : (
                    <span className="badge bg-danger-subtle text-danger border border-danger-subtle">
                      <i className="bi bi-slash-circle-fill me-1"></i> Blocked
                    </span>
                  )}
                </div>
                <div className="small text-muted mt-1">
                  User ID: <strong>#{userDetails.id}</strong> &bull; Member since: <strong>{formatDate(userDetails.created_at)}</strong>
                </div>
              </div>
            </div>

            {!userDetails.is_active && (
              <div className="alert alert-danger py-2 px-3 mb-0 small rounded-3 border border-danger-subtle d-flex align-items-center gap-2">
                <i className="bi bi-slash-circle-fill text-danger fs-5"></i>
                <div>
                  <strong>Access Blocked:</strong> This user cannot log in or play games.
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="row g-3 mb-4">
        <div className="col-sm-6 col-lg-3">
          <div className="card shadow-sm border-0 rounded-4 h-100 p-3 bg-light">
            <div className="text-secondary small fw-semibold text-uppercase">Total Games</div>
            <div className="display-6 fw-bold text-dark mt-1">{userDetails.total_games}</div>
            <div className="small text-muted mt-1">{userDetails.active_games} active in progress</div>
          </div>
        </div>

        <div className="col-sm-6 col-lg-3">
          <div className="card shadow-sm border-0 rounded-4 h-100 p-3 bg-light">
            <div className="text-success small fw-semibold text-uppercase">Victories & Win Rate</div>
            <div className="display-6 fw-bold text-success mt-1">{userDetails.games_won}</div>
            <div className="small text-muted mt-1"><strong>{userDetails.win_rate}%</strong> win rate</div>
          </div>
        </div>

        <div className="col-sm-6 col-lg-3">
          <div className="card shadow-sm border-0 rounded-4 h-100 p-3 bg-light">
            <div className="text-danger small fw-semibold text-uppercase">Losses & Expired</div>
            <div className="display-6 fw-bold text-danger mt-1">
              {userDetails.games_lost + userDetails.games_expired}
            </div>
            <div className="small text-muted mt-1">
              {userDetails.games_lost} lost &bull; {userDetails.games_expired} expired
            </div>
          </div>
        </div>

        <div className="col-sm-6 col-lg-3">
          <div className="card shadow-sm border-0 rounded-4 h-100 p-3 bg-light">
            <div className="text-info small fw-semibold text-uppercase">Hints & Attempts</div>
            <div className="display-6 fw-bold text-dark mt-1">{userDetails.attempts_used_total}</div>
            <div className="small text-muted mt-1">
              {userDetails.hints_used_total} hints used in total
            </div>
          </div>
        </div>
      </div>

      {/* User's Game History Section */}
      <div className="card shadow-sm border-0 rounded-4 overflow-hidden mb-4">
        <div className="card-header bg-white py-3 border-0 d-flex flex-wrap justify-content-between align-items-center gap-2">
          <h5 className="fw-semibold mb-0 d-flex align-items-center gap-2">
            <i className="bi bi-clock-history text-primary"></i>
            <span>Match History ({gameHistory.total})</span>
          </h5>

          {/* Status Filter */}
          <div className="btn-group btn-group-sm" role="group">
            {["ALL", "WON", "LOST", "EXPIRED", "ACTIVE"].map((status) => (
              <button
                key={status}
                type="button"
                className={`btn ${
                  statusFilter === status ? "btn-primary" : "btn-outline-secondary"
                }`}
                onClick={() => {
                  setStatusFilter(status);
                  setCurrentPage(1);
                }}
              >
                {status === "ALL" ? "All" : status.charAt(0) + status.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
        </div>

        {isHistoryLoading ? (
          <div className="p-4 text-center">
            <PageLoader text="Loading user matches..." />
          </div>
        ) : gameHistory.items.length === 0 ? (
          <div className="text-center py-5 px-3">
            <i className="bi bi-inbox fs-1 text-secondary opacity-50 d-block mb-3"></i>
            <h6 className="fw-semibold text-secondary">No games played yet</h6>
            <p className="text-muted small mb-0">This user has no recorded games matching the selected filter.</p>
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
                  <th scope="col">Started</th>
                  <th scope="col" className="text-end pe-4">Action</th>
                </tr>
              </thead>
              <tbody>
                {gameHistory.items.map((game) => (
                  <tr key={game.id}>
                    <td className="ps-4 fw-semibold font-monospace">#{game.id}</td>
                    <td>{getStatusBadge(game.status)}</td>
                    <td>
                      {game.final_word ? (
                        <span className="font-monospace fw-bold text-uppercase text-dark">
                          {game.final_word}
                        </span>
                      ) : (
                        <span className="text-muted small">{game.word_length} letters (Hidden)</span>
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
                    <td className="small text-muted">{formatDate(game.started_at)}</td>
                    <td className="text-end pe-4">
                      <Link
                        to={`/player/game/${game.id}`}
                        className="btn btn-sm btn-outline-primary d-inline-flex align-items-center gap-1"
                      >
                        <span>View</span>
                        <i className="bi bi-chevron-right"></i>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* History Pagination Footer */}
        {!isHistoryLoading && gameHistory.pages > 1 && (
          <div className="card-footer bg-white border-top py-3 d-flex flex-wrap justify-content-between align-items-center gap-2">
            <div className="small text-muted">
              Showing page <strong>{gameHistory.page}</strong> of <strong>{gameHistory.pages}</strong>
            </div>

            <nav aria-label="User game history pagination">
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
                <li className={`page-item ${currentPage === gameHistory.pages ? "disabled" : ""}`}>
                  <button
                    type="button"
                    className="page-link"
                    onClick={() => setCurrentPage((p) => Math.min(gameHistory.pages, p + 1))}
                    disabled={currentPage === gameHistory.pages}
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
