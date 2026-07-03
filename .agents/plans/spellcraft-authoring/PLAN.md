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
