import React from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Trophy,
  BarChart3,
  History,
  FileText,
  Shield,
  ArrowRight,
  Flame,
  CheckCircle,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";

export function LeaderboardPreviewSection() {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  const handleAction = () => {
    if (!isAuthenticated) {
      navigate("/login");
    } else if (user?.role === "ADMIN") {
      navigate("/admin");
    } else {
      navigate("/player");
    }
  };

  return (
    <section id="features" className="lp-section-container">
      <div className="lp-section-header">
        <div className="lp-section-tag">
          <BarChart3 size={15} />
          <span>Platform Capabilities</span>
        </div>
        <h2 className="lp-section-title">Built for Word Enthusiasts</h2>
        <p className="lp-section-desc">
          Everything you need to track progress, inspect past games, and improve your word-deduction skills.
        </p>
      </div>

      {/* 3 Core Highlight Cards */}
      <div className="lp-highlights-grid">
        {/* Card 1: Player Stats & Streaks */}
        <div className="lp-highlight-card">
          <div className="lp-highlight-icon">
            <Trophy size={22} />
          </div>
          <h3 style={{ fontSize: "1.2rem", fontWeight: 700, color: "#0f172a", marginBottom: "10px" }}>
            Performance Tracking
          </h3>
          <p style={{ fontSize: "0.92rem", color: "var(--lp-text-secondary)", lineHeight: 1.55, marginBottom: "16px" }}>
            Monitor your lifetime games played, victory percentages, win counts, and current and best winning streaks.
          </p>
          <div className="d-flex align-items-center gap-2 pt-2 border-top" style={{ fontSize: "0.85rem", color: "#d97706", fontWeight: 600 }}>
            <Flame size={16} fill="currentColor" />
            <span>Streak tracking on every win</span>
          </div>
        </div>

        {/* Card 2: Match History & Details */}
        <div className="lp-highlight-card">
          <div className="lp-highlight-icon">
            <History size={22} />
          </div>
          <h3 style={{ fontSize: "1.2rem", fontWeight: 700, color: "#0f172a", marginBottom: "10px" }}>
            Match History Logs
          </h3>
          <p style={{ fontSize: "0.92rem", color: "var(--lp-text-secondary)", lineHeight: 1.55, marginBottom: "16px" }}>
            Review every completed game with attempt counts, durations, timestamps, and step-by-step guess evaluations.
          </p>
          <div className="d-flex align-items-center gap-2 pt-2 border-top" style={{ fontSize: "0.85rem", color: "#2563eb", fontWeight: 600 }}>
            <CheckCircle size={16} />
            <span>Filter by Won, Lost, or Expired</span>
          </div>
        </div>

        {/* Card 3: Admin & Reporting Engine */}
        <div className="lp-highlight-card">
          <div className="lp-highlight-icon">
            <FileText size={22} />
          </div>
          <h3 style={{ fontSize: "1.2rem", fontWeight: 700, color: "#0f172a", marginBottom: "10px" }}>
            PDF Analytics Reports
          </h3>
          <p style={{ fontSize: "0.92rem", color: "var(--lp-text-secondary)", lineHeight: 1.55, marginBottom: "16px" }}>
            Administrative reporting tools with daily performance metrics, user moderation, and exportable PDF summaries.
          </p>
          <div className="d-flex align-items-center gap-2 pt-2 border-top" style={{ fontSize: "0.85rem", color: "#15803d", fontWeight: 600 }}>
            <Shield size={16} />
            <span>Role-based access & management</span>
          </div>
        </div>
      </div>

      <div className="text-center mt-4 pt-3">
        <button
          type="button"
          onClick={handleAction}
          className="lp-btn-primary"
          style={{ padding: "10px 24px", fontSize: "0.92rem" }}
        >
          <span>Jump into the Arena</span>
          <ArrowRight size={16} />
        </button>
      </div>
    </section>
  );
}
