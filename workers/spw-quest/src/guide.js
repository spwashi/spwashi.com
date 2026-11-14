// The spw.quest front door: the steps first, then the language they open onto, with installation one link away.
// Operator names follow the workbench's reader vocabulary
// (.spw/_workbench/docs/theory/spw/operators.spw); the route test holds them to it.

/** The twelve single sigils. `reads` says what each does in a sentence; `line` is a line it might start, from the settings the guide opens on (src/starters.js); `does` restates the workbench runtime table. The <> couple is not shown as a sigil. */
// Workbench relation: harmony. The workbench's reader vocabulary, held by the route test.
export const OPERATORS = Object.freeze([
  { sigil: "~", name: "potential", reads: "Keeps options open. Use it for what is still being explored.", line: "~launch{email, waitlist, beta}", does: "Defers operand evaluation as a thunk, retaining the unreduced search space until demanded by an observer." },
  { sigil: "?", name: "wonder", reads: "Asks a question that evidence can settle.", line: "?churn[q3]{pricing, onboarding}", does: "Dispatches a conditional predicate, evaluating the contingent branch once the interrogative precondition holds." },
  { sigil: "!", name: "action", reads: "Does something, so you can see what changed.", line: "!ship{pricing_page}", does: "Forces eager evaluation of its operand, committing the state transformation and returning the actualized value." },
  { sigil: "*", name: "value", reads: "Marks what matters most.", line: "*metric{activation}", does: "Evaluates the operand to canonical normal form, recording the stabilized invariant into an addressable register." },
  { sigil: ".", name: "ground", reads: "Names the defaults everyone already assumes.", line: ".brand{voice, colors}", does: "Traverses a qualified property path or dereferences the scoped baseline context from the active lexical environment." },
  { sigil: "^", name: "ascension", reads: "Gathers parts into a whole you can inspect.", line: "^funnel{visit, signup, paid}", does: "Encapsulates operands into an integrated compound record bounded by unified relational type constraints." },
  { sigil: "#", name: "vibration", reads: "Gives something a name, so it can be found and linked.", line: "#>q3_launch", does: "Reduces the structural payload into an addressable register entry registered within the global symbol table." },
  { sigil: "@", name: "perspective", reads: "Says from where you are looking.", line: "recruiter@role[frontend]{react}", does: "Projects the operand through a situated observer lens, evaluating expressions relative to that vantage frame." },
  { sigil: "&", name: "subject", reads: "Holds several things to one topic.", line: "&hiring{role, budget, timeline}", does: "Performs associative unification across arguments, merging congruent predicates into the primary subject register." },
  { sigil: "=", name: "configuration", reads: "Fixes a setting the rest depends on.", line: "=stack{react, vite}", does: "Binds an identifier to an evaluated value within the active register bank, governing downstream parameterization." },
  { sigil: "%", name: "measure", reads: "Measures, so before and after can be compared.", line: "%conversion{before ~> after}", does: "Applies a metric evaluation function across focused registers, computing scalar distance, ratio, or cardinality." },
  { sigil: "$", name: "substrate", reads: "Names what something runs on: time, money, machines.", line: "$runway{months, team}", does: "Materializes underlying runtime metadata, exposing memory layout, latency bounds, and platform resource footprints." },
]);

/** The four interpretive brace profiles, in the order the compositional form reads them. */
export const CONTAINERS = Object.freeze([
  { open: "<", close: ">", name: "concept", reads: "Ontological boundary: encapsulates the semantic universe of discourse and categorical domain." },
  { open: "(", close: ")", name: "scene", reads: "Situational context: situates the spatiotemporal setting, environmental locus, and pragmatic frame." },
  { open: "[", close: "]", name: "mode", reads: "Modal aspect: specifies the grammatical register, epistemic modality, and operational variant." },
  { open: "{", close: "}", name: "definition", reads: "Constituent enclosure: encapsulates compositional definitions, internal clauses, and structural relations." },
]);

/** What a # particle's aim adds when the reader meets one in a line. */
export const PARTICLE_AIMS = Object.freeze({
  ">": "A frame locator: declares an addressable routing destination and canonical page identity.",
  ":": "A stratum layer: classifies the epistemological genre and architectural tier of the expression.",
  "!": "A definitive tag: assigns categorical indexing metadata to support multi-faceted taxonomy.",
});
