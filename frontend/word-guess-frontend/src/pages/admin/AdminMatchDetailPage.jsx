import React, { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Trophy,
  XCircle,
  Clock,
  PlayCircle,
  HelpCircle,
  Calendar,
  Timer,
  Hash,
  Lightbulb,
  Shield,
  User as UserIcon,
  AlertCircle,
  Sparkles,
  CheckCircle2,
  ExternalLink,
} from "lucide-react";
import { userService } from "../../services/userService";
import { ReadOnlyGuessBoard } from "../../components/gameplay/ReadOnlyGuessBoard";
import { GuessTimeline } from "../../components/gameplay/GuessTimeline";
import {
  formatJoinedDate,
  formatRelativeTime,
  formatDuration,
  formatTimeLimit,
} from "../../utils/dateUtils";
import { adminPaths } from "../../routes/paths";
import "./UserManagement.css";

export function AdminMatchDetailPage() {
  const { userId, matchId } = useParams();
  const navigate = useNavigate();

  const [matchData, setMatchData] = useState(null);
  const [userData, setUserData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusCode, setStatusCode] = useState(200);

  useEffect(() => {
    let isMounted = true;

    async function fetchData() {
      if (!userId || !matchId) {
        setError("Missing user or match identifier.");
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        // Fetch user profile and match details concurrently
        const [matchRes, userRes] = await Promise.all([
          userService.getUserMatchDetails(userId, matchId),
          userService.getUserDetails(userId).catch(() => null),
        ]);

        if (isMounted) {
          setMatchData(matchRes);
          setUserData(userRes);
        }
      } catch (err) {
        if (isMounted) {
          console.error("Failed to load match inspection data:", err);
          const status = err?.status || err?.response?.status || 500;
          setStatusCode(status);
          setError(err?.message || "Failed to load match inspection details.");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    fetchData();

    return () => {
      isMounted = false;
    };
  }, [userId, matchId]);

  const getStatusDisplay = (status) => {
    switch (status) {
      case "WON":
        return {
          icon: <Trophy size={18} className="text-success" />,
          label: "Victory (Solved)",
          badgeClass: "badge-match-won",
          color: "#15803d",
          bg: "#f0fdf4",
          border: "#bbf7d0",
        };
      case "LOST":
        return {
          icon: <XCircle size={18} className="text-danger" />,
          label: "Defeat (Attempts Exhausted)",
          badgeClass: "badge-match-lost",
          color: "#dc2626",
          bg: "#fef2f2",
          border: "#fecaca",
        };
      case "EXPIRED":
        return {
          icon: <Clock size={18} className="text-muted" />,
          label: "Expired (Time Limit Reached)",
          badgeClass: "badge-match-expired",
          color: "#64748b",
          bg: "#f8fafc",
          border: "#e2e8f0",
        };
      case "ACTIVE":
      default:
        return {
          icon: <PlayCircle size={18} className="text-primary" />,
          label: "In Progress (Active)",
          badgeClass: "badge-match-active",
          color: "#2563eb",
          bg: "#eff6ff",
          border: "#bfdbfe",
        };
    }
  };

  const getDuration = () => {
    if (!matchData?.started_at) return "—";
    if (matchData.completed_at) {
      const start = new Date(matchData.started_at).getTime();
      const end = new Date(matchData.completed_at).getTime();
      const sec = Math.max(0, Math.floor((end - start) / 1000));
      return formatDuration(sec);
    }
    return "In Progress";
  };

  if (isLoading) {
    return (
      <div className="user-detail-container">
        <div className="user-table-skeleton-rows" style={{ padding: "32px 0" }}>
          <div className="user-table-skeleton-row" style={{ height: "64px" }} />
          <div className="user-table-skeleton-row" style={{ height: "140px" }} />
          <div className="user-table-skeleton-row" style={{ height: "260px" }} />
        </div>
      </div>
    );
  }

  if (error || !matchData) {
    return (
      <div className="user-detail-container">
        <div className="user-not-found-card">
          <AlertCircle
            size={48}
            className={statusCode === 403 ? "text-warning" : "user-not-found-icon"}
          />
          <h2 className="user-not-found-title">
            {statusCode === 403
              ? "Access Forbidden"
              : statusCode === 404
              ? "Match Not Found"
              : "Unable to Load Match"}
          </h2>
          <p className="user-not-found-desc">
            {statusCode === 403
              ? "You do not have administrative permissions to inspect this player's match history."
              : statusCode === 404
              ? "The requested match session could not be found for this user."
              : error || "An unexpected error occurred while loading match details."}
          </p>
          <div className="d-flex gap-2 justify-content-center">
            <button
              type="button"
              className="btn-user-secondary"
              onClick={() => navigate(adminPaths.userDetail(userId))}
            >
              <ArrowLeft size={16} />
              <span>Back to User Profile</span>
            </button>
            <Link to={adminPaths.users()} className="btn-user-primary">
              <span>All Users</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const statusMeta = getStatusDisplay(matchData.status);
  const username = userData?.username || `User #${userId}`;
  const targetWord = matchData.final_word || (matchData.guesses?.find((g) => g.is_correct)?.guess) || "—";

  return (
    <div className="user-detail-container">
      {/* 1. Breadcrumbs and Top Actions */}
      <div className="user-profile-top-bar">
        <div className="user-breadcrumb">
          <Link to="/admin/users" className="user-breadcrumb-link">
            Users
          </Link>
          <span className="user-breadcrumb-separator">/</span>
          <Link to={adminPaths.userDetail(userId)} className="user-breadcrumb-link">
            {username}
          </Link>
          <span className="user-breadcrumb-separator">/</span>
          <span className="user-breadcrumb-current">Match #{matchData.id || matchId.slice(0, 8)}</span>
        </div>

        <div className="user-profile-actions">
          <button
            type="button"
            className="btn-user-secondary btn-sm"
            onClick={() => navigate(adminPaths.userDetail(userId))}
            aria-label="Back to User Profile"
          >
            <ArrowLeft size={15} />
            <span>Back to Profile</span>
          </button>
        </div>
      </div>

      {/* 2. Match Hero Banner */}
      <div
        className="admin-match-hero-card"
        style={{
          background: statusMeta.bg,
          borderColor: statusMeta.border,
        }}
      >
        <div className="admin-match-hero-left">
          <div
            className="admin-match-hero-badge"
            style={{
              backgroundColor: "#ffffff",
              color: statusMeta.color,
              borderColor: statusMeta.border,
            }}
          >
            {statusMeta.icon}
          </div>

          <div className="admin-match-hero-info">
            <div className="d-flex align-items-center gap-2 flex-wrap mb-1">
              <h1 className="admin-match-title mb-0">
                Match Inspection
              </h1>
              <span
                className="admin-match-status-pill"
                style={{
                  backgroundColor: statusMeta.color,
                  color: "#ffffff",
                }}
              >
                {statusMeta.label}
              </span>
            </div>

            <div className="admin-match-meta-row">
              <span className="meta-item">
                <UserIcon size={14} />
                <span>Player: <strong>{username}</strong></span>
              </span>
              <span className="meta-bullet">&bull;</span>
              <span className="meta-item">
                <Calendar size={14} />
                <span>{formatJoinedDate(matchData.started_at)}</span>
              </span>
              <span className="meta-bullet">&bull;</span>
              <span className="meta-item">
                <Timer size={14} />
                <span>Duration: <strong>{getDuration()}</strong></span>
              </span>
            </div>
          </div>
        </div>

        {/* Word Callout */}
        <div className="admin-match-word-callout">
          <span className="word-callout-label">Target Word</span>
          <span className="word-callout-text">{targetWord.toUpperCase()}</span>
          {matchData.revealed_hint && (
            <span className="word-callout-hint" title={matchData.revealed_hint}>
              Clue: {matchData.revealed_hint}
            </span>
          )}
        </div>
      </div>

      {/* 3. Main Two-Column Grid */}
      <div className="details-content-grid">
        {/* Left Column: Primary Wordle Guess Board & Collapsible attempt timeline */}
        <div className="d-flex flex-column">
          <ReadOnlyGuessBoard
            guesses={matchData.guesses || []}
            maxAttempts={matchData.max_attempts || 5}
            wordLength={matchData.word_length || targetWord.length || 5}
            status={matchData.status}
          />

          {/* Collapsible Attempt-by-Attempt breakdown */}
          <GuessTimeline
            guesses={matchData.guesses || []}
            startedAt={matchData.started_at}
            completedAt={matchData.completed_at}
            collapsible={true}
            defaultOpen={false}
          />
        </div>

        {/* Right Column: Compact Player Profile & Session Metrics */}
        <div className="admin-match-sidebar-column">
          {/* Compact Horizontal Player Summary Card */}
          {userData && (
            <div className="admin-compact-player-card">
              <div className="player-card-avatar" aria-hidden="true">
                {username.charAt(0).toUpperCase()}
              </div>

              <div className="player-card-info">
                <div className="player-card-name-row">
                  <span className="player-card-username" title={userData.username}>
                    {userData.username}
                  </span>
                  <span
                    className={`user-role-badge ${
                      userData.role === "ADMIN" ? "badge-admin" : "badge-player"
                    }`}
                  >
                    {userData.role}
                  </span>
                </div>

                <div className="player-card-stats-row">
                  <span className="num-tabular">{userData.total_games || 0} matches</span>
                  <span className="player-card-bullet" aria-hidden="true">&bull;</span>
                  <span className="num-tabular font-semibold text-success">
                    {userData.win_rate || 0}% win rate
                  </span>
                </div>
              </div>

              <Link
                to={adminPaths.userDetail(userId)}
                className="player-card-action-btn"
                title="View Player Profile"
                aria-label="View Player Profile"
              >
                <ExternalLink size={15} />
              </Link>
            </div>
          )}

          {/* Session Metrics Card */}
          <div className="admin-session-metrics-card">
            <h3 className="admin-metrics-title">
              Session Metrics
            </h3>

            <div className="admin-metrics-list">
              <div className="admin-metric-item">
                <span className="admin-metric-label">
                  <Hash size={14} className="text-primary" />
                  <span>Attempts Used</span>
                </span>
                <span className="admin-metric-value num-tabular">
                  {matchData.attempts_used} / {matchData.max_attempts}
                </span>
              </div>

              <div className="admin-metric-item">
                <span className="admin-metric-label">
                  <Lightbulb size={14} className="text-warning" />
                  <span>Hints Revealed</span>
                </span>
                <span className="admin-metric-value num-tabular">
                  {matchData.hints_used || 0} / {matchData.max_hints !== undefined ? matchData.max_hints : 0}
                  {matchData.max_hints === 0 && " (Disabled)"}
                </span>
              </div>

              <div className="admin-metric-item">
                <span className="admin-metric-label">
                  <Timer size={14} className="text-secondary" />
                  <span>Time Elapsed</span>
                </span>
                <span className="admin-metric-value num-tabular">
                  {getDuration()}
                </span>
              </div>

              <div className="admin-metric-item">
                <span className="admin-metric-label">
                  <Clock size={14} className="text-secondary" />
                  <span>Time Limit</span>
                </span>
                <span className="admin-metric-value num-tabular">
                  {formatTimeLimit(matchData.time_limit_seconds)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

