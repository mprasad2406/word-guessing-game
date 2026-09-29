import React from "react";
import {
  Gamepad2,
  Clock,
  ShieldCheck,
  Zap,
  Target,
  BarChart2,
  Layers,
} from "lucide-react";

export function GamePreviewSection() {
  const sampleBoard = [
    [
      { char: "S", status: "absent" },
      { char: "H", status: "absent" },
      { char: "A", status: "correct" },
      { char: "R", status: "present" },
      { char: "E", status: "absent" },
    ],
    [
      { char: "B", status: "absent" },
      { char: "R", status: "correct" },
      { char: "A", status: "correct" },
      { char: "I", status: "absent" },
      { char: "N", status: "correct" },
    ],
    [
      { char: "G", status: "correct" },
      { char: "R", status: "correct" },
      { char: "A", status: "correct" },
      { char: "N", status: "correct" },
      { char: "D", status: "correct" },
    ],
    [
      { char: "", status: "empty" },
      { char: "", status: "empty" },
      { char: "", status: "empty" },
      { char: "", status: "empty" },
      { char: "", status: "empty" },
    ],
    [
      { char: "", status: "empty" },
      { char: "", status: "empty" },
      { char: "", status: "empty" },
      { char: "", status: "empty" },
      { char: "", status: "empty" },
    ],
    [
      { char: "", status: "empty" },
      { char: "", status: "empty" },
      { char: "", status: "empty" },
      { char: "", status: "empty" },
      { char: "", status: "empty" },
    ],
  ];

  const kbRow1 = [
    { k: "Q", s: "default" },
    { k: "W", s: "default" },
    { k: "E", s: "absent" },
    { k: "R", s: "correct" },
    { k: "T", s: "default" },
    { k: "Y", s: "default" },
    { k: "U", s: "default" },
    { k: "I", s: "absent" },
    { k: "O", s: "default" },
    { k: "P", s: "default" },
  ];

  const kbRow2 = [
    { k: "A", s: "correct" },
    { k: "S", s: "absent" },
    { k: "D", s: "correct" },
    { k: "F", s: "default" },
    { k: "G", s: "correct" },
    { k: "H", s: "absent" },
    { k: "J", s: "default" },
    { k: "K", s: "default" },
    { k: "L", s: "default" },
  ];

  const kbRow3 = [
    { k: "ENTER", s: "default", wide: true },
    { k: "Z", s: "default" },
    { k: "X", s: "default" },
    { k: "C", s: "default" },
    { k: "V", s: "default" },
    { k: "B", s: "absent" },
    { k: "N", s: "correct" },
    { k: "M", s: "default" },
    { k: "⌫", s: "default", wide: true },
  ];

  return (
    <section id="game-preview" className="lp-section-container">
      <div className="lp-section-header">
        <div className="lp-section-tag">
          <Gamepad2 size={15} />
          <span>Interactive Arena</span>
        </div>
        <h2 className="lp-section-title">Live Match Gameplay Preview</h2>
        <p className="lp-section-desc">
          Experience responsive word guessing with server-authoritative evaluation,
          instant keyboard status synchronization, and match history tracking.
        </p>
      </div>

      <div className="lp-preview-arena">
        {/* Left Column: Simulated Game Board & Keyboard */}
        <div className="lp-arena-board-col">
          {/* Match Meta Bar */}
          <div className="lp-arena-meta-bar">
            <div className="d-flex align-items-center gap-2">
              <Clock size={15} style={{ color: "#2563eb" }} />
              <span>Active Game</span>
            </div>
            <div className="d-flex align-items-center gap-2">
              <Target size={15} style={{ color: "#d97706" }} />
              <span>Attempts: 3 / 6</span>
            </div>
          </div>

          {/* 6-Row Board */}
          <div className="lp-sample-grid">
            {sampleBoard.map((row, rIdx) => (
              <div key={`preview-row-${rIdx}`} className="lp-sample-row">
                {row.map((cell, cIdx) => (
                  <div
                    key={`preview-cell-${rIdx}-${cIdx}`}
                    className={`lp-tile lp-tile-${cell.status}`}
                    style={{
                      width: "44px",
                      height: "44px",
                      fontSize: "1.15rem",
                    }}
                  >
                    {cell.char}
                  </div>
                ))}
              </div>
            ))}
          </div>

          {/* Virtual Keyboard */}
          <div className="lp-keyboard-preview">
            <div className="lp-kb-row">
              {kbRow1.map((item) => (
                <div
                  key={item.k}
                  className={`lp-kb-key lp-kb-key-${item.s}`}
                >
                  {item.k}
                </div>
              ))}
            </div>
            <div className="lp-kb-row">
              {kbRow2.map((item) => (
                <div
                  key={item.k}
                  className={`lp-kb-key lp-kb-key-${item.s}`}
                >
                  {item.k}
                </div>
              ))}
            </div>
            <div className="lp-kb-row">
              {kbRow3.map((item) => (
                <div
                  key={item.k}
                  className={`lp-kb-key lp-kb-key-${item.s}`}
                  style={item.wide ? { minWidth: "44px", fontSize: "0.72rem" } : {}}
                >
                  {item.k}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Implemented Features */}
        <div className="lp-arena-features-list">
          <div className="lp-feature-item">
            <div className="lp-feature-icon">
              <Zap size={18} />
            </div>
            <div>
              <h4 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "3px", color: "#0f172a" }}>
                Instant Evaluation Engine
              </h4>
              <p style={{ fontSize: "0.88rem", color: "var(--lp-text-secondary)", margin: 0 }}>
                Every guess evaluates in real time against the backend dictionary with accurate letter placement tracking.
              </p>
            </div>
          </div>

          <div className="lp-feature-item">
            <div className="lp-feature-icon">
              <ShieldCheck size={18} />
            </div>
            <div>
              <h4 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "3px", color: "#0f172a" }}>
                Server-Authoritative Validation
              </h4>
              <p style={{ fontSize: "0.88rem", color: "var(--lp-text-secondary)", margin: 0 }}>
                Target words are secured server-side to ensure 100% fair and tamper-proof gameplay.
              </p>
            </div>
          </div>

          <div className="lp-feature-item">
            <div className="lp-feature-icon">
              <BarChart2 size={18} />
            </div>
            <div>
              <h4 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "3px", color: "#0f172a" }}>
                Player Statistics & History
              </h4>
              <p style={{ fontSize: "0.88rem", color: "var(--lp-text-secondary)", margin: 0 }}>
                Track lifetime win rates, current and maximum streaks, attempt counts, and past match logs.
              </p>
            </div>
          </div>

          <div className="lp-feature-item">
            <div className="lp-feature-icon">
              <Layers size={18} />
            </div>
            <div>
              <h4 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "3px", color: "#0f172a" }}>
                Session Recovery
              </h4>
              <p style={{ fontSize: "0.88rem", color: "var(--lp-text-secondary)", margin: 0 }}>
                Return anytime to automatically restore your active game board and continue guessing.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
