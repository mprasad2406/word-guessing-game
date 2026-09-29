import React from "react";

export function ReportHeader({
  title,
  periodLabel,
  extraMeta = null,
  badgeLabel = "ADMINISTRATIVE REPORT",
}) {
  const generatedAt = new Date().toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    timeZoneName: "short",
  });

  return (
    <div className="report-header-banner avoid-break">
      <div className="report-header-left">
        <div className="report-brand-tag">Guess the Word · Enterprise Analytics</div>
        <h1 className="report-main-title">{title}</h1>
        <div className="report-meta-text">
          {extraMeta && (
            <div dangerouslySetInnerHTML={{ __html: extraMeta }} style={{ marginBottom: "3px" }} />
          )}
          <div>
            <b>Reporting Scope:</b> {periodLabel || "All Time"} · <b>Generated:</b> {generatedAt}
          </div>
        </div>
      </div>
      <div className="report-header-right">
        <div className="report-badge-box">
          <span className="report-badge-label">{badgeLabel}</span>
        </div>
      </div>
    </div>
  );
}
