import React from "react";

export function MetricCard({ label, value, subtext = null, variant = "default" }) {
  let variantClass = "";
  if (variant === "success") variantClass = "kpi-success";
  else if (variant === "danger") variantClass = "kpi-danger";
  else if (variant === "warning") variantClass = "kpi-warning";
  else if (variant === "active") variantClass = "kpi-active";

  return (
    <div className={`report-kpi-card ${variantClass}`}>
      <div className="report-kpi-label">{label}</div>
      <div className="report-kpi-value">{value}</div>
      {subtext && <div className="report-kpi-subtext">{subtext}</div>}
    </div>
  );
}
