// The day's picture. An empty path used to walk the catalog in order and leave
// every ladder on the same defaults (close, overcast, handled, wall, tile), so
// each morning was the same sentence with the next noun. The day now picks both
// materials and the look. A ladder named in the query keeps the reader's word.
//
// The walk is a coprime step through each list, so a cycle of the list visits
// every item once, and tomorrow is never today's material or today's word.
//
// This file is served at /daily.js and imported by texture.js. Node tests import
// it too, so it stays free of the document. A neighbour's word for a ladder
// (attention.productions' close-up, golden hour, widescreen) is read as its
// nearest rung by workers/lib/near-word.js, which the browser loads at
// /lib/near-word.js.

import { nearWord } from "../../lib/near-word.js";

export const DAY_KEYS = ["scale", "light", "wear", "process", "scene", "format"];
/** The four mode words, in the order the line is read: distance, then light, wear, process. */
export const MODE_KEYS = ["scale", "light", "wear", "process"];
/** Marks that read as a meeting of two materials. `?` has to be escaped in a path. */
export const DAY_MARKS = ["~", "*", "^", "@", "="];
export const DEFAULTS = { scale: "close", light: "overcast", wear: "handled", process: "as found", palette: "as drawn", scene: "wall", format: "tile", lens: "none", beat: "none", trace: "none", face: "title", tone: "paper" };

export const slug = (word) => word.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
export const dayNumber = (iso) => Math.floor(Date.parse(`${iso}T00:00:00Z`) / 86400000);
export const isoOf = (n) => new Date(n * 86400000).toISOString().slice(0, 10);
export const mix = (n) => { let x = Math.imul((n ^ (n >>> 16)) >>> 0, 0x45d9f3b); x = Math.imul((x ^ (x >>> 16)) >>> 0, 0x45d9f3b); return (x ^ (x >>> 16)) >>> 0; };
const gcd = (a, b) => { let x = Math.abs(a), y = Math.abs(b); while (y) { const t = x % y; x = y; y = t; } return x || 1; };
const mod = (a, n) => ((a % n) + n) % n;

/**
 * A step that shares no factor with n, and is not 1 when the list is longer
 * than two, so the walk is a permutation and not the list in order.
 */
export function strideFor(n, salt) {
  if (n <= 1) return 1;
  let step = (mix(salt) % (n - 1)) + 1;
  for (let guard = 0; guard < n && (gcd(step, n) !== 1 || (n > 2 && step === 1)); guard += 1) step = (step % (n - 1)) + 1;
  return gcd(step, n) === 1 ? step : 1;
}

/** Item `day` of a coprime walk. n days hold each item once. */
export function pickAt(list, day, salt) {
  const n = list.length;
  if (!n) return undefined;
  const step = strideFor(n, salt);
  const start = mix(salt + 1) % n;
  return list[mod(start + mod(day, n) * step, n)];
}

/** Two materials from different classes, met by a mark. Both come from the date, not from catalog order. */
export function daily(vocab, day) {
  const all = vocab.materials;
  const first = pickAt(all, day, 1);
  const classes = [...new Set(all.map((m) => m.cls))].filter((cls) => cls !== first.cls);
  const cls = pickAt(classes, day, 2);
  const pool = all.filter((m) => m.cls === cls);
  return [{ mark: "", material: first }, { mark: pickAt(DAY_MARKS, day, 4), material: pickAt(pool, day, 3) }];
}

/**
 * The composition as one line in slot order, word[mode]{body}(scene)<concept>.
 * Scale sits in the mode with the light, the wear and the process, so the line
 * a reader carries to factshift.center or spw.quest still holds the look.
 * Mode after the body held nothing there (2026-11-11).
 */
export function lineOf(state) {
  const [first, ...rest] = state.layers;
  const inner = rest.reduceRight((acc, { material, mark }) => `${mark}${material.slug}${acc ? `{${acc}}` : ""}`, "");
  const mode = MODE_KEYS.map((key) => slug(state.ladders[key])).join(", ");
  const view = state.view && state.view !== "studio" ? `${state.view}@ ` : "";
  return `${view}${first?.mark ?? ""}${first?.material?.slug ?? "texture"}[${mode}]${inner ? `{${inner}}` : ""}(${slug(state.ladders.scene)})<${slug(state.ladders.format)}>`;
}

/**
 * Ladder words for a picture. A query value wins (its own word, or a
 * neighbour's read as the nearest rung), then a roll, then the day's word when
 * the path is empty. A path of the reader's own keeps the standing defaults
 * until a word is written into the query. Each word taken as another, or left
 * unread, goes into `reads` when one is given, so the page can say so.
 */
export function laddersFor(vocab, { day, roll, query, byDay, reads = null }) {
  const dayN = dayNumber(day);
  const ladders = {};
  Object.entries(vocab.ladders).forEach(([key, words], i) => {
    const near = nearWord(query.get(key), words, vocab.near?.[key]);
    if (near && near.how !== "exact") reads?.push({ key, ...near });
    const asked = near?.word ?? undefined;
    const rolled = Number.isFinite(roll) ? words[mix(roll + i * 97) % words.length] : null;
    const fromDay = byDay && DAY_KEYS.includes(key) ? pickAt(words, dayN, 100 + i) : null;
    ladders[key] = asked ?? rolled ?? fromDay ?? DEFAULTS[key];
  });
  return ladders;
}
