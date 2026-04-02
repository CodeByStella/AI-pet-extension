export function nowIso() {
  return new Date().toISOString();
}

export function minutesBetween(startMs, endMs = Date.now()) {
  if (!startMs) return 0;
  return Math.max(0, (endMs - startMs) / 60000);
}

export function inTimeRange(date, startHour, endHour) {
  const hour = date.getHours();
  return hour >= startHour && hour < endHour;
}

export function getDayKey(date = new Date()) {
  return date.toISOString().slice(0, 10);
}
