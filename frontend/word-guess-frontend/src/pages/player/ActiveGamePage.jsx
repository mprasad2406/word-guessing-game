import React, { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { toast } from "react-toastify";
import { PageLoader } from "../../components/common/PageLoader";
import { GameCompletionCard } from "../../components/gameplay/GameCompletionCard";
import { GameEndModal } from "../../components/gameplay/GameEndModal";
import { GameStatusCard } from "../../components/gameplay/GameStatusCard";
import { GuessForm } from "../../components/gameplay/GuessForm";
import { GuessHistory } from "../../components/gameplay/GuessHistory";
import { HintPanel } from "../../components/gameplay/HintPanel";
import { WordleGrid } from "../../components/gameplay/WordleGrid";
import { gameplayService } from "../../services/gameplayService";
import { parseServerDate } from "../../utils/dateUtils";

export function ActiveGamePage() {
  const { gameId } = useParams();
  const navigate = useNavigate();

  const [gameState, setGameState] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  const [currentGuess, setCurrentGuess] = useState("");
  const [isSubmittingGuess, setIsSubmittingGuess] = useState(false);
  const [isRequestingHint, setIsRequestingHint] = useState(false);
  const [isStartingNewGame, setIsStartingNewGame] = useState(false);
  const [showEndModal, setShowEndModal] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Fetch game state on mount or when gameId changes
  useEffect(() => {
    let isMounted = true;

    async function fetchGame() {
      if (!gameId) {
        setLoadError("Invalid game identifier.");
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setLoadError(null);

      try {
        const data = await gameplayService.getGameState(gameId);
        if (isMounted) {
          setGameState(data);
          if (data.status !== "ACTIVE") {
            setShowEndModal(true);
          }
        }
      } catch (err) {
        if (isMounted) {
          console.error("Failed to load game state:", err);
          setLoadError(err?.message || "Failed to load game session.");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    fetchGame();

    return () => {
      isMounted = false;
    };
  }, [gameId]);

  // Live timer countdown & auto-expiration check
  useEffect(() => {
    if (!gameState || gameState.status !== "ACTIVE" || !gameState.started_at) {
      return;
    }

    const timeLimit = gameState.time_limit_seconds;
    const isLimited = timeLimit && timeLimit > 0;
    const startDate = parseServerDate(gameState.started_at);
    const startTime = startDate ? startDate.getTime() : Date.now();

    let hasExpired = false;

    const updateTimer = async () => {
      const now = Date.now();
      const elapsed = Math.max(0, Math.floor((now - startTime) / 1000));
      setElapsedSeconds(elapsed);

      if (isLimited) {
        const remaining = Math.max(0, timeLimit - elapsed);
        setTimeRemaining(remaining);

        if (remaining <= 0 && !hasExpired) {
          hasExpired = true;
          try {
            // Auto expire: sync fresh state from backend to reveal word and transition status
            const freshState = await gameplayService.getGameState(gameState.id);
            setGameState(freshState);
            toast.warning("Time limit has expired for this game session!");
            setShowEndModal(true);
          } catch (err) {
            console.error("Failed to auto-expire game:", err);
          }
        }
      }
    };

    updateTimer();
    const intervalId = setInterval(updateTimer, 1000);

    return () => clearInterval(intervalId);
  }, [gameState?.id, gameState?.status, gameState?.started_at, gameState?.time_limit_seconds]);

  // Handle whole-word guess submission
  const handleGuessSubmit = async (guess) => {
    if (!gameState || gameState.status !== "ACTIVE" || isSubmittingGuess) return false;

    setIsSubmittingGuess(true);
    try {
      const updatedState = await gameplayService.submitGuess(gameState.id, guess);
      setGameState(updatedState);
      setCurrentGuess("");

      if (updatedState.status === "WON") {
        toast.success("Awesome! You guessed the secret word!");
        setShowEndModal(true);
      } else if (updatedState.status === "EXPIRED") {
        toast.warning("Time limit has expired for this game session!");
        setShowEndModal(true);
      } else if (updatedState.status === "LOST") {
        toast.error("Attempts exhausted. Better luck next time!");
        setShowEndModal(true);
      } else {
        toast.info("Incorrect guess. Try another word!");
      }

      return true;
    } catch (err) {
      const errMsg = err?.message || "Failed to submit guess.";
      toast.error(errMsg);
      return false;
    } finally {
      setIsSubmittingGuess(false);
    }
  };

  // Handle hint request
  const handleRequestHint = async () => {
    if (!gameState || gameState.status !== "ACTIVE" || isRequestingHint) return;

    setIsRequestingHint(true);
    try {
      const hintData = await gameplayService.requestHint(gameState.id);
      setGameState((prev) => ({
        ...prev,
        revealed_hint: hintData.hint,
        hints_used: hintData.hints_used,
        hints_remaining: hintData.hints_remaining,
      }));
      toast.success("Hint unlocked!");
    } catch (err) {
      const errMsg = err?.message || "Could not retrieve hint.";
      toast.error(errMsg);
    } finally {
      setIsRequestingHint(false);
    }
  };

  // Handle start new game ("Play Again")
  const handlePlayAgain = async () => {
    if (isStartingNewGame) return;

    setIsStartingNewGame(true);
    try {
      const newGame = await gameplayService.startGame();
      setShowEndModal(false);
      toast.success("New game started! Good luck!");
      navigate(`/player/game/${newGame.id}`);
    } catch (err) {
      const errMsg = err?.message || "Failed to start new game.";
      toast.error(errMsg);
    } finally {
      setIsStartingNewGame(false);
    }
  };

  // When user clicks OK in GameEndModal -> stop game and return to lobby
  const handleModalOk = () => {
    setShowEndModal(false);
    navigate("/player");
  };

  const handleViewHistory = () => {
    setShowEndModal(false);
    navigate("/player/history");
  };

  const getDurationSeconds = () => {
    if (!gameState) return null;
    if (gameState.completed_at && gameState.started_at) {
      const start = parseServerDate(gameState.started_at)?.getTime();
      const end = parseServerDate(gameState.completed_at)?.getTime();
      if (start && end) {
        return Math.max(0, Math.floor((end - start) / 1000));
      }
    }
    return elapsedSeconds;
  };

  if (isLoading) {
    return (
      <div className="container py-5">
        <PageLoader text="Loading game session..." />
      </div>
    );
  }

  if (loadError || !gameState) {
    return (
      <div className="container py-5" style={{ maxWidth: "600px" }}>
        <div className="card shadow-sm border-0 rounded-4 text-center p-4">
          <div className="mb-3">
            <i className="bi bi-exclamation-triangle-fill text-warning display-4"></i>
          </div>
          <h4 className="fw-bold mb-2">Game Session Unavailable</h4>
          <p className="text-muted mb-4">{loadError || "The requested game session could not be found."}</p>
          <div className="d-flex justify-content-center gap-3">
            <Link to="/player" className="btn btn-primary px-4">
              <i className="bi bi-house-door me-2"></i>Return to Lobby
            </Link>
            <Link to="/player/history" className="btn btn-outline-secondary px-4">
              <i className="bi bi-journal-text me-2"></i>Game History
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const isGameActive = gameState.status === "ACTIVE";

  return (
    <div className="container py-4" style={{ maxWidth: "800px" }}>
      {/* Breadcrumb Navigation */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <nav aria-label="breadcrumb">
          <ol className="breadcrumb mb-0">
            <li className="breadcrumb-item">
              <Link to="/player" className="text-decoration-none">
                <i className="bi bi-house-door me-1"></i>Lobby
              </Link>
            </li>
            <li className="breadcrumb-item active" aria-current="page">
              Game #{gameState.id}
            </li>
          </ol>
        </nav>
        <Link to="/player/history" className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1">
          <i className="bi bi-journal-text"></i>
          <span>History</span>
        </Link>
      </div>

      {/* Game Status Header Card */}
      <GameStatusCard
        gameState={gameState}
        timeRemaining={timeRemaining}
        elapsedSeconds={elapsedSeconds}
      />

      {/* Interactive Wordle Letter Grid (Highlights: Green, Orange, Grey) */}
      <div className="card shadow-sm border-0 rounded-4 p-4 mb-4 bg-white text-center">
        <h6 className="text-uppercase text-muted fw-bold mb-3 tracking-wide">
          Wordle Guessing Board
        </h6>
        <WordleGrid
          guesses={gameState.guesses}
          maxAttempts={gameState.max_attempts}
          wordLength={gameState.word_length}
          currentGuess={currentGuess}
          isGameActive={isGameActive}
        />

        {/* Legend */}
        <div className="d-flex justify-content-center flex-wrap gap-3 small text-muted pt-2 border-top">
          <div className="d-flex align-items-center gap-1">
            <span
              style={{ width: "16px", height: "16px", backgroundColor: "#198754", borderRadius: "3px" }}
              className="d-inline-block"
            />
            <span>Correct Spot (Green)</span>
          </div>
          <div className="d-flex align-items-center gap-1">
            <span
              style={{ width: "16px", height: "16px", backgroundColor: "#fd7e14", borderRadius: "3px" }}
              className="d-inline-block"
            />
            <span>Wrong Spot (Orange)</span>
          </div>
          <div className="d-flex align-items-center gap-1">
            <span
              style={{ width: "16px", height: "16px", backgroundColor: "#6c757d", borderRadius: "3px" }}
              className="d-inline-block"
            />
            <span>Not in Word (Grey)</span>
          </div>
        </div>
      </div>

      {/* Completion Banner if game finished */}
      {!isGameActive && (
        <GameCompletionCard
          status={gameState.status}
          finalWord={gameState.final_word}
          attemptsUsed={gameState.attempts_used}
          maxAttempts={gameState.max_attempts}
          hintsUsed={gameState.hints_used}
          durationSeconds={getDurationSeconds()}
          onPlayAgain={handlePlayAgain}
          onViewHistory={handleViewHistory}
          isStartingNewGame={isStartingNewGame}
        />
      )}

      {/* Active Gameplay Controls */}
      {isGameActive && (
        <>
          <GuessForm
            wordLength={gameState.word_length}
            disabled={!isGameActive}
            isSubmitting={isSubmittingGuess}
            currentGuess={currentGuess}
            onGuessChange={setCurrentGuess}
            onGuessSubmit={handleGuessSubmit}
          />

          <HintPanel
            revealedHint={gameState.revealed_hint}
            hintsUsed={gameState.hints_used}
            maxHints={gameState.max_hints}
            hintsRemaining={gameState.hints_remaining}
            isGameActive={isGameActive}
            isRequestingHint={isRequestingHint}
            onRequestHint={handleRequestHint}
          />
        </>
      )}

      {/* Chronological Guesses Log */}
      <GuessHistory guesses={gameState.guesses} />

      {/* Win / Loss / Expired Modal with OK Button */}
      <GameEndModal
        isOpen={showEndModal}
        status={gameState.status}
        finalWord={gameState.final_word}
        attemptsUsed={gameState.attempts_used}
        maxAttempts={gameState.max_attempts}
        durationSeconds={getDurationSeconds()}
        onOk={handleModalOk}
        onPlayAgain={handlePlayAgain}
        onViewHistory={handleViewHistory}
        isStartingNewGame={isStartingNewGame}
      />
    </div>
  );
}
