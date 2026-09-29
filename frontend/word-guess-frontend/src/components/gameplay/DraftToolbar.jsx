import React from "react";
import { Copy, Shuffle, RotateCcw, Undo2, ArrowLeftRight } from "lucide-react";

/**
 * DraftToolbar:
 * Compact toolbar placed directly above the guessing board for quick editing operations:
 * - Copy Previous: copies the latest submitted guess
 * - Shuffle: rearranges current letters (respecting confirmed positions)
 * - Reset: clears the unsubmitted draft
 * - Undo: reverts the last draft modification
 */
export function DraftToolbar({
  onCopyPrevious,
  onShuffle,
  onReset,
  onUndo,
  canCopy = false,
  canShuffle = false,
  canReset = false,
  canUndo = false,
  isSwapActive = false,
  onCancelSwap,
  disabled = false,
}) {
  return (
    <div className="draft-toolbar-container" role="toolbar" aria-label="Draft editing tools">
      <div className="draft-toolbar-left">
        <button
          type="button"
          className="btn-toolbar-tool"
          onClick={onCopyPrevious}
          disabled={disabled || !canCopy}
          title={canCopy ? "Copy the most recent submitted guess" : "No previous guesses to copy"}
          aria-label="Copy previous guess into draft"
        >
          <Copy size={13} />
          <span>Copy Previous</span>
        </button>

        <button
          type="button"
          className="btn-toolbar-tool"
          onClick={onShuffle}
          disabled={disabled || !canShuffle}
          title={canShuffle ? "Rearrange letters in the current draft" : "Enter at least 2 letters to shuffle"}
          aria-label="Shuffle draft letters"
        >
          <Shuffle size={13} />
          <span>Shuffle</span>
        </button>

        <button
          type="button"
          className="btn-toolbar-tool"
          onClick={onReset}
          disabled={disabled || !canReset}
          title={canReset ? "Clear current draft letters" : "Draft is already empty"}
          aria-label="Reset draft letters"
        >
          <RotateCcw size={13} />
          <span>Reset</span>
        </button>

        <button
          type="button"
          className="btn-toolbar-tool"
          onClick={onUndo}
          disabled={disabled || !canUndo}
          title={canUndo ? "Undo last draft edit" : "No edits to undo"}
          aria-label="Undo last draft edit"
        >
          <Undo2 size={13} />
          <span>Undo</span>
        </button>
      </div>

      {isSwapActive && (
        <div className="draft-swap-indicator" role="status" aria-live="polite">
          <ArrowLeftRight size={13} className="swap-icon-pulse" />
          <span>Click second tile to swap</span>
          <button
            type="button"
            className="btn-swap-cancel"
            onClick={onCancelSwap}
            aria-label="Cancel tile swap"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}
