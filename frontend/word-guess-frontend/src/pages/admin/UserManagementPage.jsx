import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import { AdminPageHeader } from "../../components/admin/AdminPageHeader";
import { PageLoader } from "../../components/common/PageLoader";
import { useAuth } from "../../context/AuthContext";
import { userService } from "../../services/userService";

export function UserManagementPage() {
  const { user: currentAdmin } = useAuth();

  const [userData, setUserData] = useState({
    items: [],
    total: 0,
    page: 1,
    page_size: 20,
    pages: 1,
  });

  const [roleFilter, setRoleFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Status toggle confirmation modal
  const [statusModalUser, setStatusModalUser] = useState(null);
  const [isProcessingStatus, setIsProcessingStatus] = useState(false);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setCurrentPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const loadUsers = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const roleParam = roleFilter === "ALL" ? null : roleFilter;
      const isActiveParam =
        statusFilter === "ALL" ? null : statusFilter === "ACTIVE";

      const data = await userService.listUsers({
        role: roleParam,
        isActive: isActiveParam,
        search: debouncedSearch,
        page: currentPage,
        pageSize: 20,
      });

      setUserData(data);
    } catch (err) {
      console.error("Failed to load users:", err);
      setError(err?.message || "Failed to load user list.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, [roleFilter, statusFilter, debouncedSearch, currentPage]);

  const handleConfirmStatusToggle = async () => {
    if (!statusModalUser) return;

    const newStatus = !statusModalUser.is_active;
    setIsProcessingStatus(true);

    try {
      await userService.updateUserStatus(statusModalUser.id, newStatus);
      toast.success(
        `User '${statusModalUser.username}' has been ${
          newStatus ? "unblocked" : "blocked"
        } successfully.`
      );
      setStatusModalUser(null);
      await loadUsers();
    } catch (err) {
      toast.error(err?.message || "Failed to update user status.");
    } finally {
      setIsProcessingStatus(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "—";
    try {
      return new Date(dateStr).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="container-fluid py-4 px-md-4">
      <AdminPageHeader
        title="User Management"
        subtitle="View all registered users, monitor gameplay activity, and manage access permissions."
        breadcrumbItem="Users"
      />

      {/* Filter and Search Bar */}
      <div className="card shadow-sm border-0 rounded-3 mb-4">
        <div className="card-body p-3">
          <div className="row g-3 align-items-center">
            {/* Search Input */}
            <div className="col-12 col-md-4">
              <div className="input-group input-group-sm">
                <span className="input-group-text bg-light text-muted">
                  <i className="bi bi-search"></i>
                </span>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search by username..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={() => setSearchQuery("")}
                  >
                    <i className="bi bi-x"></i>
                  </button>
                )}
              </div>
            </div>

            {/* Status Filter */}
            <div className="col-12 col-md-auto d-flex align-items-center gap-2">
              <span className="small text-muted fw-semibold">Status:</span>
              <div className="btn-group btn-group-sm" role="group">
                <button
                  type="button"
                  className={`btn ${statusFilter === "ALL" ? "btn-primary" : "btn-outline-secondary"}`}
                  onClick={() => {
                    setStatusFilter("ALL");
                    setCurrentPage(1);
                  }}
                >
                  All
                </button>
                <button
                  type="button"
                  className={`btn ${statusFilter === "ACTIVE" ? "btn-primary" : "btn-outline-secondary"}`}
                  onClick={() => {
                    setStatusFilter("ACTIVE");
                    setCurrentPage(1);
                  }}
                >
                  Active
                </button>
                <button
                  type="button"
                  className={`btn ${statusFilter === "BLOCKED" ? "btn-primary" : "btn-outline-secondary"}`}
                  onClick={() => {
                    setStatusFilter("BLOCKED");
                    setCurrentPage(1);
                  }}
                >
                  Blocked
                </button>
              </div>
            </div>

            {/* Role Filter */}
            <div className="col-12 col-md-auto d-flex align-items-center gap-2">
              <span className="small text-muted fw-semibold">Role:</span>
              <div className="btn-group btn-group-sm" role="group">
                <button
                  type="button"
                  className={`btn ${roleFilter === "ALL" ? "btn-primary" : "btn-outline-secondary"}`}
                  onClick={() => {
                    setRoleFilter("ALL");
                    setCurrentPage(1);
                  }}
                >
                  All
                </button>
                <button
                  type="button"
                  className={`btn ${roleFilter === "PLAYER" ? "btn-primary" : "btn-outline-secondary"}`}
                  onClick={() => {
                    setRoleFilter("PLAYER");
                    setCurrentPage(1);
                  }}
                >
                  Player
                </button>
                <button
                  type="button"
                  className={`btn ${roleFilter === "ADMIN" ? "btn-primary" : "btn-outline-secondary"}`}
                  onClick={() => {
                    setRoleFilter("ADMIN");
                    setCurrentPage(1);
                  }}
                >
                  Admin
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="alert alert-danger d-flex align-items-center gap-2 mb-4" role="alert">
          <i className="bi bi-exclamation-triangle-fill"></i>
          <div>{error}</div>
        </div>
      )}

      {/* Users Table */}
      <div className="card shadow-sm border-0 rounded-3 overflow-hidden">
        {isLoading ? (
          <div className="p-5">
            <PageLoader text="Loading user accounts..." />
          </div>
        ) : userData.items.length === 0 ? (
          <div className="text-center py-5 px-3">
            <i className="bi bi-people fs-1 text-secondary opacity-50 d-block mb-3"></i>
            <h5 className="fw-semibold text-secondary">No users found</h5>
            <p className="text-muted small mb-0">
              No registered user accounts match your active search or filter criteria.
            </p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light text-secondary small text-uppercase">
                <tr>
                  <th scope="col" className="ps-4">User</th>
                  <th scope="col">Role</th>
                  <th scope="col">Status</th>
                  <th scope="col">Games Played</th>
                  <th scope="col">Won / Win Rate</th>
                  <th scope="col">Joined Date</th>
                  <th scope="col" className="text-end pe-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {userData.items.map((user) => {
                  const isSelf = user.id === currentAdmin?.id;

                  return (
                    <tr key={user.id} className={!user.is_active ? "opacity-75 bg-light" : ""}>
                      <td className="ps-4">
                        <div className="d-flex align-items-center gap-2">
                          <div
                            className="rounded-circle bg-primary bg-opacity-10 text-primary d-flex align-items-center justify-content-center fw-bold small"
                            style={{ width: "36px", height: "36px" }}
                          >
                            {user.username.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="fw-semibold text-dark">
                              {user.username}
                              {isSelf && <span className="badge bg-secondary ms-2 small">You</span>}
                            </div>
                            <div className="small text-muted font-monospace">ID #{user.id}</div>
                          </div>
                        </div>
                      </td>

                      <td>
                        <span
                          className={`badge ${
                            user.role === "ADMIN" ? "bg-dark" : "bg-primary"
                          }`}
                        >
                          {user.role}
                        </span>
                      </td>

                      <td>
                        {user.is_active ? (
                          <span className="badge bg-success-subtle text-success border border-success-subtle">
                            <i className="bi bi-check-circle-fill me-1"></i> Active
                          </span>
                        ) : (
                          <span className="badge bg-danger-subtle text-danger border border-danger-subtle">
                            <i className="bi bi-slash-circle-fill me-1"></i> Blocked
                          </span>
                        )}
                      </td>

                      <td>
                        <span className="fw-semibold">{user.total_games}</span>
                        <span className="text-muted small ms-1">games</span>
                      </td>

                      <td>
                        <div>
                          <span className="fw-semibold text-success">{user.games_won} won</span>
                          <span className="text-muted small ms-2">({user.win_rate}%)</span>
                        </div>
                      </td>

                      <td className="small text-muted">{formatDate(user.created_at)}</td>

                      <td className="text-end pe-4">
                        <div className="btn-group btn-group-sm">
                          <Link
                            to={`/admin/users/${user.id}`}
                            className="btn btn-outline-primary d-inline-flex align-items-center gap-1"
                            title="View user profile & game history"
                          >
                            <i className="bi bi-eye"></i>
                            <span>Profile</span>
                          </Link>

                          {!isSelf && (
                            <button
                              type="button"
                              className={`btn ${
                                user.is_active ? "btn-outline-danger" : "btn-outline-success"
                              }`}
                              title={user.is_active ? "Block user access" : "Unblock user"}
                              onClick={() => setStatusModalUser(user)}
                            >
                              <i
                                className={`bi ${
                                  user.is_active ? "bi-slash-circle" : "bi-check-circle"
                                }`}
                              ></i>
                              <span className="ms-1">{user.is_active ? "Block" : "Unblock"}</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {!isLoading && userData.pages > 1 && (
          <div className="card-footer bg-white border-top py-3 d-flex flex-wrap justify-content-between align-items-center gap-2">
            <div className="small text-muted">
              Showing page <strong>{userData.page}</strong> of <strong>{userData.pages}</strong> ({userData.total} users total)
            </div>

            <nav aria-label="Users pagination">
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

                {Array.from({ length: userData.pages }, (_, i) => i + 1)
                  .filter((p) => p === 1 || p === userData.pages || Math.abs(p - currentPage) <= 2)
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

                <li className={`page-item ${currentPage === userData.pages ? "disabled" : ""}`}>
                  <button
                    type="button"
                    className="page-link"
                    onClick={() => setCurrentPage((p) => Math.min(userData.pages, p + 1))}
                    disabled={currentPage === userData.pages}
                  >
                    Next
                  </button>
                </li>
              </ul>
            </nav>
          </div>
        )}
      </div>

      {/* Block/Unblock Confirmation Modal */}
      {statusModalUser && (
        <div
          className="modal show d-block"
          tabIndex="-1"
          role="dialog"
          style={{ backgroundColor: "rgba(0, 0, 0, 0.5)" }}
        >
          <div className="modal-dialog modal-dialog-centered" role="document">
            <div className="modal-content shadow-lg border-0 rounded-4 overflow-hidden">
              <div
                className={`modal-header ${
                  statusModalUser.is_active ? "bg-danger" : "bg-success"
                } text-white border-0 py-3`}
              >
                <h5 className="modal-title fw-semibold d-flex align-items-center gap-2">
                  <i
                    className={`bi ${
                      statusModalUser.is_active ? "bi-slash-circle-fill" : "bi-check-circle-fill"
                    }`}
                  ></i>
                  <span>
                    {statusModalUser.is_active ? "Block User Access" : "Unblock User Access"}
                  </span>
                </h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  aria-label="Close"
                  onClick={() => setStatusModalUser(null)}
                  disabled={isProcessingStatus}
                ></button>
              </div>

              <div className="modal-body p-4">
                <p className="mb-2">
                  Are you sure you want to{" "}
                  <strong>{statusModalUser.is_active ? "block" : "unblock"}</strong> user:
                </p>
                <div className="p-3 bg-light rounded-3 text-center my-3 border">
                  <span className="fw-bold fs-5 text-dark">{statusModalUser.username}</span>
                  <div className="small text-muted mt-1">ID #{statusModalUser.id} &bull; Role: {statusModalUser.role}</div>
                </div>

                {statusModalUser.is_active ? (
                  <p className="small text-danger mb-0">
                    <i className="bi bi-exclamation-triangle-fill me-1"></i>
                    Blocking this user will immediately revoke their access. They will not be able to log in or play any games until unblocked.
                  </p>
                ) : (
                  <p className="small text-success mb-0">
                    <i className="bi bi-info-circle-fill me-1"></i>
                    Unblocking this user will restore their ability to log in and play games normally.
                  </p>
                )}
              </div>

              <div className="modal-footer bg-light border-0 py-3 px-4">
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={() => setStatusModalUser(null)}
                  disabled={isProcessingStatus}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className={`btn ${
                    statusModalUser.is_active ? "btn-danger" : "btn-success"
                  } fw-semibold px-4`}
                  onClick={handleConfirmStatusToggle}
                  disabled={isProcessingStatus}
                >
                  {isProcessingStatus ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      <span>Processing...</span>
                    </>
                  ) : (
                    <span>{statusModalUser.is_active ? "Yes, Block User" : "Yes, Unblock User"}</span>
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
