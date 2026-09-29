import React from "react";
import { Link } from "react-router-dom";
import { Home, ChevronRight, History, LogOut, Play } from "lucide-react";
import { playerPaths } from "../../routes/paths";

/**
 * LiveMatchHeader:
 * Compact gameplay header sitting directly beneath the main navbar.
 * Left: Breadcrumb (Lobby / Live Match) + "Word Challenge" title + "In Progress" badge.
 * Right: Game History link + Exit Game button.
 */
export function LiveMatchHeader({ onExitClick }) {
  return (
    <header className="live-match-header" aria-label="Game session header">
      <div className="live-match-header-left">
        <nav className="live-breadcrumb" aria-label="Breadcrumb">
          <Link to={playerPaths.lobby()} className="live-breadcrumb-link">
            <Home size={14} />
            <span>Lobby</span>
          </Link>
          <ChevronRight size={13} className="live-breadcrumb-separator" aria-hidden="true" />
          <span className="live-breadcrumb-current" aria-current="page">
            Live Match
          </span>
        </nav>
        <div className="live-title-row">
          <h1 className="live-page-title">Word Challenge</h1>
          <span className="live-status-badge in-progress" role="status">
            <Play size={12} fill="#2563EB" strokeWidth={0} />
            <span>In Progress</span>
          </span>
        </div>
      </div>

      <div className="live-header-actions">
        <Link
          to={playerPaths.history()}
          className="btn-live-secondary"
          aria-label="View Game History"
        >
          <History size={15} />
          <span>Game History</span>
        </Link>
        <button
          type="button"
          className="btn-live-exit"
          onClick={onExitClick}
          aria-label="Exit Game Session"
        >
          <LogOut size={15} />
          <span>Exit Game</span>
        </button>
      </div>
    </header>
  );
}
