import React from "react";
import { ReportHeader } from "./components/ReportHeader";
import { ReportFooter } from "./components/ReportFooter";
import { MetricCard } from "./components/MetricCard";
import { ReportTable } from "./components/ReportTable";
import { AttemptsDistributionChart } from "./components/ReportChart";
import { computeLetterFeedback } from "./utils/feedbackUtils";
import "./styles/report-print.css";

export function UserReport({ reportData }) {
  if (!reportData) return null;

  const {
    period = {},
    user_profile = {},
    lifetime_stats = {},
    period_stats = {},
    attempts_distribution = {},
    daily_records = [],
    sessions = [],
    summary_only = false,
  } = reportData;

  const pTot = period_stats.total_games || 0;
  const pWon = period_stats.games_won || 0;
  const pLost = period_stats.games_lost || 0;
  const pComp = pWon + pLost;
  const pCompWr = pComp > 0 ? (pWon / pComp) * 100 : 0;
  const pOverallWr = period_stats.win_rate || (pTot > 0 ? (pWon / pTot) * 100 : 0);

  const lTot = lifetime_stats.total_games || 0;
  const lWon = lifetime_stats.games_won || 0;
  const lComp = lWon + (lifetime_stats.games_lost || 0) + (lifetime_stats.games_expired || 0);
  const lCompWr = lComp > 0 ? (lWon / lComp) * 100 : 0;

  const createdStr = user_profile.created_at
    ? new Date(user_profile.created_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
    : "—";

  const lastActStr = user_profile.last_active_at
    ? new Date(user_profile.last_active_at).toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })
    : "—";

  const profileMeta = `
    <b>Player:</b> ${user_profile.username || "—"} · <b>Role:</b> ${user_profile.role || "PLAYER"} · <b>Status:</b> ${user_profile.status || "Active"}<br/>
    <b>Registered:</b> ${createdStr} · <b>Last Active:</b> ${lastActStr}
  `;

  return (
    <div className="report-document">
      {/* 1. Header */}
      <ReportHeader
        title={`Player Performance Dossier: ${user_profile.username || "Player"}`}
        periodLabel={period.label}
        extraMeta={profileMeta}
        badgeLabel="PLAYER DOSSIER"
      />

      {/* 2. Performance Overview */}
      <div className="report-section-heading">Performance Overview</div>
      <div className="report-kpi-grid">
        <MetricCard
          label="Period Matches"
          value={pTot}
          subtext={`${pWon} won, ${pLost} lost`}
        />
        <MetricCard
          label="Completed Win %"
          value={`${pCompWr.toFixed(1)}%`}
          subtext={`${pWon} of ${pComp} finished`}
          variant="success"
        />
        <MetricCard
          label="Overall Win %"
          value={`${pOverallWr.toFixed(1)}%`}
          subtext={`${pWon} of ${pTot} started`}
        />
        <MetricCard
          label="Current Streak"
          value={`${lifetime_stats.current_streak || 0} Wins`}
          subtext={`Max streak: ${lifetime_stats.max_streak || 0} wins`}
          variant="active"
        />
        <MetricCard
          label="Lifetime Matches"
          value={lTot}
          subtext={`${lWon} all-time victories`}
        />
        <MetricCard
          label="Lifetime Win %"
          value={`${lCompWr.toFixed(1)}%`}
          subtext={`${lWon} of ${lComp} completed`}
          variant="success"
        />
        <MetricCard
          label="Lifetime Guesses"
          value={lifetime_stats.total_guesses || 0}
          subtext="Total submissions"
        />
        <MetricCard
          label="Avg Attempts / Win"
          value={lifetime_stats.average_attempts != null ? Number(lifetime_stats.average_attempts).toFixed(1) : "—"}
          subtext="Attempts to solve words"
        />
      </div>

      {/* 3. Attempts Distribution Chart */}
      <div className="report-section-heading">Winning Attempts Distribution</div>
      <AttemptsDistributionChart distribution={attempts_distribution} />

      {/* 4. Daily Activity Table */}
      <div className="report-section-heading">Daily Activity History</div>
      <ReportTable
        headers={[
          { label: "Date", align: "left" },
          { label: "Words Tried", align: "right" },
          { label: "Correct Guesses", align: "right" },
          { label: "Total Guesses", align: "right" },
          { label: "Defeats / Expired", align: "right" },
          { label: "Completed %", align: "right" },
          { label: "Overall %", align: "right" },
        ]}
        data={daily_records}
        renderRow={(rec, idx) => {
          const rTot = rec.words_tried || rec.total_games || 0;
          const rWon = rec.correct_guesses || rec.games_won || 0;
          const unsucc = Math.max(0, rTot - rWon);
          const rComp = rWon + unsucc;
          const cWr = rComp > 0 ? (rWon / rComp) * 100 : 0;
          const oWr = rTot > 0 ? (rWon / rTot) * 100 : 0;

          return (
            <tr key={idx}>
              <td className="font-bold">{rec.date}</td>
              <td className="text-right font-bold">{rTot}</td>
              <td className="text-right" style={{ color: "var(--report-success)", fontWeight: 600 }}>{rWon}</td>
              <td className="text-right">{rec.total_guesses || 0}</td>
              <td className="text-right">{unsucc}</td>
              <td className="text-right font-bold">{cWr.toFixed(1)}%</td>
              <td className="text-right">{oWr.toFixed(1)}%</td>
            </tr>
          );
        }}
      />

      {/* 5. Complete Match History & Guess Inspection */}
      {!summary_only && sessions && sessions.length > 0 && (
        <>
          <div className="report-section-heading">
            Complete Match History & Guess Inspection ({sessions.length} Matches)
          </div>

          <div className="report-table-wrapper avoid-break" style={{ padding: "6px 12px", background: "var(--report-bg-light)", borderBottom: "none", borderRadius: "6px 6px 0 0" }}>
            <div style={{ fontSize: "9px", color: "var(--report-muted)" }}>
              <b>Letter Feedback Legend:</b>{" "}
              <span style={{ color: "#059669", fontWeight: 700 }}>[G] Green = Correct Position</span> ·{" "}
              <span style={{ color: "#d97706", fontWeight: 700 }}>(Y) Amber = Present in Word</span> ·{" "}
              <span style={{ color: "#64748b" }}>A Slate = Absent</span>
            </div>
          </div>

          <ReportTable
            headers={[
              { label: "Match #", align: "left", width: "65px" },
              { label: "Target Word", align: "left", width: "85px" },
              { label: "Date & Time", align: "left", width: "115px" },
              { label: "Duration", align: "left", width: "70px" },
              { label: "Result", align: "center", width: "65px" },
              { label: "Attempts", align: "center", width: "65px" },
              { label: "Chronological Guesses with Tile Feedback", align: "left" },
            ]}
            data={sessions}
            renderRow={(s, idx) => {
              const statusLower = (s.status || "active").toLowerCase();
              let durStr = "—";
              if (s.duration_seconds != null) {
                const mins = Math.floor(s.duration_seconds / 60);
                const secs = s.duration_seconds % 60;
                durStr = mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
              }

              return (
                <tr key={idx}>
                  <td className="font-bold">#{s.id}</td>
                  <td className="font-bold" style={{ letterSpacing: "0.04em" }}>{s.target_word}</td>
                  <td style={{ fontSize: "9px", color: "var(--report-muted)" }}>
                    {s.started_at ? new Date(s.started_at).toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—"}
                  </td>
                  <td style={{ fontSize: "9px", color: "var(--report-muted)" }}>{durStr}</td>
                  <td className="text-center">
                    <span className={`status-pill ${statusLower}`}>{s.status}</span>
                  </td>
                  <td className="text-center font-bold">
                    {s.attempts_used} / {s.max_attempts}
                  </td>
                  <td>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                      {s.guesses && s.guesses.length > 0 ? (
                        s.guesses.map((guess, gIdx) => {
                          const feedback = computeLetterFeedback(s.target_word, guess);
                          return (
                            <div key={gIdx} className="wordle-guess-row">
                              <span className="wordle-attempt-num">{gIdx + 1}.</span>
                              <div className="wordle-tiles-container">
                                {feedback.map((item, letterIdx) => (
                                  <span key={letterIdx} className={`wordle-tile ${item.status}`}>
                                    {item.letter}
                                  </span>
                                ))}
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <span style={{ fontSize: "9px", color: "var(--report-muted)", fontStyle: "italic" }}>
                          No guesses submitted
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              );
            }}
          />
        </>
      )}

      {/* 6. Methodology Container */}
      <div className="report-methodology-card avoid-break">
        <div className="report-methodology-title">Player Dossier Methodology & Metric Definitions</div>
        <div className="report-methodology-text">
          <b>1. Performance Baseline:</b> <i>Completed-Game Win Rate</i> calculates resolved games (<code>Won / [Won + Lost] × 100%</code>). <i>Overall Win Rate</i> measures against total sessions initiated.<br />
          <b>2. Streak Integrity:</b> Consecutive match victories without defeat or expiration. Ongoing active games do not break a streak.<br />
          <b>3. Data Privacy:</b> Strictly authorized game records. No player credentials, tokens, or security hashes are stored or exported.
        </div>
      </div>

      {/* 7. Footer */}
      <ReportFooter />
    </div>
  );
}
