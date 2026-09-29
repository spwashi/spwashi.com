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

/**
 * The spiral the hero draws: an Archimedean turn (r = bθ) with the operators
 * placed at equal arc lengths from the center outward, so neighbors never
 * crowd and each sigil keeps a 44px target at phone width. Deterministic:
 * the worker computes it once per request, and no script is needed to see it.
 */
export function spiral({ count = OPERATORS.length, b = 18.8, start = 40, gap = 60, radius = 28, samples = 180 } = {}) {
  const thetaAt = (arc) => Math.sqrt((2 * arc) / b); // arc ≈ bθ²/2 for r = bθ
  const round = (n) => Math.round(n * 10) / 10;
  const point = (theta) => [round(b * theta * Math.cos(theta)), round(b * theta * Math.sin(theta))];
  const end = thetaAt(start + (count - 1) * gap) + 0.6;
  const line = Array.from({ length: samples + 1 }, (_, i) => point((end * i) / samples));
  const path = line.map(([x, y], i) => `${i ? "L" : "M"}${x} ${y}`).join("");
  const nodes = Array.from({ length: count }, (_, k) => {
    const [x, y] = point(thetaAt(start + k * gap));
    return { x, y };
  });
  const extent = Math.ceil(b * end) + radius + 4;
  // Fit the view to what is drawn (nodes with their radius, and the line), so no empty band frames it.
  const pad = radius + 4;
  const xs = [...nodes.flatMap((n) => [n.x - pad, n.x + pad]), ...line.map(([x]) => x - 4), ...line.map(([x]) => x + 4)];
  const ys = [...nodes.flatMap((n) => [n.y - pad, n.y + pad]), ...line.map(([, y]) => y - 4), ...line.map(([, y]) => y + 4)];
  const [minX, maxX, minY, maxY] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)].map(Math.round);
  const viewBox = `${minX} ${minY} ${maxX - minX} ${maxY - minY}`;
  return { path, nodes, extent, radius, viewBox, width: maxX - minX };
}
