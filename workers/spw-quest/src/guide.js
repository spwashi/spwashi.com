// The spw.quest front door: an introduction to the language, with installation one link away.
// Operator names follow the workbench's reader vocabulary
// (.spw/_workbench/docs/theory/spw/operators.spw); the route test holds them to it.

/** Twelve single sigils and the <> couple. `does` restates the workbench runtime table in plain words. */
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
  { sigil: "<>", name: "coupling", reads: "Tie two things so each can reach the other.", does: "Links two string keys in both directions." },
]);

/** The four interpretive brace profiles, in the order the compositional form reads them. */
export const CONTAINERS = Object.freeze([
  { open: "<", close: ">", name: "concept", reads: "What this is about." },
  { open: "(", close: ")", name: "scene", reads: "Where it happens." },
  { open: "[", close: "]", name: "mode", reads: "Which lens you are using." },
  { open: "{", close: "}", name: "definition", reads: "What belongs together inside it." },
]);

/** Parsed with the workbench CLI (`spw fingerprint`): complete, no stray prose. */
export const EXAMPLE = `#>morning_pages
#:journal #!sunday

@yesterday: ~"./2026-09-27.spw"

^"entry"{
  noticed = \`the dream kept circling back\`
  wonder = \`why the same door every time\`
  next = #[\`one page\`, \`the walk\`]
}[reg=facet]`;

export const EXAMPLE_NOTES = Object.freeze([
  { code: "#>morning_pages", note: "A frame: the name this file answers to. Other files can point here." },
  { code: "#:journal #!sunday", note: "A layer line: what kind of writing this is, and a tag for this one." },
  { code: "@yesterday: ~\"./2026-09-27.spw\"", note: "A perspective held as potential: yesterday's page, reachable but not pulled in." },
  { code: "^\"entry\"{ … }", note: "Ascension over a definition: the parts inside are one entry you can inspect whole." },
  { code: "noticed = `…`", note: "Configuration: a value kept under a name. Backticks hold a phrase as written." },
  { code: "next = #[ … ]", note: "Vibration over a mode bracket: a set, two things to do next." },
  { code: "[reg=facet]", note: "A mode after the braces: read this entry as a facet, a property sheet." },
]);

/** Who might enjoy it. It was not built for any of them; it may still be for them. */
export const READERS = Object.freeze([
  { who: "People who wonder why languages are shaped the way they are", why: "Each sigil is a small claim about what a word is doing. The claims are argued in the open, in the repository's theory files." },
  { who: "People who enjoy symmetry", why: "Open and close, before and after, prefix and postfix. Four brace pairs, and operators that compose with them into register frames like #[…] and .{…}." },
  { who: "People who like plugins and IDEs", why: "A parser, a CLI, and a language server. Plain-text files gain frames, references, and structure an editor can navigate." },
  { who: "People who wonder about maintained software", why: "The workbench is kept like a garden: pinned revisions, a doctor command, and plans that say what changed and why." },
  { who: "People who journal", why: "A page stays a page. Spw only adds handles, so last Tuesday's note can be found, linked, and read again." },
]);
