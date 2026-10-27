// The spw.quest front door: the steps first, then the language they open onto, with installation one link away.
// Operator names follow the workbench's reader vocabulary
// (.spw/_workbench/docs/theory/spw/operators.spw); the route test holds them to it.

/** The twelve single sigils. `does` restates the workbench runtime table in plain words. The <> couple is not shown as a sigil. */
// Workbench relation: harmony. The workbench's reader vocabulary, held by the route test.
export const OPERATORS = Object.freeze([
  { sigil: "~", name: "potential", reads: "Keep a path open without taking it.", does: "Defers its first argument." },
  { sigil: "?", name: "wonder", reads: "Open a question you can close again.", does: "Returns the second argument when the first is true." },
  { sigil: "!", name: "action", reads: "Commit a move so its consequence can be seen.", does: "Returns its first argument." },
  { sigil: "*", name: "value", reads: "Mark what carries weight here.", does: "Writes and returns a collapsed first argument." },
  { sigil: ".", name: "ground", reads: "Come back to the local default.", does: "Reads a property path, or the base value." },
  { sigil: "^", name: "ascension", reads: "Lift parts into one relation you can inspect.", does: "Wraps its arguments as one integrated value." },
  { sigil: "#", name: "vibration", reads: "Name a structure so it can be found again.", does: "Reduces its arguments into a register." },
  { sigil: "@", name: "perspective", reads: "Say who is looking, and from where.", does: "Observes its first argument through a named observer." },
  { sigil: "&", name: "subject", reads: "Name what the relation is about.", does: "Merges its arguments into one register." },
  { sigil: "=", name: "configuration", reads: "Keep this here, under this name.", does: "Writes its first argument to a register." },
  { sigil: "%", name: "measure", reads: "Compare, weigh, or level the field.", does: "Measures a named or focused register." },
  { sigil: "$", name: "substrate", reads: "Name what carries the charge: time, money, memory, attention.", does: "Materializes a register's metadata." },
]);

/** The four interpretive brace profiles, in the order the compositional form reads them. */
export const CONTAINERS = Object.freeze([
  { open: "<", close: ">", name: "concept", reads: "What this is about." },
  { open: "(", close: ")", name: "scene", reads: "Where it happens." },
  { open: "[", close: "]", name: "mode", reads: "Which lens you are using." },
  { open: "{", close: "}", name: "definition", reads: "What belongs together inside it." },
]);

/** What a # particle's aim adds when the reader meets one in a line. */
export const PARTICLE_AIMS = Object.freeze({
  ">": "A frame address: the name this page answers to, so other pages can point here.",
  ":": "A layer: what kind of writing this is.",
  "!": "A tag for this one.",
});
