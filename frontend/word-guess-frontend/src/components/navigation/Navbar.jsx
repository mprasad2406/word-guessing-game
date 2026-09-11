import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  const isAdmin = user?.role === "ADMIN";

  return (
    <header className="navbar">
      <div className="navbar-container">
        <div className="navbar-brand">
          <Link to={isAdmin ? "/admin" : "/player"} className="brand-logo">
            <span className="brand-icon"><i className="bi bi-controller"></i></span>
            <span className="brand-title">Guess the Word</span>
          </Link>
        </div>

        <nav className="navbar-nav">
          <div className="nav-links">
            {isAdmin ? (
              <>
                <Link to="/admin" className="nav-link">
                  Dashboard
                </Link>
                <Link to="/admin/reports" className="nav-link">
                  Reports
                </Link>
                <Link to="/admin/users" className="nav-link">
                  Users
                </Link>
                <Link to="/admin/words" className="nav-link">
                  Words
                </Link>
                <Link to="/admin/settings" className="nav-link">
                  Settings
                </Link>
              </>
            ) : (
              <>
                <Link to="/player" className="nav-link">
                  Lobby
                </Link>
                <Link to="/player/history" className="nav-link">
                  Game History
                </Link>
              </>
            )}
          </div>

          {user && (
            <div className="navbar-user-section">
              <span className={`role-badge role-${user.role.toLowerCase()}`}>
                {user.role}
              </span>
              <span className="username-display">{user.username}</span>
              <button
                type="button"
                className="btn btn-outline-danger btn-sm d-flex align-items-center gap-1"
                onClick={handleLogout}
              >
                <i className="bi bi-box-arrow-right"></i>
                <span>Logout</span>
              </button>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}
