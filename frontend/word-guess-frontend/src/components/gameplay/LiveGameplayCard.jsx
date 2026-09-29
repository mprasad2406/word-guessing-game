import React, { useState } from "react";
import { Sparkles } from "lucide-react";
import { DraftToolbar } from "./DraftToolbar";
import { IntelligentSuggestionBanner } from "./IntelligentSuggestionBanner";
import { LiveGuessBoard } from "./LiveGuessBoard";
import { LiveGuessInput } from "./LiveGuessInput";
import { useGuessDraft } from "../../hooks/useGuessDraft";

/**
 * LiveGameplayCard:
 * Unified gameplay card combining the target word instruction banner,
 * feedback suggestion banner, draft editing toolbar, directly editable interactive board,
 * synchronized text field, and submit action.
 */
export function LiveGameplayCard({
  gameState,
  onGuessSubmit,
  isSubmittingGuess,
  isGameActive,
}) {
  const [isShaking, setIsShaking] = useState(false);

  const {
    guesses = [],
    max_attempts = 5,
    word_length = 5,
  } = gameState || {};

  const triggerShake = () => {
    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 500);
  };

  const draftState = useGuessDraft({
    wordLength: word_length,
    initialDraft: "",
    onGuessSubmit,
    disabled: !isGameActive || isSubmittingGuess,
  });

  const {
    draft,
    setDraft,
    selectedTileIndex,
    swapSourceIndex,
    selectTile,
    cancelSwapSelection,
    swapTiles,
    handleKeyDownOnTile,
    handlePaste,
    copyPrevious,
    prepareFromFeedback,
    shuffle,
    reset,
    undo,
    canUndo,
    canReset,
    canShuffle,
  } = draftState;

  if (!gameState) return null;

  const hasPreviousGuesses = guesses.length > 0;
  const lastGuessWord = hasPreviousGuesses ? guesses[guesses.length - 1].guess : null;

  const handleCopyLatest = () => {
    if (lastGuessWord) {
      copyPrevious(lastGuessWord);
    }
  };

  const handlePrepareFromFeedback = () => {
    prepareFromFeedback(guesses);
  };

  return (
    <section className="live-gameplay-card" aria-label="Word Guessing Area">
      {/* 1. Instruction Header */}
      <div className="gameplay-card-header">
        <div className="gameplay-header-text">
          <div className="gameplay-instruction-badge">
            <Sparkles size={13} />
            <span>Target Word</span>
          </div>
          <p className="gameplay-instruction-text">
            Guess the <strong>{word_length}-letter</strong> secret word in <strong>{max_attempts}</strong> attempts.
          </p>
        </div>
      </div>

      {/* 2. Intelligent Guess Suggestion Banner (Optional convenience) */}
      {isGameActive && hasPreviousGuesses && (
        <IntelligentSuggestionBanner
          guesses={guesses}
          wordLength={word_length}
          onPrepareDraft={handlePrepareFromFeedback}
          onShuffle={shuffle}
          disabled={!isGameActive || isSubmittingGuess}
        />
      )}

      {/* 3. Draft Editing Toolbar */}
      {isGameActive && (
        <DraftToolbar
          onCopyPrevious={handleCopyLatest}
          onShuffle={shuffle}
          onReset={reset}
          onUndo={undo}
          canCopy={hasPreviousGuesses}
          canShuffle={canShuffle}
          canReset={canReset}
          canUndo={canUndo}
          isSwapActive={swapSourceIndex !== null}
          onCancelSwap={cancelSwapSelection}
          disabled={!isGameActive || isSubmittingGuess}
        />
      )}

      {/* 4. Interactive Guessing Board with direct tile editing & drag-drop */}
      <div className="gameplay-board-section">
        <LiveGuessBoard
          guesses={guesses}
          maxAttempts={max_attempts}
          wordLength={word_length}
          draft={draft}
          selectedTileIndex={selectedTileIndex}
          swapSourceIndex={swapSourceIndex}
          onSelectTile={selectTile}
          onKeyDownTile={(idx, e) => handleKeyDownOnTile(idx, e, onGuessSubmit)}
          onPasteTile={handlePaste}
          onSwapTiles={swapTiles}
          onCopyRow={copyPrevious}
          isGameActive={isGameActive}
          isShaking={isShaking}
          disabled={!isGameActive || isSubmittingGuess}
        />
      </div>

      {/* 5. Synchronized Text Input & Submit Action */}
      {isGameActive && (
        <div className="gameplay-input-section">
          <LiveGuessInput
            wordLength={word_length}
            draft={draft}
            onDraftChange={(val) => setDraft(val, true)}
            onGuessSubmit={onGuessSubmit}
            isSubmitting={isSubmittingGuess}
            disabled={!isGameActive}
            previousGuesses={guesses}
            onTriggerShake={triggerShake}
          />
        </div>
      )}
    </section>
  );
}
