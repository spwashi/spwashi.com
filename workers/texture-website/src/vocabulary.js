// texture.website's vocabulary: material words in classes, and the ladders of
// words that tune a prompt. Every word here is written into a prompt as it is,
// so each is concrete, tactile and viable for an image model. The page sketches
// a word by its class (a drawn base, then lit, worn and printed by an SVG filter);
// a word not listed still works, as a material of no known class. `science` is a
// draft note per class for students, for the creator to confirm.

export const CLASSES = Object.freeze({
  paper: {
    science: "Plant fibres felted into a sheet; how long the fibres are and how the sheet is pressed decide its tooth, its translucency and how it takes ink.",
    qualities: ["deckled edges", "visible fibre", "soft tooth", "faint ruling", "foxing"],
    materials: ["ledger paper", "kraft paper", "vellum", "mulberry paper", "parchment", "newsprint", "card stock", "tracing paper", "blueprint", "carbon copy", "marbled endpaper"],
  },
  textile: {
    science: "Yarns interlaced or looped; the weave or knit, not only the fibre, sets how a cloth drapes, catches light and wears.",
    qualities: ["tight weave", "raised pile", "slubbed yarn", "worn nap", "visible stitching"],
    materials: ["linen", "moquette", "bouclé", "brocade", "felt", "quilted satin", "gingham", "velvet", "ripstop", "tweed", "darned wool", "tapestry back"],
  },
  stone: {
    science: "Minerals bound by heat, pressure or cement; the grain size and what fills the gaps between grains decide its pattern and polish.",
    qualities: ["polished face", "honed matte", "veining", "fine aggregate", "chipped arris"],
    materials: ["marble", "terrazzo", "slate", "travertine", "granite", "rammed earth", "lime plaster", "board-formed concrete", "fossil limestone", "pumice"],
  },
  wood: {
    science: "Cellulose fibres laid down in yearly rings; cutting across, along or around the rings shows end grain, straight grain or figure.",
    qualities: ["open grain", "end grain", "oiled sheen", "saw marks", "knots"],
    materials: ["oak", "cork", "plywood edge", "walnut burl", "bamboo", "driftwood"],
  },
  metal: {
    science: "Crystals of metal, worked by hammer, roller or brush; the surface keeps every tool's direction, and air adds its own colour as patina.",
    qualities: ["brushed direction", "hammered dimples", "patina", "enamel chips", "rivets"],
    materials: ["brushed steel", "patinated copper", "enamelware", "pewter", "galvanized sheet", "chrome", "pressed tin ceiling", "gold leaf"],
  },
  glass: {
    science: "A cooled liquid with no crystal order; it bends light at every surface, so texture in glass is mostly what it does to what lies behind it.",
    qualities: ["frosted", "bubbled", "rain beads", "lead cames", "bevelled edge"],
    materials: ["rain on glass", "frosted glass", "stained glass", "bottle glass", "pressed glass", "sea glass", "dichroic glass"],
  },
  ceramic: {
    science: "Clay fired until its grains fuse; a glaze is glass melted on top, and the crackle is the glaze and body shrinking by different amounts.",
    qualities: ["crackle glaze", "grout lines", "speckled body", "unglazed foot", "drip"],
    materials: ["glazed tile", "terracotta", "porcelain", "zellige", "raku", "kintsugi"],
  },
  pigment: {
    science: "Coloured particles carried in a binder or water; how the particles settle as the carrier leaves makes washes, blooms and granulation.",
    qualities: ["granulation", "bloom edges", "misregistration", "flat ink", "brush drag"],
    materials: ["watercolour wash", "gouache", "ink bloom", "risograph ink", "chalk pastel", "lacquer", "suminagashi marbling", "verdigris paint"],
  },
  polymer: {
    science: "Long chain molecules, moulded or cast; the mould's surface is copied exactly, so studs, grain and gloss are all made on purpose.",
    qualities: ["moulded studs", "satin gloss", "embossed grain", "seams", "scuffs"],
    materials: ["rubber stud flooring", "vinyl", "foam", "cast resin", "linoleum", "bakelite", "holographic foil"],
  },
  organic: {
    science: "Material a living thing made: cells and fibres arranged for a job, which is why bark, crust and honeycomb pattern themselves.",
    qualities: ["growth rings", "cells", "crumb", "lichen", "fuzz"],
    materials: ["pie crust", "flour on marble", "moss", "bark", "honeycomb", "orange peel", "mother of pearl", "moth wing scales"],
  },
  phenomenon: {
    science: "Patterns no one made: water, salt, frost and oxidation arranging themselves as they move, dry or grow, each by a rule a student can name.",
    qualities: ["branching", "concentric rings", "iridescence", "crystalline edges", "ripple marks"],
    materials: ["frost ferns", "salt bloom", "oil sheen on water", "rust bloom", "tide ripples in sand", "crazed mud", "soap film", "lichen map"],
  },
});

/** A word as a path segment: lower case, hyphens for spaces. */
export const slug = (word) => word.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

/** Every listed material: its word, its slug and its class. */
export const MATERIALS = Object.freeze(Object.entries(CLASSES).flatMap(([cls, { materials }]) => materials.map((word) => ({ word, slug: slug(word), cls }))));

/**
 * The ladders: each dimension is a row of words, written into the prompt as
 * they stand. The page reads a ladder's key from the query (light=sodium-night)
 * and sketches the word as well as writing it.
 */
export const LADDERS = Object.freeze({
  scale: ["macro", "close", "arm's length", "room", "far"],
  light: ["raking dawn", "overcast", "noon", "lamplight", "sodium night"],
  wear: ["pristine", "handled", "worn", "weathered", "ruined"],
  process: ["as found", "riso", "engraving", "relief", "posterized", "cyanotype"],
  scene: ["wall", "floor", "table", "costume", "sky", "page"],
  format: ["tile", "plate", "sheet"],
  // A lens is a genre in the making, said as an aesthetic; none leaves the sentence plain.
  lens: ["none", "risograph botanica", "civic brutalism", "lunar laundromat", "folk-tech embroidery", "deep-sea archive", "tidepool baroque", "midnight municipal"],
  // Story ladders, read in StoryDesigner@: the moment the scene holds and what someone left in it.
  beat: ["none", "arrival", "discovery", "waiting", "aftermath", "return"],
  trace: ["none", "footprints", "a dropped glove", "candle wax", "chalk marks", "pooled rain"],
  // The square style card: what its band says, and the band's tone. They shape the card, not the prompt.
  face: ["title", "prompt", "spw", "facets"],
  tone: ["paper", "ink", "signal"],
});

/** What each ladder word adds to the sentence. */
export const PHRASES = Object.freeze({
  scale: { macro: "macro detail", close: "close view", "arm's length": "at arm's length", room: "across a room", far: "seen from afar" },
  light: { "raking dawn": "raking dawn light", overcast: "soft overcast light", noon: "flat noon light", lamplight: "warm lamplight", "sodium night": "sodium streetlight at night" },
  wear: { pristine: "pristine", handled: "lightly handled", worn: "worn", weathered: "weathered", ruined: "ruined and broken" },
  process: { "as found": "", riso: "printed as a two-colour risograph", engraving: "rendered as a fine line engraving", relief: "in low relief", posterized: "posterized into flat tones", cyanotype: "as a cyanotype print" },
  scene: { wall: "for a wall", floor: "underfoot, as a floor", table: "as a tabletop", costume: "as a costume fabric", sky: "as a sky backdrop", page: "as a printed page" },
  lens: Object.fromEntries(["none", "risograph botanica", "civic brutalism", "lunar laundromat", "folk-tech embroidery", "deep-sea archive", "tidepool baroque", "midnight municipal"].map((w) => [w, w === "none" ? "" : `${w} aesthetic`])),
  beat: { none: "", arrival: "the moment someone arrives", discovery: "just before something is found", waiting: "while someone waits", aftermath: "after everyone has left", return: "as someone returns" },
  trace: { none: "", footprints: "with footprints across it", "a dropped glove": "with a dropped glove", "candle wax": "with drips of candle wax", "chalk marks": "with a child's chalk marks", "pooled rain": "with rain pooling on it" },
});

/** Each format's parameters for Midjourney; the plain prompt leaves them off. */
export const FORMATS = Object.freeze({
  tile: { lead: "seamless repeating texture of", params: "--tile --ar 1:1" },
  plate: { lead: "wide backdrop of", params: "--ar 16:9" },
  sheet: { lead: "flat sheet of", params: "--ar 4:5" },
});

/** A mark before a word is how it meets the material before it, said in the sentence and drawn as a blend. */
export const RELATIONS = Object.freeze({
  "": { says: "with", blend: "normal", opacity: 0.55 },
  ".": { says: "settled into", blend: "multiply", opacity: 0.6 },
  "^": { says: "lifted over", blend: "screen", opacity: 0.8 },
  "*": { says: "heavy with", blend: "multiply", opacity: 1 },
  "~": { says: "drifting through", blend: "soft-light", opacity: 1, drift: true },
  "=": { says: "held against", blend: "normal", opacity: 0.5 },
  "@": { says: "seen through", blend: "overlay", opacity: 0.9 },
  "?": { says: "broken by", blend: "difference", opacity: 0.8 },
  "!": { says: "cut with", blend: "hard-light", opacity: 0.8 },
  "%": { says: "measured against", blend: "luminosity", opacity: 0.9 },
});

/**
 * Prompting techniques, each said in a line and tied to where it is documented,
 * so a reader learns one with each pivot that uses it. Midjourney's docs (and the
 * third-party guide named for the V8 raw flag) were read through search on
 * 2026-11-11; parameters change between versions, so each says where to check.
 */
const DOCS = "https://docs.midjourney.com/hc/en-us/articles";
export const TECHNIQUES = Object.freeze({
  describe: { name: "Say what you want", syntax: "subject, medium, setting, light, colour, mood, composition", note: "Name what should be there rather than what should not; a few specific words beat many vague ones.", source: `${DOCS}/32023408776205-Prompt-Basics` },
  tile: { name: "Seamless tile", syntax: "--tile", note: "An image whose edges meet, for surfaces that repeat; not with draft speed.", source: `${DOCS}/32859204029709-Parameter-List` },
  permute: { name: "Permutations", syntax: "{a, b, c}", note: "Braces make one job per option; plans cap the count (4 on Basic) and they run in Fast or Turbo.", source: `${DOCS}/32761322355597-Permutations` },
  weigh: { name: "Multi-prompts and weights", syntax: "a::2 b::1", note: "A double colon weighs ideas apart; a negative weight excludes, and --no is a weight of -0.5.", source: `${DOCS}/32658968492557-Multi-Prompts-Weights` },
  exclude: { name: "Exclude", syntax: "--no text, logo", note: "Removes what keeps appearing, rather than describing around it.", source: `${DOCS}/32173351982093-No` },
  chaos: { name: "Chaos", syntax: "--chaos 0 to 100", note: "How far apart the results of one job are from each other.", source: `${DOCS}/32859204029709-Parameter-List` },
  weird: { name: "Weird", syntax: "--weird 0 to 3000", note: "Pushes toward the unusual; small values first.", source: `${DOCS}/32859204029709-Parameter-List` },
  stylize: { name: "Stylize", syntax: "--stylize 0 to 1000", note: "How strongly Midjourney's own taste is applied; 100 by default.", source: `${DOCS}/32859204029709-Parameter-List` },
  raw: { name: "Raw", syntax: "--raw (V8), --style raw (V7)", note: "Less default polish, closer to the words; the V8 flag is from a third-party guide.", source: "https://blakecrosley.com/guides/midjourney" },
  sref: { name: "Style reference", syntax: "--sref URL or code, --sw 0 to 1000", note: "Borrows a look; --sref random draws a new code per image, worth keeping when it works.", source: `${DOCS}/32180011136653-Style-Reference` },
  seed: { name: "Seed", syntax: "--seed n", note: "The same seed and prompt start from the same noise, so one change can be compared.", source: `${DOCS}/32859204029709-Parameter-List` },
});

/** Pivots: one move each that turns a prompt into a neighbouring one, and the technique it teaches. */
export const PIVOTS = Object.freeze([
  { id: "invert", label: "invert", technique: "describe", says: "the figure becomes the ground" },
  { id: "permute", label: "permute", technique: "permute", says: "one ladder becomes four jobs" },
  { id: "weigh", label: "weigh", technique: "weigh", says: "the first material counts twice" },
  { id: "chaos", label: "chaos", technique: "chaos", says: "results spread apart", steps: [0, 25, 50, 100] },
  { id: "weird", label: "weird", technique: "weird", says: "results turn strange", steps: [0, 250, 1000] },
  { id: "stylize", label: "stylize", technique: "stylize", says: "Midjourney's own taste, more or less", steps: [100, 250, 750, 0] },
  { id: "raw", label: "raw", technique: "raw", says: "closer to the words" },
  { id: "sref", label: "sref random", technique: "sref", says: "a new style code to keep" },
  { id: "seed", label: "seed", technique: "seed", says: "a fixed start, to compare one change" },
  { id: "lens", label: "lens", technique: "describe", says: "a genre in the making" },
]);

/** The views: a name before @ is whose eyes the page is seen through. */
export const VIEWS = Object.freeze({
  minimalist: { name: "Minimalist@", says: "the stage and one short prompt" },
  "prompt-engineer": { name: "PromptEngineer@", says: "every part of the prompt named, every pivot and technique" },
  "story-designer": { name: "StoryDesigner@", says: "a scene with a moment and a trace" },
});
