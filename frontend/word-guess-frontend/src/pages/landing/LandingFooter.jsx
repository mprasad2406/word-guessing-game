import React from "react";
import { Link } from "react-router-dom";

export function LandingFooter() {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer className="lp-footer">
      <div className="lp-footer-container">
        {/* Brand Column */}
        <div className="lp-footer-brand-col">
          <Link to="/" onClick={scrollToTop} className="lp-brand-logo">
            <div className="lp-brand-icon-box">
              <span>W</span>
            </div>
            <span>Guess The Word</span>
          </Link>
          <p>
            Interactive word deduction game platform. Solve 5-letter puzzles,
            track your win streaks, and review your match history.
          </p>
        </div>

        {/* Quick Navigation */}
        <div className="lp-footer-col">
          <h5>Navigation</h5>
          <ul>
            <li><a href="#hero">Home</a></li>
            <li><a href="#how-to-play">How to Play</a></li>
            <li><a href="#game-preview">Game Preview</a></li>
            <li><a href="#features">Features</a></li>
          </ul>
        </div>

        {/* Game Rules */}
        <div className="lp-footer-col">
          <h5>Game System</h5>
          <ul>
            <li><span style={{ color: "var(--lp-text-muted)" }}>5-Letter Words</span></li>
            <li><span style={{ color: "var(--lp-text-muted)" }}>6 Max Attempts</span></li>
            <li><span style={{ color: "var(--lp-text-muted)" }}>Color-Coded Feedback</span></li>
            <li><span style={{ color: "var(--lp-text-muted)" }}>Server Validation</span></li>
          </ul>
        </div>

        {/* Account & Portal */}
        <div className="lp-footer-col">
          <h5>Platform</h5>
          <ul>
            <li><Link to="/login">Player Login</Link></li>
            <li><Link to="/register">Create Account</Link></li>
            <li><Link to="/player">Player Arena</Link></li>
            <li><Link to="/admin">Admin Portal</Link></li>
          </ul>
        </div>
      </div>

      {/* Footer Bottom Bar */}
      <div className="lp-footer-bottom">
        <span>© {new Date().getFullYear()} Guess The Word. All rights reserved.</span>
        <div className="d-flex align-items-center gap-3">
          <span>5-Letter Word Guessing Game</span>
        </div>
      </div>
    </footer>
  );
}
