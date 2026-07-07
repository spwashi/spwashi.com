# Plan: spellcraft-authoring

Reorganize the spell and cauldron concepts around authorship: writing and editing spells, and selecting and styling elements, concepts, and artifacts. Consolidates five prior tracks into one owner model, applies the Stagecraft glossary and the G1/G2 attribute grammar (per Spwashi, 2026-07-03), and treats every authoring surface as simultaneously a live-performance and screenshot-interpretation surface.

## Public Goal

A visitor (or Spwashi on camera) can *write* a spell, not merely accumulate one: select things on the page, drop them in the cauldron, compose them into a named spell, cast it to see the page change, reopen it later to edit. Spells graduate from navigation traces to small legible programs whose two primary verb families are **select** (element, concept, artifact) and **style** (bias, swap, remember, screenshot). The taste note is **workshop, not ledger**: the cauldron is a bench where things are made and remade, and the spellbook is a shelf you take things down from.

## Current State (read 2026-07-03)

- `runtime/spells.js` (864 lines): spells are serialized navigation paths over grounded tokens; actions cast/checkpoint/reset; no edit, no selection verb, no styling verb.
- `interface/cauldron/` (contract.js, storage.js, trace.js, resonance.js, undo.js, chrome.js, helpers.js): real bones - `CAULDRON_CONTRACT` centralizes phases (`empty -> primed -> mixing -> spell-ready`), ingredient lifecycle (`gathering -> resonant -> mature -> decayed`), eight actions, max six ingredients, garden pruning. Composes "extension drafts," not reopenable spells.
- `components/cauldron.css` (332 lines) + `handles/operators/spell-breadcrumbs.css` (869-line chapter).
- Attribute families: `data-spw-cauldron-*` 26 names (19 JS-written), `data-spw-spell-*` 9, `data-spw-ingredient-*` 4.

## The Model

- **Ingredient** - one selection with context: an element (brace span, grounded token, component), a concept (topic, operator), or an artifact (image, card, checkpoint). Selection modes align with the brace-selection modes: remember, screenshot, bias, swap.
- **Cauldron** - the open spell being edited. Mixing composes ingredients into a spell; **decompose is the new inverse**: any owned spell reopens into the cauldron as ingredients. Edit = decompose, adjust, re-mix.
- **Spell** - a named, serialized sequence of (selection, operation) steps. Operations: the existing navigation replay, plus **style** (set variance-eligible custom properties or `-intent` variables on the selection - never layout/semantics, same impact-gradient rule as editions), **swap**, **remember**, **screenshot-frame**.
- **Spellbook** - the shelf: read, replay, edit (decompose into cauldron), duplicate, share. Absorbs `spellbook-utility`'s outcome-bearing direction.

Styling authority: spells style through the sanctioned channels only - `-intent` variables and variance-eligible tokens - so a cast spell can never break interaction contracts. This makes spells the visitor-facing face of the same impact gradient the edition system uses.

## Stagecraft And Attribute Grammar (applied per 2026-07-03 direction)

- Vocabulary: cauldron dock and spellbook are **tier** citizens (floating above content); the expanded editing surface is an **overlay**; the phase indicator is a **rail**. No new structural words; `spell/cauldron/ingredient` are domain words, not strata words.
- G2 role enum: the ~12 role-flavored cauldron names (`-panel`, `-panel-toggle`, `-remove`, `-mirror`, `-phase-rail`, `-candidate`, `-cue`, `-action`, ...) fold into `data-spw-cauldron="host|panel|toggle|remove|mirror|phase-rail|candidate|cue"` plus `data-spw-cauldron-action="mix|plant|nourish|prune|vision|clear|undo|re-gather|decompose"`.
- G1 axis bundle: the state/axis names (`-phase`, `-garden-phase`, `-resonance`, `-count`, `-collected`, `-visibility`, `-discoverability`, `-output-state`, ...) fold into `data-spw-cauldron-state="phase:mixing garden:tending resonance:2 count:4"`.
- Target: cauldron 26 -> ~4 names, spell 9 -> ~3, ingredient 4 -> 1. `interface/cauldron/contract.js` is the single refit point for writers; CSS readers migrate in the same patch (family is 73% JS-written - cheap per the census cost model).

## Performance And Capture Constraints (Spwashi, 2026-07-03)

- **Live-performance legibility:** Spwashi records module work for YouTube storytelling and vibecodes live on TikTok from JetBrains IDEs and VS Code. Spell authoring must read on camera: state changes visible at a glance, phase names displayable large, actions narratable in one breath. The contract objects (CAULDRON_CONTRACT and the future SPELL_CONTRACT) double as on-screen story props - keep them small, quotable, and in one file each.
- **Capture-interpretation loop:** code and web surfaces both get screenshot into Midjourney/Grok Imagine for interpretation. Chapter banners, genome blocks, and spell serializations are read by image models, not just humans - favor stable visual anatomy (banners, aligned tables, one concept per screen-height) and respect `data-spw-capture-mode` on every new surface. A serialized spell should be interpretable from a screenshot alone.

## Absorbed Tracks

This plan supersedes as owner (each keeps its file with a merged-into note; ideas stay live here):

- `spell-cauldron-lifecycle-memory-gardening/` - phases and gardening survive as the ingredient lifecycle.
- `spell-cauldron-microinteractions/` - vessel feel; now scoped to the workshop verbs.
- `spell-cognition-familiarity/` - fresh/familiar/replayable comfort states move onto the spellbook shelf.
- `spellbook-utility/` - outcome-bearing replay is the spellbook's charter here.
- `brace-cauldron-primed-collection/` - brace priming is the element-selection verb.

## Phases And Gates

1. **Contract refit (agent-executable):** SPELL_CONTRACT extracted alongside CAULDRON_CONTRACT; G1/G2 attribute migration through contract.js with CSS readers in the same patch; flattened-bundle equivalence + `check:local`. Sanctioned by the 2026-07-03 grammar direction.
2. **Decompose verb (agent-executable, gated demo):** spells reopen into the cauldron; demo before promotion.
3. **Style/swap operations (gated):** how a cast styling spell *feels* - variance surface, easing, undo - is a sensation gate per the standing review-gates principle; proposal + demo with two candidates.
4. **Authoring UX (gated):** the editing overlay's shape is a designer-conversation surface; specimens per `designer-conversation-canvas/` conventions, reviewed on camera if useful - the review itself is a story.

## Validation

- Attribute census before/after (26+9+4 -> ~8) with no orphaned CSS readers (`rg` per family).
- A spell written, cast, edited, and re-cast in one take on a phone-width viewport (the TikTok test).
- A screenshot of a serialized spell interpreted by Grok Imagine yields the spell's intent (the capture test).
- No-JS: spell surfaces degrade to readable prose traces; nothing sole-source hides behind the overlay.

## Out Of Scope

- Physics vocabulary changes (boon/bane stays with `interaction-grammar/`).
- Cross-visitor spell sharing infrastructure (serialization ladder owns the format first).
- Any styling authority beyond `-intent` variables and variance-eligible tokens.

## Implementation Note - 2026-07-03 Phase 1 + 2 Landed

- `interface/cauldron/contract.js` now names every live cauldron attribute (23 documented), owns the G1 state-bundle grammar (`composeCauldronState` / `readCauldronState` / `applyCauldronState`, axes: phase, count, garden, resonance, collected, discoverability), documents the top-down/bottom-up selectability principle, and registers the `decompose` action + `spell:decomposed` event.
- Consolidated the quadruplicated vessel state: `data-spw-cauldron-phase`, `-count`, `-force-count`, and host/preview `data-spw-ingredient-count` all retired into `data-spw-cauldron-state="phase:x count:n"`. Writers migrated: composition.js (root, hosts, mirrors), cauldron/chrome.js (chip, rail), site-settings-engine.js (kernel-side literal with contract pointer), module-catalog.js manifest. Reader migrated: observation-beats.js via `readCauldronState`.
- CSS matchers rewritten to token grammar (`[data-spw-cauldron-state~="phase:empty"]`) in `shell/chrome/adaptive.css` and `components/cauldron.css`; genome banners regenerated; cauldron.css gained its chapter banner naming the contract as source of truth.
- **Decompose verb landed:** spellbook bundle cards gain `$ decompose`; `window.spwSpells.decompose(name)` replays a checkpoint's registry through the `spell:capture` front door (cauldron owns all storage mutations), capped at maxIngredients, emitting `spell:decomposed`. Edit = decompose, adjust, re-mix is now real.
- Validation: `check:local` passed; contract helpers smoke-tested (write/merge/read round-trip). Browser gesture-path verification (hold-prime -> decompose -> re-mix) still owed per the Phase 2 gate - demo before promotion.

## Concept Intake - 2026-07-03 (Spwashi direction)

Queued for integration, routed per ecology: **pulsing** (vessel heartbeat; microinteraction owner here), **local component state caching** (interaction-cache stratum per `runtime-bootstrap-performance/`), **measurement arcs** (extends `runtime/observation-beats.js` beats into named arcs), **gentle opportunities to interact with and manage state** (cauldron/panel affordances), **navigational constructs as tangible items** (spells as carryable objects - the item model from the RPG substrate), **recognized abilities as named esoteric effects** (casting/decomposing surfaces named effects via components, panels, popups, overlays - ties to discovery-reward credits already emitted on cast). The bulletin-board / publishing / paper-manufacturing lore lives in `literacy-precipitation-press/PLAN.md`.

## QA Surface - 2026-07-03

`/design/experiments/spellcraft-bench/` is the deterministic screenshot/QA bench: static vessel-phase specimens (state bundles authored in markup), operator/operand atom grammar including open valences, effect-ledger seed/readout controls, and the decompose walkthrough that serves as this plan's Phase 2 promotion gate. Specimens are contracts made visible - if a screenshot changes, a contract moved.

## Implementation Note - 2026-07-03 Sigil Position, Disposition, And Contours

- `splitOperatorExpression` now delegates to `parseSigilPosition`, so postfix and infix expressions carry real `position:` tokens in the `data-spw-op` bundle; button labels, copy sigils, and spell atoms read one grammar.
- Prefix/postfix attention seams refined in `sigils-and-chips.css`: prefix sigils carry a leading gradient (attention flows forward into the operand), postfix a trailing one (reflection back); rules match both `data-spw-sigil-position` and the op-bundle position token.
- **Operational disposition landed** (`data-spw-op-disposition`, typed in spw.d.ts): containers determine payload behavior per spatial physics - the cauldron host writes `charge`, cast/reset write `discharge`, checkpoint writes `reference`, restore/decompose write `dereference`. CSS physics are paint-only: charge pulls inward (inset), discharge radiates, reference points (dotted underline), dereference resolves (solid).
- **Contour grammar entered the kernel** (`parseContourExpression` + SpwContour type): `topic(primary payload)[mode]{discussion queue}` - the brace type is the semantic slot. The bench documents the anatomy statically; painting contours over articles is gated design work (overlay feel + annotation UX), queued behind the Phase 4 authoring gate.
- Bench gained disposition and postfix/contour specimens. All states remain statically screenshotable.

## Grammar Play Log - 2026-07-03

Spwashi, out loud: `<painting>water[phys:reality.main](usage=brush{look,feel},cleaning){how,effects,alternatives}`

Current kernel parse (verified): head `<painting>water`, mode `phys:reality.main`, payload `usage=brush{look,feel},cleaning`, queue `how,effects,alternatives` - the flat pass survives nesting of *different* brace types because closers differ. What the specimen teaches, held as open questions rather than parser features:

- `<painting>` reads as a fourth slot glued to the head - a lens or medium declaration. Is `<>` the medium slot (the substance the contour is rendered in), distinct from mode?
- `phys:reality.main` - namespaced mode axes with dotted paths; rhymes with the G1 `axis:value` grammar, suggesting modes ARE bundles.
- `usage=brush{look,feel}` - `=` binds a sub-assignment inside a payload, and same-slot nesting (brush carries its own queue-like list). The flat parser treats this as opaque content, which is honest for now: segments hold their raw text until the notation settles.
- Comma lists in queue and payload read as siblings awaiting expansion - each queue item is a discussion thread the contour could open.

Parser posture: keep `parseContourExpression` flat and content-opaque while the notation is being played with; nested/typed segment parsing waits until at least three real contours exist on real articles. Same-type nesting (a `(` inside a payload) is the known breaking case.

## Implementation Note - 2026-07-03 Effect Vocabulary And Positional Dispatch

- `OPERATOR_AFFORDANCES` in `kernel/shared.js`: verbs per operator role, one table, one source. Spwashi-given verbatim: substrate [charge, inspect], action [prime, dry-run, preview], subject [collect], perspective [trace, pivot], potential [store, discharge]. Remaining fourteen roles carry intent-derived draft verbs (marked as drafts in the table comment) - tuning them is a vocabulary gate, and the edit point is exactly one file section.
- Positional dispatch: the op bundle gains a `dispatch:` axis derived from position (prefix->forward, postfix->reflect, infix/expression->enclose). CSS and JS can now key behavior off where attention goes when an expression fires.
- Spell atoms surface their affordances in the title ("substrate — affords: charge, inspect") read from the table; the bench renders the full vocabulary as a capture-legible table.
- Sigils in copy read as references: inline semantic carriers inside prose (p/li/dd/figcaption/frame-note) wear the dotted reference seam by default, quieter than link styling, layout-inert. Dereference resolves solid elsewhere; priming and reference selection keep their existing gesture paths.

## Sigil Usage Audit - 2026-07-03

Site-wide audit of authored handles (144 route files): label sigil vs `data-spw-operator`, alias-resolved. 504 agree; 127 diverged, in three tiers:

**Tier 1 - fixed (objective):**
- Kernel alias map gained the intent-verb forms authored in HTML (`integrate`, `situate`, `bind`, `act`, `tune`): ~50 handles that previously failed definition lookup (null geometry, generic affordances) now resolve. No HTML churn - the vocabulary met the authors where they already write.
- `$ now` (home) and `$ current sprint` (contact) re-declared substrate: the $ sigil and the meaning (time/attention/money support layer) agreed with each other and disagreed with the attribute.
- Bench's reference-disposition chip corrected to `= minted reference` with `binding` (was `%`/pragma - my own sloppy specimen).

**Tier 2 - sanctioned pattern, documented not fixed:** lens/mode chips (`.surface`, `^syntax`, `*artifacts`, `@website`, ~11 hits) declare role `select` while their sigils express destination flavor. This is deliberate two-axis semantics - the attribute names the chip's behavioral role, the sigil names where it points - and the mode-switch CSS already keys `--active-op-color` off `data-set-mode` for exactly this reason. Same hypothesis likely applies to nav cards (`#>` address sigils with flavor-role attributes, ~30 hits): the sigil says "this is an address," the attribute colors the destination genre.

**Tier 3 - judgment queue (Spwashi's ruling wanted):** whether Tier 2's two-axis layering is doctrine or drift. If doctrine: name it (e.g. sigil = deixis, attribute = flavor) in `.spw` conventions and the audit closes. If drift: the queue is ~40 declarations across home/topics/design routes, migratable per-route. Individual oddities parked with the queue: `@care_protocols` declared action, `* relationships` declared merge, `# design studio` (vibration sigil, frame declaration - possibly a typo'd `#>`), generic `concept` on paired delimiter spans in topics/software (acceptable simplification).

Audit method is reproducible: alias-resolved sigil-vs-attribute comparison over `<button|a|span data-spw-operator>` elements; rerun after any ruling.

## Implementation Note - 2026-07-03 Sigil Anatomy Hydration

Per Spwashi: sigils should be wrapped in HTML distinct from their operand, with raw HTML allowed to differ from the hydrated expression. Landed as `runtime/sigil-anatomy.js` (module catalog, enhancement/immediate):

- Raw authored HTML keeps the fused readable form (`$ now`); hydration wraps `.spw-sigil` + `.spw-operand` spans with spacing preserved byte-for-byte, so anatomization causes zero layout shift. No-JS reading IS the fused text - the degradation is the original.
- Hosts with existing nested markup are marked `authored` and left alone (spell atoms keep their prefix/nucleus/postfix anatomy); sigil-less chips are marked `bare`. The pass is idempotent via `:not([data-spw-sigil-anatomy])`.
- Hydrated hosts gain the `data-spw-op` bundle from the kernel, so authored chips join the combinatoric selection space without authoring churn.
- CSS enhancement-only: sigil takes the grammar voice (mono, weighted, operator-colored), operand keeps the reading voice. Typed in spw.d.ts (`spwSigilAnatomy`).
- Bench specimen added (raw vs hydrated comparison). Scope: `.operator-chip` population first; `.frame-sigil` mode-switch labels wait for a browser look since their pressed-state styling is denser.

## Drift Resolution And Chip Functional Model - 2026-07-03

**Drift resolved (Spwashi ruling: it was drift).** Doctrine, now operational:

1. `data-spw-operator` agrees with the visible label sigil (alias-resolved) - the sigil is the truth readers learn.
2. Destination genre keeps its color through a `flavor:` token in the `data-spw-op` bundle; a single paint-only CSS map (sigils-and-chips.css) binds flavor tokens to op-color tokens. 34 drifted `#>` nav chips migrated (`address` + `flavor:stream|wonder|integrate|surface|action|route`).
3. Function-chips are the documented exemption: lens/mode chips (`data-set-mode` machinery) declare their function (`select`); their coloring already keys off the mode target.
4. The sigil-anatomy module now merges bundles - authored axes (flavor) win, hydration adds the grammar axes (operator/operand/position/dispatch) they lack.

**Chip functional model (function, interactivity, transdimensional payloads, lifecycle):**

- A chip is a *reference with a payload*. The payload (`SpwChipPayload` in spw.d.ts) is the invariant that survives every dimension crossing: surface DOM -> cauldron ingredient -> spell step -> effect-ledger entry -> printed artifact (the precipitation ladder is the dimension list). Each dimension may enrich the payload; none may drop expression, label, op grammar, origin, deepLink, or capturedAt.
- Interactivity is lifecycle-gated, and lifecycle verbs come from the affordance table: a **candidate** invites priming; a **primed** chip invites collection (charge); a **collected** ingredient invites composition (mix) or tending (nourish/prune); a **composed** step invites casting (discharge) or minting (reference); a **cast** record invites replay or decompose (dereference); **decayed** invites pruning or revival. Reference chips age fresh -> familiar independently (cognition-familiarity track).
- Transdimensional test (for the bench, next browser session): capture one chip on a content route, walk it through vessel -> spell -> ledger, and verify the payload reads identically in the state inspector at every stop; the printed/screenshot projection is the final dimension and must carry the same story.
- Open interactivity question for a gated demo: should a chip *show* its dimension history (a small crossing-count or origin trace on hover), making transdimensionality itself legible?
