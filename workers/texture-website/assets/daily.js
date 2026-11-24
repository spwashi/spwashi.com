// The day's picture. An empty path used to walk the catalog in order and leave
// every ladder on the same defaults (close, overcast, handled, wall, tile), so
// each morning was the same sentence with the next noun. The day now picks both
// materials and the look. A ladder named in the query keeps the reader's word.
//
// This file is served at /daily.js and imported by texture.js. Node tests import
// it too, so it stays free of the document.

export const DAY_KEYS = ["scale", "light", "wear", "process", "scene", "format"];
/** Marks that read as a meeting of two materials. `?` has to be escaped in a path. */
export const DAY_MARKS = ["~", "*", "^", "@", "="];
export const DEFAULTS = { scale: "close", light: "overcast", wear: "handled", process: "as found", scene: "wall", format: "tile", lens: "none", beat: "none", trace: "none", face: "title", tone: "paper" };

export const slug = (word) => word.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
export const dayNumber = (iso) => Math.floor(Date.parse(`${iso}T00:00:00Z`) / 86400000);
export const isoOf = (n) => new Date(n * 86400000).toISOString().slice(0, 10);
export const mix = (n) => { let x = Math.imul((n ^ (n >>> 16)) >>> 0, 0x45d9f3b); x = Math.imul((x ^ (x >>> 16)) >>> 0, 0x45d9f3b); return (x ^ (x >>> 16)) >>> 0; };

/** Two materials from different classes, met by a mark. Both come from the date, not from catalog order. */
export function daily(vocab, day) {
  const all = vocab.materials;
  const first = all[mix(day) % all.length];
  const others = all.filter((m) => m.cls !== first.cls);
  return [{ mark: "", material: first }, { mark: DAY_MARKS[mix(day + 3) % DAY_MARKS.length], material: others[mix(day + 17) % others.length] }];
}

/**
 * Ladder words for a picture. A query value wins, then a roll, then the day's
 * word when the path is empty. A path of the reader's own keeps the standing
 * defaults until a word is written into the query.
 */
export function laddersFor(vocab, { day, roll, query, byDay }) {
  const dayN = dayNumber(day);
  const ladders = {};
  Object.entries(vocab.ladders).forEach(([key, words], i) => {
    const asked = words.find((word) => slug(word) === slug(query.get(key) ?? ""));
    const rolled = Number.isFinite(roll) ? words[mix(roll + i * 97) % words.length] : null;
    const fromDay = byDay && DAY_KEYS.includes(key) ? words[mix(dayN + i * 97) % words.length] : null;
    ladders[key] = asked ?? rolled ?? fromDay ?? DEFAULTS[key];
  });
  return ladders;
}
