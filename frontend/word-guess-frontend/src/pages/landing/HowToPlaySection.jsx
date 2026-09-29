import React from "react";
import {
  Keyboard,
  Compass,
  Trophy,
  HelpCircle,
} from "lucide-react";

export function HowToPlaySection() {
  return (
    <section id="how-to-play" className="lp-section-container">
      <div className="lp-section-header">
        <div className="lp-section-tag">
          <HelpCircle size={15} />
          <span>Rules & Guidelines</span>
        </div>
        <h2 className="lp-section-title">How to Play the Game</h2>
        <p className="lp-section-desc">
          Guess the hidden five-letter word in six attempts. Each guess provides
          immediate color-coded feedback to help narrow down the answer.
        </p>
      </div>

      {/* 3 Step Cards */}
      <div className="lp-how-to-play-grid">
        {/* Step 1 */}
        <div className="lp-step-card">
          <span className="lp-step-number">01</span>
          <div className="lp-step-icon-box">
            <Keyboard size={22} />
          </div>
          <h3 className="lp-step-title">Enter a 5-Letter Word</h3>
          <p className="lp-step-text">
            Type your first guess using your physical keyboard or the on-screen
            virtual keyboard, then submit your guess.
          </p>
          <div className="d-flex gap-2 justify-content-center pt-1">
            <div className="lp-tile lp-tile-empty" style={{ width: "36px", height: "36px", fontSize: "0.95rem" }}>G</div>
            <div className="lp-tile lp-tile-empty" style={{ width: "36px", height: "36px", fontSize: "0.95rem" }}>U</div>
            <div className="lp-tile lp-tile-empty" style={{ width: "36px", height: "36px", fontSize: "0.95rem" }}>E</div>
            <div className="lp-tile lp-tile-empty" style={{ width: "36px", height: "36px", fontSize: "0.95rem" }}>S</div>
            <div className="lp-tile lp-tile-empty" style={{ width: "36px", height: "36px", fontSize: "0.95rem" }}>S</div>
          </div>
        </div>

        {/* Step 2 */}
        <div className="lp-step-card">
          <span className="lp-step-number">02</span>
          <div className="lp-step-icon-box">
            <Compass size={22} />
          </div>
          <h3 className="lp-step-title">Inspect Tile Colors</h3>
          <p className="lp-step-text">
            Tiles change color to reveal whether letters are in the right position,
            wrong position, or absent from the target word.
          </p>
          <div className="d-flex gap-2 justify-content-center pt-1">
            <div className="lp-tile lp-tile-correct" style={{ width: "36px", height: "36px", fontSize: "0.95rem" }}>P</div>
            <div className="lp-tile lp-tile-present" style={{ width: "36px", height: "36px", fontSize: "0.95rem" }}>O</div>
            <div className="lp-tile lp-tile-absent" style={{ width: "36px", height: "36px", fontSize: "0.95rem" }}>I</div>
            <div className="lp-tile lp-tile-absent" style={{ width: "36px", height: "36px", fontSize: "0.95rem" }}>N</div>
            <div className="lp-tile lp-tile-correct" style={{ width: "36px", height: "36px", fontSize: "0.95rem" }}>T</div>
          </div>
        </div>

        {/* Step 3 */}
        <div className="lp-step-card">
          <span className="lp-step-number">03</span>
          <div className="lp-step-icon-box">
            <Trophy size={22} />
          </div>
          <h3 className="lp-step-title">Solve in 6 Attempts</h3>
          <p className="lp-step-text">
            Solve the puzzle before running out of attempts to record a win, build
            your win streak, and view your match history.
          </p>
          <div className="d-flex gap-2 justify-content-center pt-1">
            <div className="lp-tile lp-tile-correct" style={{ width: "36px", height: "36px", fontSize: "0.95rem" }}>M</div>
            <div className="lp-tile lp-tile-correct" style={{ width: "36px", height: "36px", fontSize: "0.95rem" }}>A</div>
            <div className="lp-tile lp-tile-correct" style={{ width: "36px", height: "36px", fontSize: "0.95rem" }}>T</div>
            <div className="lp-tile lp-tile-correct" style={{ width: "36px", height: "36px", fontSize: "0.95rem" }}>C</div>
            <div className="lp-tile lp-tile-correct" style={{ width: "36px", height: "36px", fontSize: "0.95rem" }}>H</div>
          </div>
        </div>
      </div>

      {/* Color Legend Cards */}
      <div className="lp-color-rules-container">
        {/* Green */}
        <div className="lp-color-rule-item">
          <div className="lp-rule-tile" style={{ background: "#15803d" }}>
            W
          </div>
          <div>
            <h4 className="lp-rule-title">Green (Correct Position)</h4>
            <p className="lp-rule-desc">
              The letter <strong>W</strong> is in the secret word and in the <strong>exact right position</strong>.
            </p>
          </div>
        </div>

        {/* Yellow */}
        <div className="lp-color-rule-item">
          <div className="lp-rule-tile" style={{ background: "#d97706" }}>
            I
          </div>
          <div>
            <h4 className="lp-rule-title">Amber (Wrong Position)</h4>
            <p className="lp-rule-desc">
              The letter <strong>I</strong> is in the secret word, but it is in a <strong>different spot</strong>.
            </p>
          </div>
        </div>

        {/* Gray */}
        <div className="lp-color-rule-item">
          <div className="lp-rule-tile" style={{ background: "#475569" }}>
            N
          </div>
          <div>
            <h4 className="lp-rule-title">Gray (Absent)</h4>
            <p className="lp-rule-desc">
              The letter <strong>N</strong> is <strong>not present</strong> in the secret word.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
