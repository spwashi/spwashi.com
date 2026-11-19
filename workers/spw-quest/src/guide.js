// The spw.quest front door: the steps first, then the language they open onto, with installation one link away.
// Operator names follow the workbench's reader vocabulary
// (.spw/_workbench/docs/theory/spw/operators.spw); the route test holds them to it.

/**
 * The twelve single sigils, organized as six dimensional symmetry pairs:
 *   Field ↔ Vantage (~ ↔ @), Aperture ↔ Impulse (? ↔ !), Resonance ↔ Ground (# ↔ .),
 *   Lift ↔ Confluence (^ ↔ &), Worth ↔ Carrier (* ↔ $), Pin ↔ Scale (= ↔ %).
 * `name` follows the workbench reader vocabulary (.spw/_workbench/docs/theory/spw/operators.spw);
 * `axis`, `partner`, and `valence` situate each mark in multi-dimensional space;
 * `reads` explains its spatial role; `line` is a parser-verified specimen; `does` restates runtime behavior.
 */
// Workbench relation: harmony. The workbench's reader vocabulary, held by the route test.
export const OPERATORS = Object.freeze([
  {
    sigil: "~", name: "potential", axis: "Field ↔ Vantage", partner: "perspective", valence: "latent wave",
    reads: "Holds an uncollapsed path across distance without taking it yet; sits opposite @ perspective, which names who is looking down that thread.",
    line: "~draft(studio){rough ~> paced ~> locked}<reel>",
    does: "Defers operand evaluation as a thunk, retaining the unreduced search space until demanded by an observer.",
  },
  {
    sigil: "?", name: "wonder", axis: "Aperture ↔ Impulse", partner: "action", valence: "open aperture",
    reads: "Opens an inquiry or conditional gate without forcing closure; balances ! action, which collapses possibility into an observable move.",
    line: "?pacing[scene_3]{watch_muted; check_beat}<cut>",
    does: "Dispatches a conditional predicate, evaluating the contingent branch once the interrogative precondition holds.",
  },
  {
    sigil: "!", name: "action", axis: "Aperture ↔ Impulse", partner: "wonder", valence: "kinetic impulse",
    reads: "Commits a state change so its consequence becomes observable; completes ? wonder by crossing from inquiry into effect.",
    line: "!render(final)[4k]{picture, mix ~> master}<delivery>",
    does: "Forces eager evaluation of its operand, committing the state transformation and returning the actualized value.",
  },
  {
    sigil: "*", name: "value", axis: "Worth ↔ Carrier", partner: "substrate", valence: "precipitated mass",
    reads: "Materializes what carries concrete worth or salience here; pairs with $ substrate, which names the physical cost or ground carrying it.",
    line: "*proof(print)[laminated]{front, back, colophon}<folio>",
    does: "Evaluates the operand to canonical normal form, recording the stabilized invariant into an addressable register.",
  },
  {
    sigil: ".", name: "ground", axis: "Resonance ↔ Ground", partner: "vibration", valence: "noble baseline",
    reads: "Settles attention back to the local default or center of gravity; anchors # vibration, which projects an address outward so others can find it.",
    line: ".palette(neutral_paper)[daylight]{ink, ground, edge}<surface>",
    does: "Traverses a qualified property path or dereferences the scoped baseline context from the active lexical environment.",
  },
  {
    sigil: "^", name: "ascension", axis: "Lift ↔ Confluence", partner: "subject", valence: "vertical synthesis",
    reads: "Lifts separate parts onto a higher register as one inspectable whole; complements & subject, which binds parallel streams laterally.",
    line: "^sequence(episode_04){cold_open; turn; close}<arc>",
    does: "Encapsulates operands into an integrated compound record bounded by unified relational type constraints.",
  },
  {
    sigil: "#", name: "vibration", axis: "Resonance ↔ Ground", partner: "ground", valence: "harmonic address",
    reads: "Calls a structure by resonant name (#>, #:, #!) so tools and readers can address or echo it across files; balances . ground.",
    line: "#>scene_beat[audio]{room_tone, dialogue}",
    does: "Reduces the structural payload into an addressable register entry registered within the global symbol table.",
  },
  {
    sigil: "@", name: "perspective", axis: "Field ↔ Vantage", partner: "potential", valence: "observer origin",
    reads: "Situates the coordinate origin — who or what is looking (Persona@subject, @alias) — giving ~ potential a vantage point to aim from.",
    line: "editor@timeline[rough]{pacing, breath}(late_night)<cut>",
    does: "Projects the operand through a situated observer lens, evaluating expressions relative to that vantage frame.",
  },
  {
    sigil: "&", name: "subject", axis: "Lift ↔ Confluence", partner: "ascension", valence: "covalent bond",
    reads: "Binds multiple streams or constraints onto one shared focus without flattening them; pairs laterally with ^ ascension's vertical lift.",
    line: "&production{sound, lighting, schedule}<shoot>",
    does: "Performs associative unification across arguments, merging congruent predicates into the primary subject register.",
  },
  {
    sigil: "=", name: "configuration", axis: "Pin ↔ Scale", partner: "measure", valence: "fixed coordinate",
    reads: "Pins a local parameter or invariant that downstream structure depends on; establishes the fixed reference point that % measure scales against.",
    line: "=clock(local)[24fps]{timecode, frame_rate}<spec>",
    does: "Binds an identifier to an evaluated value within the active register bank, governing downstream parameterization.",
  },
  {
    sigil: "%", name: "measure", axis: "Pin ↔ Scale", partner: "configuration", valence: "scalar gradient",
    reads: "Compares, weights, or normalizes before and after across a coordinate axis; reads the tension relative to = configuration.",
    line: "%contrast(phone)[low_light]{before ~> after}<check>",
    does: "Applies a metric evaluation function across focused registers, computing scalar distance, ratio, or cardinality.",
  },
  {
    sigil: "$", name: "substrate", axis: "Worth ↔ Carrier", partner: "value", valence: "carrier medium",
    reads: "Exposes the physical, temporal, or computational medium carrying the work — time, budget, memory, storage, attention; underpins * value.",
    line: "$budget(sprint)[3_days]{render_time, storage, crew}<runway>",
    does: "Materializes underlying runtime metadata, exposing memory layout, latency bounds, and platform resource footprints.",
  },
]);

/** The four interpretive brace profiles — independent spatial boundaries that can stand alone, nest, reorder, or repeat. Opening edges lean objective; closing edges lean subjective. */
export const CONTAINERS = Object.freeze([
  { open: "<", close: ">", name: "concept", axis: "Domain / channel", reads: "Names the kind of thing, outward channel, or domain boundary — can wrap a concept on its own or project outward beside other containers." },
  { open: "(", close: ")", name: "scene", axis: "Space-time witness", reads: "Stages where or when the line happens — before a word, after a body, or alone as an observable midprocess moment." },
  { open: "[", close: "]", name: "mode", axis: "Lens / schema key", reads: "Selects a stance, variant, or schema coordinate while leaving sibling options visible." },
  { open: "{", close: "}", name: "definition", axis: "Interior topology", reads: "Bounds what lives inside (opening { leans objective, closing } leans subjective): commas hold company, semicolons order stages, ~> relays a path, or nested containers sit inside." },
]);

/** What a # particle's aim adds when the reader meets one in a line. */
export const PARTICLE_AIMS = Object.freeze({
  ">": "A frame address: names a destination or block another file can cite.",
  ":": "A role or layer tag: classifies what kind of record or tier this is.",
  "!": "An intent mark: declares the active stance or operational focus.",
});
