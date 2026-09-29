import React from "react";
import { BarChart3, Calendar, Users, RotateCw, Clock, Download, Eye } from "lucide-react";

export function ReportHeader({
  activeTab,
  onTabChange,
  onRefresh,
  isRefreshing,
  lastUpdated,
  onOpenDownloadDialog,
  onOpenPreview,
}) {
  return (
    <div className="reports-header-section">
      {/* 1. Top Header Row */}
      <div className="reports-page-header">
        <div className="reports-header-left">
          <div className="reports-header-icon-box" aria-hidden="true">
            <BarChart3 size={22} />
          </div>
          <div className="reports-header-text">
            <h1 className="reports-header-title">Gameplay Reports</h1>
            <p className="reports-header-subtitle">
              Platform activity, daily gameplay summaries, and player performance metrics.
            </p>
          </div>
        </div>

        <div className="reports-header-right">
          {lastUpdated && (
            <div className="reports-updated-pill" title="Last updated timestamp">
              <Clock size={12} />
              <span>Updated {lastUpdated}</span>
            </div>
          )}

          {/* Preview Report Button */}
          {onOpenPreview && (
            <button
              type="button"
              className="reports-download-pdf-btn"
              onClick={onOpenPreview}
              title="Preview analytical PDF report before exporting"
              aria-label="Preview PDF Report"
              style={{
                backgroundColor: "#1e293b",
                borderColor: "#334155",
                color: "#e2e8f0",
              }}
            >
              <Eye size={14} />
              <span>Preview Report</span>
            </button>
          )}

          {/* Download PDF Button */}
          <button
            type="button"
            className="reports-download-pdf-btn"
            onClick={onOpenDownloadDialog}
            title="Download Professional Analytical PDF Report"
            aria-label="Download PDF Report"
          >
            <Download size={14} />
            <span>Download PDF</span>
          </button>

          <button
            type="button"
            className="reports-refresh-btn"
            onClick={onRefresh}
            disabled={isRefreshing}
            aria-label="Refresh report data"
            title="Refresh analytics data"
          >
            <RotateCw size={14} className={isRefreshing ? "spin-icon" : ""} />
            <span>{isRefreshing ? "Refreshing..." : "Refresh"}</span>
          </button>
        </div>
      </div>

      {/* 2. Segmented Navigation Tabs */}
      <div className="reports-nav-strip">
        <div className="reports-segmented-tabs" role="tablist" aria-label="Report Views">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "daily"}
            className={`reports-tab-btn ${activeTab === "daily" ? "is-active" : ""}`}
            onClick={() => onTabChange("daily")}
          >
            <span className="reports-tab-icon">
              <Calendar size={14} />
            </span>
            <span>Daily Overview</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "users"}
            className={`reports-tab-btn ${activeTab === "users" ? "is-active" : ""}`}
            onClick={() => onTabChange("users")}
          >
            <span className="reports-tab-icon">
              <Users size={14} />
            </span>
            <span>Player Analytics</span>
          </button>
        </div>
      </div>
    </div>
  );
}
