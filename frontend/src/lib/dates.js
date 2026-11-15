// src/lib/dates.js — date-range helpers for list filters.
// `from` / `to` are "YYYY-MM-DD" strings from <input type="date">; empty means no limit.

// True when `value` (ISO string or Date) falls inside [from, to], both days inclusive (local time).
export function inDateRange(value, from, to) {
  if (!from && !to) return true;
  if (!value) return false;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return false;
  if (from) {
    const start = new Date(`${from}T00:00:00`);
    if (d < start) return false;
  }
  if (to) {
    const end = new Date(`${to}T23:59:59.999`);
    if (d > end) return false;
  }
  return true;
}
