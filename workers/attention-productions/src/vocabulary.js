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
  light: ["golden hour", "overcast", "lamplight", "window light", "sodium night", "neon", "candlelight"],
  move: ["still", "dolly-in", "handheld", "rack focus", "long exposure"],
  ratio: ["square", "portrait", "photo", "widescreen", "scope", "vertical"],
  focus: ["center", "left third", "right third", "upper third", "lower third"],
});

/** What each word adds to the prompt. An empty phrase leaves the prompt as it was. */
export const PHRASES = Object.freeze({
  shot: { "extreme close-up": "extreme close-up", "close-up": "close-up shot", medium: "medium shot", wide: "wide shot", establishing: "establishing shot", overhead: "overhead shot looking straight down", "low angle": "low-angle shot looking up" },
  lens: { "24mm": "24mm wide lens, deep focus", "35mm": "35mm lens", "50mm": "50mm lens", "85mm": "85mm lens, shallow depth of field", macro: "macro lens, razor-thin focus", anamorphic: "anamorphic lens, oval bokeh, horizontal flare" },
  light: { "golden hour": "golden hour backlight", overcast: "soft overcast light", lamplight: "warm practical lamplight", "window light": "single window light", "sodium night": "sodium streetlight at night", neon: "neon signage glow", candlelight: "candlelight" },
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
    "golden hour": { key: "#f4b45c", fill: "#2c1a24", from: [0.5, 0] },
    overcast: { key: "#c9d0d8", fill: "#22252c", from: [0.5, 0.1] },
    lamplight: { key: "#ffb36b", fill: "#20151a", from: [0.85, 0.8] },
    "window light": { key: "#f2efe6", fill: "#1a1d24", from: [0, 0.35] },
    "sodium night": { key: "#ff9930", fill: "#120c10", from: [0.7, 0] },
    neon: { key: "#ff5ad9", fill: "#170e2a", from: [1, 0.5], second: "#3cf0ff" },
    candlelight: { key: "#ffce78", fill: "#140c09", from: [0.5, 0.9] },
  },
  focus: { center: [0.5, 0.5], "left third": [1 / 3, 0.5], "right third": [2 / 3, 0.5], "upper third": [0.5, 1 / 3], "lower third": [0.5, 2 / 3] },
});

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
