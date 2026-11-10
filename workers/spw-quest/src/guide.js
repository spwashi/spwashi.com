// The spw.quest front door: the steps first, then the language they open onto, with installation one link away.
// Operator names follow the workbench's reader vocabulary
// (.spw/_workbench/docs/theory/spw/operators.spw); the route test holds them to it.

/** The twelve single sigils. `does` restates the workbench runtime table in plain words. The <> couple is not shown as a sigil. */
// Workbench relation: harmony. The workbench's reader vocabulary, held by the route test.
export const OPERATORS = Object.freeze([
  { sigil: "~", name: "potential", reads: "Preserve an exploratory trajectory without epistemic closure; suspend commitment to keep alternative hypotheses viable.", does: "Defers operand evaluation as a thunk, retaining the unreduced search space until demanded by an observer." },
  { sigil: "?", name: "wonder", reads: "Frame an interrogative inquiry; open a metacognitive probe that tests invariant assumptions against empirical evidence.", does: "Dispatches a conditional predicate, evaluating the contingent branch once the interrogative precondition holds." },
  { sigil: "!", name: "action", reads: "Commit an active intervention; apply performative force to transition system state and reveal observable consequences.", does: "Forces eager evaluation of its operand, committing the state transformation and returning the actualized value." },
  { sigil: "*", name: "value", reads: "Anchor attentional focus; mark what carries durable communicative weight, canonical necessity, and epistemic salience.", does: "Evaluates the operand to canonical normal form, recording the stabilized invariant into an addressable register." },
  { sigil: ".", name: "ground", reads: "Anchor in shared common ground; resolve referents against local baseline schemas and presupposed contextual defaults.", does: "Traverses a qualified property path or dereferences the scoped baseline context from the active lexical environment." },
  { sigil: "^", name: "ascension", reads: "Synthesize structural relations; lift disparate constituent parts into an inspectable higher-order conceptual gestalt.", does: "Encapsulates operands into an integrated compound record bounded by unified relational type constraints." },
  { sigil: "#", name: "vibration", reads: "Establish a rigid referential index; label structural patterns with persistent symbolic handles for retrieval and transfer.", does: "Reduces the structural payload into an addressable register entry registered within the global symbol table." },
  { sigil: "@", name: "perspective", reads: "Situate deictic vantage and epistemic stance; specify the observer coordinate and perceptual lens examining the field.", does: "Projects the operand through a situated observer lens, evaluating expressions relative to that vantage frame." },
  { sigil: "&", name: "subject", reads: "Center topical subjecthood; align disparate predicates around a shared thematic core to maintain discourse coherence.", does: "Performs associative unification across arguments, merging congruent predicates into the primary subject register." },
  { sigil: "=", name: "configuration", reads: "Fix parametric constraints; bind invariants and explicit configuration states to regulate system boundaries.", does: "Binds an identifier to an evaluated value within the active register bank, governing downstream parameterization." },
  { sigil: "%", name: "measure", reads: "Calibrate across scalar dimensions; quantify variance, error gradients, and metric thresholds to guide learning.", does: "Applies a metric evaluation function across focused registers, computing scalar distance, ratio, or cardinality." },
  { sigil: "$", name: "substrate", reads: "Audit the carrying substrate; account for the metabolic, temporal, and computational resources sustaining the system.", does: "Materializes underlying runtime metadata, exposing memory layout, latency bounds, and platform resource footprints." },
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
