import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { Play, Sparkles, ArrowRight } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

export function FinalCtaSection() {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  const handleStartPlaying = () => {
    if (!isAuthenticated) {
      navigate("/login");
    } else if (user?.role === "ADMIN") {
      navigate("/admin");
    } else {
      navigate("/player");
    }
  };

  return (
    <section className="lp-section-container" style={{ paddingTop: "20px", paddingBottom: "80px" }}>
      <div className="lp-cta-wrapper">
        <div className="d-inline-flex align-items-center gap-2 mb-2" style={{ color: "#2563eb", fontWeight: 700, fontSize: "0.85rem" }}>
          <Sparkles size={16} />
          <span>JOIN AND TEST YOUR VOCABULARY</span>
        </div>

        <h2 className="lp-cta-title">Think You Can Crack the Word?</h2>

        <p className="lp-cta-subtitle">
          Six attempts. One hidden word. Put your vocabulary to the test and see how many words you can solve.
        </p>

        <div className="d-flex justify-content-center gap-3 flex-wrap">
          <button
            type="button"
            onClick={handleStartPlaying}
            className="lp-btn-primary"
            style={{ padding: "12px 28px", fontSize: "0.95rem" }}
          >
            <Play size={18} fill="currentColor" />
            <span>Start Playing Now</span>
          </button>

          {!isAuthenticated && (
            <Link
              to="/register"
              className="lp-btn-secondary"
              style={{ padding: "12px 24px", fontSize: "0.95rem" }}
            >
              <span>Create Free Account</span>
              <ArrowRight size={16} />
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}
