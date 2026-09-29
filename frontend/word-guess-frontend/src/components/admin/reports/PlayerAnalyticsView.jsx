import React, { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  Search,
  Users,
  Trophy,
  Eye,
  Calendar,
  Gamepad2,
  TrendingUp,
  ArrowUpDown,
  ArrowLeft,
  Inbox,
  User as UserIcon,
} from "lucide-react";
import { formatReportDate, formatRelativeTime } from "../../../utils/dateUtils";
import { adminPaths } from "../../../routes/paths";

export function PlayerAnalyticsView({
  userReports = [],
  userList = [],
  selectedUserId = "ALL",
  onSelectUser,
  searchTerm = "",
  onSearchChange,
  isLoading = false,
}) {
  const [sortBy, setSortBy] = useState("win_rate"); // "win_rate" | "games" | "won" | "name"
  const [sortAsc, setSortAsc] = useState(false);

  // Aggregate user records across the selected reporting period
  const aggregatedPlayers = useMemo(() => {
    const map = new Map();

    // Seed from userList if available
    userList.forEach((u) => {
      map.set(u.id, {
        user_id: u.id,
        public_id: u.public_id,
        username: u.username,
        role: u.role,
        games_played: 0,
        games_won: 0,
        total_guesses: 0,
        correct_guesses: 0,
        last_active: u.last_login_at || u.created_at,
        daily_records: [],
      });
    });

    // Populate actual activity from userReports
    userReports.forEach((r) => {
      let entry = map.get(r.user_id);
      if (!entry) {
        entry = {
          user_id: r.user_id,
          public_id: r.player_public_id || null,
          username: r.username,
          role: "PLAYER",
          games_played: 0,
          games_won: 0,
          total_guesses: 0,
          correct_guesses: 0,
          last_active: r.date,
          daily_records: [],
        };
        map.set(r.user_id, entry);
      } else if (!entry.public_id && r.player_public_id) {
        entry.public_id = r.player_public_id;
      }

      entry.games_played += r.total_games || 0;
      entry.games_won += r.games_won || 0;
      entry.total_guesses += r.total_guesses || 0;
      entry.correct_guesses += r.correct_guesses || 0;
      entry.daily_records.push(r);

      // Keep most recent date
      if (!entry.last_active || new Date(r.date) > new Date(entry.last_active)) {
        entry.last_active = r.date;
      }
    });

    // Calculate win rate & format
    const list = Array.from(map.values()).map((p) => {
      const rate = p.games_played > 0 ? (p.games_won / p.games_played) * 100 : 0;
      // Sort daily records descending by date
      const sortedDaily = [...p.daily_records].sort(
        (a, b) => new Date(b.date) - new Date(a.date)
      );
      return {
        ...p,
        win_rate: rate,
        daily_records: sortedDaily,
      };
    });

    // Filter by search term
    const filtered = searchTerm.trim()
      ? list.filter((p) => p.username.toLowerCase().includes(searchTerm.toLowerCase().trim()))
      : list;

    // Sort
    return filtered.sort((a, b) => {
      let valA = a[sortBy];
      let valB = b[sortBy];
      if (sortBy === "games") {
        valA = a.games_played;
        valB = b.games_played;
      } else if (sortBy === "won") {
        valA = a.games_won;
        valB = b.games_won;
      } else if (sortBy === "name") {
        valA = a.username.toLowerCase();
        valB = b.username.toLowerCase();
        return sortAsc ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
      return sortAsc ? valA - valB : valB - valA;
    });
  }, [userReports, userList, searchTerm, sortBy, sortAsc]);

  const selectedPlayer = useMemo(() => {
    if (selectedUserId === "ALL") return null;
    return aggregatedPlayers.find((p) => String(p.user_id) === String(selectedUserId)) || null;
  }, [aggregatedPlayers, selectedUserId]);

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortBy(field);
      setSortAsc(false);
    }
  };

  return (
    <div className="player-analytics-container">
      {/* 1. Top Filter Toolbar */}
      <div className="player-analytics-toolbar">
        <div className="d-flex align-items-center gap-2 flex-wrap flex-grow-1">
          {/* Search Input */}
          <div className="player-search-wrap">
            <Search size={13} className="search-icon" />
            <input
              type="text"
              className="player-search-input"
              placeholder="Search by player username..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              aria-label="Search players"
            />
          </div>

          {/* User Select Dropdown */}
          <select
            className="player-select-dropdown"
            value={selectedUserId}
            onChange={(e) => onSelectUser(e.target.value)}
            aria-label="Filter specific player"
          >
            <option value="ALL">All Players ({userList.length || aggregatedPlayers.length})</option>
            {userList.map((u) => (
              <option key={u.id} value={u.id}>
                {u.username} ({u.role})
              </option>
            ))}
          </select>
        </div>

        {/* Sorting Options (when in All Players mode) */}
        {!selectedPlayer && (
          <div className="d-flex align-items-center gap-2">
            <span className="text-muted small fw-medium">Sort:</span>
            <div className="btn-group btn-group-sm">
              <button
                type="button"
                className={`btn btn-sm ${sortBy === "win_rate" ? "btn-primary" : "btn-outline-secondary"}`}
                onClick={() => handleSort("win_rate")}
              >
                Win Rate
              </button>
              <button
                type="button"
                className={`btn btn-sm ${sortBy === "games" ? "btn-primary" : "btn-outline-secondary"}`}
                onClick={() => handleSort("games")}
              >
                Words Tried
              </button>
              <button
                type="button"
                className={`btn btn-sm ${sortBy === "won" ? "btn-primary" : "btn-outline-secondary"}`}
                onClick={() => handleSort("won")}
              >
                Correct
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 2. SPECIFIC PLAYER SELECTED VIEW (Date-wise Performance Breakdown) */}
      {selectedPlayer ? (
        <div className="d-flex flex-column gap-3">
          {/* Player Aggregate Header Card */}
          <div className="single-player-summary-card">
            <div className="player-profile-left">
              <div className="player-large-avatar" aria-hidden="true">
                {selectedPlayer.username.charAt(0).toUpperCase()}
              </div>
              <div className="player-info-meta">
                <div className="d-flex align-items-center gap-2">
                  <span className="player-info-name">{selectedPlayer.username}</span>
                  <span className="badge bg-primary-subtle text-primary border border-primary-subtle">
                    {selectedPlayer.role}
                  </span>
                </div>
                <span className="player-info-sub">
                  Last active {formatRelativeTime(selectedPlayer.last_active)}
                </span>
              </div>
            </div>

            <div className="player-stats-mini-row">
              <div className="player-stat-mini-box">
                <span className="player-stat-mini-label">Words Tried</span>
                <span className="player-stat-mini-val num-tabular text-dark">{selectedPlayer.games_played}</span>
              </div>
              <div className="player-stat-mini-box">
                <span className="player-stat-mini-label">Correct Guesses</span>
                <span className="player-stat-mini-val num-tabular text-success">{selectedPlayer.games_won}</span>
              </div>
              <div className="player-stat-mini-box">
                <span className="player-stat-mini-label">Win Rate</span>
                <span className="player-stat-mini-val num-tabular text-primary">{selectedPlayer.win_rate.toFixed(1)}%</span>
              </div>
              <div className="player-stat-mini-box">
                <span className="player-stat-mini-label">Total Letter Guesses</span>
                <span className="player-stat-mini-val num-tabular">{selectedPlayer.total_guesses}</span>
              </div>

              <div className="d-flex align-items-center gap-2 ms-2">
                <button
                  type="button"
                  className="btn btn-sm btn-outline-secondary d-inline-flex align-items-center gap-1"
                  onClick={() => onSelectUser("ALL")}
                  title="Return to all players list"
                >
                  <ArrowLeft size={13} />
                  <span>All Players</span>
                </button>

                <Link
                  to={adminPaths.userDetail(selectedPlayer.public_id || selectedPlayer.user_id)}
                  className="btn btn-sm btn-primary d-inline-flex align-items-center gap-1"
                  title="View full user profile"
                >
                  <Eye size={13} />
                  <span>Full Profile</span>
                </Link>
              </div>
            </div>
          </div>

          {/* Date-wise Performance Table for Selected Player */}
          <div className="reports-table-card">
            <div className="card-header bg-white py-2 px-3 border-bottom d-flex align-items-center justify-content-between">
              <div className="d-flex align-items-center gap-2">
                <Calendar size={14} className="text-primary" />
                <span className="fw-semibold text-dark small">
                  Daily Performance for {selectedPlayer.username}
                </span>
              </div>
              <span className="text-muted small num-tabular">
                {selectedPlayer.daily_records.length} {selectedPlayer.daily_records.length === 1 ? "day" : "days"} recorded
              </span>
            </div>

            <div className="reports-table-container">
              <table className="reports-table">
                <thead>
                  <tr>
                    <th scope="col" style={{ width: "25%" }}>Date</th>
                    <th scope="col" style={{ width: "20%" }}>Words Tried</th>
                    <th scope="col" style={{ width: "20%" }}>Correct Guesses</th>
                    <th scope="col" style={{ width: "20%" }}>Win Rate</th>
                    <th scope="col" style={{ width: "15%" }} className="text-end">Total Guesses</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td colSpan="5" className="py-5 text-center">
                        <div className="spinner-border spinner-border-sm text-primary" role="status" />
                        <span className="ms-2 small text-muted">Loading player daily breakdown...</span>
                      </td>
                    </tr>
                  ) : selectedPlayer.daily_records.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="text-center py-5 text-muted">
                        <Inbox size={32} className="opacity-40 d-block mx-auto mb-2" />
                        <span>No gameplay recorded for {selectedPlayer.username} in this period.</span>
                      </td>
                    </tr>
                  ) : (
                    selectedPlayer.daily_records.map((r, idx) => {
                      const rate = r.total_games > 0 ? (r.games_won / r.total_games) * 100 : 0;
                      const isLow = rate < 40;

                      return (
                        <tr key={`${r.date}-${idx}`} className="report-row">
                          {/* Date */}
                          <td>
                            <span className="report-date-cell">
                              {formatReportDate(r.date)}
                            </span>
                          </td>

                          {/* Words Tried */}
                          <td>
                            <span className="num-tabular font-medium text-dark">
                              {r.total_games}
                            </span>
                          </td>

                          {/* Correct Guesses */}
                          <td>
                            <span className="report-won-cell">
                              <Trophy size={13} className="text-success" />
                              <span className="num-tabular">{r.games_won}</span>
                            </span>
                          </td>

                          {/* Win Rate */}
                          <td>
                            <div className="winrate-progress-wrap" title={`${r.games_won} solved of ${r.total_games} words tried`}>
                              <div className="winrate-progress-bar">
                                <div
                                  className={`winrate-progress-fill ${isLow ? "fill-low" : ""}`}
                                  style={{ width: `${Math.min(100, Math.max(0, rate))}%` }}
                                />
                              </div>
                              <span className="winrate-progress-label num-tabular">
                                {r.total_games > 0 ? `${rate.toFixed(1)}%` : "—"}
                              </span>
                            </div>
                          </td>

                          {/* Total Guesses */}
                          <td className="text-end text-muted num-tabular font-medium">
                            {r.total_guesses}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* 3. ALL PLAYERS VIEW */
        <div className="reports-table-card">
          <div className="reports-table-container">
            <table className="reports-table">
              <thead>
                <tr>
                  <th scope="col" style={{ width: "26%" }}>
                    <button
                      type="button"
                      className="btn btn-link p-0 text-decoration-none text-muted fw-bold d-inline-flex align-items-center gap-1"
                      onClick={() => handleSort("name")}
                    >
                      <span>Player</span>
                      <ArrowUpDown size={11} />
                    </button>
                  </th>
                  <th scope="col" style={{ width: "15%" }}>Words Tried</th>
                  <th scope="col" style={{ width: "15%" }}>Correct Guesses</th>
                  <th scope="col" style={{ width: "22%" }}>Win Rate</th>
                  <th scope="col" style={{ width: "12%" }}>Last Active</th>
                  <th scope="col" style={{ width: "10%" }} className="text-end">Action</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan="6" className="py-5 text-center">
                      <div className="spinner-border spinner-border-sm text-primary" role="status" />
                      <span className="ms-2 small text-muted">Loading player analytics...</span>
                    </td>
                  </tr>
                ) : aggregatedPlayers.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center py-5 text-muted">
                      <Inbox size={32} className="opacity-40 d-block mx-auto mb-2" />
                      <span>No player records found matching the search criteria.</span>
                    </td>
                  </tr>
                ) : (
                  aggregatedPlayers.map((player) => {
                    const isLow = player.win_rate < 40;

                    return (
                      <tr key={player.user_id} className="report-row">
                        {/* Player Avatar + Name */}
                        <td>
                          <button
                            type="button"
                            className="btn btn-link p-0 text-decoration-none text-dark d-flex align-items-center gap-2"
                            onClick={() => onSelectUser(player.user_id)}
                            title={`View daily performance for ${player.username}`}
                          >
                            <div className="player-card-avatar-sm" aria-hidden="true">
                              {player.username.charAt(0).toUpperCase()}
                            </div>
                            <span className="fw-semibold">{player.username}</span>
                          </button>
                        </td>

                        {/* Words Tried */}
                        <td>
                          <span className="num-tabular font-medium text-dark">
                            {player.games_played}
                          </span>
                        </td>

                        {/* Correct Guesses */}
                        <td>
                          <span className="report-won-cell">
                            <Trophy size={13} className="text-success" />
                            <span className="num-tabular">{player.games_won}</span>
                          </span>
                        </td>

                        {/* Win Rate Progress Bar */}
                        <td>
                          <div className="winrate-progress-wrap" title={`${player.games_won} won of ${player.games_played} games`}>
                            <div className="winrate-progress-bar">
                              <div
                                className={`winrate-progress-fill ${isLow ? "fill-low" : ""}`}
                                style={{ width: `${Math.min(100, Math.max(0, player.win_rate))}%` }}
                              />
                            </div>
                            <span className="winrate-progress-label num-tabular">
                              {player.games_played > 0 ? `${player.win_rate.toFixed(1)}%` : "—"}
                            </span>
                          </div>
                        </td>

                        {/* Last Active */}
                        <td>
                          <span className="text-muted small" title={player.last_active}>
                            {formatRelativeTime(player.last_active)}
                          </span>
                        </td>

                        {/* Action -> Link to Admin User Profile & View daily breakdown */}
                        <td className="text-end">
                          <div className="d-inline-flex align-items-center gap-1">
                            <button
                              type="button"
                              className="btn-match-icon-view"
                              onClick={() => onSelectUser(player.user_id)}
                              title={`View ${player.username}'s daily breakdown`}
                              aria-label={`View ${player.username}'s daily breakdown`}
                            >
                              <Calendar size={13} />
                            </button>
                            <Link
                              to={adminPaths.userDetail(player.public_id || player.user_id)}
                              className="btn-match-icon-view"
                              title={`Inspect ${player.username}'s full profile`}
                              aria-label={`Inspect ${player.username}'s full profile`}
                            >
                              <Eye size={13} />
                            </Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
