import React, { useState, useEffect } from "react";
import {
  X,
  Printer,
  Download,
  Loader2,
  ZoomIn,
  ZoomOut,
  RefreshCw,
  FileText,
  AlertTriangle,
} from "lucide-react";
import { toast } from "react-toastify";
import { adminReportService } from "../../../services/adminReportService";
import { DailyReport } from "./pdf/DailyReport";
import { UserReport } from "./pdf/UserReport";
import "./pdf/styles/report-print.css";

export function ReportPreviewModal({
  isOpen,
  onClose,
  reportType = "daily", // "daily" | "player"
  reportParams = {},
}) {
  const [isLoading, setIsLoading] = useState(true);
  const [reportData, setReportData] = useState(null);
  const [error, setError] = useState(null);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [isDownloading, setIsDownloading] = useState(false);

  // Fetch report dataset whenever modal opens or params change
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    async function fetchReportData() {
      setIsLoading(true);
      setError(null);
      try {
        let res;
        if (reportType === "player" || reportType === "users") {
          if (!reportParams.player) {
            throw new Error("Please select a player to preview the report.");
          }
          res = await adminReportService.getPlayerReportData({
            player: reportParams.player,
            date: reportParams.date,
            startDate: reportParams.startDate,
            endDate: reportParams.endDate,
            summaryOnly: reportParams.summaryOnly,
          });
        } else {
          res = await adminReportService.getDailyReportData({
            date: reportParams.date,
            startDate: reportParams.startDate,
            endDate: reportParams.endDate,
            summaryOnly: reportParams.summaryOnly,
          });
        }

        if (isMounted) {
          if (res?.data) {
            setReportData(res.data);
          } else if (res) {
            setReportData(res);
          }
        }
      } catch (err) {
        if (isMounted) {
          console.error("Error fetching report data for preview:", err);
          setError(err.message || "Failed to load report data.");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    fetchReportData();
    return () => {
      isMounted = false;
    };
  }, [isOpen, reportType, reportParams]);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = async () => {
    try {
      setIsDownloading(true);
      let filename = "";
      if (reportType === "player" || reportType === "users") {
        filename = await adminReportService.downloadPlayerPdfReport({
          player: reportParams.player,
          date: reportParams.date,
          startDate: reportParams.startDate,
          endDate: reportParams.endDate,
          summaryOnly: reportParams.summaryOnly,
          password: reportParams.password || null,
        });
      } else {
        filename = await adminReportService.downloadDailyPdfReport({
          date: reportParams.date,
          startDate: reportParams.startDate,
          endDate: reportParams.endDate,
          summaryOnly: reportParams.summaryOnly,
          password: reportParams.password || null,
        });
      }
      toast.success(`Report downloaded successfully: ${filename}`);
    } catch (err) {
      toast.error(err.message || "Failed to download PDF report.");
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div
      className="report-preview-backdrop"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(15, 23, 42, 0.8)",
        backdropFilter: "blur(4px)",
        zIndex: 9999,
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Top Action Toolbar (Hidden in Print) */}
      <div
        className="no-print"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          backgroundColor: "#0f172a",
          borderBottom: "1px solid #334155",
          padding: "10px 20px",
          color: "#ffffff",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <FileText size={20} color="#38bdf8" />
          <span style={{ fontWeight: 700, fontSize: "14px" }}>
            Report Preview:{" "}
            {reportType === "player" || reportType === "users"
              ? `Player Dossier (${reportParams.player})`
              : "Daily Gameplay Analytics"}
          </span>
          {reportData?.period?.label && (
            <span
              style={{
                backgroundColor: "#1e293b",
                border: "1px solid #334155",
                padding: "2px 8px",
                borderRadius: "4px",
                fontSize: "11px",
                color: "#94a3b8",
              }}
            >
              {reportData.period.label}
            </span>
          )}
        </div>

        {/* Toolbar Center: Zoom Controls */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <button
            type="button"
            className="btn btn-sm btn-outline-secondary text-white"
            onClick={() => setZoomLevel((z) => Math.max(50, z - 15))}
            disabled={zoomLevel <= 50}
            title="Zoom Out"
            style={{ padding: "4px 8px" }}
          >
            <ZoomOut size={14} />
          </button>
          <span style={{ fontSize: "12px", width: "45px", textAlign: "center", color: "#cbd5e1" }}>
            {zoomLevel}%
          </span>
          <button
            type="button"
            className="btn btn-sm btn-outline-secondary text-white"
            onClick={() => setZoomLevel((z) => Math.min(150, z + 15))}
            disabled={zoomLevel >= 150}
            title="Zoom In"
            style={{ padding: "4px 8px" }}
          >
            <ZoomIn size={14} />
          </button>
          <button
            type="button"
            className="btn btn-sm btn-outline-secondary text-white"
            onClick={() => setZoomLevel(100)}
            title="Reset Zoom"
            style={{ fontSize: "11px", padding: "4px 8px" }}
          >
            Reset
          </button>
        </div>

        {/* Toolbar Right: Action Buttons */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <button
            type="button"
            className="btn btn-sm btn-primary"
            onClick={handlePrint}
            disabled={isLoading || !!error}
            style={{ display: "flex", alignItems: "center", gap: "6px", fontWeight: 600 }}
          >
            <Printer size={15} />
            Print / Save as PDF
          </button>

          <button
            type="button"
            className="btn btn-sm btn-outline-light"
            onClick={handleDownloadPdf}
            disabled={isLoading || isDownloading || !!error}
            style={{ display: "flex", alignItems: "center", gap: "6px" }}
          >
            {isDownloading ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />}
            Download PDF
          </button>

          <button
            type="button"
            className="btn btn-sm btn-outline-secondary text-white"
            onClick={onClose}
            title="Close Preview"
            style={{ display: "flex", alignItems: "center", padding: "4px 8px" }}
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Main Preview Scroll Area */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "24px 16px",
          backgroundColor: "#1e293b",
          display: "flex",
          justifyContent: "center",
        }}
      >
        {isLoading ? (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              color: "#94a3b8",
              height: "300px",
            }}
          >
            <Loader2 size={36} className="animate-spin" color="#38bdf8" />
            <span style={{ marginTop: "12px", fontSize: "14px", fontWeight: 500 }}>
              Rendering analytical report document...
            </span>
          </div>
        ) : error ? (
          <div
            style={{
              backgroundColor: "#fef2f2",
              border: "1px solid #fecaca",
              borderRadius: "8px",
              padding: "24px",
              maxWidth: "500px",
              height: "fit-content",
              color: "#991b1b",
              textAlign: "center",
              marginTop: "40px",
            }}
          >
            <AlertTriangle size={32} color="#dc2626" style={{ margin: "0 auto 12px auto" }} />
            <h5 style={{ fontWeight: 700, marginBottom: "8px" }}>Failed to Render Report</h5>
            <p style={{ fontSize: "13px", marginBottom: "16px" }}>{error}</p>
            <button
              type="button"
              className="btn btn-sm btn-danger"
              onClick={() => {
                setError(null);
                setIsLoading(true);
              }}
            >
              <RefreshCw size={13} style={{ marginRight: "6px" }} />
              Retry Loading
            </button>
          </div>
        ) : (
          <div
            className="report-preview-sheet"
            style={{
              transform: `scale(${zoomLevel / 100})`,
              transformOrigin: "top center",
              transition: "transform 0.15s ease",
            }}
          >
            {reportType === "player" || reportType === "users" ? (
              <UserReport reportData={reportData} />
            ) : (
              <DailyReport reportData={reportData} />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
