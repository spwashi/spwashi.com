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
    materials: ["ledger paper", "kraft paper", "vellum", "mulberry paper", "parchment", "newsprint", "card stock", "tracing paper"],
  },
  textile: {
    science: "Yarns interlaced or looped; the weave or knit, not only the fibre, sets how a cloth drapes, catches light and wears.",
    qualities: ["tight weave", "raised pile", "slubbed yarn", "worn nap", "visible stitching"],
    materials: ["linen", "moquette", "bouclé", "brocade", "felt", "quilted satin", "gingham", "velvet", "ripstop", "tweed"],
  },
  stone: {
    science: "Minerals bound by heat, pressure or cement; the grain size and what fills the gaps between grains decide its pattern and polish.",
    qualities: ["polished face", "honed matte", "veining", "fine aggregate", "chipped arris"],
    materials: ["marble", "terrazzo", "slate", "travertine", "granite", "rammed earth", "lime plaster", "board-formed concrete"],
  },
  wood: {
    science: "Cellulose fibres laid down in yearly rings; cutting across, along or around the rings shows end grain, straight grain or figure.",
    qualities: ["open grain", "end grain", "oiled sheen", "saw marks", "knots"],
    materials: ["oak", "cork", "plywood edge", "walnut burl", "bamboo", "driftwood"],
  },
  metal: {
    science: "Crystals of metal, worked by hammer, roller or brush; the surface keeps every tool's direction, and air adds its own colour as patina.",
    qualities: ["brushed direction", "hammered dimples", "patina", "enamel chips", "rivets"],
    materials: ["brushed steel", "patinated copper", "enamelware", "pewter", "galvanized sheet", "chrome"],
  },
  glass: {
    science: "A cooled liquid with no crystal order; it bends light at every surface, so texture in glass is mostly what it does to what lies behind it.",
    qualities: ["frosted", "bubbled", "rain beads", "lead cames", "bevelled edge"],
    materials: ["rain on glass", "frosted glass", "stained glass", "bottle glass", "pressed glass"],
  },
  ceramic: {
    science: "Clay fired until its grains fuse; a glaze is glass melted on top, and the crackle is the glaze and body shrinking by different amounts.",
    qualities: ["crackle glaze", "grout lines", "speckled body", "unglazed foot", "drip"],
    materials: ["glazed tile", "terracotta", "porcelain", "zellige", "raku"],
  },
  pigment: {
    science: "Coloured particles carried in a binder or water; how the particles settle as the carrier leaves makes washes, blooms and granulation.",
    qualities: ["granulation", "bloom edges", "misregistration", "flat ink", "brush drag"],
    materials: ["watercolour wash", "gouache", "ink bloom", "risograph ink", "chalk pastel", "lacquer"],
  },
  polymer: {
    science: "Long chain molecules, moulded or cast; the mould's surface is copied exactly, so studs, grain and gloss are all made on purpose.",
    qualities: ["moulded studs", "satin gloss", "embossed grain", "seams", "scuffs"],
    materials: ["rubber stud flooring", "vinyl", "foam", "cast resin", "linoleum"],
  },
  organic: {
    science: "Material a living thing made: cells and fibres arranged for a job, which is why bark, crust and honeycomb pattern themselves.",
    qualities: ["growth rings", "cells", "crumb", "lichen", "fuzz"],
    materials: ["pie crust", "flour on marble", "moss", "bark", "honeycomb", "orange peel"],
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
});

/** What each ladder word adds to the sentence. */
export const PHRASES = Object.freeze({
  scale: { macro: "macro detail", close: "close view", "arm's length": "at arm's length", room: "across a room", far: "seen from afar" },
  light: { "raking dawn": "raking dawn light", overcast: "soft overcast light", noon: "flat noon light", lamplight: "warm lamplight", "sodium night": "sodium streetlight at night" },
  wear: { pristine: "pristine", handled: "lightly handled", worn: "worn", weathered: "weathered", ruined: "ruined and broken" },
  process: { "as found": "", riso: "printed as a two-colour risograph", engraving: "rendered as a fine line engraving", relief: "in low relief", posterized: "posterized into flat tones", cyanotype: "as a cyanotype print" },
  scene: { wall: "for a wall", floor: "underfoot, as a floor", table: "as a tabletop", costume: "as a costume fabric", sky: "as a sky backdrop", page: "as a printed page" },
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
