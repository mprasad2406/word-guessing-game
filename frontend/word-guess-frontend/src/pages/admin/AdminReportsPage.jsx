import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { ErrorMessage } from "../../components/common/ErrorMessage";
import { PageLoader } from "../../components/common/PageLoader";
import { adminReportService } from "../../services/adminReportService";
import { userService } from "../../services/userService";

export function AdminReportsPage() {
  const [activeTab, setActiveTab] = useState("daily"); // "daily" | "users"

  // --- Daily Reports State ---
  const [dailyDateFilter, setDailyDateFilter] = useState("");
  const [dailyData, setDailyData] = useState({ summaries: [], total: 0, page: 1, page_size: 20, pages: 1 });
  const [isDailyLoading, setIsDailyLoading] = useState(true);
  const [dailyError, setDailyError] = useState(null);

  // Selected date for on-demand detailed logs
  const [expandedDate, setExpandedDate] = useState(null);
  const [detailsData, setDetailsData] = useState({ sessions: [], total: 0, page: 1, page_size: 10, pages: 1 });
  const [isDetailsLoading, setIsDetailsLoading] = useState(false);

  // --- User Reports State ---
  const [userFilterId, setUserFilterId] = useState("ALL");
  const [userDateFilter, setUserDateFilter] = useState("");
  const [userData, setUserData] = useState({ summaries: [], total: 0, page: 1, page_size: 20, pages: 1 });
  const [isUserLoading, setIsUserLoading] = useState(false);
  const [userError, setUserError] = useState(null);

  // User list for dropdown selector
  const [userOptions, setUserOptions] = useState([]);

  // Load User dropdown list on mount
  useEffect(() => {
    async function loadUserDropdown() {
      try {
        const res = await userService.listUsers({ pageSize: 100 });
        if (res && res.items) {
          setUserOptions(res.items);
        }
      } catch (err) {
        console.error("Could not load users for report filter:", err);
      }
    }
    loadUserDropdown();
  }, []);

  // Fetch Daily Reports
  const fetchDailyReports = async (page = 1) => {
    setIsDailyLoading(true);
    setDailyError(null);
    try {
      const res = await adminReportService.getDailyReports({
        date: dailyDateFilter || null,
        page,
        pageSize: 20,
      });
      setDailyData(res || { summaries: [], total: 0, page: 1, page_size: 20, pages: 1 });
    } catch (err) {
      setDailyError(err?.message || "Failed to load daily reports.");
    } finally {
      setIsDailyLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "daily") {
      fetchDailyReports(1);
    }
  }, [activeTab]);

  // Fetch User Reports
  const fetchUserReports = async (page = 1) => {
    setIsUserLoading(true);
    setUserError(null);
    try {
      const res = await adminReportService.getUserReports({
        userId: userFilterId === "ALL" ? null : userFilterId,
        date: userDateFilter || null,
        page,
        pageSize: 20,
      });
      setUserData(res || { summaries: [], total: 0, page: 1, page_size: 20, pages: 1 });
    } catch (err) {
      setUserError(err?.message || "Failed to load user reports.");
    } finally {
      setIsUserLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "users") {
      fetchUserReports(1);
    }
  }, [activeTab]);

  // Fetch on-demand session details for a specific date
  const handleToggleDateDetails = async (targetDate, page = 1) => {
    if (expandedDate === targetDate && page === detailsData.page) {
      setExpandedDate(null);
      return;
    }

    setExpandedDate(targetDate);
    setIsDetailsLoading(true);
    try {
      const res = await adminReportService.getDailyDetails(targetDate, { page, pageSize: 10 });
      setDetailsData(res || { sessions: [], total: 0, page: 1, page_size: 10, pages: 1 });
    } catch (err) {
      toast.error(err?.message || "Could not load session details.");
    } finally {
      setIsDetailsLoading(false);
    }
  };

  // KPI Calculations for Daily
  const totalUsersToday = dailyData.summaries.reduce((acc, curr) => acc + curr.number_of_users, 0);
  const totalCorrectToday = dailyData.summaries.reduce((acc, curr) => acc + curr.number_of_correct_guesses, 0);
  const totalGamesToday = dailyData.summaries.reduce((acc, curr) => acc + curr.total_games, 0);
  const totalWonToday = dailyData.summaries.reduce((acc, curr) => acc + curr.games_won, 0);
  const overallWinRate = totalGamesToday > 0 ? ((totalWonToday / totalGamesToday) * 100).toFixed(1) : 0;

  return (
    <div className="container py-4">
      {/* Header */}
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 pb-2 border-bottom">
        <div>
          <h2 className="fw-bold mb-1 d-flex align-items-center gap-2 text-dark">
            <i className="bi bi-graph-up text-primary"></i>
            <span>Gameplay & Activity Reports</span>
          </h2>
          <p className="text-muted mb-0 small">
            View aggregated daily activity, user performance metrics, and words tried.
          </p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <ul className="nav nav-pills mb-4 gap-2">
        <li className="nav-item">
          <button
            type="button"
            className={`nav-link px-4 py-2 fw-semibold rounded-3 ${activeTab === "daily" ? "active" : "bg-light text-dark"}`}
            onClick={() => setActiveTab("daily")}
          >
            <i className="bi bi-calendar-event me-2"></i>
            <span>Daily Report</span>
          </button>
        </li>
        <li className="nav-item">
          <button
            type="button"
            className={`nav-link px-4 py-2 fw-semibold rounded-3 ${activeTab === "users" ? "active" : "bg-light text-dark"}`}
            onClick={() => setActiveTab("users")}
          >
            <i className="bi bi-person-lines-fill me-2"></i>
            <span>User Report</span>
          </button>
        </li>
      </ul>

      {/* TAB 1: DAILY REPORT */}
      {activeTab === "daily" && (
        <>
          {/* KPI Summary Cards */}
          <div className="row g-3 mb-4">
            <div className="col-sm-6 col-md-3">
              <div className="card shadow-sm border-0 rounded-4 p-3 bg-white">
                <div className="text-muted small fw-semibold text-uppercase">Active Users</div>
                <div className="display-6 fw-bold text-primary mt-1">{totalUsersToday}</div>
                <div className="small text-muted mt-1">Unique players active</div>
              </div>
            </div>
            <div className="col-sm-6 col-md-3">
              <div className="card shadow-sm border-0 rounded-4 p-3 bg-white">
                <div className="text-muted small fw-semibold text-uppercase">Correct Guesses</div>
                <div className="display-6 fw-bold text-success mt-1">{totalCorrectToday}</div>
                <div className="small text-muted mt-1">Exact word matches</div>
              </div>
            </div>
            <div className="col-sm-6 col-md-3">
              <div className="card shadow-sm border-0 rounded-4 p-3 bg-white">
                <div className="text-muted small fw-semibold text-uppercase">Games Played</div>
                <div className="display-6 fw-bold text-dark mt-1">{totalGamesToday}</div>
                <div className="small text-muted mt-1">{totalWonToday} games won</div>
              </div>
            </div>
            <div className="col-sm-6 col-md-3">
              <div className="card shadow-sm border-0 rounded-4 p-3 bg-white">
                <div className="text-muted small fw-semibold text-uppercase">Win Rate</div>
                <div className="display-6 fw-bold text-info mt-1">{overallWinRate}%</div>
                <div className="small text-muted mt-1">Overall completion success</div>
              </div>
            </div>
          </div>

          {/* Daily Filter Bar */}
          <div className="card shadow-sm border-0 rounded-3 mb-4">
            <div className="card-body p-3">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  fetchDailyReports(1);
                }}
                className="row g-2 align-items-center"
              >
                <div className="col-auto">
                  <label htmlFor="daily-date-picker" className="col-form-label small fw-semibold text-muted">
                    Filter Date:
                  </label>
                </div>
                <div className="col-auto">
                  <input
                    id="daily-date-picker"
                    type="date"
                    className="form-control form-control-sm"
                    value={dailyDateFilter}
                    onChange={(e) => setDailyDateFilter(e.target.value)}
                  />
                </div>
                <div className="col-auto">
                  <button type="submit" className="btn btn-sm btn-primary px-3 fw-semibold">
                    <i className="bi bi-funnel me-1"></i> Filter
                  </button>
                </div>
                {dailyDateFilter && (
                  <div className="col-auto">
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-secondary px-3"
                      onClick={() => {
                        setDailyDateFilter("");
                        setTimeout(() => fetchDailyReports(1), 0);
                      }}
                    >
                      Clear
                    </button>
                  </div>
                )}
              </form>
            </div>
          </div>

          {/* Daily Table */}
          {dailyError && <ErrorMessage message={dailyError} onRetry={() => fetchDailyReports(1)} />}

          {isDailyLoading ? (
            <PageLoader text="Loading daily report..." />
          ) : (
            <div className="card shadow-sm border-0 rounded-4 overflow-hidden mb-4">
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead className="table-light">
                    <tr>
                      <th className="ps-4">Date</th>
                      <th className="text-center">Active Users</th>
                      <th className="text-center">Correct Guesses</th>
                      <th className="text-center">Games Won</th>
                      <th className="text-center">Total Games</th>
                      <th className="text-center">Total Guesses</th>
                      <th className="text-center">Win Rate</th>
                      <th className="text-end pe-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dailyData.summaries.length === 0 ? (
                      <tr>
                        <td colSpan="8" className="text-center py-5 text-muted">
                          <i className="bi bi-inbox fs-2 text-secondary opacity-50 d-block mb-2"></i>
                          No gameplay data recorded for the selected period.
                        </td>
                      </tr>
                    ) : (
                      dailyData.summaries.map((row) => {
                        const isExpanded = expandedDate === row.date;
                        return (
                          <React.Fragment key={row.date}>
                            <tr>
                              <td className="ps-4 fw-bold font-monospace text-primary">{row.date}</td>
                              <td className="text-center">
                                <span className="badge bg-primary-subtle text-primary border border-primary-subtle px-3 py-1">
                                  {row.number_of_users} users
                                </span>
                              </td>
                              <td className="text-center">
                                <span className="badge bg-success-subtle text-success border border-success-subtle px-3 py-1">
                                  <i className="bi bi-check-circle me-1"></i>
                                  {row.number_of_correct_guesses}
                                </span>
                              </td>
                              <td className="text-center fw-semibold text-success">{row.games_won}</td>
                              <td className="text-center fw-semibold">{row.total_games}</td>
                              <td className="text-center text-muted">{row.total_guesses}</td>
                              <td className="text-center">
                                <span className="badge bg-light text-dark border px-2 py-1">
                                  {row.win_rate}%
                                </span>
                              </td>
                              <td className="text-end pe-4">
                                <button
                                  type="button"
                                  className={`btn btn-sm ${isExpanded ? "btn-secondary" : "btn-outline-primary"}`}
                                  onClick={() => handleToggleDateDetails(row.date, 1)}
                                >
                                  <i className={`bi ${isExpanded ? "bi-chevron-up" : "bi-eye"} me-1`}></i>
                                  {isExpanded ? "Hide Logs" : "View Logs"}
                                </button>
                              </td>
                            </tr>

                            {/* Expanded Details Row */}
                            {isExpanded && (
                              <tr className="bg-light">
                                <td colSpan="8" className="p-4">
                                  <div className="card border shadow-sm rounded-3">
                                    <div className="card-header bg-white py-2 d-flex justify-content-between align-items-center">
                                      <span className="fw-semibold small text-uppercase text-secondary">
                                        <i className="bi bi-list-nested me-1"></i>
                                        Detailed Game Sessions for {row.date}
                                      </span>
                                      <span className="badge bg-secondary">
                                        Total: {detailsData.total} sessions
                                      </span>
                                    </div>
                                    <div className="card-body p-0">
                                      {isDetailsLoading ? (
                                        <div className="py-4 text-center">
                                          <div className="spinner-border spinner-border-sm text-primary" role="status"></div>
                                          <span className="ms-2 small text-muted">Loading logs...</span>
                                        </div>
                                      ) : detailsData.sessions.length === 0 ? (
                                        <div className="p-3 text-center text-muted small">
                                          No sessions logged for this date.
                                        </div>
                                      ) : (
                                        <div className="table-responsive">
                                          <table className="table table-sm align-middle mb-0">
                                            <thead className="table-light small">
                                              <tr>
                                                <th className="ps-3">Game ID</th>
                                                <th>Player</th>
                                                <th>Secret Word</th>
                                                <th>Status</th>
                                                <th>Attempts</th>
                                                <th>Guesses Submitted</th>
                                                <th>Time</th>
                                              </tr>
                                            </thead>
                                            <tbody className="small">
                                              {detailsData.sessions.map((s) => (
                                                <tr key={s.session_id}>
                                                  <td className="ps-3 font-monospace fw-bold">#{s.session_id}</td>
                                                  <td className="fw-semibold">{s.username}</td>
                                                  <td>
                                                    <span className="font-monospace fw-bold text-uppercase badge bg-light text-dark border">
                                                      {s.target_word}
                                                    </span>
                                                  </td>
                                                  <td>
                                                    <span
                                                      className={`badge ${
                                                        s.status === "WON"
                                                          ? "bg-success"
                                                          : s.status === "LOST"
                                                          ? "bg-danger"
                                                          : "bg-warning text-dark"
                                                      }`}
                                                    >
                                                      {s.status}
                                                    </span>
                                                  </td>
                                                  <td>
                                                    {s.attempts_used} / {s.max_attempts}
                                                  </td>
                                                  <td>
                                                    {s.guesses && s.guesses.length > 0 ? (
                                                      <div className="d-flex flex-wrap gap-1">
                                                        {s.guesses.map((g, idx) => (
                                                          <span
                                                            key={idx}
                                                            className="badge bg-white text-dark border font-monospace text-uppercase"
                                                          >
                                                            {g}
                                                          </span>
                                                        ))}
                                                      </div>
                                                    ) : (
                                                      <span className="text-muted">None</span>
                                                    )}
                                                  </td>
                                                  <td className="text-muted">
                                                    {new Date(s.started_at).toLocaleTimeString([], {
                                                      hour: "2-digit",
                                                      minute: "2-digit",
                                                    })}
                                                  </td>
                                                </tr>
                                              ))}
                                            </tbody>
                                          </table>
                                        </div>
                                      )}
                                    </div>
                                  </div>
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

              {/* Pagination */}
              {dailyData.pages > 1 && (
                <div className="card-footer bg-white d-flex justify-content-between align-items-center py-3">
                  <span className="text-muted small">
                    Page {dailyData.page} of {dailyData.pages} ({dailyData.total} total days)
                  </span>
                  <div className="btn-group btn-group-sm">
                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      disabled={dailyData.page <= 1}
                      onClick={() => fetchDailyReports(dailyData.page - 1)}
                    >
                      Previous
                    </button>
                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      disabled={dailyData.page >= dailyData.pages}
                      onClick={() => fetchDailyReports(dailyData.page + 1)}
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* TAB 2: USER REPORT */}
      {activeTab === "users" && (
        <>
          {/* User Filter Bar */}
          <div className="card shadow-sm border-0 rounded-3 mb-4">
            <div className="card-body p-3">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  fetchUserReports(1);
                }}
                className="row g-3 align-items-center"
              >
                <div className="col-sm-auto">
                  <label htmlFor="user-select" className="form-label small fw-semibold text-muted mb-0">
                    Select User:
                  </label>
                  <select
                    id="user-select"
                    className="form-select form-select-sm mt-1"
                    value={userFilterId}
                    onChange={(e) => setUserFilterId(e.target.value)}
                  >
                    <option value="ALL">All Users</option>
                    {userOptions.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.username} ({u.role})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="col-sm-auto">
                  <label htmlFor="user-date-picker" className="form-label small fw-semibold text-muted mb-0">
                    Date Filter:
                  </label>
                  <input
                    id="user-date-picker"
                    type="date"
                    className="form-control form-control-sm mt-1"
                    value={userDateFilter}
                    onChange={(e) => setUserDateFilter(e.target.value)}
                  />
                </div>

                <div className="col-sm-auto d-flex align-items-end pt-3">
                  <button type="submit" className="btn btn-sm btn-primary px-3 fw-semibold me-2">
                    <i className="bi bi-funnel me-1"></i> Apply Filter
                  </button>
                  {(userFilterId !== "ALL" || userDateFilter) && (
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-secondary px-3"
                      onClick={() => {
                        setUserFilterId("ALL");
                        setUserDateFilter("");
                        setTimeout(() => fetchUserReports(1), 0);
                      }}
                    >
                      Reset
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>

          {/* User Report Table */}
          {userError && <ErrorMessage message={userError} onRetry={() => fetchUserReports(1)} />}

          {isUserLoading ? (
            <PageLoader text="Loading user reports..." />
          ) : (
            <div className="card shadow-sm border-0 rounded-4 overflow-hidden mb-4">
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead className="table-light">
                    <tr>
                      <th className="ps-4">User</th>
                      <th>Date</th>
                      <th className="text-center">Words Tried (Games Started)</th>
                      <th className="text-center">Correct Guesses</th>
                      <th className="text-center">Games Won</th>
                      <th className="text-center">Total Guesses</th>
                      <th className="text-center pe-4">Win Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {userData.summaries.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="text-center py-5 text-muted">
                          <i className="bi bi-person-x fs-2 text-secondary opacity-50 d-block mb-2"></i>
                          No user performance records found for the selected criteria.
                        </td>
                      </tr>
                    ) : (
                      userData.summaries.map((row, idx) => (
                        <tr key={`${row.user_id}-${row.date}-${idx}`}>
                          <td className="ps-4 fw-bold text-dark">
                            <i className="bi bi-person-circle text-secondary me-2"></i>
                            {row.username}
                          </td>
                          <td className="font-monospace text-primary fw-medium">{row.date}</td>
                          <td className="text-center">
                            <span className="badge bg-secondary-subtle text-secondary border px-3 py-1">
                              {row.words_tried} words
                            </span>
                          </td>
                          <td className="text-center">
                            <span className="badge bg-success-subtle text-success border border-success-subtle px-3 py-1">
                              <i className="bi bi-check-circle me-1"></i>
                              {row.correct_guesses}
                            </span>
                          </td>
                          <td className="text-center fw-semibold text-success">{row.games_won}</td>
                          <td className="text-center text-muted">{row.total_guesses}</td>
                          <td className="text-center pe-4">
                            <span className="badge bg-light text-dark border px-2 py-1">
                              {row.win_rate}%
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {userData.pages > 1 && (
                <div className="card-footer bg-white d-flex justify-content-between align-items-center py-3">
                  <span className="text-muted small">
                    Page {userData.page} of {userData.pages} ({userData.total} total records)
                  </span>
                  <div className="btn-group btn-group-sm">
                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      disabled={userData.page <= 1}
                      onClick={() => fetchUserReports(userData.page - 1)}
                    >
                      Previous
                    </button>
                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      disabled={userData.page >= userData.pages}
                      onClick={() => fetchUserReports(userData.page + 1)}
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
