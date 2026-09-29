import React from "react";

export function ReportTable({
  headers = [],
  data = [],
  renderRow,
  grandTotalRow = null,
  emptyMessage = "No records found for the selected period.",
}) {
  if (!data || data.length === 0) {
    return (
      <div className="report-table-wrapper avoid-break" style={{ padding: "16px", textAlign: "center", color: "var(--report-muted)", fontSize: "11px" }}>
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="report-table-wrapper">
      <table className="report-table">
        <thead>
          <tr>
            {headers.map((h, idx) => (
              <th
                key={idx}
                className={h.align === "right" ? "text-right" : h.align === "center" ? "text-center" : ""}
                style={h.width ? { width: h.width } : {}}
              >
                {h.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((item, rowIdx) => renderRow(item, rowIdx))}
          {grandTotalRow && (
            <tr className="grand-total-row">
              {grandTotalRow}
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
