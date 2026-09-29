import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Play,
  HelpCircle,
  Sparkles,
  RotateCcw,
  CheckCircle2,
  Zap,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";

const SAMPLE_WORDS = [
  {
    target: "PLANT",
    guesses: [
      [
        { letter: "C", status: "absent" },
        { letter: "R", status: "absent" },
        { letter: "A", status: "correct" },
        { letter: "N", status: "correct" },
        { letter: "E", status: "absent" },
      ],
      [
        { letter: "S", status: "absent" },
        { letter: "P", status: "present" },
        { letter: "A", status: "correct" },
        { letter: "N", status: "correct" },
        { letter: "K", status: "absent" },
      ],
      [
        { letter: "P", status: "correct" },
        { letter: "L", status: "correct" },
        { letter: "A", status: "correct" },
        { letter: "N", status: "correct" },
        { letter: "T", status: "correct" },
      ],
    ],
  },
];

export function HeroSection() {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [animationKey, setAnimationKey] = useState(0);
  const [revealedRows, setRevealedRows] = useState(0);
  const [isWinning, setIsWinning] = useState(false);

  const handlePlayNow = () => {
    if (!isAuthenticated) {
      navigate("/login");
    } else if (user?.role === "ADMIN") {
      navigate("/admin");
    } else {
      navigate("/player");
    }
  };

  const scrollToHowToPlay = () => {
    const el = document.getElementById("how-to-play");
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  const handleReplay = () => {
    setRevealedRows(0);
    setIsWinning(false);
    setAnimationKey((prev) => prev + 1);
  };

  // Staggered onload row reveals with flip animations
  useEffect(() => {
    if (revealedRows < 3) {
      const timer = setTimeout(() => {
        setRevealedRows((prev) => prev + 1);
      }, 450);
      return () => clearTimeout(timer);
    } else if (revealedRows === 3) {
      const winTimer = setTimeout(() => {
        setIsWinning(true);
      }, 600);
      return () => clearTimeout(winTimer);
    }
  }, [revealedRows, animationKey]);

  const activeRound = SAMPLE_WORDS[0];

  return (
    <section id="hero" className="lp-hero-section">
      {/* Left Column: Hero Content */}
      <div className="lp-hero-content">
        <div className="lp-hero-badge">
          <Sparkles size={15} />
          <span>Interactive 5-Letter Word Challenge</span>
        </div>

        <h1 className="lp-hero-title">
          Five Letters.<br />
          Six Attempts.<br />
          <span className="lp-hero-title-blue">One Word.</span>
        </h1>

        <p className="lp-hero-subtitle">
          Put your vocabulary and deductive reasoning to the test.
          Guess the hidden five-letter word in six attempts with instant tile evaluation.
        </p>

        {/* Call to Actions */}
        <div className="lp-hero-ctas">
          <button
            type="button"
            onClick={handlePlayNow}
            className="lp-btn-primary"
            style={{ padding: "12px 26px", fontSize: "0.95rem" }}
          >
            <Play size={18} fill="currentColor" />
            <span>Play Now</span>
          </button>

          <button
            type="button"
            onClick={scrollToHowToPlay}
            className="lp-btn-secondary"
            style={{ padding: "12px 22px", fontSize: "0.95rem" }}
          >
            <HelpCircle size={18} />
            <span>How to Play</span>
          </button>
        </div>

        {/* Implemented Game Highlights */}
        <div className="lp-hero-stats">
          <div className="lp-stat-item">
            <span className="lp-stat-number">5</span>
            <span className="lp-stat-label">Letter Length</span>
          </div>
          <div className="lp-stat-item">
            <span className="lp-stat-number">6</span>
            <span className="lp-stat-label">Max Attempts</span>
          </div>
          <div className="lp-stat-item">
            <span className="lp-stat-number">100%</span>
            <span className="lp-stat-label">Server Verified</span>
          </div>
        </div>
      </div>

      {/* Right Column: Interactive Animated Grid Demo */}
      <div className="lp-hero-interactive-card" key={animationKey}>
        <div className="lp-card-header-bar">
          <div className="lp-card-title">
            <Zap size={18} style={{ color: "#2563eb" }} />
            <span>Live Gameplay Preview</span>
          </div>
          <span className="lp-pill-badge">
            {revealedRows < 3 ? `Evaluating Row ${revealedRows + 1}...` : "Victory in 3/6"}
          </span>
        </div>

        {/* Sample Animated 5x5 Grid */}
        <div className="lp-sample-grid">
          {/* Row 1: CRANE */}
          <div className="lp-sample-row">
            {activeRound.guesses[0].map((tile, idx) => (
              <div
                key={`r0-${idx}`}
                className={`lp-tile ${
                  revealedRows >= 1 ? `lp-tile-${tile.status}` : "lp-tile-empty"
                }`}
                style={{
                  animationDelay: `${idx * 0.1}s`,
                }}
              >
                {tile.letter}
              </div>
            ))}
          </div>

          {/* Row 2: SPANK */}
          <div className="lp-sample-row">
            {activeRound.guesses[1].map((tile, idx) => (
              <div
                key={`r1-${idx}`}
                className={`lp-tile ${
                  revealedRows >= 2 ? `lp-tile-${tile.status}` : "lp-tile-empty"
                }`}
                style={{
                  animationDelay: `${idx * 0.1}s`,
                }}
              >
                {tile.letter}
              </div>
            ))}
          </div>

          {/* Row 3: PLANT (Winning Row with Victory Bounce) */}
          <div className="lp-sample-row">
            {activeRound.guesses[2].map((tile, idx) => (
              <div
                key={`r2-${idx}`}
                className={`lp-tile ${
                  revealedRows >= 3
                    ? isWinning
                      ? "lp-tile-correct lp-tile-winning"
                      : "lp-tile-correct"
                    : "lp-tile-empty"
                }`}
                style={{
                  animationDelay: isWinning ? `${idx * 0.08}s` : `${idx * 0.1}s`,
                }}
              >
                {tile.letter}
              </div>
            ))}
          </div>

          {/* Empty Rows 4, 5, 6 */}
          {[3, 4, 5].map((rowIdx) => (
            <div key={`r-${rowIdx}`} className="lp-sample-row">
              {["", "", "", "", ""].map((_, cIdx) => (
                <div key={`r${rowIdx}-${cIdx}`} className="lp-tile lp-tile-empty" />
              ))}
            </div>
          ))}
        </div>

        {/* Demo Status Bar */}
        <div className="lp-interactive-controls">
          <div className="d-flex align-items-center gap-2">
            <CheckCircle2 size={16} style={{ color: "#15803d" }} />
            <span style={{ fontWeight: 600, color: "#0f172a" }}>Target: PLANT</span>
          </div>
          <button
            type="button"
            className="lp-replay-btn"
            onClick={handleReplay}
            title="Replay Tile Reveal"
          >
            <RotateCcw size={14} />
            <span>Replay</span>
          </button>
        </div>
      </div>
    </section>
  );
}
