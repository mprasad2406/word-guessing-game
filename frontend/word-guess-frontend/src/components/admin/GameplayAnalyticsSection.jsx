import React from "react";
import { Link } from "react-router-dom";
import { BarChart3, Trophy, Users2, Activity, ArrowRight, Layers } from "lucide-react";
import { ActivityChart } from "./ActivityChart";

/**
 * GameplayAnalyticsSection:
 * Operational gameplay analytics section combining today's metrics,
 * a recent match activity chart, and a direct link to detailed reports.
 */
export function GameplayAnalyticsSection({ dailyReports = [], isLoading = false }) {
  const summaries = dailyReports || [];
  const latestSummary = summaries[0] || null;

  // Extract metrics from the most recent day (today)
  const todayGames = latestSummary?.total_games ?? 0;
  const todayWon = latestSummary?.games_won ?? 0;
  const todayUsers = latestSummary?.number_of_users ?? 0;
  const todayWinRate = latestSummary?.win_rate != null ? Number(latestSummary.win_rate).toFixed(1) : "0.0";

  // Cumulative totals across available recent daily reports
  const totalRecentGames = summaries.reduce((acc, s) => acc + (s.total_games || 0), 0);
  const totalRecentWon = summaries.reduce((acc, s) => acc + (s.games_won || 0), 0);
  const avgWinRate =
    totalRecentGames > 0
      ? ((totalRecentWon / totalRecentGames) * 100).toFixed(1)
      : "0.0";

  return (
    <section className="admin-analytics-section" aria-label="Gameplay Overview & Analytics">
      <div className="section-header-row">
        <div className="section-title-group">
          <h2 className="admin-section-title">Gameplay Analytics</h2>
          <span className="section-subtitle-tag">Recent Activity</span>
        </div>

        <Link to="/admin/reports" className="btn-view-reports-link">
          <span>View Detailed Reports</span>
          <ArrowRight size={14} />
        </Link>
      </div>

      <div className="analytics-content-layout">
        {/* Left Column: 4 Compact KPI Cards for gameplay */}
        <div className="analytics-kpi-grid">
          {/* Matches Today */}
          <div className="analytics-kpi-card">
            <div className="kpi-icon-box icon-blue">
              <Layers size={16} strokeWidth={2.2} />
            </div>
            <div className="kpi-info">
              <span className="kpi-label">Today's Matches</span>
              <div className="kpi-value num-tabular">
                {isLoading ? <span className="skeleton-box kpi-skeleton" /> : todayGames}
              </div>
              <span className="kpi-subtext">Total sessions today</span>
            </div>
          </div>

          {/* Won Today */}
          <div className="analytics-kpi-card">
            <div className="kpi-icon-box icon-green">
              <Trophy size={16} strokeWidth={2.2} />
            </div>
            <div className="kpi-info">
              <span className="kpi-label">Matches Won</span>
              <div className="kpi-value num-tabular">
                {isLoading ? <span className="skeleton-box kpi-skeleton" /> : todayWon}
              </div>
              <span className="kpi-subtext">{todayGames - todayWon} missed / lost</span>
            </div>
          </div>

          {/* Active Players Today */}
          <div className="analytics-kpi-card">
            <div className="kpi-icon-box icon-indigo">
              <Users2 size={16} strokeWidth={2.2} />
            </div>
            <div className="kpi-info">
              <span className="kpi-label">Active Players</span>
              <div className="kpi-value num-tabular">
                {isLoading ? <span className="skeleton-box kpi-skeleton" /> : todayUsers}
              </div>
              <span className="kpi-subtext">Played matches today</span>
            </div>
          </div>

          {/* Win Rate */}
          <div className="analytics-kpi-card">
            <div className="kpi-icon-box icon-teal">
              <Activity size={16} strokeWidth={2.2} />
            </div>
            <div className="kpi-info">
              <span className="kpi-label">Win Rate</span>
              <div className="kpi-value num-tabular">
                {isLoading ? (
                  <span className="skeleton-box kpi-skeleton" />
                ) : (
                  `${todayGames > 0 ? todayWinRate : avgWinRate}%`
                )}
              </div>
              <span className="kpi-subtext">
                {todayGames > 0 ? "Today's rate" : "Recent average"}
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: Recent Activity Visual Chart */}
        <div className="analytics-chart-panel">
          <div className="chart-panel-header">
            <div className="chart-header-title">
              <BarChart3 size={16} className="text-primary" />
              <span>Match Volume (Last 7 Days)</span>
            </div>
          </div>

          <div className="chart-panel-body">
            <ActivityChart summaries={summaries} isLoading={isLoading} />
          </div>
        </div>
      </div>
    </section>
  );
}
