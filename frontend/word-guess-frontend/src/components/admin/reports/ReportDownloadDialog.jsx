import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import {
  FileText,
  Download,
  Calendar,
  User,
  X,
  Loader2,
  BarChart2,
  CheckCircle2,
} from "lucide-react";
import { adminReportService } from "../../../services/adminReportService";

export function ReportDownloadDialog({
  isOpen,
  onClose,
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

  // Sync state whenever modal opens or props change
  useEffect(() => {
    if (isOpen) {
      setReportType(initialReportType === "users" ? "player" : initialReportType);
      setPreset(initialPreset || "7D");
      setCustomStart(initialStartDate || "");
      setCustomEnd(initialEndDate || "");

      if (initialPlayerId && initialPlayerId !== "ALL") {
        setSelectedPlayer(String(initialPlayerId));
      } else if (userOptions.length > 0) {
        setSelectedPlayer(String(userOptions[0].id));
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

    setIsGenerating(true);
    try {
      let downloadedFilename = "";
      if (reportType === "daily") {
        downloadedFilename = await adminReportService.downloadDailyPdfReport({
          date: targetDate,
          startDate,
          endDate,
        });
      } else {
        downloadedFilename = await adminReportService.downloadPlayerPdfReport({
          player: selectedPlayer,
          date: targetDate,
          startDate,
          endDate,
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
      <div className="report-modal-dialog">
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
                Generate official, print-ready analytical documents
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
                      <span className="report-type-name">Daily Overview</span>
                    </div>
                    {reportType === "daily" && <CheckCircle2 size={14} className="text-primary" />}
                  </div>
                  <span className="report-type-desc">
                    Daily games played, active players, win rates & trend chart
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
                      <span className="report-type-name">Player Performance</span>
                    </div>
                    {reportType === "player" && <CheckCircle2 size={14} className="text-primary" />}
                  </div>
                  <span className="report-type-desc">
                    Individual player performance, words tried & date-wise stats
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
                { label: "Custom", value: "CUSTOM" },
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
                  />
                </div>
              </div>
            )}
          </div>

          {/* Modal Footer */}
          <div className="report-modal-footer">
            <button
              type="button"
              className="btn-modal-cancel"
              onClick={onClose}
              disabled={isGenerating}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="btn-modal-submit"
              disabled={isGenerating || (reportType === "player" && !selectedPlayer)}
            >
              {isGenerating ? (
                <>
                  <Loader2 size={15} className="spin-icon" />
                  <span>Generating PDF...</span>
                </>
              ) : (
                <>
                  <Download size={15} />
                  <span>Generate & Download PDF</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
