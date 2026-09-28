/**
 * day-seed.js — freshness by day, with no build and no hand.
 *
 * A route that rotates by date needs three things this file owns: a day key
 * everyone shares (the reader's local calendar day), a pick that is stable
 * for that day and does not cycle with the weekday, and a salt so two
 * surfaces choosing from the same list on the same day need not agree.
 * No DOM, no storage, no clock beyond the Date it is handed.
 *
 *   dayKey(date)                   'YYYY-MM-DD' in local time
 *   dayNumber(date)                whole days since 1970-01-01, local
 *   pickForDay(list, date, salt)   one item, stable for that day and salt
 *   dayWindow(list, date, n, salt) the next n days' picks, today first
 */

const DAY_MS = 24 * 60 * 60 * 1000;

function pad(value) {
  return String(value).padStart(2, '0');
}

export function dayKey(date = new Date()) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function dayNumber(date = new Date()) {
  return Math.floor(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / DAY_MS);
}

/**
 * FNV-1a over the key, then murmur3's finalizer. FNV alone leaves keys that
 * differ only in their last digits close together, so neighbors in a list
 * would clump in the rotation; the finalizer spreads every bit.
 */
function hash(text) {
  let value = 0x811c9dc5;
  for (let index = 0; index < text.length; index += 1) {
    value ^= text.charCodeAt(index);
    value = Math.imul(value, 0x01000193) >>> 0;
  }
  value ^= value >>> 16;
  value = Math.imul(value, 0x85ebca6b);
  value ^= value >>> 13;
  value = Math.imul(value, 0xc2b2ae35);
  value ^= value >>> 16;
  return value >>> 0;
}

/**
 * The item for a day. Consecutive days walk a salted permutation of the list,
 * so every item appears once per pass before any repeats, and a pass does not
 * line up with the week.
 */
export function pickForDay(list = [], date = new Date(), salt = '') {
  const items = Array.isArray(list) ? list : [];
  if (!items.length) return null;
  const day = dayNumber(date);
  const pass = Math.floor(day / items.length);
  const order = items
    .map((item, index) => ({ item, weight: hash(`${salt}:${pass}:${index}`) }))
    .sort((a, b) => a.weight - b.weight);
  return order[((day % items.length) + items.length) % items.length].item;
}

export function dayWindow(list = [], date = new Date(), count = 7, salt = '') {
  return Array.from({ length: Math.max(0, count) }, (_, offset) => {
    const day = new Date(date.getFullYear(), date.getMonth(), date.getDate() + offset);
    return { key: dayKey(day), date: day, item: pickForDay(list, day, salt) };
  });
}

export const SPW_DAY_SEED_CONTRACT = Object.freeze({
  portableUse: 'dayKey / dayNumber / pickForDay / dayWindow: a stable daily choice from any list, the same for every reader on the same local day, without a build or storage.',
  rotation: 'Each pass walks a salted permutation, so no item repeats until the list is spent and a pass does not align with the weekday.',
});
