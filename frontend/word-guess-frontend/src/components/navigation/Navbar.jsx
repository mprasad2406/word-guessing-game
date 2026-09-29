import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Gamepad2,
  LogOut,
  History,
  LayoutDashboard,
  BarChart3,
  Users,
  BookA,
  Settings,
  Menu,
  X,
  Sparkles,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import "./Navbar.css";

export function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  // Handle ESC key to dismiss modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && showLogoutModal) {
        setShowLogoutModal(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showLogoutModal]);

  const handleConfirmLogout = () => {
    setShowLogoutModal(false);
    logout();
    navigate("/login", { replace: true });
  };

  const isAdmin = user?.role === "ADMIN";

  // Check active routes
  const isLobbyActive = location.pathname === "/player";
  const isHistoryActive = location.pathname.startsWith("/player/history");

  return (
    <>
      <header className="app-navbar">
        <div className="app-navbar-container">
          {/* Left: Brand Identity */}
          <div className="navbar-brand-wrapper">
            <Link
              to={isAdmin ? "/admin" : "/player"}
              className="navbar-brand-link"
              aria-label="Guess the Word Homepage"
            >
              <div className="navbar-brand-icon-box">
                <Gamepad2 size={22} strokeWidth={2.2} />
              </div>
              <span className="navbar-brand-title">Guess the Word</span>
            </Link>
          </div>

          {/* Center: Navigation Links */}
          <nav className="navbar-center-nav" aria-label="Main Navigation">
            {isAdmin ? (
              <>
                <Link
                  to="/admin"
                  className={`navbar-nav-item ${location.pathname === "/admin" ? "active" : ""}`}
                >
                  <LayoutDashboard size={16} />
                  <span>Dashboard</span>
                </Link>
                <Link
                  to="/admin/reports"
                  className={`navbar-nav-item ${location.pathname.startsWith("/admin/reports") ? "active" : ""}`}
                >
                  <BarChart3 size={16} />
                  <span>Reports</span>
                </Link>
                <Link
                  to="/admin/users"
                  className={`navbar-nav-item ${location.pathname.startsWith("/admin/users") ? "active" : ""}`}
                >
                  <Users size={16} />
                  <span>Users</span>
                </Link>
                <Link
                  to="/admin/words"
                  className={`navbar-nav-item ${location.pathname.startsWith("/admin/words") ? "active" : ""}`}
                >
                  <BookA size={16} />
                  <span>Words</span>
                </Link>
                <Link
                  to="/admin/settings"
                  className={`navbar-nav-item ${location.pathname.startsWith("/admin/settings") ? "active" : ""}`}
                >
                  <Settings size={16} />
                  <span>Settings</span>
                </Link>
              </>
            ) : (
              <>
                <Link
                  to="/player"
                  className={`navbar-nav-item ${isLobbyActive ? "active" : ""}`}
                  aria-current={isLobbyActive ? "page" : undefined}
                >
                  <Sparkles size={16} />
                  <span>Lobby</span>
                </Link>
                <Link
                  to="/player/history"
                  className={`navbar-nav-item ${isHistoryActive ? "active" : ""}`}
                  aria-current={isHistoryActive ? "page" : undefined}
                >
                  <History size={16} />
                  <span>Game History</span>
                </Link>
              </>
            )}
          </nav>

          {/* Right: User & Actions */}
          <div className="navbar-right-section">
            {user && (
              <div className="navbar-user-info">
                <span
                  className={`navbar-role-pill role-${user.role.toLowerCase()}`}
                  title={`Logged in as ${user.role}`}
                >
                  {user.role}
                </span>
                <span className="navbar-username">{user.username}</span>
              </div>
            )}

            {user && (
              <button
                type="button"
                className="navbar-logout-btn"
                onClick={() => setShowLogoutModal(true)}
                aria-label="Log out of account"
              >
                <LogOut size={16} />
                <span>Logout</span>
              </button>
            )}

            {/* Mobile Hamburger Button */}
            <button
              type="button"
              className="navbar-mobile-toggle"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label={isMobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
              aria-expanded={isMobileMenuOpen}
            >
              {isMobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Dropdown */}
        {isMobileMenuOpen && (
          <div className="navbar-mobile-menu" role="menu">
            {isAdmin ? (
              <>
                <Link to="/admin" className={`navbar-nav-item ${location.pathname === "/admin" ? "active" : ""}`}>
                  <LayoutDashboard size={18} />
                  <span>Dashboard</span>
                </Link>
                <Link to="/admin/reports" className={`navbar-nav-item ${location.pathname.startsWith("/admin/reports") ? "active" : ""}`}>
                  <BarChart3 size={18} />
                  <span>Reports</span>
                </Link>
                <Link to="/admin/users" className={`navbar-nav-item ${location.pathname.startsWith("/admin/users") ? "active" : ""}`}>
                  <Users size={18} />
                  <span>Users</span>
                </Link>
                <Link to="/admin/words" className={`navbar-nav-item ${location.pathname.startsWith("/admin/words") ? "active" : ""}`}>
                  <BookA size={18} />
                  <span>Words</span>
                </Link>
                <Link to="/admin/settings" className={`navbar-nav-item ${location.pathname.startsWith("/admin/settings") ? "active" : ""}`}>
                  <Settings size={18} />
                  <span>Settings</span>
                </Link>
              </>
            ) : (
              <>
                <Link to="/player" className={`navbar-nav-item ${isLobbyActive ? "active" : ""}`}>
                  <Sparkles size={18} />
                  <span>Lobby</span>
                </Link>
                <Link to="/player/history" className={`navbar-nav-item ${isHistoryActive ? "active" : ""}`}>
                  <History size={18} />
                  <span>Game History</span>
                </Link>
              </>
            )}

            {user && (
              <div className="navbar-mobile-user-row">
                <span className="navbar-username">{user.username}</span>
                <span className={`navbar-role-pill role-${user.role.toLowerCase()}`}>
                  {user.role}
                </span>
              </div>
            )}

            {user && (
              <button
                type="button"
                className="navbar-mobile-logout-btn"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  setShowLogoutModal(true);
                }}
              >
                <LogOut size={16} />
                <span>Logout</span>
              </button>
            )}
          </div>
        )}
      </header>

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div
          className="modal-backdrop-custom"
          role="presentation"
          onClick={() => setShowLogoutModal(false)}
        >
          <div
            className="modal-dialog-custom"
            role="dialog"
            aria-modal="true"
            aria-labelledby="logout-modal-title"
            aria-describedby="logout-modal-description"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-content-custom">
              <div className="modal-icon-badge danger">
                <LogOut size={26} strokeWidth={2.2} />
              </div>
              <h2 id="logout-modal-title" className="modal-title-custom">
                Log out of your account?
              </h2>
              <p id="logout-modal-description" className="modal-desc-custom">
                Are you sure you want to log out? Any active game sessions will remain saved in your match history.
              </p>
              <div className="modal-actions-custom">
                <button
                  type="button"
                  className="modal-btn-cancel"
                  onClick={() => setShowLogoutModal(false)}
                >
                  Stay Logged In
                </button>
                <button
                  type="button"
                  className="modal-btn-confirm-danger"
                  onClick={handleConfirmLogout}
                  autoFocus
                >
                  <LogOut size={16} />
                  <span>Log Out</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
