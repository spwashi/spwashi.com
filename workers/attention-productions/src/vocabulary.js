// attention.productions' vocabulary: the words a shot is made of. texture.website
// says what a surface is; this says where the eye goes in a frame. Each ladder is
// a row of words, each word written into a Midjourney prompt as its phrase, and
// each drawn by the page's viewfinder (assets/attention.js) as a number in
// SHAPES. This file is copied byte for byte into assets/ (carry.mjs), so the page
// and the tests read the same words. A draft for the creator to tune.

/** The ladders, in the order the page shows them. */
export const LADDERS = Object.freeze({
  shot: ["extreme close-up", "close-up", "medium", "wide", "establishing", "overhead", "low angle"],
  lens: ["24mm", "35mm", "50mm", "85mm", "macro", "anamorphic"],
  light: ["golden hour", "raking dawn", "noon", "overcast", "window light", "lamplight", "candlelight", "sodium night", "neon"],
  from: ["above", "left", "right", "below", "behind"],
  move: ["still", "dolly-in", "handheld", "rack focus", "long exposure"],
  ratio: ["square", "portrait", "photo", "widescreen", "scope", "vertical"],
  focus: ["center", "left third", "right third", "upper third", "lower third"],
});

/**
 * The neighbours' words for each ladder, read by workers/lib/near-word.js, so a
 * link from texture.website, spwashi.com or a hand lands on the rung it means.
 * Shot holds texture.website's scale (its focal radius, macro to far). Focus
 * holds depth: what is near sits low in a frame, what is far sits high, so
 * foreground reads as the lower third and background as the upper. Light
 * holds texture.website's five lights as its own words. A word with no rung
 * here (orbit, drift) is left for the day to pick, and the page says so.
 */
export const NEAR = Object.freeze({
  shot: {
    aliases: {
      macro: "extreme close-up", ecu: "extreme close-up", detail: "extreme close-up", insert: "extreme close-up",
      cu: "close-up", close: "close-up", "arm-s-length": "medium", mid: "medium", ms: "medium", room: "wide",
      ws: "wide", full: "wide", far: "establishing", ls: "establishing", master: "establishing",
      "top-down": "overhead", "flat-lay": "overhead", "birds-eye": "overhead", low: "low angle", "worms-eye": "low angle", hero: "low angle",
    },
  },
  lens: {
    aliases: { "90mm": "macro", "100mm": "macro", "105mm": "macro", "macro-lens": "macro", scope: "anamorphic", cinemascope: "anamorphic" },
    measures: { "24mm": 24, "35mm": 35, "50mm": 50, "85mm": 85 },
  },
  light: {
    aliases: {
      dusk: "golden hour", sunset: "golden hour", "magic-hour": "golden hour", "raking-sun": "raking dawn", raking: "raking dawn", dawn: "raking dawn", sunrise: "raking dawn", grazing: "raking dawn",
      midday: "noon", "high-sun": "noon", harsh: "noon", "hard-sun": "noon", cloudy: "overcast", diffuse: "overcast", soft: "overcast",
      tungsten: "lamplight", lamp: "lamplight", incandescent: "lamplight", practical: "lamplight",
      daylight: "window light", window: "window light", streetlight: "sodium night", sodium: "sodium night", candle: "candlelight",
    },
  },
  from: {
    aliases: { top: "above", overhead: "above", bottom: "below", under: "below", uplight: "below", back: "behind", backlight: "behind", backlit: "behind", rim: "behind" },
  },
  move: {
    aliases: {
      static: "still", locked: "still", "locked-off": "still", push: "dolly-in", "push-in": "dolly-in", dolly: "dolly-in", "track-in": "dolly-in",
      shaky: "handheld", documentary: "handheld", rack: "rack focus", "pull-focus": "rack focus", exposure: "long exposure", "drag-shutter": "long exposure",
    },
  },
  ratio: {
    aliases: {
      tile: "square", sheet: "portrait", instagram: "portrait", plate: "widescreen", academy: "photo", imax: "photo", flat: "widescreen",
      cinemascope: "scope", anamorphic: "scope", story: "vertical", reel: "vertical",
    },
    measures: { square: 1, portrait: 0.8, photo: 1.5, widescreen: 16 / 9, scope: 2.39, vertical: 9 / 16 },
  },
  wear: { aliases: { new: "pristine", mint: "pristine", clean: "pristine", used: "handled", aged: "weathered", distressed: "weathered", broken: "ruined", wrecked: "ruined" } },
  process: { aliases: { none: "as found", raw: "as found", natural: "as found", engraved: "engraving", etching: "engraving", etched: "engraving", embossed: "relief", blueprint: "cyanotype", "sun-print": "cyanotype" } },
  focus: {
    aliases: {
      near: "lower third", foreground: "lower third", fg: "lower third", far: "upper third", deep: "upper third", background: "upper third",
      bg: "upper third", horizon: "upper third", mid: "center", middle: "center", midground: "center", centre: "center",
    },
  },
});

/** Lights named by where they fall from. light=backlight is from=behind, unless the address names its own from. */
export const LIGHT_DIRECTIONS = Object.freeze({ backlight: "behind", backlit: "behind", rim: "behind", "rim-light": "behind", toplight: "above", "top-light": "above", underlight: "below", uplight: "below", sidelight: "left", "side-light": "left" });

/** What each word adds to the prompt. An empty phrase leaves the prompt as it was. */
export const PHRASES = Object.freeze({
  shot: { "extreme close-up": "extreme close-up", "close-up": "close-up shot", medium: "medium shot", wide: "wide shot", establishing: "establishing shot", overhead: "overhead shot looking straight down", "low angle": "low-angle shot looking up" },
  lens: { "24mm": "24mm wide lens, deep focus", "35mm": "35mm lens", "50mm": "50mm lens", "85mm": "85mm lens, shallow depth of field", macro: "macro lens, razor-thin focus", anamorphic: "anamorphic lens, oval bokeh, horizontal flare" },
  from: { above: "lit from above", left: "key light from the left", right: "key light from the right", below: "lit from below", behind: "backlit, rim light" },
  light: { "golden hour": "golden hour backlight", "raking dawn": "low raking dawn light grazing every surface", noon: "hard noon sun, short black shadows", overcast: "soft overcast light", lamplight: "warm practical lamplight", "window light": "single window light", "sodium night": "sodium streetlight at night", neon: "neon signage glow", candlelight: "candlelight" },
  move: { still: "", "dolly-in": "slow dolly-in", handheld: "handheld, slight motion", "rack focus": "rack focus", "long exposure": "long exposure motion blur" },
  ratio: { square: "", portrait: "", photo: "", widescreen: "", scope: "", vertical: "" },
  focus: { center: "subject centered", "left third": "subject on the left third", "right third": "subject on the right third", "upper third": "subject on the upper third", "lower third": "subject on the lower third" },
});

/**
 * Each ratio as Midjourney takes it and as the viewfinder draws it. --ar takes
 * whole numbers only, so 2.39:1 is written 239:100
 * (https://docs.midjourney.com/aspect-ratios, read 2026-11-16).
 */
export const RATIOS = Object.freeze({
  square: { ar: "1:1", w: 1, h: 1 },
  portrait: { ar: "4:5", w: 4, h: 5 },
  photo: { ar: "3:2", w: 3, h: 2 },
  widescreen: { ar: "16:9", w: 16, h: 9 },
  scope: { ar: "239:100", w: 239, h: 100 },
  vertical: { ar: "9:16", w: 9, h: 16 },
});

/**
 * What the viewfinder draws for each word, as numbers: how large the subject
 * stands (scale), how hard the lens throws what is off its plane out of focus
 * (blur), where a light falls from and its two colours (key, fill), and where
 * the thirds put the eye.
 */
export const SHAPES = Object.freeze({
  shot: { "extreme close-up": { scale: 1.7 }, "close-up": { scale: 1.3 }, medium: { scale: 0.95 }, wide: { scale: 0.62 }, establishing: { scale: 0.42 }, overhead: { scale: 0.8, flat: true }, "low angle": { scale: 0.9, tilt: -9 } },
  lens: { "24mm": { blur: 0.3 }, "35mm": { blur: 0.55 }, "50mm": { blur: 0.8 }, "85mm": { blur: 1.25 }, macro: { blur: 1.7 }, anamorphic: { blur: 1, flare: true } },
  light: {
    "golden hour": { key: "#f4b45c", fill: "#2c1a24" },
    "raking dawn": { key: "#ffc4a0", fill: "#1d1a2a" },
    noon: { key: "#fffbef", fill: "#2a3140" },
    overcast: { key: "#c9d0d8", fill: "#22252c" },
    lamplight: { key: "#ffb36b", fill: "#20151a" },
    "window light": { key: "#f2efe6", fill: "#1a1d24" },
    "sodium night": { key: "#ff9930", fill: "#120c10" },
    neon: { key: "#ff5ad9", fill: "#170e2a", second: "#3cf0ff" },
    candlelight: { key: "#ffce78", fill: "#140c09" },
  },
  // Where the light falls from, as a place on the frame (0 to 1 across and down); behind is the subject itself, lit from the back.
  from: { above: [0.5, 0], left: [0, 0.42], right: [1, 0.42], below: [0.5, 1], behind: null },
  focus: { center: [0.5, 0.5], "left third": [1 / 3, 0.5], "right third": [2 / 3, 0.5], "upper third": [0.5, 1 / 3], "lower third": [0.5, 2 / 3] },
});

/** The move's tempo, a multiplier of its speed: drawn by the bar under the frame, written as %tempo[n] in Spw, and kept out of the prompt. */
export const TEMPO = Object.freeze({ min: 0.5, max: 2, step: 0.1, rest: 1 });

/** The subject when the address names none: what holds the frame when nothing else does. */
export const DEFAULT_SUBJECT = "a laminated folio";

/** A few of texture.website's materials to offer as the frame's surface; any of its listed words works by address. */
export const MATERIAL_OFFER = Object.freeze(["vellum", "terrazzo", "brushed-steel", "rain-on-glass", "risograph-ink", "moss"]);

/** What a prompt always ends with, as texture.website's starters end. */
export const NO = "--no text, letters, logo, watermark";

/** How strongly a material's image steers the look, as texture.website's starters write it. */
export const STYLE_WEIGHT = "--sw 250";

/** Where each Midjourney parameter used here is documented. Parameters change between versions. */
export const SOURCES = Object.freeze({
  aspect: "https://docs.midjourney.com/aspect-ratios",
  sref: "https://docs.midjourney.com/hc/en-us/articles/32180011136653-Style-Reference",
  no: "https://docs.midjourney.com/hc/en-us/articles/32173351982093-No",
});
