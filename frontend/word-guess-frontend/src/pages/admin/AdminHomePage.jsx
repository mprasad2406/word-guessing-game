import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { SecurityKeyModal } from "../../components/admin/SecurityKeyModal";
import { PageLoader } from "../../components/common/PageLoader";
import { useAuth } from "../../context/AuthContext";
import { securityService } from "../../services/securityService";
import { settingsService } from "../../services/settingsService";
import { userService } from "../../services/userService";
import { wordService } from "../../services/wordService";

export function AdminHomePage() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalWords: 0,
    activeWords: 0,
    totalUsers: 0,
    activeUsers: 0,
    gameSettings: null,
    securityStatus: null,
  });

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSecurityModalOpen, setIsSecurityModalOpen] = useState(false);

  const loadDashboardData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const [allWordsRes, activeWordsRes, allUsersRes, activeUsersRes, settingsRes, secStatusRes] =
        await Promise.allSettled([
          wordService.listWords({ page: 1, pageSize: 1 }),
          wordService.listWords({ isActive: true, page: 1, pageSize: 1 }),
          userService.listUsers({ page: 1, pageSize: 1 }),
          userService.listUsers({ isActive: true, page: 1, pageSize: 1 }),
          settingsService.getGameSettings(),
          securityService.getSecurityStatus(),
        ]);

      setStats({
        totalWords:
          allWordsRes.status === "fulfilled" ? allWordsRes.value.total : 0,
        activeWords:
          activeWordsRes.status === "fulfilled" ? activeWordsRes.value.total : 0,
        totalUsers:
          allUsersRes.status === "fulfilled" ? allUsersRes.value.total : 0,
        activeUsers:
          activeUsersRes.status === "fulfilled" ? activeUsersRes.value.total : 0,
        gameSettings:
          settingsRes.status === "fulfilled" ? settingsRes.value : null,
        securityStatus:
          secStatusRes.status === "fulfilled" ? secStatusRes.value : null,
      });
    } catch (err) {
      console.error("Dashboard metrics load error:", err);
      setError("Some dashboard metrics could not be loaded.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  return (
    <div className="container-fluid py-4 px-md-4">
      {/* Welcome Banner */}
      <div className="card shadow-sm border-0 rounded-4 overflow-hidden mb-4 bg-dark text-white">
        <div className="card-body p-4 p-md-5">
          <div className="row align-items-center">
            <div className="col-lg-8">
              <span className="badge bg-warning text-dark mb-2 px-3 py-1 fw-semibold text-uppercase">
                Administrator Console
              </span>
              <h1 className="fw-bold display-6 mb-2">
                Welcome, {user?.username}!
              </h1>
              <p className="lead mb-4 text-white-50">
                Manage user accounts and permissions, maintain the word dictionary, and configure global gameplay policies.
              </p>
              <div className="d-flex flex-wrap gap-3">
                <Link to="/admin/users" className="btn btn-primary btn-lg px-4 fw-semibold d-inline-flex align-items-center gap-2">
                  <i className="bi bi-people"></i>
                  <span>Manage Users</span>
                </Link>
                <Link to="/admin/words" className="btn btn-outline-light btn-lg px-4 fw-semibold d-inline-flex align-items-center gap-2">
                  <i className="bi bi-book"></i>
                  <span>Words</span>
                </Link>
                <Link to="/admin/settings" className="btn btn-outline-light btn-lg px-4 fw-semibold d-inline-flex align-items-center gap-2">
                  <i className="bi bi-gear"></i>
                  <span>Settings</span>
                </Link>
                <button
                  type="button"
                  className="btn btn-outline-warning btn-lg px-4 fw-semibold d-inline-flex align-items-center gap-2"
                  onClick={() => setIsSecurityModalOpen(true)}
                >
                  <i className="bi bi-shield-lock"></i>
                  <span>Security Key</span>
                </button>
              </div>
            </div>
            <div className="col-lg-4 d-none d-lg-block text-center">
              <i className="bi bi-shield-shaded text-warning opacity-50" style={{ fontSize: "7rem" }}></i>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="alert alert-warning d-flex align-items-center gap-2 mb-4" role="alert">
          <i className="bi bi-exclamation-triangle-fill"></i>
          <div>{error}</div>
        </div>
      )}

      {/* Live System Metric Cards */}
      {isLoading ? (
        <div className="p-5 text-center">
          <PageLoader text="Loading system metrics..." />
        </div>
      ) : (
        <div className="row g-4 mb-4">
          {/* Users Count Metric */}
          <div className="col-sm-6 col-xl-3">
            <div className="card shadow-sm border-0 rounded-4 h-100">
              <div className="card-body p-4">
                <div className="d-flex justify-content-between align-items-start mb-3">
                  <div className="bg-primary-subtle text-primary p-3 rounded-3">
                    <i className="bi bi-people fs-4"></i>
                  </div>
                  <span className="badge bg-light text-secondary border">Accounts</span>
                </div>
                <h3 className="fw-bold mb-1">{stats.totalUsers}</h3>
                <span className="text-muted small">
                  <strong>{stats.activeUsers}</strong> active ({stats.totalUsers - stats.activeUsers} blocked)
                </span>
                <div className="mt-3 pt-2 border-top">
                  <Link to="/admin/users" className="small text-decoration-none fw-semibold d-inline-flex align-items-center gap-1">
                    <span>Manage users</span>
                    <i className="bi bi-arrow-right"></i>
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Words Count Metric */}
          <div className="col-sm-6 col-xl-3">
            <div className="card shadow-sm border-0 rounded-4 h-100">
              <div className="card-body p-4">
                <div className="d-flex justify-content-between align-items-start mb-3">
                  <div className="bg-info-subtle text-info p-3 rounded-3">
                    <i className="bi bi-book fs-4"></i>
                  </div>
                  <span className="badge bg-light text-secondary border">Dictionary</span>
                </div>
                <h3 className="fw-bold mb-1">{stats.totalWords}</h3>
                <span className="text-muted small">
                  <strong>{stats.activeWords}</strong> active for gameplay
                </span>
                <div className="mt-3 pt-2 border-top">
                  <Link to="/admin/words" className="small text-decoration-none fw-semibold d-inline-flex align-items-center gap-1">
                    <span>View word list</span>
                    <i className="bi bi-arrow-right"></i>
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Game Status Metric */}
          <div className="col-sm-6 col-xl-3">
            <div className="card shadow-sm border-0 rounded-4 h-100">
              <div className="card-body p-4">
                <div className="d-flex justify-content-between align-items-start mb-3">
                  <div className={`p-3 rounded-3 ${stats.gameSettings?.game_enabled ? "bg-success-subtle text-success" : "bg-danger-subtle text-danger"}`}>
                    <i className={`bi ${stats.gameSettings?.game_enabled ? "bi-check-circle-fill" : "bi-slash-circle-fill"} fs-4`}></i>
                  </div>
                  <span className="badge bg-light text-secondary border">Global Status</span>
                </div>
                <h3 className="fw-bold mb-1">
                  {stats.gameSettings?.game_enabled ? "Enabled" : "Disabled"}
                </h3>
                <span className="text-muted small">
                  {stats.gameSettings?.game_enabled
                    ? "Players can start new games"
                    : "Gameplay creation paused"}
                </span>
                <div className="mt-3 pt-2 border-top">
                  <Link to="/admin/settings" className="small text-decoration-none fw-semibold d-inline-flex align-items-center gap-1">
                    <span>Configure toggle</span>
                    <i className="bi bi-arrow-right"></i>
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Security Status Metric */}
          <div className="col-sm-6 col-xl-3">
            <div className="card shadow-sm border-0 rounded-4 h-100">
              <div className="card-body p-4">
                <div className="d-flex justify-content-between align-items-start mb-3">
                  <div className={`p-3 rounded-3 ${stats.securityStatus?.is_initialized ? "bg-success-subtle text-success" : "bg-warning-subtle text-warning"}`}>
                    <i className="bi bi-shield-lock-fill fs-4"></i>
                  </div>
                  <span className="badge bg-light text-secondary border">Security Key</span>
                </div>
                <h3 className="fw-bold mb-1">
                  {stats.securityStatus?.is_initialized ? "Configured" : "Unset"}
                </h3>
                <span className="text-muted small">
                  {stats.securityStatus?.is_initialized
                    ? "Argon2id key active"
                    : "Key setup recommended"}
                </span>
                <div className="mt-3 pt-2 border-top">
                  <button
                    type="button"
                    className="btn btn-link p-0 small text-decoration-none fw-semibold d-inline-flex align-items-center gap-1"
                    onClick={() => setIsSecurityModalOpen(true)}
                  >
                    <span>{stats.securityStatus?.is_initialized ? "Rotate key" : "Initialize key"}</span>
                    <i className="bi bi-arrow-right"></i>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Admin Modules Quick Grid */}
      <div className="row g-4">
        {/* User Management Module */}
        <div className="col-md-4">
          <div className="card shadow-sm border-0 rounded-4 h-100">
            <div className="card-header bg-white py-3 border-0">
              <h5 className="fw-semibold mb-0 d-flex align-items-center gap-2">
                <i className="bi bi-people text-primary"></i>
                <span>User Accounts & Access</span>
              </h5>
            </div>
            <div className="card-body pt-0 px-4 pb-4">
              <p className="text-muted small mb-4">
                Inspect registered player profiles, evaluate individual win rates and game histories, and block or unblock account access.
              </p>
              <Link to="/admin/users" className="btn btn-outline-primary d-inline-flex align-items-center gap-2">
                <i className="bi bi-arrow-right-circle"></i>
                <span>Open Users Console</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Words Module */}
        <div className="col-md-4">
          <div className="card shadow-sm border-0 rounded-4 h-100">
            <div className="card-header bg-white py-3 border-0">
              <h5 className="fw-semibold mb-0 d-flex align-items-center gap-2">
                <i className="bi bi-book text-primary"></i>
                <span>Word Dictionary</span>
              </h5>
            </div>
            <div className="card-body pt-0 px-4 pb-4">
              <p className="text-muted small mb-4">
                Maintain secret words, configure clues and hints, adjust difficulty classifications, and toggle word activation states.
              </p>
              <Link to="/admin/words" className="btn btn-outline-primary d-inline-flex align-items-center gap-2">
                <i className="bi bi-arrow-right-circle"></i>
                <span>Open Words Console</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Settings Module */}
        <div className="col-md-4">
          <div className="card shadow-sm border-0 rounded-4 h-100">
            <div className="card-header bg-white py-3 border-0">
              <h5 className="fw-semibold mb-0 d-flex align-items-center gap-2">
                <i className="bi bi-gear text-primary"></i>
                <span>Gameplay Rules</span>
              </h5>
            </div>
            <div className="card-body pt-0 px-4 pb-4">
              <p className="text-muted small mb-4">
                Fine-tune allowed attempts, word length limits, hint quotas, session timeouts, scoring multipliers, and word reuse.
              </p>
              <Link to="/admin/settings" className="btn btn-outline-primary d-inline-flex align-items-center gap-2">
                <i className="bi bi-arrow-right-circle"></i>
                <span>Open Settings Console</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Security Key Configuration Modal */}
      <SecurityKeyModal
        isOpen={isSecurityModalOpen}
        onClose={() => setIsSecurityModalOpen(false)}
        isInitialized={stats.securityStatus?.is_initialized || false}
        onKeyUpdated={loadDashboardData}
      />
    </div>
  );
}
