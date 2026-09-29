import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  Play,
  History,
  Sparkles,
  CalendarCheck,
  Infinity as InfinityIcon,
  UserCheck,
  Check,
  RefreshCw,
  X,
  Lock,
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  BookOpen,
  User,
  Activity,
  CheckCircle2,
  Info,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { gameplayService } from "../../services/gameplayService";
import { playerPaths } from "../../routes/paths";
import "./PlayerLobby.css";

export function PlayerHomePage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [isStartingGame, setIsStartingGame] = useState(false);
  const [startError, setStartError] = useState(null);
  const [showStartModal, setShowStartModal] = useState(false);
  const [dailyQuota, setDailyQuota] = useState({
    daily_limit: 3,
    games_played_today: 0,
    games_remaining_today: 3,
    can_start_game: true,
  });
  const [isLoadingQuota, setIsLoadingQuota] = useState(true);

  // Close modal on Escape key press
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && showStartModal && !isStartingGame) {
        setShowStartModal(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showStartModal, isStartingGame]);

  useEffect(() => {
    let isMounted = true;

    async function loadQuota() {
      try {
        const quota = await gameplayService.getDailyQuota();
        if (isMounted) {
          setDailyQuota(quota);
        }
      } catch (err) {
        console.error("Failed to load daily quota:", err);
      } finally {
        if (isMounted) {
          setIsLoadingQuota(false);
        }
      }
    }

    loadQuota();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleStartGame = async () => {
    if (isStartingGame || !dailyQuota.can_start_game) return;

    setIsStartingGame(true);
    setStartError(null);

    try {
      const newGame = await gameplayService.startGame();
      setShowStartModal(false);
      toast.success("Game created! Let's guess the word!");
      navigate(playerPaths.matchDetails(newGame.public_id));
    } catch (err) {
      console.error("Failed to create game:", err);
      const errMsg =
        err?.message || "Failed to start a new game session. Please try again later.";
      setStartError(errMsg);
      toast.error(errMsg);
      setShowStartModal(false);
      // Re-fetch quota in case it changed
      try {
        const quota = await gameplayService.getDailyQuota();
        setDailyQuota(quota);
      } catch {
        // ignore
      }
    } finally {
      setIsStartingGame(false);
    }
  };

  const isUnlimited = dailyQuota.daily_limit === 0 || Boolean(dailyQuota.is_unlimited);
  const isLimitReached =
    !isUnlimited &&
    (!dailyQuota.can_start_game || dailyQuota.games_played_today >= dailyQuota.daily_limit);

  return (
    <div className="lobby-container">
      {/* 1. Welcome Hero Card */}
      <section className="lobby-hero-card" aria-label="Welcome Banner">
        <div className="lobby-hero-left">
          <div className="lobby-eyebrow-badge">
            <Sparkles size={14} />
            <span>Player Lobby</span>
          </div>
          <h1 className="lobby-hero-title">
            Welcome back, {user?.username || "Player"}!
          </h1>
          <p className="lobby-hero-desc">
            Ready for your next word challenge? Start a new game and put your vocabulary to the test.
          </p>

          <div className="lobby-hero-actions">
            <button
              type="button"
              className="btn-start-game"
              onClick={() => setShowStartModal(true)}
              disabled={isStartingGame || isLimitReached}
              title={
                isLimitReached
                  ? `Daily limit of ${dailyQuota.daily_limit} words reached`
                  : "Start a new game"
              }
              aria-label="Start New Game"
            >
              {isStartingGame ? (
                <>
                  <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                  <span>Starting Game...</span>
                </>
              ) : isLimitReached ? (
                <>
                  <Lock size={18} />
                  <span>Daily Limit Reached ({dailyQuota.games_played_today}/{dailyQuota.daily_limit})</span>
                </>
              ) : (
                <>
                  <Play size={18} fill="#2563EB" />
                  <span>Start New Game</span>
                </>
              )}
            </button>

            <Link
              to="/player/history"
              className="btn-hero-history"
              aria-label="View Game History"
            >
              <History size={18} />
              <span>Game History</span>
            </Link>
          </div>
        </div>

        {/* Hero Decorative Illustration (Neutral frosted letter tiles without misleading feedback) */}
        <div className="lobby-hero-right" aria-hidden="true">
          <div className="word-puzzle-graphic-container">
            <div className="puzzle-graphic-header">
              <Sparkles size={14} />
              <span>5-Letter Word Challenge</span>
            </div>
            <div className="puzzle-tile-row">
              <div className="puzzle-tile">W</div>
              <div className="puzzle-tile tile-highlight">O</div>
              <div className="puzzle-tile">R</div>
              <div className="puzzle-tile">D</div>
              <div className="puzzle-tile tile-highlight">S</div>
            </div>
            <div className="puzzle-tile-row">
              <div className="puzzle-tile">G</div>
              <div className="puzzle-tile">U</div>
              <div className="puzzle-tile tile-highlight">E</div>
              <div className="puzzle-tile">S</div>
              <div className="puzzle-tile">S</div>
            </div>
          </div>
        </div>
      </section>

      {/* Daily Limit Warning Banner if Reached */}
      {!isLoadingQuota && isLimitReached && (
        <div className="lobby-alert-warning" role="alert">
          <AlertCircle size={22} className="flex-shrink-0" />
          <div>
            <strong>Daily Word Limit Reached ({dailyQuota.games_played_today} / {dailyQuota.daily_limit} words played).</strong>{" "}
            You have completed all allowed words for today. New words and attempts will become available tomorrow!
          </div>
        </div>
      )}

      {/* Start Game Error Alert */}
      {startError && (
        <div className="lobby-alert-danger" role="alert">
          <AlertTriangle size={22} className="flex-shrink-0" />
          <div className="d-flex justify-content-between align-items-center w-100">
            <div>
              <strong>Unable to start game:</strong> {startError}
            </div>
            <button
              type="button"
              className="btn-close ms-2"
              onClick={() => setStartError(null)}
              aria-label="Dismiss error"
            ></button>
          </div>
        </div>
      )}

      {/* 2. Daily Guessing Quota Card (With Skeleton Loader) */}
      <section className="quota-status-card" aria-label="Daily Guessing Quota Status">
        {isLoadingQuota ? (
          <>
            <div className="quota-left-content">
              <div className="skeleton-shimmer" style={{ width: "44px", height: "44px", borderRadius: "10px" }}></div>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <div className="skeleton-shimmer" style={{ width: "160px", height: "18px" }}></div>
                <div className="skeleton-shimmer" style={{ width: "260px", height: "14px" }}></div>
              </div>
            </div>
            <div>
              <div className="skeleton-shimmer" style={{ width: "130px", height: "34px", borderRadius: "9999px" }}></div>
            </div>
          </>
        ) : (
          <>
            <div className="quota-left-content">
              <div className="quota-icon-badge">
                <CalendarCheck size={22} />
              </div>
              <div>
                <h2 className="quota-text-title">Daily Guessing Quota</h2>
                <p className="quota-text-desc">
                  {isUnlimited ? (
                    <>You have <strong>unlimited</strong> word guesses allowed today.</>
                  ) : (
                    <>
                      You can guess up to <strong>{dailyQuota.daily_limit} words</strong> per day (
                      {dailyQuota.games_remaining_today ??
                        Math.max(0, dailyQuota.daily_limit - dailyQuota.games_played_today)}{" "}
                      remaining).
                    </>
                  )}
                </p>
              </div>
            </div>

            <div>
              {isUnlimited ? (
                <div className="unlimited-badge">
                  <InfinityIcon size={16} strokeWidth={2.5} />
                  <span>Unlimited Play</span>
                </div>
              ) : dailyQuota.daily_limit <= 6 ? (
                <div className="quota-limited-slots">
                  {Array.from({ length: dailyQuota.daily_limit }, (_, idx) => idx + 1).map((slot) => {
                    const isPlayed = slot <= dailyQuota.games_played_today;
                    return (
                      <div
                        key={slot}
                        className={`quota-slot-pill ${isPlayed ? "completed" : "remaining"}`}
                      >
                        {isPlayed ? (
                          <Check size={14} strokeWidth={2.5} />
                        ) : (
                          <span style={{ fontSize: "10px", lineHeight: 1 }}>○</span>
                        )}
                        <span>Word {slot}</span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="unlimited-badge" style={{ backgroundColor: "#F1F5F9", color: "#0F172A", borderColor: "#E2E8F0" }}>
                  <span>{dailyQuota.games_played_today} / {dailyQuota.daily_limit} Played</span>
                </div>
              )}
            </div>
          </>
        )}
      </section>

      {/* 3. Lower Two-Column Grid (How to Play & Player Profile) */}
      <div className="lobby-grid-layout">
        {/* How to Play Card */}
        <section className="lobby-card" aria-labelledby="how-to-play-heading">
          <div className="lobby-card-header">
            <div className="lobby-card-icon-box">
              <BookOpen size={20} />
            </div>
            <h2 id="how-to-play-heading" className="lobby-card-title">
              How to Play
            </h2>
          </div>

          <div className="lobby-card-body">
            <div className="instruction-step-list">
              {/* Step 1 */}
              <div className="instruction-step-item">
                <div className="step-number-circle">1</div>
                <div className="step-content">
                  <h3 className="step-heading">
                    {isUnlimited ? "Unlimited Daily Games" : `${dailyQuota.daily_limit} Words Daily`}
                  </h3>
                  <p className="step-description">
                    {isUnlimited
                      ? "Start multiple game sessions whenever you want. Each game challenges you with a new 5-letter hidden word."
                      : `You are allocated up to ${dailyQuota.daily_limit} secret words to solve each day with fresh challenges daily.`}
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="instruction-step-item">
                <div className="step-number-circle">2</div>
                <div className="step-content">
                  <h3 className="step-heading">Understand the Tile Colors</h3>
                  <p className="step-description">
                    After each 5-letter guess, tile colors highlight your accuracy:
                  </p>

                  <div className="tile-demo-grid">
                    <div className="tile-demo-card">
                      <div className="d-flex align-items-center justify-content-between">
                        <div className="demo-tile-box color-green">C</div>
                        <span className="demo-tile-label label-green">
                          <Check size={12} strokeWidth={3} />
                          <span>Green</span>
                        </span>
                      </div>
                      <p className="demo-tile-desc">
                        Correct letter in the correct position.
                      </p>
                    </div>

                    <div className="tile-demo-card">
                      <div className="d-flex align-items-center justify-content-between">
                        <div className="demo-tile-box color-orange">A</div>
                        <span className="demo-tile-label label-orange">
                          <RefreshCw size={12} strokeWidth={3} />
                          <span>Orange</span>
                        </span>
                      </div>
                      <p className="demo-tile-desc">
                        Letter exists in the word, wrong position.
                      </p>
                    </div>

                    <div className="tile-demo-card">
                      <div className="d-flex align-items-center justify-content-between">
                        <div className="demo-tile-box color-gray">R</div>
                        <span className="demo-tile-label label-gray">
                          <X size={12} strokeWidth={3} />
                          <span>Gray</span>
                        </span>
                      </div>
                      <p className="demo-tile-desc">
                        Letter is not in the secret word.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 3 */}
              <div className="instruction-step-item">
                <div className="step-number-circle">3</div>
                <div className="step-content">
                  <h3 className="step-heading">Five Guesses & Hints</h3>
                  <p className="step-description">
                    You have 5 attempts to solve the word. Request clues with hints when available to solve tricky puzzles.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Player Profile Summary Card */}
        <section className="lobby-card" aria-labelledby="player-profile-heading">
          <div className="lobby-card-header">
            <div className="lobby-card-icon-box">
              <UserCheck size={20} />
            </div>
            <h2 id="player-profile-heading" className="lobby-card-title">
              Player Profile
            </h2>
          </div>

          <div className="lobby-card-body">
            <div className="profile-content-wrapper">
              <div className="profile-rows-container">
                <div className="profile-info-row">
                  <div className="profile-row-label-group">
                    <User size={16} className="profile-row-icon" />
                    <span className="profile-row-label">Username</span>
                  </div>
                  <span className="profile-row-value">{user?.username || "Player"}</span>
                </div>

                <div className="profile-info-row">
                  <div className="profile-row-label-group">
                    <ShieldCheck size={16} className="profile-row-icon" />
                    <span className="profile-row-label">Account Role</span>
                  </div>
                  <span className="navbar-role-pill role-player">
                    {user?.role || "PLAYER"}
                  </span>
                </div>

                <div className="profile-info-row">
                  <div className="profile-row-label-group">
                    <Activity size={16} className="profile-row-icon" />
                    <span className="profile-row-label">Words Played</span>
                  </div>
                  {isLoadingQuota ? (
                    <span className="skeleton-shimmer" style={{ width: "65px", height: "16px" }}></span>
                  ) : (
                    <span className="profile-row-value">
                      {dailyQuota.games_played_today}{" "}
                      {isUnlimited ? "(Unlimited)" : `/ ${dailyQuota.daily_limit}`}
                    </span>
                  )}
                </div>

                <div className="profile-info-row">
                  <div className="profile-row-label-group">
                    <CheckCircle2 size={16} className="profile-row-icon" />
                    <span className="profile-row-label">Status</span>
                  </div>
                  <span className="active-status-badge">
                    <span className="active-status-dot"></span>
                    <span>Active</span>
                  </span>
                </div>
              </div>

              <div className="profile-tip-box">
                <Info size={16} className="profile-tip-icon" />
                <span>
                  Your session stats and daily quota update in real time as you play and complete word games.
                </span>
              </div>
            </div>

            <div className="profile-history-action">
              <Link
                to="/player/history"
                className="btn-view-match-history"
                aria-label="View Full Match History"
              >
                <History size={16} />
                <span>View Full Match History</span>
                <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </section>
      </div>

      {/* Start New Game Confirmation Modal */}
      {showStartModal && (
        <div
          className="modal-backdrop-custom"
          role="presentation"
          onClick={() => !isStartingGame && setShowStartModal(false)}
        >
          <div
            className="modal-dialog-custom"
            role="dialog"
            aria-modal="true"
            aria-labelledby="start-modal-title"
            aria-describedby="start-modal-description"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-content-custom">
              <div className="modal-icon-badge primary">
                <Sparkles size={26} strokeWidth={2.2} />
              </div>
              <h2 id="start-modal-title" className="modal-title-custom">
                Start a new game?
              </h2>
              <p id="start-modal-description" className="modal-desc-custom">
                You'll have 5 attempts to guess the secret 5-letter word. Ready to begin?
              </p>
              <div className="modal-actions-custom">
                <button
                  type="button"
                  className="modal-btn-cancel"
                  onClick={() => setShowStartModal(false)}
                  disabled={isStartingGame}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="modal-btn-confirm-primary"
                  onClick={handleStartGame}
                  disabled={isStartingGame}
                  autoFocus
                >
                  {isStartingGame ? (
                    <>
                      <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                      <span>Starting...</span>
                    </>
                  ) : (
                    <>
                      <Play size={16} fill="#FFFFFF" />
                      <span>Start Game</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
