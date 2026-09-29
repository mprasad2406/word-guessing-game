import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Gamepad2,
  LogIn,
  Play,
  User,
  LogOut,
  Menu,
  X,
  Shield,
  HelpCircle,
  Sparkles,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";

export function LandingNavbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handlePlayNow = () => {
    if (!isAuthenticated) {
      navigate("/login");
    } else if (user?.role === "ADMIN") {
      navigate("/admin");
    } else {
      navigate("/player");
    }
  };

  const scrollToSection = (id) => {
    setMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <nav className="lp-navbar" aria-label="Main Navigation">
      <div className="lp-nav-container">
        {/* Brand Logo */}
        <Link to="/" className="lp-brand-logo">
          <div className="lp-brand-icon-box">
            <span>W</span>
          </div>
          <span>Guess The Word</span>
        </Link>

        {/* Desktop Navigation Links */}
        <ul className="lp-nav-links">
          <li>
            <button
              type="button"
              className="lp-nav-link"
              onClick={() => scrollToSection("hero")}
            >
              Home
            </button>
          </li>
          <li>
            <button
              type="button"
              className="lp-nav-link"
              onClick={() => scrollToSection("how-to-play")}
            >
              How to Play
            </button>
          </li>
          <li>
            <button
              type="button"
              className="lp-nav-link"
              onClick={() => scrollToSection("game-preview")}
            >
              Game Preview
            </button>
          </li>
          <li>
            <button
              type="button"
              className="lp-nav-link"
              onClick={() => scrollToSection("features")}
            >
              Features
            </button>
          </li>
        </ul>

        {/* Action Buttons */}
        <div className="lp-nav-actions">
          {isAuthenticated ? (
            <>
              <Link
                to={user?.role === "ADMIN" ? "/admin" : "/player"}
                className="lp-btn-login"
                title="Go to Dashboard"
              >
                {user?.role === "ADMIN" ? <Shield size={16} /> : <User size={16} />}
                <span>{user?.username || "Dashboard"}</span>
              </Link>
              <button
                type="button"
                onClick={handlePlayNow}
                className="lp-btn-primary"
              >
                <Play size={16} fill="currentColor" />
                <span>Play Now</span>
              </button>
              <button
                type="button"
                onClick={logout}
                className="lp-btn-secondary"
                style={{ padding: "8px 12px" }}
                title="Log Out"
                aria-label="Log Out"
              >
                <LogOut size={16} />
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="lp-btn-login">
                <LogIn size={16} />
                <span>Sign In</span>
              </Link>
              <button
                type="button"
                onClick={handlePlayNow}
                className="lp-btn-primary"
              >
                <Play size={16} fill="currentColor" />
                <span>Play Now</span>
              </button>
            </>
          )}

          {/* Mobile Menu Button */}
          <button
            type="button"
            className="lp-mobile-menu-btn"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lp-mobile-drawer">
          <button
            type="button"
            className="lp-nav-link text-start"
            style={{ padding: "6px 0" }}
            onClick={() => scrollToSection("hero")}
          >
            Home
          </button>
          <button
            type="button"
            className="lp-nav-link text-start"
            style={{ padding: "6px 0" }}
            onClick={() => scrollToSection("how-to-play")}
          >
            How to Play
          </button>
          <button
            type="button"
            className="lp-nav-link text-start"
            style={{ padding: "6px 0" }}
            onClick={() => scrollToSection("game-preview")}
          >
            Game Preview
          </button>
          <button
            type="button"
            className="lp-nav-link text-start"
            style={{ padding: "6px 0" }}
            onClick={() => scrollToSection("features")}
          >
            Features
          </button>

          {!isAuthenticated ? (
            <div className="d-flex gap-2 pt-2 border-top">
              <Link to="/login" className="lp-btn-login flex-grow-1 justify-content-center">
                Sign In
              </Link>
              <Link to="/register" className="lp-btn-primary flex-grow-1 justify-content-center">
                Register
              </Link>
            </div>
          ) : (
            <div className="d-flex gap-2 pt-2 border-top">
              <button
                type="button"
                onClick={handlePlayNow}
                className="lp-btn-primary flex-grow-1 justify-content-center"
              >
                <Play size={16} fill="currentColor" /> Go to Game
              </button>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}
