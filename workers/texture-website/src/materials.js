// texture.website's materials: what exists to compose with. The rotation, the
// catalog and every reading (/paper.webp, /paper.txt, /paper.spw) come from this
// list, so a material added here changes the days ahead. `science` is a draft
// note for students, for the creator to confirm; `sidecar` and `family` find its
// provenance (generator, sources) in the asset's .spw sidecar.

/** The categories a day draws from: a ground under, a figure over. */
export const CATEGORIES = Object.freeze({
  grain: { role: "ground", says: "fibre and tooth" },
  cloth: { role: "ground", says: "woven structure" },
  wash: { role: "ground", says: "pigment in water" },
  pattern: { role: "figure", says: "a tiling" },
  plate: { role: "figure", says: "a paper maquette" },
});

const MOTIFS = "public/images/assets/motifs";

export const MATERIALS = Object.freeze([
  {
    id: "paper", name: "Paper fiber", category: "grain",
    image: `${MOTIFS}/texture-paper-fiber-display`, sidecar: `${MOTIFS}/texture-session-5.spw`, family: 0,
    meaning: "Warm cellulose grain. Reading surfaces that want to stay put.",
    science: "Cellulose fibres felted into a sheet as water drains through a screen; a deckled edge is where the pulp thinned against the mould's frame.",
  },
  {
    id: "linen", name: "Linen weave", category: "cloth",
    image: `${MOTIFS}/texture-linen-weave-display`, sidecar: `${MOTIFS}/texture-session-5.spw`, family: 1,
    meaning: "Crossed threads. Cloth memory under illustration.",
    science: "Flax bast fibre in plain weave: each weft thread passes over one warp and under the next, the simplest interlacing that holds.",
  },
  {
    id: "harlequin", name: "Harlequin diamonds", category: "pattern",
    image: `${MOTIFS}/texture-harlequin-diamonds-display`, sidecar: `${MOTIFS}/texture-session-5.spw`, family: 2,
    meaning: "Play lattice. Pattern that can carry a scene without becoming a costume.",
    science: "A rhombic tiling: one diamond, translated along two directions, covers the plane with no gaps and no overlaps.",
  },
  {
    id: "wash", name: "Cream ochre wash", category: "wash",
    image: `${MOTIFS}/texture-cream-ochre-wash-display`, sidecar: `${MOTIFS}/texture-session-5.spw`, family: 3,
    meaning: "Thin pigment on paper. A field, not a fill.",
    science: "Iron-oxide pigment suspended in water; as a wash dries, particles carried to its edges leave them darker, the coffee-ring effect.",
  },
  {
    id: "lattice", name: "Lattice plate", category: "plate",
    image: `${MOTIFS}/ornament-scaffold-lattice-display`, sidecar: `${MOTIFS}/ornament-scaffold.spw`, family: 0,
    meaning: "A paper truss pinned to linen. Structure you can see through.",
    science: "A truss carries load through triangles, the one polygon whose shape is fixed by the lengths of its sides.",
  },
  {
    id: "bone", name: "Bone plate", category: "plate",
    image: `${MOTIFS}/ornament-scaffold-bone-display`, sidecar: `${MOTIFS}/ornament-scaffold.spw`, family: 1,
    meaning: "A paper chassis. The frame a figure hangs on.",
    science: "Bone is a composite: stiff mineral crystals in a tough collagen matrix, strong where either alone would crack or bend.",
  },
  {
    id: "flow", name: "Flow plate", category: "plate",
    image: `${MOTIFS}/ornament-scaffold-flow-display`, sidecar: `${MOTIFS}/ornament-scaffold.spw`, family: 2,
    meaning: "Paper clockwork. Motion drawn as parts that touch.",
    science: "Gears pass motion by meshing teeth; the ratio of their tooth counts is the ratio of their turns.",
  },
]);

/**
 * A layer's law is the mark before its word, read as factshift.center reads a
 * body's mark (its LAW_SAYS), and drawn here as a blend over the layer below.
 */
export const LAWS = Object.freeze({
  "": { blend: "normal", opacity: 1, says: "as it is" },
  ".": { blend: "multiply", opacity: 0.6, says: "settles: ground" },
  "^": { blend: "screen", opacity: 0.85, says: "lifts: ascension" },
  "*": { blend: "multiply", opacity: 1, says: "is heavy: value" },
  "~": { blend: "soft-light", opacity: 1, says: "drifts: potential", drift: true },
  "=": { blend: "normal", opacity: 0.5, says: "holds still: configuration" },
  "@": { blend: "overlay", opacity: 0.9, says: "leans in: perspective", scale: 1.6 },
  "?": { blend: "difference", opacity: 0.8, says: "opens out: wonder" },
  "!": { blend: "hard-light", opacity: 0.8, says: "makes room: action", scale: 0.6 },
  "%": { blend: "luminosity", opacity: 0.9, says: "levels: measure" },
});

/** A speech bubble's shape by the mark it is asked as, as spw.quest draws them. */
export const BUBBLES = Object.freeze({ "~": "thought", "?": "question", "!": "burst", ".": "statement" });
