# Writer Attribute Matrix

Attribute-level follow-up to [state-ownership-audit.md](/Users/spwashi/air/spwashi.com/.agents/plans/gesture-inspectability-metaphysics/state-ownership-audit.md:1).

## Purpose

Identify the highest-risk shared keys and decide, per key:

- who writes today
- who should own it
- whether it should be canonical, derived, transient, or persistent

This is the decision surface needed before changing runtime behavior in `brace-gestures.js`, `experiential.js`, or `image-metaphysics.js`.

## Decision rules

- `canonical`: stable semantic truth, visible in inspect mode, safe to narrate
- `derived`: readable projection of canonical state, but not the source of truth
- `transient`: live gesture or settling residue only
- `persistent`: browser-stored state that must expose provenance and reset

## Shared-key matrix

| Key family | Current writers | Current readers / dependents | Recommended owner | State class | Decision |
|---|---|---|---|---|---|
| `spwPageArrival`, `spwPageArrivalStep`, `spwPageTransition`, `spwPageTransitionPhase`, `spwAttentionContext` | `public/js/runtime/page-state.js` | `spells.js`, `experiential.js`, CSS arrival systems | `page-state.js` | canonical | Keep exclusive. Other modules should read only. |
| `data-spw-page-section-*`, `data-spw-section-state`, `data-spw-reading-groove*`, `data-spw-reading-beat*`, `data-spw-scroll-cadence` | `public/js/runtime/attention-architecture.js` | handle UI, reading CSS, inspect surfaces | `attention-architecture.js` | canonical | Keep exclusive. Route or inspect helpers must not shadow these keys. |
| `spwFieldWonder` | `public/js/runtime/brace-gestures.js`, `public/js/runtime/experiential.js` | CSS field response, memo / inspect surfaces | split ownership or single field owner | ambiguous today | Current collision. Prefer one canonical field key for durable context and a separate transient gesture-field key. |
| `spwFieldContext` | `public/js/runtime/brace-gestures.js`, `public/js/runtime/experiential.js` | field CSS and contextual narration | split ownership or single field owner | ambiguous today | Same problem as `spwFieldWonder`. Do not let inspect narration overwrite gesture context or vice versa. |
| `spwFieldOperator` | `public/js/runtime/experiential.js` | inspect summaries | `experiential.js` or future inspect owner | derived | Safe as inspect-only if it stops pretending to be field truth. Rename or scope if necessary. |
| `spwFieldGesture` | `public/js/runtime/brace-gestures.js` | CSS field hormones, possible inspect surfaces | `brace-gestures.js` | transient | Keep, but make it explicitly transient and clear it aggressively. |
| `spwGesture`, `spwCharge`, `spwArmed`, `spwLastGesture` | `public/js/runtime/brace-gestures.js` | brace CSS, gesture affordance logic | `brace-gestures.js` | transient | Keep local to gesture hosts. Do not narrate as durable semantics. |
| `spwResolvedOperator`, `spwResolvedWonder`, `spwResolvedContext`, `spwResolvedAffordance` | `public/js/runtime/brace-gestures.js` | inspect / CSS-mutation experiments | `brace-gestures.js` when mutation mode is on | derived | Allowed only as resolved annotations. They should never outrank author-owned route semantics. |
| `spwSemanticExpression`, `spwSemanticKey`, `spwSemanticFamily`, `spwSemanticRoot*`, `spwSemanticVariant*`, `spwSemanticBehavior*`, `spwSemanticLens*` | `public/js/runtime/brace-gestures.js` | semantic expansion UI, inspect surfaces | `brace-gestures.js` as local semantic adapter | derived | Keep local and inspectable. Do not treat these as page-level truth. |
| `spwSemanticExpanded`, `spwSemanticFocused`, `spwSemanticMatch`, `spwSemanticFocusRoot`, `spwSemanticFocusKey` | `public/js/runtime/brace-gestures.js` | semantic expansion CSS and inspect logic | `brace-gestures.js` | transient or short-lived derived | Treat expansion/focus as ephemeral inspect state, not durable semantics. |
| `spwPinned`, `spwLatched` | `public/js/runtime/brace-gestures.js`, cleared/read by `public/js/runtime/experiential.js` | bookmark registry, card / frame CSS | one pin-registry owner, likely new shared pin module or `brace-gestures.js` initially | mixed transient + persistent | `spwPinned` should represent persistent pin state. `spwLatched` should represent transient pulse / local emphasis. They should not share ownership. |
| `localStorage('spw-pins')` | `public/js/runtime/brace-gestures.js`, `public/js/runtime/experiential.js` | settings / pin views / bookmark panels | one pin-registry owner | persistent | Centralize write authority. Other modules should read or dispatch events only. |
| `spwSpellFamiliarity`, `spwSpellLiminality`, `spwSpellCognitive`, `spwSpellMeaningMode`, `spwViewport` | `public/js/runtime/spells.js` | spell dock and spell CSS | `spells.js` | derived | Keep reflective. No canonical ownership creep. |
| `localStorage('spw-checkpoint:*')` | `public/js/runtime/spells.js` and checkpoint helpers | spell replay / restore | spell/checkpoint subsystem | persistent | Valid persistence family. Needs inspect and reset hooks. |
| `spwImageSurface`, `spwImageKey`, `spwMedium`, `spwRealization`, `spwSubstrate`, `spwPhrase`, `spwImageProminence`, `spwImageResonance`, `spwImageEffect`, `spwAccentPalette`, `spwVisited` | `public/js/media/image-metaphysics.js` | image CSS, helper strips, inspect surfaces | `image-metaphysics.js` | canonical for identity, persistent for `spwVisited` | Keep on host. Distinguish identity from memory clearly in inspect UI. |
| `spwImageState`, `spwContrastState`, `spwImageLayout`, `spwImageMemoryState` | `public/js/media/image-metaphysics.js` | helper UI, CSS transitions | `image-metaphysics.js` | derived | Good as projections; should remain computable from identity + interaction. |
| `spwImageInput`, `spwImagePreview`, `spwControlsOpen`, `spwHoldState`, `spwImageGesture`, `spwImagePrimed`, `spwVisitBurst` | `public/js/media/image-metaphysics.js` | helper strip, hover/hold logic, CSS | `image-metaphysics.js` | transient | Keep transient. Prefer helper-local mirroring where possible instead of overloading host identity. |
| `localStorage('spw-visited-image-surfaces')` | `public/js/media/image-metaphysics.js` | image revisit logic | `image-metaphysics.js` | persistent | Keep, but expose reset and provenance. |
| `spwCauldronCount` | `public/js/interface/composition.js` | cauldron UI | `composition.js` | derived | Fine as a root summary. The item list itself remains the persistent truth. |
| `localStorage('spw-cauldron')` | `public/js/interface/composition.js` | cauldron UI | `composition.js` | persistent | Keep local until a typed ingredient model exists. |
| notice-local keys such as `data-spw-cadence`, `data-spw-presentation`, `data-spw-copy-unit`, `data-spw-locale`, promo theme / kind / handles | `public/js/interface/discovery-notices.js` | notice CSS, modal/toast surfaces | `discovery-notices.js` | canonical local-to-notice | Fine if kept local. Do not elevate to page truth. |
| `localStorage('spw-discovery-notice-dismissals')` | `public/js/interface/discovery-notices.js` | notice suppression | `discovery-notices.js` | persistent | Needs visible reset path and inspect wording. |

## Immediate decisions

### 1. Separate field semantics from field gesture

Recommended split:

- `spwFieldWonder`, `spwFieldContext`
  Canonical or at least durable field context, owned by one module only.
- `spwFieldGesture`
  Transient brace-driven atmosphere, owned by `brace-gestures.js`.
- optional future `spwInspectField*`
  Narrated inspect summary, owned by inspect surfaces only.

This prevents `experiential.js` from overwriting the same field keys that `brace-gestures.js` uses for live hormonal response.

### 2. Split pin truth from latch pulse

Recommended contract:

- `spwPinned`
  Persistent semantic state tied to the pin registry.
- `spwLatched`
  Local transient emphasis or recent-commit pulse only.

`experiential.js` should not directly clear or author pin truth without going through the pin registry owner.

### 3. Reduce `brace-gestures.js` authority

Recommended reduction:

- keep local gesture residue
- keep optional resolved semantic annotations in mutation mode
- stop writing any page-like or field-like durable truth unless explicitly designated

This aligns with the idea that gestures interpret or invoke semantics; they should not silently become the semantics authority.

### 4. Keep `spells.js` reflective

Spells should read:

- arrival state
- grounded state
- route/path memory
- checkpoint persistence

They should only write durable state when a user explicitly casts, restores, or checkpoints.

### 5. Keep image identity and image interaction legible as separate layers

Recommended distinction:

- host identity keys remain on the host
- active gesture and helper visibility state remain transient
- helper descendants may mirror transient state, but inspect mode should label them as interaction residue

## Recommended implementation order

1. Refactor field-state ownership:
   remove `experiential.js` writes to contested field keys or rename them into inspect-only keys.
2. Centralize pin persistence:
   one write path for `spw-pins`, one event contract for readers.
3. Demote brace semantic expansion state from implicit truth to explicit inspect state.
4. Add inspect/reset surfaces for all persistence registries on `/settings/`.
5. Run the browser specimen audit against these rules before adding new gestures.
