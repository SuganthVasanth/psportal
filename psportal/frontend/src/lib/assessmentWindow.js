/**
 * Assessment slot window helpers (matches /api/my-bookings shape: date, startTime, endTime).
 */

function parseHm(timeStr) {
  if (timeStr == null || timeStr === "") return NaN;
  const s = String(timeStr).trim();
  const m = s.match(/^(\d{1,2}):(\d{2})/);
  if (!m) return NaN;
  const h = parseInt(m[1], 10);
  const min = parseInt(m[2], 10);
  if (!Number.isFinite(h) || !Number.isFinite(min)) return NaN;
  return h * 60 + min;
}

/**
 * True if "now" is on the same calendar day as `booking.date` and local time is in [startTime, endTime).
 * `startTime` / `endTime` are HH:mm strings from the slot API.
 */
export function isBookingAssessmentActive(booking) {
  if (!booking?.date) return false;
  const startRaw = booking.startTime ?? booking.slot_start_time;
  const endRaw = booking.endTime ?? booking.slot_end_time;
  if (!startRaw || !endRaw) return false;

  const now = new Date();
  const day = new Date(booking.date);
  if (Number.isNaN(day.getTime())) return false;
  if (now.toDateString() !== day.toDateString()) return false;

  const cur = now.getHours() * 60 + now.getMinutes();
  const start = parseHm(startRaw);
  const end = parseHm(endRaw);
  if (!Number.isFinite(start) || !Number.isFinite(end)) return false;

  return cur >= start && cur < end;
}
