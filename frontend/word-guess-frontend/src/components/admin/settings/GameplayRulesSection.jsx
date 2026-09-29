import React from "react";
import {
  Sliders,
  Smile,
  Sparkles,
  Zap,
  Clock,
  Infinity as InfinityIcon,
  HelpCircle,
  Hash,
} from "lucide-react";

/**
 * Reusable Numerical Stepper Component with compact buttons and consistent height
 */
function NumberStepper({
  id,
  label,
  tooltip,
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  unit = "",
  disabled = false,
  badgeText = null,
}) {
  const numVal = typeof value === "number" ? value : parseFloat(value) || 0;

  const handleDecrement = () => {
    const next = Math.max(min, Math.round((numVal - step) * 10) / 10);
    onChange(next);
  };

  const handleIncrement = () => {
    const next = Math.min(max, Math.round((numVal + step) * 10) / 10);
    onChange(next);
  };

  const handleDirectChange = (e) => {
    const raw = e.target.value;
    if (raw === "") {
      onChange("");
      return;
    }
    const parsed = step < 1 ? parseFloat(raw) : parseInt(raw, 10);
    if (!isNaN(parsed)) {
      onChange(Math.min(max, Math.max(min, parsed)));
    }
  };

  return (
    <div className="stepper-form-group">
      <div className="d-flex align-items-center justify-content-between mb-1">
        <label htmlFor={id} className="settings-field-label">
          <span>{label}</span>
          {tooltip && (
            <span className="tooltip-trigger" title={tooltip}>
              <HelpCircle size={13} />
            </span>
          )}
        </label>
        {badgeText && <span className="settings-field-badge">{badgeText}</span>}
      </div>

      <div className="stepper-input-wrap">
        <button
          type="button"
          className="stepper-btn stepper-btn-dec"
          onClick={handleDecrement}
          disabled={disabled || numVal <= min}
          aria-label={`Decrease ${label}`}
        >
          –
        </button>
        <input
          id={id}
          type="number"
          min={min}
          max={max}
          step={step}
          className="stepper-input num-tabular"
          value={value}
          onChange={handleDirectChange}
          disabled={disabled}
        />
        <button
          type="button"
          className="stepper-btn stepper-btn-inc"
          onClick={handleIncrement}
          disabled={disabled || numVal >= max}
          aria-label={`Increase ${label}`}
        >
          +
        </button>
        {unit && <span className="stepper-unit-label">{unit}</span>}
      </div>
    </div>
  );
}

export function GameplayRulesSection({ formData, onChange, isSaving }) {
  // Convert time_limit_seconds to minutes & seconds
  const totalSec = formData.time_limit_seconds || 0;
  const isTimeUnlimited = totalSec === 0;
  const timeMinutes = Math.floor(totalSec / 60);
  const timeSeconds = totalSec % 60;

  const handleTimeChange = (mins, secs, unlimited = false) => {
    if (unlimited) {
      onChange("time_limit_seconds", 0);
    } else {
      const computed = Math.max(0, (parseInt(mins, 10) || 0) * 60 + (parseInt(secs, 10) || 0));
      onChange("time_limit_seconds", computed);
    }
  };

  // Daily word limit handling
  const isDailyUnlimited = formData.daily_word_limit === 0;

  // Difficulty options configured with User-Adaptive intelligence
  const difficultyOptions = [
    {
      value: "MEDIUM",
      label: "Adaptive Mixed",
      sub: "Auto-tunes difficulty dynamically based on player streak & win rate",
      icon: Sparkles,
      tag: "Recommended",
    },
    {
      value: "EASY",
      label: "Entry Level (Easy)",
      sub: "Standard common vocabulary for beginners",
      icon: Smile,
    },
    {
      value: "HARD",
      label: "Master Level (Hard)",
      sub: "Challenging vocabulary with rare letter combinations",
      icon: Zap,
    },
  ];

  // Only show 5-letter mode badge when both min and max are exactly 5
  const isStandardFiveLetter = formData.min_word_length === 5 && formData.max_word_length === 5;

  return (
    <div className="settings-card">
      <div className="settings-card-header">
        <div className="d-flex align-items-center gap-2">
          <div className="settings-header-icon-box">
            <Sliders size={18} />
          </div>
          <div>
            <h3 className="settings-card-title mb-0">Gameplay Rules</h3>
            <p className="settings-card-subtitle mb-0">
              Configure guess attempts, hint limits, word lengths, scoring multiplier, and timers
            </p>
          </div>
        </div>
      </div>

      <div className="settings-card-body">
        <div className="settings-two-column-grid">
          {/* 1. Maximum Attempts */}
          <NumberStepper
            id="max-attempts"
            label="Maximum Attempts"
            tooltip="Total permitted word guesses per game session before match is marked as lost."
            value={formData.max_attempts}
            onChange={(val) => onChange("max_attempts", val)}
            min={1}
            max={20}
            step={1}
            unit="attempts"
            disabled={isSaving}
            badgeText={formData.max_attempts === 5 ? "Default: 5" : null}
          />

          {/* 2. Maximum Hints */}
          <NumberStepper
            id="max-hints"
            label="Maximum Hints"
            tooltip="Permitted letter hints per match. Set to 0 to completely disable hints."
            value={formData.max_hints}
            onChange={(val) => onChange("max_hints", val)}
            min={0}
            max={10}
            step={1}
            unit="hints"
            disabled={isSaving}
            badgeText={formData.max_hints === 0 ? "Hints Disabled" : null}
          />

          {/* 3. Word Length Settings */}
          <div className="settings-field-box">
            <div className="d-flex align-items-center justify-content-between mb-2">
              <label className="settings-field-label mb-0">
                <span>Target Word Length</span>
                <span className="tooltip-trigger" title="Standard Wordle guessing uses 5-letter target words. Minimum and maximum thresholds govern word catalog selection.">
                  <HelpCircle size={13} />
                </span>
              </label>
              {isStandardFiveLetter && (
                <span className="badge bg-primary-subtle text-primary border border-primary-subtle font-medium">
                  5-Letter Mode Active
                </span>
              )}
            </div>

            <div className="row g-2">
              <div className="col-6">
                <NumberStepper
                  id="min-word-length"
                  label="Min Length"
                  value={formData.min_word_length}
                  onChange={(val) => onChange("min_word_length", val)}
                  min={2}
                  max={Math.min(50, formData.max_word_length || 50)}
                  step={1}
                  unit="letters"
                  disabled={isSaving}
                />
              </div>
              <div className="col-6">
                <NumberStepper
                  id="max-word-length"
                  label="Max Length"
                  value={formData.max_word_length}
                  onChange={(val) => onChange("max_word_length", val)}
                  min={Math.max(2, formData.min_word_length || 2)}
                  max={50}
                  step={1}
                  unit="letters"
                  disabled={isSaving}
                />
              </div>
            </div>
          </div>

          {/* 4. Scoring Multiplier */}
          <NumberStepper
            id="scoring-multiplier"
            label="Scoring Multiplier"
            tooltip="Base multiplier applied to points calculated upon solving target words."
            value={formData.scoring_multiplier}
            onChange={(val) => onChange("scoring_multiplier", val)}
            min={0.1}
            max={10.0}
            step={0.1}
            unit="x"
            disabled={isSaving}
          />

          {/* 5. Daily Word Limit */}
          <div className="settings-field-box">
            <div className="d-flex align-items-center justify-content-between mb-1">
              <label className="settings-field-label mb-0">
                <span>Daily Word Limit</span>
                <span className="tooltip-trigger" title="Maximum game sessions a single player can start per day.">
                  <HelpCircle size={13} />
                </span>
              </label>
            </div>

            <div className="d-flex align-items-center gap-2 mb-2">
              <button
                type="button"
                className={`btn-segmented-choice ${isDailyUnlimited ? "is-selected" : ""}`}
                onClick={() => onChange("daily_word_limit", 0)}
                disabled={isSaving}
              >
                <InfinityIcon size={14} />
                <span>Unlimited</span>
              </button>
              <button
                type="button"
                className={`btn-segmented-choice ${!isDailyUnlimited ? "is-selected" : ""}`}
                onClick={() => onChange("daily_word_limit", formData.daily_word_limit || 3)}
                disabled={isSaving}
              >
                <Hash size={14} />
                <span>Custom Limit</span>
              </button>
            </div>

            {!isDailyUnlimited && (
              <NumberStepper
                id="daily-word-limit-custom"
                label="Matches Per Day"
                value={formData.daily_word_limit || 3}
                onChange={(val) => onChange("daily_word_limit", val)}
                min={1}
                max={100}
                step={1}
                unit="matches/day"
                disabled={isSaving}
              />
            )}
          </div>

          {/* 6. Session Time Limit */}
          <div className="settings-field-box">
            <div className="d-flex align-items-center justify-content-between mb-1">
              <label className="settings-field-label mb-0">
                <span>Session Time Limit</span>
                <span className="tooltip-trigger" title="Countdown duration before an active match session expires.">
                  <HelpCircle size={13} />
                </span>
              </label>
              {isTimeUnlimited && (
                <span className="settings-field-badge">
                  Unlimited
                </span>
              )}
            </div>

            <div className="d-flex align-items-center gap-2 mb-2">
              <button
                type="button"
                className={`btn-segmented-choice ${isTimeUnlimited ? "is-selected" : ""}`}
                onClick={() => handleTimeChange(0, 0, true)}
                disabled={isSaving}
              >
                <InfinityIcon size={14} />
                <span>Unlimited Time</span>
              </button>
              <button
                type="button"
                className={`btn-segmented-choice ${!isTimeUnlimited ? "is-selected" : ""}`}
                onClick={() => handleTimeChange(timeMinutes || 50, timeSeconds, false)}
                disabled={isSaving}
              >
                <Clock size={14} />
                <span>Timed Match</span>
              </button>
            </div>

            {!isTimeUnlimited && (
              <div className="row g-2">
                <div className="col-6">
                  <NumberStepper
                    id="time-limit-mins"
                    label="Minutes"
                    value={timeMinutes}
                    onChange={(m) => handleTimeChange(m, timeSeconds, false)}
                    min={1}
                    max={180}
                    step={1}
                    unit="min"
                    disabled={isSaving}
                  />
                </div>
                <div className="col-6">
                  <NumberStepper
                    id="time-limit-secs"
                    label="Seconds"
                    value={timeSeconds}
                    onChange={(s) => handleTimeChange(timeMinutes, s, false)}
                    min={0}
                    max={59}
                    step={5}
                    unit="sec"
                    disabled={isSaving}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 7. Difficulty Mode Selection */}
        <div className="difficulty-mode-section mt-4 pt-3 border-top">
          <label className="settings-field-label mb-2">
            <span>Default Difficulty Mode</span>
            <span className="tooltip-trigger" title="Initial difficulty level for new game sessions. Controls word pool selection complexity.">
              <HelpCircle size={13} />
            </span>
          </label>

          <div className="difficulty-cards-grid">
            {difficultyOptions.map((opt) => {
              const isSelected = formData.default_difficulty === opt.value;
              const IconComponent = opt.icon;

              return (
                <button
                  key={opt.value}
                  type="button"
                  className={`difficulty-choice-card ${isSelected ? "is-selected" : ""}`}
                  onClick={() => onChange("default_difficulty", opt.value)}
                  disabled={isSaving}
                >
                  <div className="d-flex align-items-center justify-content-between mb-1">
                    <div className="d-flex align-items-center gap-2">
                      <IconComponent size={16} className={isSelected ? "text-primary" : "text-muted"} />
                      <span className="difficulty-card-title">{opt.label}</span>
                    </div>
                    {opt.tag && <span className="badge bg-primary-subtle text-primary border border-primary-subtle text-xs">{opt.tag}</span>}
                  </div>
                  <span className="difficulty-card-sub">{opt.sub}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
