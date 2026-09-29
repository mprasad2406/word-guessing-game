import React from "react";
import { UserCheck, RotateCcw, History, HelpCircle } from "lucide-react";

export function PlayerExperienceSection({ formData, onChange, isSaving }) {
  return (
    <div className="settings-card">
      <div className="settings-card-header">
        <div className="d-flex align-items-center gap-2">
          <div className="settings-header-icon-box">
            <UserCheck size={18} />
          </div>
          <div>
            <h3 className="settings-card-title mb-0">Player Experience</h3>
            <p className="settings-card-subtitle mb-0">
              Configure guess repetition rules and historical word reuse policies
            </p>
          </div>
        </div>
      </div>

      <div className="settings-card-body">
        <div className="player-experience-rows">
          {/* 1. Allow Repeated Guesses within a game */}
          <div className="player-exp-row">
            <div className="player-exp-left">
              <div className="player-exp-icon-box">
                <RotateCcw size={16} />
              </div>
              <div className="player-exp-meta">
                <div className="d-flex align-items-center gap-1">
                  <span className="player-exp-title">Allow Repeated Guesses</span>
                  <span
                    className="tooltip-trigger"
                    title="If enabled, players can re-submit the same incorrect word within a single game session. If disabled, duplicates are rejected with a warning."
                  >
                    <HelpCircle size={13} />
                  </span>
                </div>
                <p className="player-exp-desc mb-0">
                  Permits submitting identical word guesses within the same active match session
                </p>
              </div>
            </div>

            <div className="player-exp-right">
              <label className="switch-control" title={formData.allow_repeated_guesses ? "Repeated guesses enabled" : "Repeated guesses disabled"}>
                <input
                  type="checkbox"
                  checked={formData.allow_repeated_guesses}
                  onChange={(e) => onChange("allow_repeated_guesses", e.target.checked)}
                  disabled={isSaving}
                  aria-label="Toggle allow repeated guesses"
                />
                <span className="switch-slider" />
              </label>
            </div>
          </div>

          {/* 2. Allow Word Reuse Across Games */}
          <div className="player-exp-row">
            <div className="player-exp-left">
              <div className="player-exp-icon-box">
                <History size={16} />
              </div>
              <div className="player-exp-meta">
                <div className="d-flex align-items-center gap-1">
                  <span className="player-exp-title">Allow Word Reuse Across Games</span>
                  <span
                    className="tooltip-trigger"
                    title="If enabled, words previously played by a player may be selected again in future matches. If disabled, players only receive words they have not yet encountered."
                  >
                    <HelpCircle size={13} />
                  </span>
                </div>
                <p className="player-exp-desc mb-0">
                  Allows previously attempted target words to reappear for the player in subsequent matches
                </p>
              </div>
            </div>

            <div className="player-exp-right">
              <label className="switch-control" title={formData.allow_word_reuse ? "Word reuse enabled" : "Word reuse disabled"}>
                <input
                  type="checkbox"
                  checked={formData.allow_word_reuse}
                  onChange={(e) => onChange("allow_word_reuse", e.target.checked)}
                  disabled={isSaving}
                  aria-label="Toggle allow word reuse across games"
                />
                <span className="switch-slider" />
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
