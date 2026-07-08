# Plan: spw-metaphysical-language

Mature Spw from a site grammar into a described metaphysical language: a complete
construct codex, a sigil-property study that arbitrates semantic alignment, a
production-and-manufacturing ladder that carries the language into physical and
commercial form, and integration briefs that project the language into other
industries without diluting its physics.

## Public Goal

Spw already behaves like a language on this site — operators prime attention,
braces hold charge, positions carry force — but its description is distributed
across conventions, atlas pages, runtime attributes, and memory. This plan makes
the language *describable as itself*: every construct named, every sigil's
assignment justified by the properties of the glyph, every semantic drift
ledgered and arbitrated, and a durable path from "notation on a webpage" to
"artifact you can hold, teach with, sell, or install in another industry."

Creator identity preserved: "I'm Spwashi. I build software and make art." The
language is the art and the software at once; describing it is not paperwork,
it is the product line maturing.

## Why Now — the drift evidence

The canon has grown faster than its self-description, and the seams show:

- **Registry drift.** The original set (`~ # . ? ! * & @ ^ <> () [] {}`) in
  `operator-semantics.spw#lineage`, the site registry in
  `operator-alignment.spw`, and the fourteen-family list in
  `spw-operator-pages/wip.spw` (`#> #: . ^ ~ ? @ * & = $ % ! >`) do not agree
  on membership, and no surface says which list is authoritative for which
  layer.
- **Assignment drift.** `@` is glossed "enters perspective" in
  `operator-alignment.spw` but corrected to **ref** in author feedback; `%` is
  listed as "meta"/"normalize" while the author reads the glyph as
  **measurement/reduction** (ratio, partition, collapse-to-a-measure); `&`
  (subject) sits ambiguously between `.` and `^` and may reduce into `.`
  (subject-as-traversal).
- **Undescribed constructs.** `_` as label/escape (`?_query` = "probe named
  query", holding a name flat against the grammar's tendency to interpret),
  labeled braces `{_A … }_A` permitting **overlapping, non-nesting scopes**
  (`{_A {_B }_A }_B` is valid — the core structural move away from strict tree
  hierarchy), `#`-repetition as dimensional channel tuning (`#` d1 time, `##`
  d2 attention, `###` d3 relationship, `#####` d5 meaning), and the `.spw` file
  idioms themselves (`#>` address, `#:`/`#!` tags, `~#` metadata, `@name:`
  refs, `[reg=facet|set|stream]` registers, `dispatch` blocks) have no codex
  entry anywhere.
- **No arbitration protocol.** When lore, site registry, runtime, and author
  correction disagree, nothing states how the disagreement resolves. Sigil
  properties (glyph geometry, lineage, ergonomics) are the natural arbiter and
  are currently only implicit.

Selection spans as labeled braces (visitor highlights mapping to `{_A }_A`
overlapping scopes) already depend on the overlapping-brace construct being
first-class; the codex has to catch up before more runtime is built on it.

## Workstream A — Construct Codex

**Deliverable:** `.spw/conventions/construct-codex.spw` — one entry per
construct, uniform shape, following the `operational_semantics_template` from
`planning-ecology.spw` (cognitive_use, computational_use, claims, validation).

Codex entry shape (fixed for all entries):

| field | content |
|---|---|
| construct | canonical name |
| sigil_form | glyph(s) + positional variants (prefix/infix/postfix/expression) |
| metaphysical_role | what force, field, or phase it models |
| grammar_slot | prefix primes / infix scopes / postfix marks residue / delimiter couples / file idiom |
| runtime_projection | `data-spw-*` attrs, CSS/JS owners, bus events |
| fixity_tier | fixed / stable / tending / experimental / volatile |
| claim | one falsifiable claim (claim_chain shape) |
| lineage_note | original-set meaning, site adaptation, open drift |

Construct census to cover (initial, dense — extend during implementation):

1. **Operator sigils** — `~ # . ? ! * & @ ^ = $ %` plus family markers `#>` `#:`
   `#!` and projection `>`. Each entry cites `operator-alignment.spw` and
   `operator-semantics.spw` rather than restating them; the codex adds the
   uniform shape and the drift note.
2. **Delimiter couples** — `{}` direction/containment (objective-open →
   subjective-close), `[]` mode/variant, `()` scene, `<>` concept/lens/conduit.
3. **Labeled braces** — `{_A … }_A` overlapping scopes; interleaving legality;
   highlighter semantics; relation to selection spans and brace-gesture charge.
   This is the codex's flagship non-tree construct: document that Spw scopes
   are a *coverage algebra*, not a tree.
4. **Label/escape** — `_` as name-flattener and its intrinsic-operator history
   (`_` intrinsic vs `#` extrinsic); rules for when `_` suppresses
   interpretation.
5. **Positional grammar** — prefix/infix/postfix force, brace coupling,
   symmetry pairs (bridge to `operator-semantics.spw#positional_grammar`).
6. **Semantic expressions** — `root[variant]{behavior}<lens>` (bridge to
   `semantic-braces.spw`).
7. **File idioms** — `#>address`, `#:kind #!tag`, `@name: ~"path"` refs, `~#`
   metadata, `^"section"{}` frames, `dispatch` facets, registers
   (`[reg=facet]`, `[reg=set]`, `[reg=stream]`), invariants sets, stream
   entries (`>>[timestamp] verb - note`), `?[topic]:` open questions,
   `~[n]:` commit sketches.
8. **Phase and charge vocabulary** — threshold sequence
   (`~ ? % = $ ! * ^ #/.`), charge roles, liminality axes, discharge kinds
   (bridge to `charge-cycle.spw` and `operator-alignment.spw#threshold_sequence`).
9. **Composition families** — probe/substrate/output/threshold families as
   documented compositions, not a full algebra.

Rule: the codex *bridges* to existing conventions with `@refs`; it never forks
their content. Where the codex and an existing convention disagree, that is a
drift-ledger entry (Workstream B), not a silent rewrite.

## Workstream B — Sigil Property Study & Alignment Protocol

**Deliverables:**
- `.agents/plans/spw-metaphysical-language/sigil-property-matrix.spw` — the
  study artifact (plan-local until stable).
- `.spw/conventions/sigil-alignment-protocol.spw` — the durable arbitration
  rule, promoted once the matrix has evidence.
- A **drift ledger** section in the matrix with one claim chain per open drift.

### Property dimensions (score every sigil on all of these)

1. **Glyph geometry** — symmetry class (mirror/rotational/none), openness vs
   enclosure, verticality/horizontality, curvature vs angularity, whether the
   glyph points (directional stroke) or sits (mass). E.g. `~` is a wave with no
   endpoint (potential/thread); `%` is two masses across a divider (ratio,
   partition — evidence *for* the measurement reading); `&` is a closed braid
   (binding); `$` is a stroke through substance (a layer running through
   value — substrate).
2. **Ink weight at small sizes** — how the sigil reads at chip scale, in
   screenshots, and in captured frames (Grok/Midjourney interpretation and
   `data-spw-capture-mode` legibility are design requirements, not
   afterthoughts).
3. **Keyboard ergonomics** — shift layer, hand alternation, chord cost,
   proximity to companion sigils; a language meant to be *written live* (code
   performance, recorded sessions) should place high-frequency operators on
   low-cost keys, and the matrix should say where it doesn't.
4. **Prior-art lineage** — what the glyph already means in regex, shell,
   markdown, math, music notation, and spreadsheet formulas; alignment scores
   drop when Spw fights a strong prior (e.g. `!` imperative aligns with shell
   history/negation tension noted; `#` anchor aligns with markdown headers and
   hashtags; `@` aligns with *address/handle* — which is evidence for the
   **ref** reading over "perspective").
5. **Phonetic/subvocal handle** — what readers say in their heads (per the
   voice-marker and sentence-rhythm work); a sigil whose subvocalization
   contradicts its semantics accumulates drift.
6. **Sigil-craft tradition** — the occult/chaos-magic sense of sigil as
   *charged compressed intent*: a mark condensed from a statement, charged
   through attention, discharged through action. Spw's charge/discharge cycle
   (`charge-cycle.spw`, brace gesture charge) is the same physics; the matrix
   should make this correspondence explicit because it is the "metaphysical
   language" claim in its strongest form — sigils are not *like* operators,
   operators *are* sigils in the working sense: compressed intent that
   accumulates and discharges attention.

### Alignment protocol (the durable rule)

- Every operator assignment must cite at least three property dimensions in
  its favor; an assignment contradicted by glyph geometry **and** prior-art
  lineage is presumed drifted and enters the ledger.
- Arbitration order when sources disagree:
  author correction > glyph-property evidence > original-set lineage > site
  registry gloss > runtime label. Runtime and copy then converge on the
  arbitrated reading in ordinary maintenance passes (no big-bang rename).
- Each resolved drift produces: a codex update, a registry update in
  `operator-alignment.spw`, an atlas-page copy check
  (`/topics/software/spw/operators/`), and a `data-spw-operator-*` audit.

### Known drift ledger (seed entries, each becomes a claim chain)

| id | tension | evidence to gather |
|---|---|---|
| drift-at-001 | `@` = ref (author) vs perspective (registry) | glyph lineage (@ = address/handle), atlas copy, runtime `data-spw-operator='@'` uses; candidate synthesis: *ref-as-entered-perspective* — a reference you can stand inside |
| drift-pct-002 | `%` = meta/normalize vs measurement/reduction | glyph geometry (two masses over a divider), `measurement-contract.spw`, `%` chip uses |
| drift-amp-003 | `&` subject placement; possible reduction into `.` (subject-as-traversal: pointing and reaching-into as one gesture) | composition-family uses of `&`, brace-gesture data, confluence copy |
| drift-hash-004 | `#`-repetition as dimensional channel tuning (d1 time … d5 meaning) — undocumented | `#`/`##` uses in .spw files, dimension-vocabulary.spw, cognitive-navigation dimensions |
| drift-und-005 | `_` label/escape vs its intrinsic-operator history | grep `_`-prefixed names across .spw; decide codex entry wording |
| drift-brace-006 | labeled overlapping braces are load-bearing (selection spans) but described nowhere durable | selection/highlight runtime, brace-physics registry, semantic-braces.spw |

## Workstream C — Production & Manufacturing

Spw's production story already has a ladder on the site side
(`precipitates-and-projections.spw`: idea → design → implementation → instance;
`product-lines.spw`: feature → named line → narrated line → edition →
collection). This workstream extends the ladder past the screen.

### C1. Language production ladder (formalize what exists)

Document the full crystallization path as a single inspectable contract:

```
insight (semantic-capacity cache)
  → convention (.spw/conventions/)
  → runtime projection (data-spw-*, CSS handles, JS resolvers)
  → public surface (operator atlas, topic routes)
  → edition (collectible instance: seed card, session receipt, proof card)
  → manufactured artifact (physical/exported good)
```

Each rung names its promotion condition and its owner surface. The new rung is
the last one; the rest is consolidation of `planning-ecology.spw#memory_rule`
and `product-lines.spw#narrativization` into one visible ladder.

### C2. Manufacturing program (new)

Physical and exportable instantiations of the language, each with a `.spw`
sidecar so manufactured artifacts stay inside the semantic graph:

1. **Operator deck** — one card per operator: sigil, canonical name, plain
   verb, geometry (left-role/right-role/flow), symmetry partner, one
   composition example. The RPG character-sheet "Spwashi Lego" schema
   (header/badges/sections/footer) is the card anatomy. Print-run as edition;
   the deck is simultaneously a teaching tool (learning-science lens), an RPG
   table artifact, and a product.
2. **Sigil specimen sheets** — typographic masters: each sigil as SVG at
   display/chip/print scales, with geometry annotations (the property-matrix
   rendered visually). Feeds letterpress/riso/laser-cut experiments and the
   site's own `handles/operators.css`.
3. **Brace-field poster / zine** — the labeled-brace coverage algebra as a
   visual explainer; overlapping highlighter scopes are inherently printable.
4. **Seed cards, printed** — the configurable rates/asks card from
   `product-lines.spw` gets a print stylesheet and a physical edition path;
   same infrastructure serves services rates and informal asks.
5. **Capture-mode exports** — screenshot-stable framings of operator pages and
   brace fields sized for Grok Imagine / Midjourney interpretation loops;
   manufacturing includes *media manufacturing* — the site producing its own
   promptable image seeds (bridge to `promptable-image-library-pass` and the
   image pipeline in `production-demonstration-pass`).

Shared specs: print-safe palette derived from existing tokens; glyph weights
validated at physical scale; every artifact gets a `.spw` sidecar with
edition/timestamp/provenance (librarian-audience requirement); export tooling
stays framework-free (print CSS + SVG masters + existing image-optimize skill).

### C3. Commercial posture

Editions and decks are product lines, so the `creative_marketing_engine`
card-shape (audience/offer/proof/resonance/extension/next_action) governs any
public offer. Pricing/asks route through the seed-card infrastructure. Nothing
ships as a "store" — artifacts ship as editions with provenance, consistent
with narrativization progression.

## Workstream D — Industry Integration

Each integration gets a one-page brief (plan-local `.spw`), with a fixed shape:
**mapping thesis** (which Spw constructs carry over), **pilot artifact**
(smallest honest demonstration), **partner audience** (from the collaborative
network: illustrators, painters, librarians, gardeners, engineers), and
**falsification** (what would show the mapping is decorative rather than
structural).

1. **Learning science / education** — the home lens. Operators as attention
   primitives; threshold sequence as mastery progression; fixity tiers as
   scaffolding-fade schedule; brace charge as formative assessment signal.
   Pilot: one math-practice-lab exercise annotated end-to-end in codex
   constructs. Falsification: learners perform no better navigating by
   root/variant/behavior than by prose alone.
2. **Publishing / writing craft** — voice markers and sentence-rhythm sampler
   are already publishing tools; extend to editorial workflow (marks as
   revision protocol: `#land ?open ~return @move .pause`). Pilot: one blog
   article authored with the revision protocol and its trace published.
3. **Library & information science** — sigil/identifier contract as cataloging
   discipline; `.spw` sidecars as provenance records; editions as accession
   entries. Pilot: catalog one manufactured artifact with a librarian
   collaborator; the record round-trips (site → print → site).
4. **Culinary** — recipes already model ingredients-as-set, steps-as-stream,
   context-as-facet; threshold sequence maps to mise-en-place → service.
   Pilot: one recipe card printed from the same schema as the operator deck.
5. **Games / RPG** — threshold sequence as quest progression is already
   claimed in `operator-alignment.spw#threshold_sequence`; the operator deck is
   a table artifact; proof cards log practiced skills. Pilot: run one RPG
   Wednesday session using the physical deck; session receipt cites operator
   moves.
6. **Music / performance** — operators as score (promo/wonder cadence as
   rhythm; charge/discharge as dynamics). Pilot: one notated "operator score"
   of an existing interaction loop that a musician can read (musician_path in
   `product-lines.spw` names the doorway).
7. **Show production / attention orchestration** — timing and attention
   orchestration is the stated value prop; Spw phase vocabulary is the cue
   sheet language. Pilot: one show segment (dregg.net collaboration) cue-listed
   in threshold-sequence notation, with the fixation-risk queues from the
   production protocols expressed as `?`-gates.
8. **Software / agent tooling** — Spw as prompt-handle and contract language
   for agents: `data-spw-*` as machine-readable semantics, composition
   families as prompt-mining vocabulary, claim chains as agent validation
   contracts. Pilot: one agent workflow (this repo) that consumes the codex to
   answer "what does this attribute mean" without reading prose.

Sequencing rule: industries 1, 5, and 8 are load-bearing (already have live
surfaces); 2–4 are near-term (routes exist); 6–7 are exploratory and gated on
a willing collaborator. No integration brief becomes a convention until its
pilot artifact exists. Workstream E upgrades industry 7 (show production) from
exploratory to near-term: the sigil-physics show *is* its pilot artifact, with
cue sheets in threshold-sequence notation.

## Workstream E — Sigil Physics Research Program & Show

**Deliverable:** `sigil-physics-research.spw` (plan-local, dense) plus a first
show-segment pilot. Full detail lives in the artifact; this section fixes the
contract.

A show presents the sigils while researching their physics — and the show is
the instrument, not the advertisement. Audience comprehension, transcription,
ordering judgments, and verso/skim/dictation trials are the measurements.
Segment anatomy: **present** (glyph, lineage, open drift — disagreement is
content), **perform** (fundamental-motion choreography or object-kit
assembly), **probe** (one pre-registered falsifiable expectation, run live),
**precipitate** (evidence logged to the property matrix or drift ledger on
camera; segment edition minted with `.spw` sidecar provenance). The show
performs the stated value prop — timing and attention orchestration — as
content, and inherits the production risk protocols: stage interpretations
enter a `?`-queue and pass the Workstream B arbitration order before touching
canon; every episode closes by reading its open questions aloud.

Research axes (each feeds matrix columns; the show feeds evidence rows):

1. **Prefix/postfix juxtaposition** — the expression as gesture envelope:
   prefix wind-up, name contact, postfix follow-through. Same-sigil sandwiches
   (`!commit!`) and asymmetric sandwiches (`?name.` vs `!name?`) tested for
   non-commutativity via ordering and residue-recall trials.
2. **Composition as motion and object** — a nine-motion basis (strike, wave,
   loop, cross, settle, thread, lift, split, hook); every sigil decomposed
   into ≤3 motions (e.g. `?` = hook + settle, inquiry held over ground; `_` =
   ground-level thread, the glyph literally holding a name flat — its
   semantics *is* its geometry); an **object kit** whose manipulation enacts
   the grammar as a semantics-preserving projection (show props and a new
   manufacturing artifact class alongside the deck).
3. **Higher dimensions** — the projection chain motion (space+time) → stroke
   (2D) → glyph (stable form) → sequence position (1D); each direction
   restores a lost dimension: animation restores time, transparent overlay
   stacks restore depth (labeled braces as literal reorderable layers),
   `#`-repetition as channel tuning (drift-hash-004), the object kit restores
   volume.
4. **Skimmability** — sigils as skim anchors: a marked page yields argument
   structure at skim velocity before any name is read; prefix dominates the
   first pass, postfix residue rewards the return pass; tiers align with
   copy-depth. Claim sigil-skim-001 (marked vs unmarked skim trial).
5. **Thin/transparent substrate** — vellum overlays make the labeled-brace
   coverage algebra physical (stacking composes; weaving band edges performs
   interleaving); show-through sets hard bounds on ink weight; **verso
   legibility** becomes a matrix dimension — mirror-symmetric sigils (`= * #
   ^`) survive back-reading, chiral ones flip (mirrored `?` is the irony mark
   `⸮` — verso reading can invert meaning, not just orientation). Claim
   sigil-verso-002.
6. **Sound writing** — a sonic signature per operator whose envelope matches
   its physics (`!` transient, `~` sustained vibrato, `%` a two-note interval
   — ratio is literally a musical interval, native evidence for
   drift-pct-002; `$` sub-bass drone; `&` braided chord; braces as filter
   envelopes). Prefix sounds as anacrusis, postfix as release tail — the
   juxtaposition axis in another medium. Dictation runs both directions and
   opens a screen-free reading channel (a11y). Claim sigil-sound-003.
7. **Stabilization** — a glyph is stabilized motion: combinations of
   fundamental motions that survive the pressures (speed, scale, verso, skim,
   capture, sound) crystallize into glyph form. This is
   precipitates-and-projections at the letterform scale — the language's own
   crystallization model explaining its own alphabet. Claim sigil-motion-004
   (independent annotators reproduce the decompositions).
8. **Language as species evolution fabric** — language as the inheritance
   channel through which cognitive moves propagate across a population faster
   than genes: glyphs vary (hand drift, overloads, industry adaptations), are
   selected (site, show, print, and sound as four distinct selection
   environments), and are inherited (atlas, deck, workshops, capture, agent
   tooling). The drift ledger is the fossil record; arbitration is documented
   selection. Claim sigil-evolution-005 (practitioners under shared pressure
   converge on pressure-specific simplifications). This axis is the
   philosophy capstone and stays plan-local until it has an evidence pass;
   then it becomes a `.spw/philosophy/evolution-fabric.spw` candidate carrying
   its counterexamples.

Boundary rule: Workstream E produces evidence and editions; Workstream B owns
arbitration; Workstream C owns manufacturing the props (object kit, vellum
overlay kit, specimen sheets). The matrix is the single accumulation point so
research and arbitration never fork.

## Scope

**In scope:**
- Construct codex convention + wiring (conventions index, site.spw ref).
- Sigil property matrix + drift ledger + alignment protocol.
- Production-ladder contract; manufacturing specs for deck + specimen sheet
  (design-level; first physical pilot is deck-as-print-stylesheet).
- Eight industry briefs at one-page density; pilots for the three load-bearing
  industries scoped as smallest honest artifacts.
- Sigil-physics research program (`sigil-physics-research.spw`) and one
  show-segment pilot: one sigil or one cross-sigil probe (the verso trial),
  recorded capture-legibly, with its pre-registered expectation and result.
- Object-kit and vellum-overlay-kit specs (design-level, alongside the deck).
- This plan's `wip.spw` and `index.spw` as the working/index surfaces.

**Out of scope (this plan):**
- Rewriting operator atlas pages wholesale (route through `spw-operator-pages`
  once drifts resolve).
- Runtime widget development (route through `interaction-grammar` /
  `interaction-loop-contract`).
- Any actual print vendor selection, fulfillment, or storefront.
- Renaming `data-spw-*` attributes before their drift entry is arbitrated and
  validated (stability rule from `operator-alignment.spw` holds).
- Workbench canon changes under `.spw/_workbench/` (site bridges only).

## Predicted File Surfaces

- `[NEW] .agents/plans/spw-metaphysical-language/PLAN.md` (this file)
- `[NEW] .agents/plans/spw-metaphysical-language/wip.spw`
- `[NEW] .agents/plans/spw-metaphysical-language/index.spw`
- `[NEW] .agents/plans/spw-metaphysical-language/sigil-property-matrix.spw`
- `[NEW] .agents/plans/spw-metaphysical-language/sigil-physics-research.spw`
- `[NEW] .agents/plans/spw-metaphysical-language/industry-briefs/*.spw` (8)
- `[NEW?] .spw/philosophy/evolution-fabric.spw` — gated on sigil-evolution-005
  evidence
- `[NEW] .spw/conventions/construct-codex.spw`
- `[NEW] .spw/conventions/sigil-alignment-protocol.spw` (promoted from matrix)
- `[MOD] .spw/conventions/index.spw` — register codex + protocol
- `[MOD] .spw/site.spw` — root refs for the new conventions
- `[MOD] .spw/conventions/operator-alignment.spw` — arbitrated drift updates
- `[MOD] .agents/plans/README.md` — one index line
- `[MOD?] topics/software/spw/index.html` — codex/atlas cross-link once codex
  lands (copy only)
- `[MOD?] .spw/surfaces/product-lines.spw` — manufactured-artifact rung note

## Focus Dimension & Fixity

- **Focus dimension:** semantic layer (primary), collaboration phase
  (secondary — industry briefs are recruitment surfaces).
- **Fixity posture:** codex entries land at *stable* for constructs with
  runtime projections, *tending* for glyph-property readings, *experimental*
  for industry mappings without pilots. Drift arbitration can move an entry
  between tiers; the tier must be visible in the entry.

## Risks & Constraints

- **Ontology bloat.** The codex could become a second, competing canon.
  Guard: bridge-don't-fork rule; every entry cites its owner convention; codex
  adds shape and drift notes only.
- **Premature arbitration.** Resolving `@`/`%`/`&` drifts by fiat would repeat
  the original mistake. Guard: each drift needs gathered evidence (grep counts,
  atlas copy, glyph analysis) before its claim chain flips to confirmed; author
  sign-off required on any operator-meaning change (sensation-review-gates
  posture applies to semantics too).
- **Metaphysics without falsifiability.** The philosophy index invariant holds:
  every metaphysical claim in the codex carries a counterexample or test.
- **Manufacturing scope creep.** Physical goods stay design-and-spec until the
  print-stylesheet pilot proves the schema; no vendor commitments in this plan.
- **Industry briefs as vaporware.** Briefs without pilots stay plan-local and
  never enter `.spw/conventions/`.
- **Stage-to-canon leakage.** A live audience rewards vivid interpretation over
  correct interpretation. Guard: the `?`-queue and arbitration order apply to
  everything said on camera; episodes close by reading open questions aloud;
  no probe airs without a pre-registered expectation.
- **Show as spectacle drift.** If segments stop producing matrix rows or
  ledger evidence, the show has detached from the research program. Guard: the
  precipitate step is mandatory segment anatomy, not post-production optional.

## Validation Loop

- `git diff --check`; `npm run check` after any HTML/CSS/JS touch.
- Codex completeness probe: every `data-spw-operator` value and every sigil in
  `operator-alignment.spw#operator_registry` has a codex entry (`rg` audit).
- Drift-ledger probe: each ledger row has claim_id, evidence refs, and status.
- Bridge probe: `rg` confirms codex entries cite (not restate) owner
  conventions; no duplicated registry tables.
- Print pilot probe: operator-deck print stylesheet renders one legible card
  per operator at physical card ratio (manual browser print preview).
- Industry pilot probe: each load-bearing brief names an existing route or
  artifact that demonstrates the mapping today.
- Show segment probe: the pilot segment has a pre-registered expectation, a
  recorded result, a matrix/ledger entry, and an edition sidecar — all four or
  it isn't a segment.
- Claim hygiene probe: every claim in `sigil-physics-research.spw` starts
  `untested` and only changes status with a named probe run.
- Handoff: `spw-plan-maintenance` wires references after significant landings.

## Phased Commits

1. `#[spw-lang] — plan, wip, and index for the metaphysical-language track`
2. `&[codex] — construct codex convention with census, entry shape, and bridges`
3. `%[sigils] — sigil property matrix, drift ledger, and evidence gathering`
4. `?[show] — sigil-physics research program, axes, claims, and segment format`
5. `=[protocol] — sigil alignment protocol promoted with arbitration order`
6. `![drift] — first arbitrated drift lands across registry, atlas copy, and codex`
7. `^[manufacture] — production ladder contract + deck/object-kit/overlay pilots`
8. `*[segment] — first show segment recorded: pre-registered probe, result, edition`
9. `~[industries] — eight integration briefs; pilots for learning/RPG/agents/show`
10. `.[maintenance] — plan-maintenance handoff, index wiring, archive notes`

## Open Questions

- Should the codex live as one dense file or a directory
  (`.spw/conventions/codex/`) once entries exceed ~20? (Split rule from
  spw-surface-normalization applies.)
- Is the sigil-craft correspondence (charged compressed intent) public copy or
  editor-layer lore? It is the strongest metaphysical claim and the easiest to
  misread as decoration.
- Does the labeled-brace coverage algebra deserve its own convention now, or
  after the selection-span runtime stabilizes?
- Which industry brief earns the second physical artifact — recipe card
  (culinary) or cue sheet (show production)?
- Where does the arbitrated `@` reading leave `~`? If `@` is ref, `~` may
  narrow toward potential/thread exclusively — that cascade needs its own
  ledger row before any copy changes.
- Episode one: a single sigil, or one cross-sigil probe (the verso trial runs
  the whole set at once)?
- Live-first or capture-first for the show — staged episodes, or TikTok-scale
  segments that accumulate into episodes?
- Does the object kit precede the deck in manufacturing order, since the show
  needs props before cards?
- Do sound signatures need a notation of their own, or does the existing
  expression syntax suffice as a score?

## Agentic Hygiene

- Plan follows `spw-feature-planning`; maintenance routes through
  `spw-plan-maintenance`.
- Related owner plans: `operator-semantics-refinement` (lineage/physics),
  `spw-operator-pages` (atlas routes), `operator-resonance-alignment`,
  `production-demonstration-pass` (media pipeline),
  `spw-surface-normalization` (.spw navigability), `relational-attention-media`
  (media seeds), `professional-skill-development-worldbuilding` (proof loop).
- New durable concepts wire through `site.spw`, `conventions/index.spw`, and
  the planning ecology per its invariants.
