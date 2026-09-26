/** ISO week helpers shared by the folio high-res audit and rotation. */

/** @param {Date} date */
export function isoWeek(date) {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return { year: d.getUTCFullYear(), week: Math.ceil(((d - yearStart) / 86400000 + 1) / 7) };
}

/** "2026-W39" → { year, week }, or null. */
export function parseWeek(label) {
  const match = /^(\d{4})-W(\d{2})$/.exec(label || '');
  return match ? { year: Number(match[1]), week: Number(match[2]) } : null;
}

export function formatWeek({ year, week }) {
  return `${year}-W${String(week).padStart(2, '0')}`;
}

/** Monday of an ISO week, so two weeks can be subtracted across a year boundary. */
export function weekStart({ year, week }) {
  const jan4 = new Date(Date.UTC(year, 0, 4));
  const monday = new Date(jan4);
  monday.setUTCDate(jan4.getUTCDate() - ((jan4.getUTCDay() || 7) - 1) + (week - 1) * 7);
  return monday;
}
