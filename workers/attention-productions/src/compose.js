// A shot, read from an address and written back out: as a Midjourney prompt, as
// a plain prompt for any model, as Spw lines, as an address, and as the numbers
// the viewfinder draws. Pure, with no DOM: the carry renders the page's first
// frame with it, the page (assets/attention.js) redraws with it, and the tests
// read it. Copied byte for byte into assets/ by carry.mjs.
import { DEFAULT_SUBJECT, LADDERS, LIGHT_DIRECTIONS, MATERIAL_OFFER, NEAR, NO, PHRASES, RATIOS, SHAPES, STYLE_WEIGHT, TEMPO } from "./vocabulary.js";
import { MATERIALS, PALETTES, RELATIONS, SURFACE, SURFACE_PHRASES } from "./materials.js";
import { ABSENT, nearWord } from "../../lib/near-word.js";

/** A word as a path segment: lower case, hyphens for spaces. */
export const slug = (word) => String(word ?? "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

const MATERIAL_BY_SLUG = new Map(MATERIALS.map((m) => [m.slug, m]));
/** texture.website's surface ladders (wear, process), carried from its vocabulary; optional, like the material, and never picked by the day. */
export { SURFACE };
export const SURFACE_KEYS = Object.freeze(["wear", "process", "palette"]);

/** texture.website's marks: the first character of a path word that says how it meets the one before. */
const MARKS = ".^*~=@?!%";

/**
 * A path as layers, texture.website's way: each word a material or a thing,
 * bottom first, a mark before a word saying how it meets the one before
 * (/vellum/~moss is vellum drifting through moss). A word a sender wrote out
 * as missing ("undefined") is no word.
 */
export function layersOf(pathname) {
  return String(pathname ?? "").split("/").map(decode).filter(Boolean).map((part) => {
    const mark = MARKS.includes(part[0]) ? part[0] : "";
    return { mark, word: slug(mark ? part.slice(1) : part).replace(/-/g, " ") };
  }).filter(({ word }) => word && !ABSENT.has(slug(word)));
}

/** Layers as a subject: "vellum drifting through moss, heavy with rust". */
export const sentenceOf = (layers) => layers.map(({ mark, word }, i) => (i ? `${RELATIONS[mark] ?? "with"} ${word}` : word)).join(" ");

/** Layers as a path texture.website reads back as the same layers. */
const layerPath = (layers) => `/${layers.map(({ mark, word }) => `${mark === "?" ? "%3F" : mark}${slug(word)}`).join("/")}`;

/** The layers a shot still stands for: only while its subject is their sentence (an edited subject is the reader's own). */
const layersStanding = (shot) => (shot.layers?.length > 1 && sentenceOf(shot.layers) === shot.subject ? shot.layers : null);

/**
 * A palette as a gradient map: the frame to luminance, stretched to reach both
 * ends, then each channel read across the palette's stops from dark to light,
 * as texture.website prints its stage. Empty for no palette.
 */
export function paletteFilterOf(word) {
  const stops = PALETTES[word];
  if (!stops?.length) return "";
  const luma = "0.2126 0.7152 0.0722 0 0";
  const channel = (i) => stops.map((hex) => (Number.parseInt(hex.slice(1 + i * 2, 3 + i * 2), 16) / 255).toFixed(3)).join(" ");
  return `<feColorMatrix type="matrix" values="${luma} ${luma} ${luma} 0 0 0 1 0"/>`
    + `<feComponentTransfer>${["R", "G", "B"].map((c) => `<feFunc${c} type="linear" slope="1.45" intercept="-0.2"/>`).join("")}</feComponentTransfer>`
    + `<feComponentTransfer>${["R", "G", "B"].map((c, i) => `<feFunc${c} type="table" tableValues="${channel(i)}"/>`).join("")}</feComponentTransfer>`;
}
const DAY = /^\d{4}-\d{2}-\d{2}$/;

/** The shot the page draws before it reads an address, and with scripts off. */
export const FIRST_SHOT = Object.freeze({ subject: DEFAULT_SUBJECT, shot: "close-up", lens: "85mm", light: "lamplight", from: "right", move: "still", ratio: "scope", focus: "left third", tempo: TEMPO.rest, material: null, wear: null, process: null, named: false, day: "" });

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

/** A tempo from an address or a hand: a number held to its range, to one decimal; anything else is the rest. */
export function tempoOf(value) {
  const n = Number.parseFloat(value);
  if (!Number.isFinite(n)) return TEMPO.rest;
  return Math.round(Math.min(TEMPO.max, Math.max(TEMPO.min, n)) * 10) / 10;
}

/**
 * Read an address as a shot. The path is the subject (a hyphen is a space);
 * each ladder is a query key whose value is one of its words, or a neighbour's
 * word read as its nearest rung (NEAR, workers/lib/near-word.js); material= is
 * one of texture.website's listed words, and wear= and process= its surface
 * words. What the address leaves out, or says with nothing near, the day
 * picks; the surface stays as it was unless named. `read` lists each word taken as another,
 * so the page can say how it read the link.
 */
export function readShot(pathname, search, today) {
  const params = new URLSearchParams(search);
  const day = DAY.test(params.get("day") ?? "") ? params.get("day") : today;
  // One path word is the subject (a hyphen is a space); several, or a marked one, are layers read as a sentence.
  const layers = layersOf(pathname);
  const composite = layers.length > 1;
  // subject= says the subject as written (capitals, commas, apostrophes) and wins over the path, which is slugged.
  const said = String(params.get("subject") ?? "").replace(/\s+/g, " ").trim().slice(0, 140);
  const told = said && !ABSENT.has(slug(said)) ? said : "";
  const subject = told || (composite ? sentenceOf(layers) : layers.map(({ word }) => word).join(" ")).slice(0, composite ? 140 : 80).trim();
  const picked = dayShot(day);
  const shot = { subject: subject || DEFAULT_SUBJECT, layers: composite ? layers : null, material: MATERIAL_BY_SLUG.get(slug(params.get("material"))) ?? null, tempo: tempoOf(params.get("tempo")), named: Boolean(subject), day, read: [] };
  if (params.has("tempo")) shot.named = true;
  for (const key of Object.keys(LADDERS)) {
    const near = nearWord(params.get(key), LADDERS[key], NEAR[key]);
    if (near?.word) shot.named = true;
    if (near && near.how !== "exact") shot.read.push({ key, ...near, word: near.word ?? picked[key] });
    shot[key] = near?.word ?? picked[key];
  }
  // A light named by its direction is where the light falls from; the address's own from= wins, and agreeing with it is read too.
  const way = LIGHT_DIRECTIONS[slug(params.get("light"))];
  const ownFrom = nearWord(params.get("from"), LADDERS.from, NEAR.from)?.word;
  if (way && (!ownFrom || ownFrom === way)) {
    shot.read = shot.read.filter((r) => r.key !== "light");
    shot.read.push({ key: "from", how: "alias", asked: params.get("light"), word: way });
    shot.from = way;
    shot.named = true;
  }
  for (const key of SURFACE_KEYS) {
    // texture.website's "as drawn" palette is no palette.
    if (key === "palette" && slug(params.get(key)) === "as-drawn") { shot[key] = null; continue; }
    const near = nearWord(params.get(key), SURFACE[key], NEAR[key]);
    if (near?.word) shot.named = true;
    if (near && near.how !== "exact") shot.read.push({ key, ...near });
    shot[key] = near?.word ?? null;
  }
  return shot;
}

/** The address that reads back as this shot. */
export function addressOf(shot) {
  const query = Object.keys(LADDERS).filter((key) => slug(shot[key])).map((key) => `${key}=${slug(shot[key])}`);
  if (shot.material) query.push(`material=${shot.material.slug}`);
  for (const key of SURFACE_KEYS) if (shot[key]) query.push(`${key}=${slug(shot[key])}`);
  if (shot.tempo !== TEMPO.rest) query.push(`tempo=${shot.tempo}`);
  const layers = layersStanding(shot);
  if (layers) return `${layerPath(layers)}?${query.join("&")}`;
  const path = shot.subject === DEFAULT_SUBJECT ? "" : slug(shot.subject);
  // A subject the path cannot hold as written also travels as subject=, so a link keeps it exactly.
  if (path && path.replace(/-/g, " ") !== shot.subject) query.push(`subject=${encodeURIComponent(shot.subject)}`);
  return `/${path}?${query.join("&")}`;
}

/** The surfaces, in texture.website's words: "weathered vellum surfaces", or "worn surfaces" with no material named. */
function surfaceOf(shot) {
  const wear = shot.wear ? SURFACE_PHRASES.wear[shot.wear] : "";
  if (!shot.material && !wear) return "";
  return `${[wear, shot.material?.word].filter(Boolean).join(" ")} surfaces`;
}

/** The prompt as a sentence, for any model, and with Midjourney's parameters. */
export function promptOf(shot) {
  const sentence = [
    `${PHRASES.shot[shot.shot]} of ${shot.subject}`,
    PHRASES.focus[shot.focus],
    PHRASES.lens[shot.lens],
    PHRASES.light[shot.light],
    PHRASES.from[shot.from],
    PHRASES.move[shot.move],
    surfaceOf(shot),
    shot.process ? SURFACE_PHRASES.process[shot.process] : "",
    shot.palette ? SURFACE_PHRASES.palette[shot.palette] : "",
    "cinematic film still",
  ].filter(Boolean).join(", ");
  const sref = shot.material ? ` --sref https://texture.website/${shot.material.slug}.png ${STYLE_WEIGHT}` : "";
  return { plain: sentence, midjourney: `${sentence} --ar ${RATIOS[shot.ratio].ar}${sref} ${NO}` };
}

const under = (word) => String(word).replace(/ /g, "_");
const mod = (n, m) => ((n % m) + m) % m;
const MATERIAL_RING = [null, ...MATERIAL_OFFER.map((s) => MATERIAL_BY_SLUG.get(s)).filter(Boolean)];

/** The brackets a slot wears, so the expression reads as Spw and the word is the handle. */
const BRACKET = Object.freeze({
  shot: ["[", "]"], light: ["(", ")"], lens: ["<", ">"],
  ratio: ["[", "]"], focus: ["[", "]"], from: ["[", "]"], move: ["[", "]"], tempo: ["[", "]"],
  material: ["[", "]"], wear: ["[", "]"], process: ["[", "]"], palette: ["[", "]"],
});

/** The word a slot shows. A space is an underscore, as in the Spw. */
export function slotText(shot, key) {
  if (key === "tempo") return String(shot.tempo);
  if (key === "material") return shot.material?.slug ?? "none";
  if (SURFACE_KEYS.includes(key)) return shot[key] ? under(shot[key]) : "none";
  if (key === "ratio" || key === "from") return String(shot[key]);
  return under(shot[key]);
}

/**
 * Step one ladder from the shot's current word. Every slot is a ring, including
 * the tempo and the surfaces, so a scrub past the end comes back in the other side.
 */
export function stepKey(shot, key, by = 1) {
  if (key === "tempo") {
    const count = Math.round((TEMPO.max - TEMPO.min) / TEMPO.step) + 1;
    const i = Math.round((tempoOf(shot.tempo) - TEMPO.min) / TEMPO.step);
    return { tempo: tempoOf(TEMPO.min + mod(i + by, count) * TEMPO.step) };
  }
  if (key === "material") {
    const i = Math.max(0, MATERIAL_RING.findIndex((m) => (m?.slug ?? null) === (shot.material?.slug ?? null)));
    return { material: MATERIAL_RING[mod(i + by, MATERIAL_RING.length)] };
  }
  if (SURFACE_KEYS.includes(key)) {
    const ring = [null, ...SURFACE[key]];
    const i = Math.max(0, ring.indexOf(shot[key] ?? null));
    return { [key]: ring[mod(i + by, ring.length)] };
  }
  const words = LADDERS[key];
  if (!words) return {};
  const i = Math.max(0, words.indexOf(shot[key]));
  return { [key]: words[mod(i + by, words.length)] };
}

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

/** The shot as Spw, with each ladder's word a link to the next word on that ladder. */
const MARK_OP = { "!": "action", "^": "integration", "=": "configuration", "~": "potential", "%": "measure", "@": "perspective" };
const BRACKET_OP = { shot: "action", light: "scene", lens: "concept", ratio: "mode", focus: "mode", from: "mode", move: "mode", tempo: "mode", material: "concept", wear: "mode", process: "mode", palette: "mode" };

/**
 * The interactive Spw expression inside the card: each slot is an <a class="slot">
 * whose fallback link steps forward; JS handles horizontal drag scrubbing
 * and vertical dragging without stealing page scroll.
 */
export function expressionHtml(shot) {
  const slot = (key) => ({ key, text: slotText(shot, key) });
  const mark = (text, cls = "") => {
    const trimmed = text.trim();
    const head = trimmed[0];
    const op = cls ? "" : (MARK_OP[head] || (head === "{" || head === "}" ? "direction" : ""));
    return { text, cls, op };
  };
  const glue = (...parts) => ({ glue: true, parts });
  const free = (...parts) => ({ glue: false, parts });
  const lines = [
    [glue(mark("!shot"), slot("shot")), free(mark(`{${shot.subject}}`, "subject")), glue(slot("light")), glue(slot("lens"))],
    [free(mark("^frame{")), glue(mark(" =ratio"), slot("ratio")), glue(mark(" =focus"), slot("focus")), glue(mark(" =light_from"), slot("from")), glue(mark(" ~move"), slot("move")), glue(mark(" %tempo"), slot("tempo")), free(mark(" }"))],
    [glue(mark("@material"), slot("material")), glue(mark(" =wear"), slot("wear")), glue(mark(" =process"), slot("process")), glue(mark(" =palette"), slot("palette"))],
  ];
  const one = (part) => {
    if (!part.key) return `<span class="mark${part.cls ? ` ${part.cls}` : ""}"${part.op ? ` data-op="${part.op}"` : ""}>${esc(part.text)}</span>`;
    const [open, close] = BRACKET[part.key];
    const href = addressOf({ ...shot, ...stepKey(shot, part.key, 1) });
    const brOp = BRACKET_OP[part.key] || "";
    const brAttr = brOp ? ` data-op="${brOp}"` : "";
    const brackets = `${open ? `<span class="br"${brAttr}>${esc(open)}</span>` : ""}<span class="word">${esc(part.text)}</span>${close ? `<span class="br"${brAttr}>${esc(close)}</span>` : ""}`;
    return `<a class="slot" data-key="${part.key}" href="${esc(href)}">${brackets}</a>`;
  };
  const group = (item) => `<span class="${item.glue ? "glue" : "free"}">${item.parts.map(one).join("")}</span>`;
  return lines.map((line) => `<span class="line">${line.map(group).join("")}</span>`).join("");
}

/**
 * The shot as Spw: the mark acts, the mode is the shot, the body the subject,
 * the scene its light and the concept its lens; the frame's settings follow,
 * and a material is a path to texture.website's own line for it (written
 * without a scheme, since // would open a comment); its wear and process,
 * texture.website's words, are the surface's settings.
 */
const surfaceLines = (shot) => [
  ...(shot.material ? [`@material: ~"texture.website/${shot.material.slug}.spw"`] : []),
  ...(SURFACE_KEYS.some((key) => shot[key]) ? [`^surface{ ${SURFACE_KEYS.filter((key) => shot[key]).map((key) => `=${key}[${under(shot[key])}]`).join(" ")} }`] : []),
];

export function spwOf(shot) {
  return [
    `!shot[${under(shot.shot)}]{${shot.subject}}(${under(shot.light)})<${under(shot.lens)}>`,
    `^frame{ =ratio[${shot.ratio}] =focus[${under(shot.focus)}] =light_from[${shot.from}] ~move[${under(shot.move)}] %tempo[${shot.tempo}] }`,
    ...surfaceLines(shot),
  ].join("\n");
}

/** Text as base64url, the form factshift.center and spw.quest read from a link's #spw64= fragment. */
function base64url(text) {
  let binary = "";
  for (const byte of new TextEncoder().encode(text)) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/** What the canvas opens with: the shot's Spw, and the prompt it makes, as a phrase it can hold. */
export const canvasTextOf = (shot) => `${spwOf(shot)}\nprompt = \`${promptOf(shot).midjourney}\``;

/** The shot on factshift.center: the fragment never reaches a server. */
export const canvasHrefOf = (shot) => `https://factshift.center/#spw64=${base64url(canvasTextOf(shot))}`;

/** A three-shot sequence locking the same subject, light, lens, ratio, and surface across establishing -> medium -> close-up. */
export function beatScriptOf(shot) {
  const frames = ["establishing", "medium", "close-up"].map((framing) => {
    const step = { ...shot, shot: framing };
    return `!shot[${under(step.shot)}]{${step.subject}}(${under(step.light)})<${under(step.lens)}>`;
  });
  return [
    ...frames,
    `^frame{ =ratio[${shot.ratio}] =focus[${under(shot.focus)}] =light_from[${shot.from}] ~move[${under(shot.move)}] %tempo[${shot.tempo}] }`,
    ...surfaceLines(shot),
    `prompt = \`${promptOf(shot).midjourney}\``,
  ].join("\n");
}

/**
 * The same surface on texture.website, carrying this shot's distance, light,
 * lamp and frame in attention's own words and its wear and process in texture's;
 * texture.website reads each as its nearest rung (close-up as close, golden
 * hour as raking dawn, widescreen as plate).
 */
export function textureHrefOf(shot) {
  // from= is the lamp: texture.website turns its light to fall from the same side.
  const query = [`scale=${slug(shot.shot)}`, `light=${slug(shot.light)}`, `from=${shot.from}`, `format=${slug(shot.ratio)}`, ...SURFACE_KEYS.filter((key) => shot[key]).map((key) => `${key}=${slug(shot[key])}`)].join("&");
  const layers = layersStanding(shot);
  return `https://texture.website${layers ? layerPath(layers) : `/${shot.material ? shot.material.slug : ""}`}?${query}`;
}

/**
 * The way back to texture.website for a reader who came here to tune it. back=
 * is the address they left (a path on texture.website); it keeps everything
 * attention.productions does not hold (the layers, the palette, the lens), and
 * this shot's distance, light, lamp, frame and surface are written over it. A
 * back= that is not a path is ignored.
 */
export function textureReturnOf(shot, back = "") {
  const fresh = new URL(textureHrefOf(shot));
  if (!back || !back.startsWith("/") || back.startsWith("//")) return fresh.href;
  const there = new URL(back, "https://texture.website");
  if (there.origin !== "https://texture.website") return fresh.href;
  // A surface chosen here leads the layers; otherwise the reader's own layers stand.
  const first = decodeURIComponent(there.pathname.split("/").filter(Boolean)[0] ?? "").replace(/^[.^*~=@?!%]/, "");
  if (shot.material && slug(first) !== shot.material.slug) there.pathname = `/${shot.material.slug}`;
  for (const [key, value] of fresh.searchParams) there.searchParams.set(key, value);
  return there.href;
}

/** The three-shot beat opened on factshift.center as a multi-line storyboard script. */
export const beatHrefOf = (shot) => `https://factshift.center/#spw64=${base64url(beatScriptOf(shot))}`;

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
export function geometryOf(shot, focusDepth = SUBJECT_DEPTH, { at = null, lightAt = null } = {}) {
  const ratio = RATIOS[shot.ratio];
  const innerW = VIEW.w - VIEW.margin * 2;
  const innerH = VIEW.h - VIEW.margin * 2;
  const r = ratio.w / ratio.h;
  const fw = r >= innerW / innerH ? innerW : innerH * r;
  const fh = fw / r;
  const fx = (VIEW.w - fw) / 2;
  const fy = (VIEW.h - fh) / 2;
  // A hand dragging the focus or the lamp places them anywhere; a word places them on its mark.
  const [ax, ay] = at ?? SHAPES.focus[shot.focus];
  const px = fx + fw * ax;
  const py = fy + fh * ay;
  const shape = SHAPES.shot[shot.shot];
  const lens = SHAPES.lens[shot.lens];
  const light = SHAPES.light[shot.light];
  const [lu, lv] = lightAt ?? SHAPES.from[shot.from] ?? [ax, ay];
  const lx = fx + fw * lu;
  const ly = fy + fh * lv;
  const backlit = !lightAt && SHAPES.from[shot.from] === null;
  const beat = 84 * (shot.tempo ?? TEMPO.rest);
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
    light: { cx: round(lx), cy: round(ly), r: round(Math.max(fw, fh) * (backlit ? 0.45 : 0.95)), key: light.key, fill: light.fill, second: light.second ?? light.key },
    // The lamp a hand can drag: where the light falls from, held just inside the frame; behind the subject, just above it.
    lamp: { x: round(Math.min(fx + fw - 18, Math.max(fx + 18, backlit ? px : lx))), y: round(Math.min(fy + fh - 18, Math.max(fy + 18, backlit ? py - unit * 0.55 : ly))) },
    thirds: [1, 2].flatMap((k) => [
      { x1: round(fx + (fw * k) / 3), y1: round(fy), x2: round(fx + (fw * k) / 3), y2: round(fy + fh) },
      { x1: round(fx), y1: round(fy + (fh * k) / 3), x2: round(fx + fw), y2: round(fy + (fh * k) / 3) },
    ]),
    // Where attention sits, said under the frame: a short bar beneath the subject.
    // Its length is the move's tempo: drag its end to slow the move or quicken it.
    bar: { x1: round(px - 42), x2: round(px - 42 + beat), y: round(fy + fh + 20) },
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

/** The light's direction nearest a place in the frame: a side, or behind when the lamp is held near the subject. */
export function nearestFrom(geometry, x, y) {
  const { frame, focus } = geometry;
  let best = "behind";
  let bestD = Math.hypot(focus.x - x, focus.y - y) * 1.4;
  for (const [word, place] of Object.entries(SHAPES.from)) {
    if (!place) continue;
    const d = Math.hypot(frame.x + frame.w * place[0] - x, frame.y + frame.h * place[1] - y);
    if (d < bestD) { bestD = d; best = word; }
  }
  return best;
}

/** The tempo a bar of this length says, from where its start sits. */
export const tempoAt = (geometry, x) => tempoOf((x - geometry.bar.x1) / 84);

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

/** How deep a shot goes, widest first: a pinch steps along it (workers/lib/pinch.js). */
export const SHOT_DEPTH = Object.freeze(["establishing", "wide", "medium", "close-up", "extreme close-up"]);

/** The shot one step in (tighter) or out (wider); an overhead or a low angle stands at a medium's depth. Null past either end. */
export function stepShot(shot, direction) {
  const at = SHOT_DEPTH.indexOf(shot.shot);
  const next = (at >= 0 ? at : SHOT_DEPTH.indexOf("medium")) + (direction === "in" ? 1 : -1);
  return next >= 0 && next < SHOT_DEPTH.length ? SHOT_DEPTH[next] : null;
}
