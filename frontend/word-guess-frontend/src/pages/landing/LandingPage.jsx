import React, { useEffect } from "react";
import "./LandingPage.css";
import { LandingNavbar } from "./LandingNavbar";
import { HeroSection } from "./HeroSection";
import { HowToPlaySection } from "./HowToPlaySection";
import { GamePreviewSection } from "./GamePreviewSection";
import { LeaderboardPreviewSection } from "./LeaderboardPreviewSection";
import { FinalCtaSection } from "./FinalCtaSection";
import { LandingFooter } from "./LandingFooter";

export function LandingPage() {
  // Scroll Reveal Intersection Observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
          }
        });
      },
      {
        threshold: 0.12,
        rootMargin: "0px 0px -40px 0px",
      }
    );

    const revealElements = document.querySelectorAll(".lp-reveal");
    revealElements.forEach((el) => observer.observe(el));

    return () => {
      revealElements.forEach((el) => observer.unobserve(el));
    };
  }, []);

  return (
    <div className="landing-page-root">
      {/* Ambient Floating Letter Elements */}
      <div className="lp-floating-letter" style={{ top: "110px", left: "5%", animationDelay: "0s" }}>W</div>
      <div className="lp-floating-letter" style={{ top: "260px", left: "11%", animationDelay: "1.5s" }}>O</div>
      <div className="lp-floating-letter" style={{ top: "160px", right: "7%", animationDelay: "0.8s" }}>R</div>
      <div className="lp-floating-letter" style={{ top: "320px", right: "13%", animationDelay: "2.2s" }}>D</div>

      {/* Sticky Clean White Navigation Bar */}
      <LandingNavbar />

      {/* Main Content Stream */}
      <main>
        {/* 1. Hero Section with dynamic onload animations */}
        <HeroSection />

        {/* 2. How to Play Rules with on-scroll reveal */}
        <div className="lp-reveal">
          <HowToPlaySection />
        </div>

        {/* 3. Authentic Game Preview with on-scroll reveal */}
        <div className="lp-reveal lp-reveal-delay-1">
          <GamePreviewSection />
        </div>

        {/* 4. Implemented Platform Features with on-scroll reveal */}
        <div className="lp-reveal lp-reveal-delay-2">
          <LeaderboardPreviewSection />
        </div>

        {/* 5. Final Call to Action with on-scroll reveal */}
        <div className="lp-reveal lp-reveal-delay-1">
          <FinalCtaSection />
        </div>
      </main>

      {/* 6. Footer */}
      <LandingFooter />
    </div>
  );
}
