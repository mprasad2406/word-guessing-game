import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import {
  FileText,
  Download,
  User,
  X,
  Loader2,
  BarChart2,
  CheckCircle2,
  Lock,
  Eye,
  EyeOff,
  KeyRound,
  Copy,
  Check,
  ShieldCheck,
  Layers,
} from "lucide-react";
import { adminReportService } from "../../../services/adminReportService";

/**
 * Helper to generate a random 12-character strong alphanumeric password
 */
function generateRandomPassword() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%&*";
  let result = "";
  for (let i = 0; i < 12; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export function ReportDownloadDialog({
  isOpen,
  onClose,
  onPreview,
  initialReportType = "daily", // "daily" | "player"
  initialPreset = "7D",
  initialStartDate = "",
  initialEndDate = "",
  initialPlayerId = "",
  userOptions = [],
}) {
  const [reportType, setReportType] = useState(initialReportType);
  const [preset, setPreset] = useState(initialPreset);
  const [customStart, setCustomStart] = useState(initialStartDate || "");
  const [customEnd, setCustomEnd] = useState(initialEndDate || "");
  const [selectedPlayer, setSelectedPlayer] = useState(initialPlayerId || "");
  const [isGenerating, setIsGenerating] = useState(false);

  // Granularity & Scope
  const [isSummaryOnly, setIsSummaryOnly] = useState(false);

  // Password Protection & Encryption
  const [isPasswordProtected, setIsPasswordProtected] = useState(false);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [copied, setCopied] = useState(false);

  // Sync state whenever modal opens or props change
  useEffect(() => {
    if (isOpen) {
      setReportType(initialReportType === "users" ? "player" : initialReportType);
      setPreset(initialPreset || "7D");
      setCustomStart(initialStartDate || "");
      setCustomEnd(initialEndDate || "");
      setIsSummaryOnly(false);
      setIsPasswordProtected(false);
      setPassword("");
      setShowPassword(false);
      setCopied(false);

      if (initialPlayerId && initialPlayerId !== "ALL") {
        setSelectedPlayer(String(initialPlayerId));
      } else if (userOptions.length > 0) {
        setSelectedPlayer(String(userOptions[0].username || userOptions[0].id));
      }
    }
  }, [isOpen, initialReportType, initialPreset, initialStartDate, initialEndDate, initialPlayerId, userOptions]);

  if (!isOpen) return null;

  const handlePresetSelect = (selectedPreset) => {
    setPreset(selectedPreset);
    const today = new Date().toISOString().slice(0, 10);

    if (selectedPreset === "TODAY") {
      setCustomStart(today);
      setCustomEnd(today);
    } else if (selectedPreset === "7D") {
      const d = new Date();
      d.setDate(d.getDate() - 7);
      setCustomStart(d.toISOString().slice(0, 10));
      setCustomEnd(today);
    } else if (selectedPreset === "30D") {
      const d = new Date();
      d.setDate(d.getDate() - 30);
      setCustomStart(d.toISOString().slice(0, 10));
      setCustomEnd(today);
    } else if (selectedPreset === "ALL") {
      setCustomStart("");
      setCustomEnd("");
    }
  };

  const handleGeneratePassword = () => {
    const newPass = generateRandomPassword();
    setPassword(newPass);
    setShowPassword(true);
    toast.info("Generated a 12-character strong document password.");
  };

  const handleCopyPassword = () => {
    if (!password) return;
    navigator.clipboard.writeText(password);
    setCopied(true);
    toast.success("Document password copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleGenerateAndDownload = async (e) => {
    e.preventDefault();

    let startDate = null;
    let endDate = null;
    let targetDate = null;
    const today = new Date().toISOString().slice(0, 10);

    if (preset === "TODAY") {
      targetDate = today;
    } else if (preset === "7D") {
      const d = new Date();
      d.setDate(d.getDate() - 7);
      startDate = d.toISOString().slice(0, 10);
      endDate = today;
    } else if (preset === "30D") {
      const d = new Date();
      d.setDate(d.getDate() - 30);
      startDate = d.toISOString().slice(0, 10);
      endDate = today;
    } else if (preset === "CUSTOM") {
      if (customStart && customEnd && customStart > customEnd) {
        toast.warning("Start date cannot be after end date.");
        return;
      }
      startDate = customStart || null;
      endDate = customEnd || null;
    } else if (preset === "ALL") {
      startDate = null;
      endDate = null;
    }

    if (reportType === "player" && !selectedPlayer) {
      toast.warning("Please select a player for the player report.");
      return;
    }

    if (isPasswordProtected && (!password || password.trim().length < 4)) {
      toast.warning("Please enter a document password with at least 4 characters or generate one.");
      return;
    }

    setIsGenerating(true);
    try {
      let downloadedFilename = "";
      const exportOptions = {
        date: targetDate,
        startDate,
        endDate,
        summaryOnly: isSummaryOnly,
        password: isPasswordProtected ? password.trim() : null,
      };

      if (reportType === "daily") {
        downloadedFilename = await adminReportService.downloadDailyPdfReport(exportOptions);
      } else {
        downloadedFilename = await adminReportService.downloadPlayerPdfReport({
          player: selectedPlayer,
          ...exportOptions,
        });
      }

      toast.success(`Report downloaded successfully: ${downloadedFilename}`);
      onClose();
    } catch (err) {
      console.error("PDF Generation error:", err);
      toast.error(err?.message || "Failed to generate and download PDF report.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="report-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="report-modal-title">
      <div className="report-modal-dialog report-modal-dialog-wide">
        {/* Modal Header */}
        <div className="report-modal-header">
          <div className="d-flex align-items-center gap-2">
            <div className="report-modal-icon-box">
              <FileText size={18} />
            </div>
            <div>
              <h2 id="report-modal-title" className="report-modal-title">
                Export Analytical PDF Report
              </h2>
              <p className="report-modal-subtitle">
                Generate official, multi-page analytical documents with actual database records
              </p>
            </div>
          </div>
          <button
            type="button"
            className="report-modal-close-btn"
            onClick={onClose}
            disabled={isGenerating}
            aria-label="Close dialog"
          >
            <X size={16} />
          </button>
        </div>

        {/* Modal Form Body */}
        <form onSubmit={handleGenerateAndDownload} className="report-modal-body">
          {/* 1. Report Type Selection */}
          <div className="report-form-group">
            <label className="report-form-label">Report Type</label>
            <div className="report-type-cards">
              <label
                className={`report-type-card ${reportType === "daily" ? "is-selected" : ""}`}
              >
                <input
                  type="radio"
                  name="reportType"
                  value="daily"
                  checked={reportType === "daily"}
                  onChange={() => setReportType("daily")}
                  className="visually-hidden"
                />
                <div className="report-type-card-content">
                  <div className="d-flex align-items-center justify-content-between mb-1">
                    <div className="d-flex align-items-center gap-2">
                      <BarChart2 size={15} className="text-primary" />
                      <span className="report-type-name">Daily Gameplay & Activity</span>
                    </div>
                    {reportType === "daily" && <CheckCircle2 size={14} className="text-primary" />}
                  </div>
                  <span className="report-type-desc">
                    Daily breakdown, player participation, word statistics & full session logs
                  </span>
                </div>
              </label>

              <label
                className={`report-type-card ${reportType === "player" ? "is-selected" : ""}`}
              >
                <input
                  type="radio"
                  name="reportType"
                  value="player"
                  checked={reportType === "player"}
                  onChange={() => setReportType("player")}
                  className="visually-hidden"
                />
                <div className="report-type-card-content">
                  <div className="d-flex align-items-center justify-content-between mb-1">
                    <div className="d-flex align-items-center gap-2">
                      <User size={15} className="text-primary" />
                      <span className="report-type-name">Complete Player Dossier</span>
                    </div>
                    {reportType === "player" && <CheckCircle2 size={14} className="text-primary" />}
                  </div>
                  <span className="report-type-desc">
                    Lifetime profile, attempts distribution & chronological Wordle tile matches
                  </span>
                </div>
              </label>
            </div>
          </div>

          {/* 2. Player Selection (Conditional on Player Report) */}
          {reportType === "player" && (
            <div className="report-form-group">
              <label htmlFor="report-player-select" className="report-form-label">
                Target Player
              </label>
              <select
                id="report-player-select"
                className="report-select-input"
                value={selectedPlayer}
                onChange={(e) => setSelectedPlayer(e.target.value)}
                required
              >
                {userOptions.length === 0 ? (
                  <option value="">No players found</option>
                ) : (
                  userOptions.map((u) => (
                    <option key={u.id} value={u.username}>
                      {u.username} ({u.role})
                    </option>
                  ))
                )}
              </select>
            </div>
          )}

          {/* 3. Reporting Period / Date Range */}
          <div className="report-form-group">
            <label className="report-form-label">Reporting Period</label>
            <div className="report-preset-buttons">
              {[
                { label: "Today", value: "TODAY" },
                { label: "Last 7 Days", value: "7D" },
                { label: "Last 30 Days", value: "30D" },
                { label: "All Time", value: "ALL" },
                { label: "Custom Range", value: "CUSTOM" },
              ].map((p) => (
                <button
                  key={p.value}
                  type="button"
                  className={`report-preset-btn ${preset === p.value ? "is-active" : ""}`}
                  onClick={() => handlePresetSelect(p.value)}
                >
                  {p.label}
                </button>
              ))}
            </div>

            {/* Custom Range Inputs */}
            {preset === "CUSTOM" && (
              <div className="report-custom-date-row mt-2">
                <div className="flex-1">
                  <label htmlFor="report-start-date" className="report-sub-label">Start Date</label>
                  <input
                    id="report-start-date"
                    type="date"
                    className="report-date-input w-100"
                    value={customStart}
                    onChange={(e) => setCustomStart(e.target.value)}
                    required
                  />
                </div>
                <div className="flex-1">
                  <label htmlFor="report-end-date" className="report-sub-label">End Date</label>
                  <input
                    id="report-end-date"
                    type="date"
                    className="report-date-input w-100"
                    value={customEnd}
                    onChange={(e) => setCustomEnd(e.target.value)}
                    required
                  />
                </div>
              </div>
            )}
          </div>

          {/* 4. Report Scope & Detail Options */}
          <div className="report-form-group">
            <label className="report-form-label">Report Detail Level</label>
            <div className="d-flex align-items-center gap-3">
              <label className="radio-option-label">
                <input
                  type="radio"
                  name="reportScope"
                  checked={!isSummaryOnly}
                  onChange={() => setIsSummaryOnly(false)}
                />
                <span className="ms-2 font-medium">Comprehensive (Full Logs & Distributions)</span>
              </label>

              <label className="radio-option-label">
                <input
                  type="radio"
                  name="reportScope"
                  checked={isSummaryOnly}
                  onChange={() => setIsSummaryOnly(true)}
                />
                <span className="ms-2 font-medium">Summary Only (Compact Overview)</span>
              </label>
            </div>
          </div>

          {/* 5. Document Security & AES Encryption */}
          <div className="report-form-group border-top pt-3">
            <div className="d-flex align-items-center justify-content-between mb-2">
              <div className="d-flex align-items-center gap-2">
                <Lock size={15} className="text-secondary" />
                <label className="report-form-label mb-0">Password Protection & AES Encryption</label>
              </div>
              <label className="switch-control" title="Enable password protection">
                <input
                  type="checkbox"
                  checked={isPasswordProtected}
                  onChange={(e) => setIsPasswordProtected(e.target.checked)}
                  aria-label="Toggle document password protection"
                />
                <span className="switch-slider" />
              </label>
            </div>

            {isPasswordProtected && (
              <div className="password-protect-box">
                <div className="d-flex align-items-center gap-2 mb-2">
                  <div className="password-input-wrap flex-1">
                    <input
                      type={showPassword ? "text" : "password"}
                      className="password-input"
                      placeholder="Enter document password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required={isPasswordProtected}
                    />
                    <button
                      type="button"
                      className="password-toggle-btn"
                      onClick={() => setShowPassword(!showPassword)}
                      title={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>

                  <button
                    type="button"
                    className="btn-password-action"
                    onClick={handleGeneratePassword}
                    title="Generate secure 12-character random password"
                  >
                    <KeyRound size={13} />
                    <span>Generate</span>
                  </button>

                  <button
                    type="button"
                    className="btn-password-action"
                    onClick={handleCopyPassword}
                    disabled={!password}
                    title="Copy password to clipboard"
                  >
                    {copied ? <Check size={13} className="text-success" /> : <Copy size={13} />}
                    <span>{copied ? "Copied" : "Copy"}</span>
                  </button>
                </div>

                <p className="password-security-notice mb-0">
                  <ShieldCheck size={13} />
                  <span>Document is encrypted with AES-256 before delivery. The password is never logged or stored.</span>
                </p>
              </div>
            )}
          </div>

          {/* Modal Footer */}
          <div className="report-modal-footer" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <button
              type="button"
              className="btn-modal-cancel"
              onClick={onClose}
              disabled={isGenerating}
            >
              Cancel
            </button>

            <div style={{ display: "flex", gap: "8px" }}>
              {onPreview && (
                <button
                  type="button"
                  className="btn btn-outline-primary btn-sm"
                  onClick={() => {
                    let startDate = null;
                    let endDate = null;
                    let targetDate = null;
                    const today = new Date().toISOString().slice(0, 10);

                    if (preset === "TODAY") {
                      targetDate = today;
                    } else if (preset === "7D") {
                      const d = new Date();
                      d.setDate(d.getDate() - 7);
                      startDate = d.toISOString().slice(0, 10);
                      endDate = today;
                    } else if (preset === "30D") {
                      const d = new Date();
                      d.setDate(d.getDate() - 30);
                      startDate = d.toISOString().slice(0, 10);
                      endDate = today;
                    } else if (preset === "CUSTOM") {
                      startDate = customStart || null;
                      endDate = customEnd || null;
                    }

                    onPreview({
                      reportType,
                      reportParams: {
                        player: selectedPlayer,
                        date: targetDate,
                        startDate,
                        endDate,
                        summaryOnly: isSummaryOnly,
                        password: isPasswordProtected ? password.trim() : null,
                      },
                    });
                  }}
                  disabled={isGenerating || (reportType === "player" && !selectedPlayer)}
                  style={{ display: "flex", alignItems: "center", gap: "6px", fontWeight: 600, padding: "8px 14px", borderRadius: "6px" }}
                >
                  <Eye size={15} />
                  <span>Preview Report</span>
                </button>
              )}

              <button
                type="submit"
                className="btn-modal-submit"
                disabled={isGenerating || (reportType === "player" && !selectedPlayer)}
              >
                {isGenerating ? (
                  <>
                    <Loader2 size={15} className="spin-icon" />
                    <span>Compiling & Generating PDF...</span>
                  </>
                ) : (
                  <>
                    <Download size={15} />
                    <span>Generate & Download PDF</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
