import React from "react";
import { ReportHeader } from "./components/ReportHeader";
import { ReportFooter } from "./components/ReportFooter";
import { MetricCard } from "./components/MetricCard";
import { ReportTable } from "./components/ReportTable";
import { OutcomeDistributionBar, DailyActivityChart } from "./components/ReportChart";
import { computeLetterFeedback } from "./utils/feedbackUtils";
import "./styles/report-print.css";

export function DailyReport({ reportData }) {
  if (!reportData) return null;

  const {
    period = {},
    summary = {},
    outcome_distribution = {},
    daily_summaries = [],
    player_participation = [],
    word_statistics = [],
    sessions = [],
    summary_only = false,
  } = reportData;

  const won = outcome_distribution.won?.count || summary.victories || 0;
  const lost = outcome_distribution.lost?.count || 0;
  const expired = outcome_distribution.expired?.count || 0;
  const active = outcome_distribution.active?.count || summary.active_sessions || 0;

  return (
    <div className="report-document">
      {/* 1. Header */}
      <ReportHeader
        title="Daily Gameplay & Activity Report"
        periodLabel={period.label}
        badgeLabel="DAILY ANALYTICS"
      />

      {/* 2. Executive Summary */}
      <div className="report-section-heading">Executive Summary</div>
      <div className="report-kpi-grid">
        <MetricCard
          label="Active Players"
          value={summary.active_players || 0}
          subtext="Unique participants"
        />
        <MetricCard
          label="Games Started"
          value={summary.games_started || 0}
          subtext={`${summary.completed_matches || 0} finished, ${summary.active_sessions || 0} active`}
        />
        <MetricCard
          label="Completed Matches"
          value={summary.completed_matches || 0}
          subtext={`${summary.victories || 0} won, ${summary.defeats_and_expired || 0} lost/exp`}
        />
        <MetricCard
          label="Active Sessions"
          value={summary.active_sessions || 0}
          subtext="Ongoing / in-progress"
          variant="active"
        />
        <MetricCard
          label="Victories (Won)"
          value={summary.victories || 0}
          subtext={`${summary.correct_guesses || summary.victories || 0} correct words`}
          variant="success"
        />
        <MetricCard
          label="Defeats / Expired"
          value={summary.defeats_and_expired || 0}
          subtext="Unsuccessful resolutions"
          variant="danger"
        />
        <MetricCard
          label="Completed Win Rate"
          value={`${(summary.completed_win_rate || 0).toFixed(1)}%`}
          subtext={`${summary.victories || 0} of ${summary.completed_matches || 0} completed`}
        />
        <MetricCard
          label="Overall Win Rate"
          value={`${(summary.overall_win_rate || 0).toFixed(1)}%`}
          subtext={`${summary.victories || 0} of ${summary.games_started || 0} started`}
        />
      </div>

      {/* Outcome Distribution Bar */}
      <OutcomeDistributionBar
        won={won}
        lost={lost}
        expired={expired}
        active={active}
      />

      {/* Daily Timeline Activity Chart (Multi-day only) */}
      <DailyActivityChart summaries={daily_summaries} />

      {/* 3. Daily Gameplay Statistics Table */}
      <div className="report-section-heading">Daily Gameplay Statistics</div>
      <ReportTable
        headers={[
          { label: "Date", align: "left" },
          { label: "Players", align: "right" },
          { label: "Started", align: "right" },
          { label: "Won", align: "right" },
          { label: "Lost", align: "right" },
          { label: "Expired", align: "right" },
          { label: "Active", align: "right" },
          { label: "Guesses", align: "right" },
          { label: "Completed %", align: "right" },
          { label: "Overall %", align: "right" },
        ]}
        data={daily_summaries}
        renderRow={(s, idx) => (
          <tr key={idx}>
            <td className="font-bold">{s.date}</td>
            <td className="text-right">{s.number_of_users || 0}</td>
            <td className="text-right">{s.total_games || 0}</td>
            <td className="text-right" style={{ color: "var(--report-success)", fontWeight: 600 }}>{s.games_won || 0}</td>
            <td className="text-right">{s.games_lost || 0}</td>
            <td className="text-right">{s.games_expired || 0}</td>
            <td className="text-right">{s.games_active || 0}</td>
            <td className="text-right">{s.total_guesses || 0}</td>
            <td className="text-right font-bold">{(s.completed_win_rate || 0).toFixed(1)}%</td>
            <td className="text-right">{(s.overall_win_rate || 0).toFixed(1)}%</td>
          </tr>
        )}
        grandTotalRow={
          <>
            <td>Grand Total</td>
            <td className="text-right">{summary.active_players || 0}</td>
            <td className="text-right">{summary.games_started || 0}</td>
            <td className="text-right">{summary.victories || 0}</td>
            <td className="text-right">{lost}</td>
            <td className="text-right">{expired}</td>
            <td className="text-right">{active}</td>
            <td className="text-right">{summary.total_guesses || 0}</td>
            <td className="text-right font-bold">{(summary.completed_win_rate || 0).toFixed(1)}%</td>
            <td className="text-right">{(summary.overall_win_rate || 0).toFixed(1)}%</td>
          </>
        }
      />

      {/* 4. Player Participation Breakdown */}
      <div className="report-section-heading">Player Participation Breakdown</div>
      <ReportTable
        headers={[
          { label: "Player", align: "left" },
          { label: "Role", align: "left" },
          { label: "Words Tried", align: "right" },
          { label: "Won", align: "right" },
          { label: "Lost", align: "right" },
          { label: "Expired", align: "right" },
          { label: "Active", align: "right" },
          { label: "Guesses", align: "right" },
          { label: "Completed %", align: "right" },
          { label: "Overall %", align: "right" },
        ]}
        data={player_participation}
        renderRow={(p, idx) => (
          <tr key={idx}>
            <td className="font-bold">{p.username}</td>
            <td><span style={{ fontSize: "9px", color: "var(--report-muted)" }}>{p.role || "PLAYER"}</span></td>
            <td className="text-right font-bold">{p.words_tried || 0}</td>
            <td className="text-right" style={{ color: "var(--report-success)", fontWeight: 600 }}>{p.victories || 0}</td>
            <td className="text-right">{p.losses || 0}</td>
            <td className="text-right">{p.expired || 0}</td>
            <td className="text-right">{p.active || 0}</td>
            <td className="text-right">{p.total_guesses || 0}</td>
            <td className="text-right font-bold">{(p.completed_win_rate ?? p.win_rate ?? 0).toFixed(1)}%</td>
            <td className="text-right">{(p.overall_win_rate ?? p.win_rate ?? 0).toFixed(1)}%</td>
          </tr>
        )}
      />

      {/* 5. Target Word Analytics */}
      <div className="report-section-heading">Target Word Analytics</div>
      <ReportTable
        headers={[
          { label: "Target Word", align: "left" },
          { label: "Frequency", align: "right" },
          { label: "Won", align: "right" },
          { label: "Lost / Exp.", align: "right" },
          { label: "Active", align: "right" },
          { label: "Completed %", align: "right" },
          { label: "Overall %", align: "right" },
          { label: "Avg Attempts", align: "right" },
        ]}
        data={word_statistics}
        renderRow={(w, idx) => (
          <tr key={idx}>
            <td className="font-bold" style={{ letterSpacing: "0.05em" }}>{w.word?.toUpperCase()}</td>
            <td className="text-right">{w.frequency || 0}</td>
            <td className="text-right" style={{ color: "var(--report-success)", fontWeight: 600 }}>{w.successful || 0}</td>
            <td className="text-right">{w.unsuccessful || 0}</td>
            <td className="text-right">{w.active || 0}</td>
            <td className="text-right font-bold">{(w.completed_success_rate ?? w.success_rate ?? 0).toFixed(1)}%</td>
            <td className="text-right">{(w.overall_success_rate ?? w.success_rate ?? 0).toFixed(1)}%</td>
            <td className="text-right">{w.avg_attempts != null ? Number(w.avg_attempts).toFixed(1) : "—"}</td>
          </tr>
        )}
      />

      {/* 6. Detailed Match Session Logs */}
      {!summary_only && sessions && sessions.length > 0 && (
        <>
          <div className="report-section-heading">
            Detailed Match Session Logs ({sessions.length} Records)
          </div>
          <ReportTable
            headers={[
              { label: "Match #", align: "left", width: "65px" },
              { label: "Player", align: "left", width: "95px" },
              { label: "Target", align: "left", width: "70px" },
              { label: "Started At", align: "left", width: "105px" },
              { label: "Status", align: "center", width: "65px" },
              { label: "Attempts", align: "center", width: "65px" },
              { label: "Submitted Guesses", align: "left" },
            ]}
            data={sessions}
            renderRow={(s, idx) => {
              const statusLower = (s.status || "active").toLowerCase();
              return (
                <tr key={idx}>
                  <td className="font-bold">#{s.id}</td>
                  <td>{s.username}</td>
                  <td className="font-bold">{s.target_word}</td>
                  <td style={{ fontSize: "9px", color: "var(--report-muted)" }}>
                    {s.started_at ? new Date(s.started_at).toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : "—"}
                  </td>
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

      {/* 7. Methodology Container */}
      <div className="report-methodology-card avoid-break">
        <div className="report-methodology-title">Report Methodology & Statistical Reconciliations</div>
        <div className="report-methodology-text">
          <b>1. Words Tried vs. Total Guesses:</b> <i>Words Tried</i> (Games Started) represents unique game sessions initiated by players. <i>Total Guesses</i> reflects individual guess submissions across all attempts.<br />
          <b>2. Dual Win Rate Reconciliations:</b><br />
          &nbsp;&nbsp;• <i>Completed-Game Win Rate</i> = <code>Won / (Won + Lost + Expired) × 100%</code> (Excludes ongoing active games to measure true match resolution outcomes).<br />
          &nbsp;&nbsp;• <i>Overall Win Rate</i> = <code>Won / Words Tried (Started) × 100%</code> (Measures victory frequency against all initiated game attempts).<br />
          <b>3. Session States:</b> Reconciled as <code>Started = Won + Lost + Expired + Active</code>. Active sessions reflect ongoing matches within allowed time limits.<br />
          <b>4. Data Governance & Security:</b> Sourced directly from persisted database audit entities. Export timestamps are recorded in UTC.
        </div>
      </div>

      {/* 8. Footer */}
      <ReportFooter />
    </div>
  );
}
