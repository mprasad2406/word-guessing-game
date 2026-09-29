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
  const secs = sec % 60;
  if (mins > 0) return `${mins}m ${secs}s`;
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

  // Detect timezone discrepancy (e.g. database stored server local time instead of UTC, ~5.5h offset)
  if (totalDurationSec != null && diffSec > totalDurationSec + 30) {
    // If diffSec is significantly larger than total duration, check local timezone offset
    const tzOffsetSec = Math.abs(new Date().getTimezoneOffset() * 60);
    if (Math.abs(diffSec - tzOffsetSec) <= totalDurationSec + 30) {
      diffSec = Math.max(0, diffSec - tzOffsetSec);
    } else {
      // Clamp to total duration or proportional attempt progress
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
