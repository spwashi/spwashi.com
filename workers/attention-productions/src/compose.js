// A shot, read from an address and written back out: as a Midjourney prompt, as
// a plain prompt for any model, as Spw lines, as an address, and as the numbers
// the viewfinder draws. Pure, with no DOM: the carry renders the page's first
// frame with it, the page (assets/attention.js) redraws with it, and the tests
// read it. Copied byte for byte into assets/ by carry.mjs.
import { DEFAULT_SUBJECT, LADDERS, NO, PHRASES, RATIOS, SHAPES, STYLE_WEIGHT } from "./vocabulary.js";
import { MATERIALS } from "./materials.js";

/** A word as a path segment: lower case, hyphens for spaces. */
export const slug = (word) => String(word ?? "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

const WORD_BY_SLUG = Object.fromEntries(Object.entries(LADDERS).map(([key, words]) => [key, new Map(words.map((word) => [slug(word), word]))]));
const MATERIAL_BY_SLUG = new Map(MATERIALS.map((m) => [m.slug, m]));
const DAY = /^\d{4}-\d{2}-\d{2}$/;

/** The shot the page draws before it reads an address, and with scripts off. */
export const FIRST_SHOT = Object.freeze({ subject: DEFAULT_SUBJECT, shot: "close-up", lens: "85mm", light: "lamplight", move: "still", ratio: "scope", focus: "left third", material: null, named: false, day: "" });

/** A word from each ladder, picked by the date, so each day of the season opens on its own shot. */
export function dayShot(day) {
  let h = 2166136261;
  for (const c of String(day)) h = Math.imul(h ^ c.charCodeAt(0), 16777619) >>> 0;
  const pick = {};
  for (const [key, words] of Object.entries(LADDERS)) {
    pick[key] = words[h % words.length];
    h = Math.imul(h ^ (h >>> 15), 2246822519) >>> 0;
  }
  return pick;
}

const decode = (part) => { try { return decodeURIComponent(part); } catch { return ""; } };

/**
 * Read an address as a shot. The path is the subject (a hyphen is a space);
 * each ladder is a query key whose value is one of its words; material= is one
 * of texture.website's listed words. What the address leaves out, the day picks.
 */
export function readShot(pathname, search, today) {
  const params = new URLSearchParams(search);
  const day = DAY.test(params.get("day") ?? "") ? params.get("day") : today;
  const words = String(pathname ?? "").split("/").map(decode).map(slug).filter(Boolean);
  const subject = words.join(" ").replace(/-/g, " ").slice(0, 80).trim();
  const picked = dayShot(day);
  const shot = { subject: subject || DEFAULT_SUBJECT, material: MATERIAL_BY_SLUG.get(slug(params.get("material"))) ?? null, named: Boolean(subject), day };
  for (const key of Object.keys(LADDERS)) {
    const word = WORD_BY_SLUG[key].get(slug(params.get(key)));
    if (word) shot.named = true;
    shot[key] = word ?? picked[key];
  }
  return shot;
}

/** The address that reads back as this shot. */
export function addressOf(shot) {
  const query = Object.keys(LADDERS).map((key) => `${key}=${slug(shot[key])}`);
  if (shot.material) query.push(`material=${shot.material.slug}`);
  const path = shot.subject === DEFAULT_SUBJECT ? "" : slug(shot.subject);
  return `/${path}?${query.join("&")}`;
}

/** The prompt as a sentence, for any model, and with Midjourney's parameters. */
export function promptOf(shot) {
  const sentence = [
    `${PHRASES.shot[shot.shot]} of ${shot.subject}`,
    PHRASES.focus[shot.focus],
    PHRASES.lens[shot.lens],
    PHRASES.light[shot.light],
    PHRASES.move[shot.move],
    shot.material ? `${shot.material.word} surfaces` : "",
    "cinematic film still",
  ].filter(Boolean).join(", ");
  const sref = shot.material ? ` --sref https://texture.website/${shot.material.slug}.png ${STYLE_WEIGHT}` : "";
  return { plain: sentence, midjourney: `${sentence} --ar ${RATIOS[shot.ratio].ar}${sref} ${NO}` };
}

const under = (word) => String(word).replace(/ /g, "_");

/**
 * The shot as Spw: the mark acts, the mode is the shot, the body the subject,
 * the scene its light and the concept its lens; the frame's settings follow,
 * and a material is a path to texture.website's own line for it (written
 * without a scheme, since // would open a comment).
 */
export function spwOf(shot) {
  return [
    `!shot[${under(shot.shot)}]{${shot.subject}}(${under(shot.light)})<${under(shot.lens)}>`,
    `^frame{ =ratio[${shot.ratio}] =focus[${under(shot.focus)}] ~move[${under(shot.move)}] }`,
    ...(shot.material ? [`@material: ~"texture.website/${shot.material.slug}.spw"`] : []),
  ].join("\n");
}

/** The viewfinder's canvas, in its own units. */
export const VIEW = Object.freeze({ w: 1200, h: 800, margin: 56 });

/** The sheets in the frame, nearest first: where each sits from the subject, in units of the subject's size, and its tilt. */
const SHEETS = Object.freeze([
  { dx: -0.95, dy: 0.62, w: 1.5, h: 0.9, rot: -6 },
  { dx: 0.8, dy: -0.38, w: 1.1, h: 0.78, rot: 4 },
  { dx: 0, dy: 0, w: 1, h: 0.72, rot: -2 },
  { dx: -0.62, dy: -0.58, w: 1.4, h: 1, rot: 7 },
  { dx: 0.18, dy: -0.08, w: 2.7, h: 1.8, rot: 0 },
]);
/** The subject's sheet, and the points inside it. */
export const SUBJECT_DEPTH = 2;
const POINTS = Object.freeze([[0.3, 0.42], [0.56, 0.64], [0.72, 0.34], [0.44, 0.24]]);
const BOKEH = Object.freeze([[0.12, 0.2], [0.86, 0.16], [0.78, 0.82], [0.2, 0.78], [0.62, 0.12], [0.94, 0.56]]);

const round = (n) => Math.round(n * 10) / 10;

/**
 * The numbers the viewfinder draws for a shot, with the sheet at `focusDepth`
 * in focus: each other sheet is thrown out of focus by how far it stands from
 * that one, times the lens's blur, in four fixed levels (0 to 3), so a pointer
 * never animates a blur.
 */
export function geometryOf(shot, focusDepth = SUBJECT_DEPTH) {
  const ratio = RATIOS[shot.ratio];
  const innerW = VIEW.w - VIEW.margin * 2;
  const innerH = VIEW.h - VIEW.margin * 2;
  const r = ratio.w / ratio.h;
  const fw = r >= innerW / innerH ? innerW : innerH * r;
  const fh = fw / r;
  const fx = (VIEW.w - fw) / 2;
  const fy = (VIEW.h - fh) / 2;
  const [ax, ay] = SHAPES.focus[shot.focus];
  const px = fx + fw * ax;
  const py = fy + fh * ay;
  const shape = SHAPES.shot[shot.shot];
  const lens = SHAPES.lens[shot.lens];
  const light = SHAPES.light[shot.light];
  // The subject's sheet is half the frame's short side at a scale of 1, so a close-up fills it and an establishing shot leaves room.
  const unit = Math.min(fw, fh) * 0.5 * shape.scale;
  const sheets = SHEETS.map((s, depth) => {
    const w = s.w * unit * (shape.flat ? 1.05 : 1);
    const h = s.h * unit;
    return {
      depth,
      x: round(px + s.dx * unit - w / 2),
      y: round(py + s.dy * unit - h / 2),
      w: round(w),
      h: round(h),
      rot: shape.flat ? 0 : s.rot + (shape.tilt ?? 0) * (depth - SUBJECT_DEPTH) * 0.4,
      blur: Math.min(3, Math.round(Math.abs(depth - focusDepth) * lens.blur)),
    };
  });
  const subject = sheets[SUBJECT_DEPTH];
  return {
    frame: { x: round(fx), y: round(fy), w: round(fw), h: round(fh) },
    focus: { x: round(px), y: round(py), r: round(Math.max(26, unit * 0.32)) },
    sheets,
    points: POINTS.map(([u, v]) => ({ x: round(subject.x + subject.w * u), y: round(subject.y + subject.h * v), r: round(Math.max(3, unit * 0.035)) })),
    bokeh: BOKEH.map(([u, v], i) => ({ x: round(fx + fw * u), y: round(fy + fh * v), rx: round(unit * (0.07 + (i % 3) * 0.025)), ry: round(unit * (0.07 + (i % 3) * 0.025) * (lens.flare ? 1.7 : 1)), on: lens.blur >= 1 })),
    flare: { y: round(py), on: Boolean(lens.flare) },
    light: { cx: round(fx + fw * light.from[0]), cy: round(fy + fh * light.from[1]), r: round(Math.max(fw, fh) * 0.95), key: light.key, fill: light.fill, second: light.second ?? light.key },
    thirds: [1, 2].flatMap((k) => [
      { x1: round(fx + (fw * k) / 3), y1: round(fy), x2: round(fx + (fw * k) / 3), y2: round(fy + fh) },
      { x1: round(fx), y1: round(fy + (fh * k) / 3), x2: round(fx + fw), y2: round(fy + (fh * k) / 3) },
    ]),
    // Where attention sits, said under the frame: a short bar beneath the subject.
    bar: { x1: round(px - 42), x2: round(px + 42), y: round(fy + fh + 20) },
    streaks: [0.22, 0.38, 0.55, 0.7, 0.84].map((v, i) => ({ x1: round(fx - fw * 0.1), x2: round(fx + fw * (0.28 + (i % 2) * 0.12)), y: round(fy + fh * v) })),
    move: slug(shot.move),
  };
}

/** The four corner brackets of a frame, as a path. */
export function cornersOf(frame, arm = 30) {
  const { x, y, w, h } = frame;
  const r = (n) => Math.round(n * 10) / 10;
  return `M${r(x)} ${r(y + arm)}V${r(y)}H${r(x + arm)}M${r(x + w - arm)} ${r(y)}H${r(x + w)}V${r(y + arm)}M${r(x + w)} ${r(y + h - arm)}V${r(y + h)}H${r(x + w - arm)}M${r(x + arm)} ${r(y + h)}H${r(x)}V${r(y + h - arm)}`;
}

/** The ladder word for the thirds point nearest a place in the frame. */
export function nearestFocus(geometry, x, y) {
  const { frame } = geometry;
  let best = "center";
  let bestD = Infinity;
  for (const [word, [u, v]] of Object.entries(SHAPES.focus)) {
    const d = Math.hypot(frame.x + frame.w * u - x, frame.y + frame.h * v - y);
    if (d < bestD) { bestD = d; best = word; }
  }
  return best;
}

/** The sheet whose centre is nearest a place in the frame. */
export function nearestSheet(geometry, x, y) {
  let best = SUBJECT_DEPTH;
  let bestD = Infinity;
  for (const s of geometry.sheets) {
    const d = Math.hypot(s.x + s.w / 2 - x, s.y + s.h / 2 - y) / Math.sqrt(s.w * s.h);
    if (d < bestD) { bestD = d; best = s.depth; }
  }
  return best;
}
