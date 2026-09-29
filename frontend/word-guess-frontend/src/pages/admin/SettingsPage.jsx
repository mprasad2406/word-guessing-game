import React, { useEffect, useState, useMemo, useCallback } from "react";
import { toast } from "react-toastify";
import { AdminPageHeader } from "../../components/admin/AdminPageHeader";
import { PageLoader } from "../../components/common/PageLoader";
import { GameAvailabilityCard } from "../../components/admin/settings/GameAvailabilityCard";
import { GameplayRulesSection } from "../../components/admin/settings/GameplayRulesSection";
import { PlayerExperienceSection } from "../../components/admin/settings/PlayerExperienceSection";
import { SecuritySaveControlsSection } from "../../components/admin/settings/SecuritySaveControlsSection";
import { SecurityVerificationModal } from "../../components/admin/settings/SecurityVerificationModal";
import { SettingsStickyBar } from "../../components/admin/settings/SettingsStickyBar";
import { settingsService } from "../../services/settingsService";
import "./AdminSettings.css";

const CRITICAL_FIELDS = [
  "game_enabled",
  "max_attempts",
  "max_hints",
  "min_word_length",
  "max_word_length",
  "scoring_multiplier",
  "daily_word_limit",
  "time_limit_seconds",
  "default_difficulty",
];

const FIELD_LABELS = {
  game_enabled: "Game Availability",
  max_attempts: "Max Guess Attempts",
  min_word_length: "Min Word Length",
  max_word_length: "Max Word Length",
  scoring_multiplier: "Scoring Multiplier",
  daily_word_limit: "Daily Word Limit",
  default_difficulty: "Difficulty Mode",
  max_hints: "Max Hints",
  time_limit_seconds: "Time Limit",
  allow_repeated_guesses: "Allow Repeated Guesses",
  allow_word_reuse: "Allow Word Reuse",
};

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

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);

  // Security Verification Modal
  const [isVerificationModalOpen, setIsVerificationModalOpen] = useState(false);
  const [verificationError, setVerificationError] = useState(null);

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

  // Determine which fields have changed compared to initial
  const modifiedFields = useMemo(() => {
    if (!initialSettings) return [];
    return Object.keys(formData).filter((key) => {
      const currentVal = formData[key];
      const initialVal = initialSettings[key];
      return currentVal !== initialVal;
    });
  }, [formData, initialSettings]);

  const hasUnsavedChanges = modifiedFields.length > 0;

  // Check if any critical settings are modified
  const isCriticalModified = useMemo(() => {
    return modifiedFields.some((f) => CRITICAL_FIELDS.includes(f));
  }, [modifiedFields]);

  // List of modified critical fields with human labels
  const modifiedCriticalLabels = useMemo(() => {
    return modifiedFields
      .filter((f) => CRITICAL_FIELDS.includes(f))
      .map((f) => {
        const label = FIELD_LABELS[f] || f;
        const fromVal = initialSettings ? initialSettings[f] : "";
        const toVal = formData[f];
        if (f === "game_enabled") {
          return `${label}: ${fromVal ? "Enabled" : "Disabled"} → ${toVal ? "Enabled" : "Disabled"}`;
        }
        if (f === "daily_word_limit") {
          return `${label}: ${fromVal === 0 ? "Unlimited" : fromVal} → ${toVal === 0 ? "Unlimited" : toVal}`;
        }
        return `${label}: ${fromVal} → ${toVal}`;
      });
  }, [modifiedFields, initialSettings, formData]);

  // Client-side Validation Error Computation
  const validationError = useMemo(() => {
    if (formData.min_word_length > formData.max_word_length) {
      return "Min word length cannot exceed max word length.";
    }
    if (formData.max_attempts <= 0) {
      return "Max attempts must be at least 1.";
    }
    if (formData.scoring_multiplier <= 0) {
      return "Scoring multiplier must be greater than 0.";
    }
    if (formData.daily_word_limit < 0) {
      return "Daily word limit cannot be negative.";
    }
    if (formData.time_limit_seconds < 0) {
      return "Time limit cannot be negative.";
    }
    return null;
  }, [formData]);

  // Warn user before navigating away with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = "You have unsaved configuration changes. Are you sure you want to leave?";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasUnsavedChanges]);

  const handleFieldChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    if (error) setError(null);
    if (verificationError) setVerificationError(null);
  };

  const handleDiscardChanges = () => {
    if (!initialSettings) return;
    setFormData({
      game_enabled: initialSettings.game_enabled,
      max_attempts: initialSettings.max_attempts,
      min_word_length: initialSettings.min_word_length,
      max_word_length: initialSettings.max_word_length,
      default_difficulty: initialSettings.default_difficulty,
      max_hints: initialSettings.max_hints,
      time_limit_seconds: initialSettings.time_limit_seconds || 0,
      scoring_multiplier: initialSettings.scoring_multiplier,
      daily_word_limit: initialSettings.daily_word_limit !== undefined ? initialSettings.daily_word_limit : 3,
      allow_repeated_guesses: initialSettings.allow_repeated_guesses,
      allow_word_reuse: initialSettings.allow_word_reuse,
    });
    setError(null);
    setVerificationError(null);
    setIsVerificationModalOpen(false);
    toast.info("Unsaved changes discarded. Restored saved configuration.");
  };

  const executeSave = async (securityKey = null) => {
    setIsSaving(true);
    setError(null);
    setVerificationError(null);

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

      if (securityKey) {
        payload.security_key = securityKey;
      }

      const updated = await settingsService.updateGameSettings(payload);
      setInitialSettings(updated);
      setIsVerificationModalOpen(false);
      toast.success("Game settings saved successfully!");
    } catch (err) {
      const errMsg = err?.message || "Failed to update game configuration.";
      if (isVerificationModalOpen) {
        setVerificationError(errMsg);
      } else {
        setError(errMsg);
        toast.error(errMsg);
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleInitiateSave = () => {
    if (validationError) {
      toast.warning(validationError);
      return;
    }

    if (isCriticalModified) {
      setVerificationError(null);
      setIsVerificationModalOpen(true);
    } else {
      executeSave(null);
    }
  };

  if (isLoading) {
    return (
      <div className="container-fluid py-5 px-md-4">
        <PageLoader text="Loading game settings..." />
      </div>
    );
  }

  return (
    <div className="settings-page-container">
      {/* 1. Standard Admin Page Header */}
      <AdminPageHeader
        title="Game Settings"
        subtitle="Manage global gameplay parameters, difficulty defaults, and player constraints."
        breadcrumbItem="Settings"
      />

      {/* Global Error Banner */}
      {error && (
        <div className="alert-callout-error mb-2" role="alert">
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* 2. SECTION 1: Game Availability Card */}
      <GameAvailabilityCard
        isEnabled={formData.game_enabled}
        onChange={(val) => handleFieldChange("game_enabled", val)}
        isSaving={isSaving}
      />

      {/* 3. SECTION 2: Gameplay Rules */}
      <GameplayRulesSection
        formData={formData}
        onChange={handleFieldChange}
        isSaving={isSaving}
      />

      {/* 4. SECTION 3: Player Experience */}
      <PlayerExperienceSection
        formData={formData}
        onChange={handleFieldChange}
        isSaving={isSaving}
      />

      {/* 5. SECTION 4: Security & Save Controls */}
      <SecuritySaveControlsSection
        hasChanges={hasUnsavedChanges}
        isCriticalModified={isCriticalModified}
        onDiscard={handleDiscardChanges}
        onSave={handleInitiateSave}
        isSaving={isSaving}
        validationError={validationError}
        modifiedFieldsCount={modifiedFields.length}
      />

      {/* 6. Sticky Bottom Action Bar (Unsaved Changes & Quick Save) */}
      <SettingsStickyBar
        hasChanges={hasUnsavedChanges}
        isCriticalModified={isCriticalModified}
        onDiscard={handleDiscardChanges}
        onSave={handleInitiateSave}
        isSaving={isSaving}
        validationError={validationError}
      />

      {/* 6. Security Key Verification Modal */}
      <SecurityVerificationModal
        isOpen={isVerificationModalOpen}
        onClose={() => setIsVerificationModalOpen(false)}
        onConfirm={(key) => executeSave(key)}
        isSaving={isSaving}
        errorMessage={verificationError}
        modifiedFieldsList={modifiedCriticalLabels}
      />
    </div>
  );
}
