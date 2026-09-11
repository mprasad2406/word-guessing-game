import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useAuth } from "../../context/AuthContext";
import { gameplayService } from "../../services/gameplayService";

export function PlayerHomePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isStartingGame, setIsStartingGame] = useState(false);
  const [startError, setStartError] = useState(null);
  const [dailyQuota, setDailyQuota] = useState({
    daily_limit: 3,
    games_played_today: 0,
    games_remaining_today: 3,
    can_start_game: true,
  });
  const [isLoadingQuota, setIsLoadingQuota] = useState(true);

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
      toast.success("Game created! Let's guess the word!");
      navigate(`/player/game/${newGame.id}`);
    } catch (err) {
      console.error("Failed to create game:", err);
      const errMsg = err?.message || "Failed to start a new game session. Please try again later.";
      setStartError(errMsg);
      toast.error(errMsg);
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
  const isLimitReached = !isUnlimited && (!dailyQuota.can_start_game || dailyQuota.games_played_today >= dailyQuota.daily_limit);

  return (
    <div className="container py-4" style={{ maxWidth: "900px" }}>
      {/* Welcome Banner */}
      <div className="card shadow-sm border-0 rounded-4 overflow-hidden mb-4 bg-primary text-white">
        <div className="card-body p-4 p-md-5">
          <div className="row align-items-center">
            <div className="col-lg-8">
              <span className="badge bg-white text-primary mb-2 px-3 py-1 fw-semibold text-uppercase">
                Player Lobby
              </span>
              <h1 className="fw-bold display-6 mb-2">
                Welcome back, {user?.username}!
              </h1>
              <p className="lead mb-4 text-white-50">
                Ready to test your vocabulary and deduction skills? Start a fresh game session and crack the secret word!
              </p>
              <div className="d-flex flex-wrap gap-3">
                <button
                  type="button"
                  className={`btn btn-lg px-4 fw-bold d-inline-flex align-items-center gap-2 shadow ${
                    isLimitReached ? "btn-light text-muted opacity-75" : "btn-light text-primary"
                  }`}
                  onClick={handleStartGame}
                  disabled={isStartingGame || isLimitReached}
                  title={isLimitReached ? `Daily limit of ${dailyQuota.daily_limit} words reached` : "Start a new game"}
                >
                  {isStartingGame ? (
                    <>
                      <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                      <span>Starting Game...</span>
                    </>
                  ) : isLimitReached ? (
                    <>
                      <i className="bi bi-lock-fill fs-5"></i>
                      <span>Daily Limit Reached ({dailyQuota.games_played_today}/{dailyQuota.daily_limit})</span>
                    </>
                  ) : (
                    <>
                      <i className="bi bi-play-circle-fill fs-5"></i>
                      <span>Start New Game</span>
                    </>
                  )}
                </button>
                <Link
                  to="/player/history"
                  className="btn btn-outline-light btn-lg px-4 fw-semibold d-inline-flex align-items-center gap-2"
                >
                  <i className="bi bi-journal-text fs-5"></i>
                  <span>Game History</span>
                </Link>
              </div>
            </div>
            <div className="col-lg-4 d-none d-lg-block text-center">
              <i className="bi bi-controller text-white opacity-50" style={{ fontSize: "7rem" }}></i>
            </div>
          </div>
        </div>
      </div>

      {/* Daily Limit Warning Banner if Reached */}
      {isLimitReached && (
        <div className="alert alert-warning border-0 shadow-sm d-flex align-items-center gap-3 rounded-4 p-3 mb-4" role="alert">
          <i className="bi bi-calendar-x-fill fs-3 text-warning"></i>
          <div>
            <h6 className="fw-bold mb-0">Daily Word Limit Reached ({dailyQuota.games_played_today} / {dailyQuota.daily_limit} words played)</h6>
            <p className="small mb-0 text-secondary">
              You have completed all {dailyQuota.daily_limit} words allowed for today. New words and attempts will become available tomorrow!
            </p>
          </div>
        </div>
      )}

      {/* Start Game Error Alert */}
      {startError && (
        <div className="alert alert-danger d-flex align-items-center gap-2 rounded-3 mb-4" role="alert">
          <i className="bi bi-exclamation-triangle-fill fs-5"></i>
          <div>
            <strong>Unable to start game:</strong> {startError}
          </div>
        </div>
      )}

      {/* Daily Quota Tracking Card */}
      <div className="card shadow-sm border-0 rounded-4 mb-4">
        <div className="card-body p-4">
          <div className="d-flex flex-wrap justify-content-between align-items-center gap-3">
            <div>
              <h5 className="fw-bold mb-1 d-flex align-items-center gap-2">
                <i className="bi bi-calendar-check text-primary"></i>
                <span>Daily Guessing Quota</span>
              </h5>
              <p className="text-muted small mb-0">
                {isUnlimited ? (
                  <>You have <strong>unlimited</strong> word guesses allowed today.</>
                ) : (
                  <>
                    You can guess up to <strong>{dailyQuota.daily_limit} words</strong> per day (
                    {dailyQuota.games_remaining_today ?? Math.max(0, dailyQuota.daily_limit - dailyQuota.games_played_today)} remaining).
                  </>
                )}
              </p>
            </div>
            <div>
              {isUnlimited ? (
                <div className="d-flex align-items-center gap-2 bg-success-subtle text-success border border-success-subtle rounded-3 px-3 py-2 fw-bold">
                  <i className="bi bi-infinity fs-5"></i>
                  <span>Unlimited Play</span>
                </div>
              ) : dailyQuota.daily_limit <= 6 ? (
                <div className="d-flex flex-wrap align-items-center gap-2">
                  {Array.from({ length: dailyQuota.daily_limit }, (_, idx) => idx + 1).map((slot) => {
                    const isPlayed = slot <= dailyQuota.games_played_today;
                    return (
                      <div
                        key={slot}
                        className={`d-flex align-items-center justify-content-center rounded-3 p-2 px-3 fw-bold border ${
                          isPlayed
                            ? "bg-success-subtle text-success border-success-subtle"
                            : "bg-light text-secondary border-light-subtle"
                        }`}
                        style={{ minWidth: "85px" }}
                      >
                        <i className={`bi ${isPlayed ? "bi-check-circle-fill me-1 text-success" : "bi-dash-circle me-1 text-muted"}`}></i>
                        <span className="small">Word {slot}</span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="d-flex align-items-center gap-2 bg-light border border-light-subtle rounded-3 px-3 py-2 fw-bold text-dark">
                  <i className="bi bi-card-checklist text-primary me-1"></i>
                  <span>{dailyQuota.games_played_today} / {dailyQuota.daily_limit} Played</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Game Rules & Profile Overview */}
      <div className="row g-4">
        {/* How to Play Card */}
        <div className="col-md-7">
          <div className="card shadow-sm border-0 rounded-4 h-100">
            <div className="card-header bg-white py-3 border-0">
              <h5 className="mb-0 fw-semibold d-flex align-items-center gap-2">
                <i className="bi bi-info-circle text-primary"></i>
                <span>How to Play</span>
              </h5>
            </div>
            <div className="card-body pt-0 px-4 pb-4">
              <div className="d-flex flex-column gap-3">
                <div className="d-flex gap-3 align-items-start">
                  <div className="bg-primary-subtle text-primary rounded-circle p-2 d-flex align-items-center justify-content-center" style={{ width: "36px", height: "36px" }}>
                    <strong>1</strong>
                  </div>
                  <div>
                    <h6 className="fw-bold mb-1">
                      {isUnlimited ? "Unlimited Daily Games" : `${dailyQuota.daily_limit} Words Per Day`}
                    </h6>
                    <p className="small text-muted mb-0">
                      {isUnlimited
                        ? "Unlimited games enabled! Play as many secret word guessing sessions as you'd like."
                        : `Every player is allocated up to ${dailyQuota.daily_limit} secret words to solve each day.`}
                    </p>
                  </div>
                </div>

                <div className="d-flex gap-3 align-items-start">
                  <div className="bg-primary-subtle text-primary rounded-circle p-2 d-flex align-items-center justify-content-center" style={{ width: "36px", height: "36px" }}>
                    <strong>2</strong>
                  </div>
                  <div>
                    <h6 className="fw-bold mb-1">Wordle Color Highlights</h6>
                    <p className="small text-muted mb-0">
                      Submit 5-letter uppercase guesses. Green indicates the right spot, Orange means wrong spot, and Grey means not in word.
                    </p>
                  </div>
                </div>

                <div className="d-flex gap-3 align-items-start">
                  <div className="bg-primary-subtle text-primary rounded-circle p-2 d-flex align-items-center justify-content-center" style={{ width: "36px", height: "36px" }}>
                    <strong>3</strong>
                  </div>
                  <div>
                    <h6 className="fw-bold mb-1">Limited Guesses & Hints</h6>
                    <p className="small text-muted mb-0">
                      You have 5 attempts to solve the secret word. Use hints when available to reveal clues!
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Player Profile Summary */}
        <div className="col-md-5">
          <div className="card shadow-sm border-0 rounded-4 h-100">
            <div className="card-header bg-white py-3 border-0">
              <h5 className="mb-0 fw-semibold d-flex align-items-center gap-2">
                <i className="bi bi-person-badge text-primary"></i>
                <span>Player Profile</span>
              </h5>
            </div>
            <div className="card-body pt-0 px-4 pb-4">
              <div className="list-group list-group-flush small">
                <div className="list-group-item px-0 py-2 d-flex justify-content-between">
                  <span className="text-muted">Player Username</span>
                  <span className="fw-semibold text-dark">{user?.username}</span>
                </div>
                <div className="list-group-item px-0 py-2 d-flex justify-content-between">
                  <span className="text-muted">Account Role</span>
                  <span className="badge bg-primary">{user?.role}</span>
                </div>
                <div className="list-group-item px-0 py-2 d-flex justify-content-between">
                  <span className="text-muted">Daily Words Played</span>
                  <span className="fw-bold text-dark">
                    {dailyQuota.games_played_today} {isUnlimited ? "(Unlimited)" : `/ ${dailyQuota.daily_limit}`}
                  </span>
                </div>
                <div className="list-group-item px-0 py-2 d-flex justify-content-between">
                  <span className="text-muted">Status</span>
                  <span className="badge bg-success-subtle text-success border border-success-subtle">Active</span>
                </div>
              </div>

              <div className="mt-4 pt-2">
                <Link to="/player/history" className="btn btn-outline-primary w-100 d-flex align-items-center justify-content-center gap-2">
                  <i className="bi bi-journal-text"></i>
                  <span>View Full Match History</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
