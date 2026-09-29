/**
 * Date and timing utility helpers for Wordle Guessing Game.
 */

/**
 * Safely parses ISO datetime string from server into a Date object.
 * If the string does not have timezone information ('Z' or '+00:00'), treats it as UTC.
 */
export function parseServerDate(dateStr) {
  if (!dateStr) return null;
  if (dateStr instanceof Date) {
    return isNaN(dateStr.getTime()) ? null : dateStr;
  }
  let str = String(dateStr).trim();
  if (!str) return null;

  // If ISO string does not contain Z or + or timezone offset, append Z to force UTC parsing
  if (!str.endsWith("Z") && !str.includes("+") && !/-\d{2}:\d{2}$/.test(str)) {
    str += "Z";
  }
  const date = new Date(str);
  return isNaN(date.getTime()) ? null : date;
}

/**
 * Formats a server date string into human-friendly localized date & time.
 */
export function formatServerDate(dateStr) {
  const d = parseServerDate(dateStr);
  if (!d) return "—";
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Formats a date string into relative time (e.g. "Just now", "5m ago", "2h ago", "Yesterday", "3d ago").
 */
export function formatRelativeTime(dateStr) {
  const d = parseServerDate(dateStr);
  if (!d) return "Never";
  const now = new Date();
  const diffSec = Math.floor((now.getTime() - d.getTime()) / 1000);

  if (diffSec < 0) return "Just now";
  if (diffSec < 60) return "Just now";
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
  if (diffSec < 172800) return "Yesterday";
  if (diffSec < 604800) return `${Math.floor(diffSec / 86400)}d ago`;

  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: d.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  });
}

/**
 * Formats a date into a clean registration date format (e.g. "Sep 11, 2026").
 */
export function formatJoinedDate(dateStr) {
  const d = parseServerDate(dateStr);
  if (!d) return "—";
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/**
 * Formats seconds into MM:SS.
 */
export function formatSeconds(totalSec) {
  if (totalSec == null || isNaN(totalSec) || totalSec < 0) totalSec = 0;
  const mins = Math.floor(totalSec / 60);
  const secs = totalSec % 60;
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

/**
 * Formats seconds into "Xm Ys" or "Ys".
 */
export function formatDuration(sec) {
  if (sec == null || isNaN(sec) || sec < 0) return "—";
  const mins = Math.floor(sec / 60);
  const secs = Math.round(sec % 60);
  if (mins > 0 && secs > 0) return `${mins}m ${secs}s`;
  if (mins > 0) return `${mins}m`;
  return `${secs}s`;
}

/**
 * Formats time limit seconds into human-readable minutes (e.g. 3000s -> "50 min").
 */
export function formatTimeLimit(seconds) {
  if (!seconds || seconds <= 0) return "No Limit";
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins > 0 && secs === 0) return `${mins} min`;
  if (mins > 0) return `${mins} min ${secs}s`;
  return `${secs}s`;
}


/**
 * Calculates elapsed seconds for a specific guess attempt relative to session start.
 * Safely accounts for potential database timezone discrepancies and clamps within valid bounds.
 */
export function calculateAttemptElapsedSec(attemptCreatedAt, sessionStartedAt, sessionCompletedAt = null) {
  const attemptDate = parseServerDate(attemptCreatedAt);
  const startDate = parseServerDate(sessionStartedAt);
  if (!attemptDate || !startDate) return null;

  let diffSec = Math.floor((attemptDate.getTime() - startDate.getTime()) / 1000);

  const completedDate = parseServerDate(sessionCompletedAt);
  const totalDurationSec = completedDate
    ? Math.max(0, Math.floor((completedDate.getTime() - startDate.getTime()) / 1000))
    : null;

  // Detect timezone discrepancy
  if (totalDurationSec != null && diffSec > totalDurationSec + 30) {
    const tzOffsetSec = Math.abs(new Date().getTimezoneOffset() * 60);
    if (Math.abs(diffSec - tzOffsetSec) <= totalDurationSec + 30) {
      diffSec = Math.max(0, diffSec - tzOffsetSec);
    } else {
      diffSec = Math.min(Math.max(0, diffSec), totalDurationSec);
    }
  }

  if (diffSec < 0) {
    diffSec = 0;
  }

  if (totalDurationSec != null && diffSec > totalDurationSec) {
    diffSec = totalDurationSec;
  }

  return diffSec;
}
