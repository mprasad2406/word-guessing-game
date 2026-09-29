import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  Home,
  ChevronRight,
  ArrowLeft,
  Play,
  History,
  Sparkles,
  RotateCcw,
} from "lucide-react";
import { GameSummaryCard } from "../../components/gameplay/GameSummaryCard";
import { ReadOnlyGuessBoard } from "../../components/gameplay/ReadOnlyGuessBoard";
import { GuessTimeline } from "../../components/gameplay/GuessTimeline";
import { GameStatisticsCard } from "../../components/gameplay/GameStatisticsCard";
import { HintHistoryCard } from "../../components/gameplay/HintHistoryCard";
import { gameplayService } from "../../services/gameplayService";
import { playerPaths } from "../../routes/paths";
import "./GameDetails.css";

/**
 * GameDetailsPage:
 * Dedicated read-only review page for completed, won, lost, or expired game sessions.
 * Never displays popup modals on load or refresh.
 */
export function GameDetailsPage({ gameState }) {
  const navigate = useNavigate();
  const [showStartModal, setShowStartModal] = useState(false);
  const [isStartingGame, setIsStartingGame] = useState(false);

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

  const handleStartNewGame = async () => {
    if (isStartingGame) return;

    setIsStartingGame(true);
    try {
      const newGame = await gameplayService.startGame();
      setShowStartModal(false);
      toast.success("New game started! Good luck!");
      navigate(playerPaths.matchDetails(newGame.public_id));
    } catch (err) {
      const errMsg = err?.message || "Failed to start a new game session.";
      toast.error(errMsg);
      setShowStartModal(false);
    } finally {
      setIsStartingGame(false);
    }
  };

  if (!gameState) return null;

  return (
    <div className="details-container">
      {/* 1. Breadcrumb & Page Header */}
      <section className="details-header-section" aria-label="Game Details Header">
        <div className="details-header-left">
          <nav className="details-breadcrumb" aria-label="Breadcrumb">
            <Link to={playerPaths.lobby()}>
              <Home size={14} />
              <span>Lobby</span>
            </Link>
            <ChevronRight size={13} className="details-breadcrumb-separator" />
            <Link to={playerPaths.history()}>
              <span>Game History</span>
            </Link>
            <ChevronRight size={13} className="details-breadcrumb-separator" />
            <span className="details-breadcrumb-current" aria-current="page">
              Match Details
            </span>
          </nav>

          <h1 className="details-page-title">Match Details</h1>
          <p className="details-page-subtitle">
            Review your guesses, clues and session results.
          </p>
        </div>

        <div className="details-header-actions">
          <Link to={playerPaths.history()} className="btn-details-back" aria-label="Return to Game History">
            <ArrowLeft size={16} />
            <span>Back to History</span>
          </Link>

          <button
            type="button"
            className="btn-details-play"
            onClick={() => setShowStartModal(true)}
            aria-label="Play New Game"
          >
            <Play size={16} fill="#FFFFFF" />
            <span>Play New Game</span>
          </button>
        </div>
      </section>

      {/* 2. Main Two-Column Content Grid */}
      <div className="details-content-grid">
        {/* Left Column: Primary Visual Area */}
        <div className="d-flex flex-column">
          <GameSummaryCard gameState={gameState} />
          <ReadOnlyGuessBoard
            guesses={gameState.guesses}
            maxAttempts={gameState.max_attempts}
            wordLength={gameState.word_length}
            status={gameState.status}
          />
          <GuessTimeline
            guesses={gameState.guesses}
            startedAt={gameState.started_at}
            completedAt={gameState.completed_at}
          />
        </div>

        {/* Right Column: Sidebar Metrics & Clues */}
        <div className="d-flex flex-column">
          <GameStatisticsCard gameState={gameState} />
          <HintHistoryCard gameState={gameState} />
        </div>
      </div>

      {/* 3. Bottom Actions Card */}
      <div className="details-bottom-actions-card">
        <div className="d-flex align-items-center gap-2 text-muted small">
          <History size={16} className="text-secondary" />
          <span>Need to check other matches? Return to your match log anytime.</span>
        </div>

        <div className="d-flex align-items-center gap-2">
          <Link to={playerPaths.history()} className="btn-details-back">
            <ArrowLeft size={15} />
            <span>Back to History</span>
          </Link>

          <button
            type="button"
            className="btn-details-play"
            onClick={() => setShowStartModal(true)}
          >
            <Play size={15} fill="#FFFFFF" />
            <span>Play New Game</span>
          </button>
        </div>
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
                  onClick={handleStartNewGame}
                  disabled={isStartingGame}
                  autoFocus
                >
                  {isStartingGame ? (
                    <>
                      <span
                        className="spinner-border spinner-border-sm"
                        role="status"
                        aria-hidden="true"
                      ></span>
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
