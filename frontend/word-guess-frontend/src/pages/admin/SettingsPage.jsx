import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { AdminPageHeader } from "../../components/admin/AdminPageHeader";
import { PageLoader } from "../../components/common/PageLoader";
import { settingsService } from "../../services/settingsService";

const CRITICAL_FIELDS = [
  "game_enabled",
  "max_attempts",
  "min_word_length",
  "max_word_length",
  "scoring_multiplier",
  "daily_word_limit",
];

export function SettingsPage() {
  const [initialSettings, setInitialSettings] = useState(null);
  const [formData, setFormData] = useState({
    game_enabled: true,
    max_attempts: 5,
    min_word_length: 4,
    max_word_length: 8,
    default_difficulty: "MEDIUM",
    max_hints: 2,
    time_limit_seconds: 0,
    scoring_multiplier: 1.0,
    daily_word_limit: 3,
    allow_repeated_guesses: false,
    allow_word_reuse: false,
  });

  const [securityKey, setSecurityKey] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);

  const loadSettings = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const settings = await settingsService.getGameSettings();
      setInitialSettings(settings);
      setFormData({
        game_enabled: settings.game_enabled,
        max_attempts: settings.max_attempts,
        min_word_length: settings.min_word_length,
        max_word_length: settings.max_word_length,
        default_difficulty: settings.default_difficulty,
        max_hints: settings.max_hints,
        time_limit_seconds: settings.time_limit_seconds || 0,
        scoring_multiplier: settings.scoring_multiplier,
        daily_word_limit: settings.daily_word_limit !== undefined ? settings.daily_word_limit : 3,
        allow_repeated_guesses: settings.allow_repeated_guesses,
        allow_word_reuse: settings.allow_word_reuse,
      });
      setSecurityKey("");
    } catch (err) {
      console.error("Failed to load settings:", err);
      setError(err?.message || "Failed to load game configuration settings.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  // Determine if critical fields have been modified compared to initial
  const isCriticalModified = () => {
    if (!initialSettings) return false;
    return CRITICAL_FIELDS.some(
      (field) => formData[field] !== initialSettings[field]
    );
  };

  const hasUnsavedChanges = () => {
    if (!initialSettings) return false;
    return Object.keys(formData).some(
      (key) => formData[key] !== (initialSettings[key] ?? 0)
    );
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    if (error) setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // Frontend Range Validations matching backend
    if (formData.min_word_length > formData.max_word_length) {
      setError("Minimum word length cannot exceed maximum word length.");
      return;
    }

    if (formData.max_attempts <= 0) {
      setError("Maximum attempts must be greater than 0.");
      return;
    }

    if (formData.scoring_multiplier <= 0) {
      setError("Scoring multiplier must be greater than 0.");
      return;
    }

    if (formData.daily_word_limit < 0) {
      setError("Daily word limit must be 0 or greater (0 = infinite).");
      return;
    }

    const modifiesCritical = isCriticalModified();
    if (modifiesCritical && !securityKey.trim()) {
      setError(
        "Modifying critical settings (Game toggle, daily limit, attempts, word lengths, or scoring) requires your Admin Security Key."
      );
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        game_enabled: formData.game_enabled,
        max_attempts: Number(formData.max_attempts),
        min_word_length: Number(formData.min_word_length),
        max_word_length: Number(formData.max_word_length),
        default_difficulty: formData.default_difficulty,
        max_hints: Number(formData.max_hints),
        time_limit_seconds:
          Number(formData.time_limit_seconds) > 0
            ? Number(formData.time_limit_seconds)
            : null,
        scoring_multiplier: Number(formData.scoring_multiplier),
        daily_word_limit: Number(formData.daily_word_limit) || 0,
        allow_repeated_guesses: Boolean(formData.allow_repeated_guesses),
        allow_word_reuse: Boolean(formData.allow_word_reuse),
      };

      if (securityKey.trim()) {
        payload.security_key = securityKey.trim();
      }

      await settingsService.updateGameSettings(payload);
      toast.success("Game settings updated successfully!");
      await loadSettings();
    } catch (err) {
      const errMsg = err?.message || "Failed to update game settings.";
      setError(errMsg);
      toast.error(errMsg);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container-fluid py-5 px-md-4">
        <PageLoader text="Loading game settings..." />
      </div>
    );
  }

  const criticalChanged = isCriticalModified();

  return (
    <div className="container-fluid py-4 px-md-4" style={{ maxWidth: "1000px" }}>
      <AdminPageHeader
        title="Game Settings"
        subtitle="Configure core gameplay parameters, word selection limits, difficulty defaults, and security policies."
        breadcrumbItem="Settings"
      />

      {/* Error Alert */}
      {error && (
        <div className="alert alert-danger d-flex align-items-center gap-2 mb-4" role="alert">
          <i className="bi bi-exclamation-triangle-fill fs-5"></i>
          <div>{error}</div>
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate>
        {/* Global Game Status Toggle */}
        <div className="card shadow-sm border-0 rounded-4 mb-4">
          <div className="card-body p-4">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <h5 className="fw-bold mb-1 d-flex align-items-center gap-2">
                  <i className="bi bi-power text-primary"></i>
                  <span>Global Game Status</span>
                </h5>
                <p className="text-muted small mb-0">
                  Enable or disable player game creation across the entire application.
                </p>
              </div>
              <div className="form-check form-switch fs-4 mb-0">
                <input
                  className="form-check-input"
                  type="checkbox"
                  role="switch"
                  id="game-enabled-switch"
                  checked={formData.game_enabled}
                  onChange={(e) => handleInputChange("game_enabled", e.target.checked)}
                  disabled={isSaving}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Core Game Parameters */}
        <div className="card shadow-sm border-0 rounded-4 mb-4">
          <div className="card-header bg-white py-3 border-0">
            <h5 className="fw-semibold mb-0 d-flex align-items-center gap-2">
              <i className="bi bi-sliders text-primary"></i>
              <span>Gameplay Rules & Constraints</span>
            </h5>
          </div>
          <div className="card-body pt-0 px-4 pb-4">
            <div className="row g-3">
              {/* Max Attempts */}
              <div className="col-md-6">
                <label htmlFor="max-attempts" className="form-label small fw-semibold text-secondary">
                  Max Guess Attempts <span className="text-danger">*</span>
                </label>
                <input
                  id="max-attempts"
                  type="number"
                  min="1"
                  max="20"
                  className="form-control"
                  value={formData.max_attempts}
                  onChange={(e) => handleInputChange("max_attempts", parseInt(e.target.value) || "")}
                  disabled={isSaving}
                  required
                />
                <div className="form-text small">Number of wrong word guesses allowed per game session.</div>
              </div>

              {/* Max Hints */}
              <div className="col-md-6">
                <label htmlFor="max-hints" className="form-label small fw-semibold text-secondary">
                  Max Hints Allowed
                </label>
                <input
                  id="max-hints"
                  type="number"
                  min="0"
                  max="10"
                  className="form-control"
                  value={formData.max_hints}
                  onChange={(e) => handleInputChange("max_hints", parseInt(e.target.value) || 0)}
                  disabled={isSaving}
                />
                <div className="form-text small">Maximum hint requests permitted per game (0 to disable).</div>
              </div>

              {/* Min Word Length */}
              <div className="col-md-6">
                <label htmlFor="min-word-length" className="form-label small fw-semibold text-secondary">
                  Min Word Length <span className="text-danger">*</span>
                </label>
                <input
                  id="min-word-length"
                  type="number"
                  min="2"
                  max="50"
                  className="form-control"
                  value={formData.min_word_length}
                  onChange={(e) => handleInputChange("min_word_length", parseInt(e.target.value) || "")}
                  disabled={isSaving}
                  required
                />
                <div className="form-text small">Minimum length of words eligible for gameplay.</div>
              </div>

              {/* Max Word Length */}
              <div className="col-md-6">
                <label htmlFor="max-word-length" className="form-label small fw-semibold text-secondary">
                  Max Word Length <span className="text-danger">*</span>
                </label>
                <input
                  id="max-word-length"
                  type="number"
                  min="2"
                  max="50"
                  className="form-control"
                  value={formData.max_word_length}
                  onChange={(e) => handleInputChange("max_word_length", parseInt(e.target.value) || "")}
                  disabled={isSaving}
                  required
                />
                <div className="form-text small">Maximum length of words eligible for gameplay.</div>
              </div>

              {/* Difficulty Mode (Adaptive Mixed Default) */}
              <div className="col-md-6">
                <label className="form-label small fw-semibold text-secondary">
                  Difficulty Mode
                </label>
                <div className="p-2 border rounded bg-light d-flex align-items-center justify-content-between">
                  <div>
                    <span className="badge bg-primary-subtle text-primary border border-primary-subtle me-2">
                      <i className="bi bi-cpu-fill me-1"></i> Adaptive Mixed (Default)
                    </span>
                    <span className="small text-muted">Auto-tunes per player</span>
                  </div>
                  <span className="badge bg-success">Active</span>
                </div>
                <div className="form-text small">
                  Scales between Easy, Medium, and Hard based on user performance & win streaks.
                </div>
              </div>

              {/* Scoring Multiplier */}
              <div className="col-md-6">
                <label htmlFor="scoring-multiplier" className="form-label small fw-semibold text-secondary">
                  Scoring Multiplier <span className="text-danger">*</span>
                </label>
                <input
                  id="scoring-multiplier"
                  type="number"
                  step="0.1"
                  min="0.1"
                  max="10.0"
                  className="form-control"
                  value={formData.scoring_multiplier}
                  onChange={(e) => handleInputChange("scoring_multiplier", parseFloat(e.target.value) || "")}
                  disabled={isSaving}
                  required
                />
                <div className="form-text small">Base score calculation multiplier (e.g. 1.0).</div>
              </div>

              {/* Daily Word Limit */}
              <div className="col-md-6">
                <label htmlFor="daily-word-limit" className="form-label small fw-semibold text-secondary">
                  Daily Word Limit per Player
                </label>
                <input
                  id="daily-word-limit"
                  type="number"
                  min="0"
                  max="100"
                  className="form-control"
                  value={formData.daily_word_limit}
                  onChange={(e) => handleInputChange("daily_word_limit", parseInt(e.target.value) || 0)}
                  disabled={isSaving}
                />
                <div className="form-text small">
                  Max words a player can guess per day. Set to <strong>0</strong> for unlimited / infinite words.
                </div>
              </div>

              {/* Time Limit Seconds */}
              <div className="col-md-6">
                <label htmlFor="time-limit" className="form-label small fw-semibold text-secondary">
                  Time Limit (Seconds)
                </label>
                <input
                  id="time-limit"
                  type="number"
                  min="0"
                  max="3600"
                  className="form-control"
                  value={formData.time_limit_seconds}
                  onChange={(e) => handleInputChange("time_limit_seconds", parseInt(e.target.value) || 0)}
                  disabled={isSaving}
                />
                <div className="form-text small">Session expiration timeout in seconds. Set to 0 for unlimited time.</div>
              </div>
            </div>
          </div>
        </div>

        {/* Gameplay Feature Toggles */}
        <div className="card shadow-sm border-0 rounded-4 mb-4">
          <div className="card-header bg-white py-3 border-0">
            <h5 className="fw-semibold mb-0 d-flex align-items-center gap-2">
              <i className="bi bi-toggle2-on text-primary"></i>
              <span>Player Experience Toggles</span>
            </h5>
          </div>
          <div className="card-body pt-0 px-4 pb-4">
            <div className="d-flex flex-column gap-3">
              <div className="form-check form-switch">
                <input
                  className="form-check-input"
                  type="checkbox"
                  role="switch"
                  id="allow-repeated-switch"
                  checked={formData.allow_repeated_guesses}
                  onChange={(e) => handleInputChange("allow_repeated_guesses", e.target.checked)}
                  disabled={isSaving}
                />
                <label className="form-check-label fw-semibold text-secondary" htmlFor="allow-repeated-switch">
                  Allow Repeated Guesses
                </label>
                <div className="text-muted small">
                  If enabled, players can re-submit the same incorrect word without restriction. If disabled, duplicate guesses are rejected.
                </div>
              </div>

              <div className="form-check form-switch border-top pt-3">
                <input
                  className="form-check-input"
                  type="checkbox"
                  role="switch"
                  id="allow-reuse-switch"
                  checked={formData.allow_word_reuse}
                  onChange={(e) => handleInputChange("allow_word_reuse", e.target.checked)}
                  disabled={isSaving}
                />
                <label className="form-check-label fw-semibold text-secondary" htmlFor="allow-reuse-switch">
                  Allow Word Reuse Across Games
                </label>
                <div className="text-muted small">
                  If enabled, words previously played by a user may be selected again in future games.
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Security Key Section (Revealed when modifying critical settings) */}
        {criticalChanged && (
          <div className="card shadow-sm border-danger border-2 rounded-4 mb-4 bg-danger bg-opacity-10">
            <div className="card-body p-4">
              <h5 className="fw-bold text-danger d-flex align-items-center gap-2 mb-2">
                <i className="bi bi-shield-lock-fill"></i>
                <span>Admin Security Key Required</span>
              </h5>
              <p className="small text-secondary mb-3">
                You are modifying critical game settings (Game status, daily word limit, attempts, word lengths, or scoring multiplier). Please enter your Admin Security Key to authorize this change.
              </p>
              <div className="row">
                <div className="col-md-6">
                  <input
                    type="password"
                    className="form-control"
                    placeholder="Enter admin security key"
                    value={securityKey}
                    onChange={(e) => setSecurityKey(e.target.value)}
                    disabled={isSaving}
                    autoComplete="off"
                    required
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Action Controls */}
        <div className="d-flex justify-content-end gap-3 mb-5">
          <button
            type="button"
            className="btn btn-outline-secondary px-4"
            onClick={loadSettings}
            disabled={isSaving || !hasUnsavedChanges()}
          >
            Reset Changes
          </button>
          <button
            type="submit"
            className="btn btn-primary px-5 py-2 fw-semibold d-inline-flex align-items-center gap-2 shadow-sm"
            disabled={isSaving || !hasUnsavedChanges()}
          >
            {isSaving ? (
              <>
                <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                <span>Saving Settings...</span>
              </>
            ) : (
              <>
                <i className="bi bi-check2-circle fs-5"></i>
                <span>Save Configuration</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
