import React from "react";

export function ReportFooter({ pageNumber = null, totalPages = null }) {
  return (
    <div className="report-footer avoid-break">
      <span>Guess the Word · Enterprise Administrative Analytics · Confidential Document</span>
      <span>
        {pageNumber && totalPages ? `Page ${pageNumber} of ${totalPages}` : "Official System Record"}
      </span>
    </div>
  );
}
