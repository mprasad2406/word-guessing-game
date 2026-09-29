import React, { useEffect, useState, useRef } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { toast } from "react-toastify";
import { AlertTriangle, Home, History } from "lucide-react";
import { PageLoader } from "../../components/common/PageLoader";
import { LiveMatchHeader } from "../../components/gameplay/LiveMatchHeader";
import { MatchDashboardCards } from "../../components/gameplay/MatchDashboardCards";
import { LiveGameplayCard } from "../../components/gameplay/LiveGameplayCard";
import { HintSection } from "../../components/gameplay/HintSection";
import { LivePreviousGuesses } from "../../components/gameplay/LivePreviousGuesses";
import { ExitMatchModal } from "../../components/gameplay/ExitMatchModal";
import { ResultModal } from "../../components/gameplay/ResultModal";
import { GameDetailsPage } from "./GameDetailsPage";
import { gameplayService } from "../../services/gameplayService";
import { parseServerDate } from "../../utils/dateUtils";
import { playerPaths } from "../../routes/paths";
import "./LiveMatch.css";

export function ActiveGamePage() {
  const { publicId, gameId } = useParams();
  const navigate = useNavigate();

  const matchIdentifier = publicId || gameId;

  const [gameState, setGameState] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  const [currentGuess, setCurrentGuess] = useState("");
  const [isSubmittingGuess, setIsSubmittingGuess] = useState(false);
  const [isRequestingHint, setIsRequestingHint] = useState(false);
  const [isStartingNewGame, setIsStartingNewGame] = useState(false);

  // Modal states
  const [showResultModal, setShowResultModal] = useState(false);
  const [showExitModal, setShowExitModal] = useState(false);
  const wasActiveSessionRef = useRef(false);

  const [timeRemaining, setTimeRemaining] = useState(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Fetch game state on mount or when identifier changes
  useEffect(() => {
    let isMounted = true;
    setShowResultModal(false);
    wasActiveSessionRef.current = false;

    async function fetchGame() {
      if (!matchIdentifier) {
        setLoadError("Invalid match identifier.");
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setLoadError(null);

      try {
        const data = await gameplayService.getGameState(matchIdentifier);
        if (isMounted) {
          setGameState(data);
          if (data.status === "ACTIVE") {
            wasActiveSessionRef.current = true;
          }

          // If accessed via legacy numeric route, seamlessly replace URL with secure public route
          if (gameId && data?.public_id) {
            navigate(playerPaths.matchDetails(data.public_id), { replace: true });
          }
        }
      } catch (err) {
        if (isMounted) {
          console.error("Failed to load match state:", err);
          setLoadError(err?.message || "Failed to load match session.");
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
  }, [matchIdentifier, gameId, navigate]);

  // Live timer countdown & auto-expiration check for active games
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
            // Auto expire: sync fresh state from backend
            const activeId = gameState.public_id || gameState.id;
            const freshState = await gameplayService.getGameState(activeId);
            setGameState(freshState);
            toast.warning("Time limit has expired for this match session!");
            // Transition happened live, show result modal
            setShowResultModal(true);
          } catch (err) {
            console.error("Failed to auto-expire game:", err);
          }
        }
      }
    };

    updateTimer();
    const intervalId = setInterval(updateTimer, 1000);

    return () => clearInterval(intervalId);
  }, [gameState?.id, gameState?.public_id, gameState?.status, gameState?.started_at, gameState?.time_limit_seconds]);

  // Handle whole-word guess submission
  const handleGuessSubmit = async (guess) => {
    if (!gameState || gameState.status !== "ACTIVE" || isSubmittingGuess) return false;

    const activeId = gameState.public_id || gameState.id;
    setIsSubmittingGuess(true);
    try {
      const updatedState = await gameplayService.submitGuess(activeId, guess);
      setGameState(updatedState);
      setCurrentGuess("");

      if (updatedState.status === "WON") {
        toast.success("Awesome! You guessed the secret word!");
        setShowResultModal(true);
      } else if (updatedState.status === "EXPIRED") {
        toast.warning("Time limit has expired for this match session!");
        setShowResultModal(true);
      } else if (updatedState.status === "LOST") {
        toast.error("Attempts exhausted. Better luck next time!");
        setShowResultModal(true);
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

    const activeId = gameState.public_id || gameState.id;
    setIsRequestingHint(true);
    try {
      const hintData = await gameplayService.requestHint(activeId);
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

  // Exit match handler
  const handleConfirmExit = () => {
    setShowExitModal(false);
    navigate(playerPaths.lobby());
  };

  // Result modal: Return to Lobby (OK)
  const handleModalReturnToLobby = () => {
    setShowResultModal(false);
    navigate(playerPaths.lobby());
  };

  // Result modal: Play Again
  const handleModalPlayAgain = async () => {
    if (isStartingNewGame) return;

    setIsStartingNewGame(true);
    try {
      const newGame = await gameplayService.startGame();
      setShowResultModal(false);
      toast.success("New game started! Good luck!");
      navigate(playerPaths.matchDetails(newGame.public_id));
    } catch (err) {
      const errMsg = err?.message || "Failed to start new game.";
      toast.error(errMsg);
    } finally {
      setIsStartingNewGame(false);
    }
  };

  // Result modal: View History
  const handleModalViewHistory = () => {
    setShowResultModal(false);
    navigate(playerPaths.history());
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
      <div className="container py-5 text-center">
        <PageLoader text="Loading match session..." />
      </div>
    );
  }

  if (loadError || !gameState) {
    return (
      <div className="container py-5" style={{ maxWidth: "560px" }}>
        <div className="card shadow-sm border-0 rounded-4 text-center p-4 bg-white">
          <div className="mb-3 d-flex justify-content-center">
            <span
              style={{
                width: "52px",
                height: "52px",
                borderRadius: "14px",
                backgroundColor: "#fef2f2",
                color: "#dc2626",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <AlertTriangle size={26} />
            </span>
          </div>
          <h4 className="fw-bold mb-2" style={{ color: "#0f172a" }}>
            Match Unavailable
          </h4>
          <p className="text-muted mb-4" style={{ fontSize: "0.875rem" }}>
            {loadError || "The requested match session could not be found or is not accessible."}
          </p>
          <div className="d-flex justify-content-center gap-2">
            <Link to={playerPaths.lobby()} className="btn-live-secondary">
              <Home size={15} />
              <span>Return to Lobby</span>
            </Link>
            <Link to={playerPaths.history()} className="btn-live-secondary">
              <History size={15} />
              <span>Game History</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // If the game is already in a terminal state (WON, LOST, EXPIRED) and result modal is closed,
  // render the dedicated read-only GameDetailsPage!
  if (gameState.status !== "ACTIVE" && !showResultModal) {
    return <GameDetailsPage gameState={gameState} />;
  }

  const isGameActive = gameState.status === "ACTIVE";

  return (
    <div className="live-match-container">
      {/* 1. Compact Gameplay Header */}
      <LiveMatchHeader onExitClick={() => setShowExitModal(true)} />

      {/* 2. Compact Dashboard Cards (Attempts, Hints, Time) */}
      <MatchDashboardCards
        attemptsUsed={gameState.attempts_used}
        maxAttempts={gameState.max_attempts}
        remainingAttempts={gameState.remaining_attempts}
        hintsUsed={gameState.hints_used}
        maxHints={gameState.max_hints}
        hintsRemaining={gameState.hints_remaining}
        timeRemaining={timeRemaining}
        timeLimitSeconds={gameState.time_limit_seconds}
        elapsedSeconds={elapsedSeconds}
      />

      {/* 3. Combined Cohesive Gameplay Card (Instruction, Board, Input & Submission) */}
      <LiveGameplayCard
        gameState={gameState}
        currentGuess={currentGuess}
        onGuessChange={setCurrentGuess}
        onGuessSubmit={handleGuessSubmit}
        isSubmittingGuess={isSubmittingGuess}
        isGameActive={isGameActive}
      />

      {/* 4. Supporting Sections (Hint and Previous Guesses) */}
      <div className="live-supporting-grid">
        <HintSection
          revealedHint={gameState.revealed_hint}
          hintsUsed={gameState.hints_used}
          maxHints={gameState.max_hints}
          hintsRemaining={gameState.hints_remaining}
          isGameActive={isGameActive}
          isRequestingHint={isRequestingHint}
          onRequestHint={handleRequestHint}
        />

        <LivePreviousGuesses guesses={gameState.guesses} />
      </div>

      {/* Exit Match Confirmation Dialog */}
      <ExitMatchModal
        isOpen={showExitModal}
        onConfirm={handleConfirmExit}
        onCancel={() => setShowExitModal(false)}
      />

      {/* Result Modal: Triggered ONLY when active gameplay completes */}
      <ResultModal
        isOpen={showResultModal}
        status={gameState.status}
        finalWord={gameState.final_word}
        attemptsUsed={gameState.attempts_used}
        maxAttempts={gameState.max_attempts}
        durationSeconds={getDurationSeconds()}
        onOk={handleModalReturnToLobby}
        onPlayAgain={handleModalPlayAgain}
        onViewHistory={handleModalViewHistory}
        isStartingNewGame={isStartingNewGame}
      />
    </div>
  );
}
