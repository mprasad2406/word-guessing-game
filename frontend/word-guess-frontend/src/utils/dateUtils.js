/**
 * Date and timing utility helpers for Wordle Guessing Game.
 */

/**
 * Safely parses ISO datetime string from server into a Date object.
 * If the string does not have timezone information ('Z' or '+00:00'), treats it as UTC.
 */
export function parseServerDate(dateStr) {
  if (!dateStr) return null;
  if (dateStr instanceof Date) return dateStr;
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
