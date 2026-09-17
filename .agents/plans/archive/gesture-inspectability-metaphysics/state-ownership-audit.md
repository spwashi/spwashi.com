# State Ownership Audit

Workstream A deliverable for `gesture-inspectability-metaphysics`.

## Purpose

Map which shared runtime modules currently write meaning-bearing `data-spw-*` state, which writes are transient gesture residue, and which writes persist across sessions. This is the baseline needed before further gesture or inspectability expansion.

## State classes

### Canonical state

State that the site may reasonably expose as semantic truth for the current page, shell, or host.

Examples:

- page lifecycle and attention phase
- section locomotion and reading locus
- shell menu topology and intent
- image host semantic identity

### Derived durable state

State that can remain visible for more than one frame or gesture, but should still be understood as a projection of canonical state rather than independent truth.

Examples:

- spell familiarity / liminality summaries
- route or card-level inspect summaries
- helper-strip mirrors of host state

### Transient gesture state

State that exists only to support a live gesture, hover, hold, preview, armed phase, or settling sequence. This state should not silently become semantic truth.

Examples:

- `armed`, `preview`, `hold`, `drag`, `primed`
- pointer-mode or hover-driven pressure
- gesture charge and local focus echo

### Persistent local state

State stored in `localStorage` or similar browser persistence. This should be explicitly inspectable and resettable.

Examples:

- pinned items
- checkpoints
- dismissed notices
- visited image surfaces
- cauldron ingredients

## Current ownership table

| Module | Main write surface | Canonical writes | Derived durable writes | Transient writes | Persistence |
|---|---|---|---|---|---|
| `public/js/runtime/page-state.js` | `<html>` | `spwPageState`, `spwPagePresence`, `spwPageArrival`, `spwPageArrivalStep`, `spwPageTransition`, `spwPageTransitionPhase`, `spwAttentionContext` | none | arrival-step sequencing during settle | none |
| `public/js/runtime/attention-architecture.js` | handle shell, sections, `<html>`, reading beats | `data-spw-page-section-*`, `data-spw-section-state`, `data-spw-reading-groove*`, `data-spw-reading-beat*`, `data-spw-scroll-cadence` | handle labels, availability, section index metadata | `data-spw-handle-state`, `data-spw-handle-phase`, `data-spw-pinch-scaling`, `data-spw-pinch-text-scale`, `data-spw-resonance-probe` | none |
| `public/js/runtime/shell-disclosure.js` | header, nav, toggle, utility row, `<html>` | `spwMenuMode`, `spwMenuPhase`, `spwMenuPressure`, `spwMenuTopology`, `spwMenuIntent`, `spwMenuClarity`, `spwMenuViewport`, `spwMenuPointer`, `spwMenuReversible`, `spwMenuReturnPaths` | `spwMenuChanged`, `spwMenuNavFit`, `spwMenuRouteCount`, `spwMenuOverflowCount`, utility affordance datasets like `spwFontScale`, `spwColorMode`, `spwPathAvailable`, `spwUtilityMode` | settle / approach / contact phase transitions | none |
| `public/js/runtime/brace-gestures.js` | local hosts, semantic targets, field root | resolved semantic writes such as `spwResolvedOperator`, `spwResolvedWonder`, `spwResolvedContext`, `spwResolvedAffordance`; optional semantic expansion state like `spwSemanticExpanded`; pinning state `spwPinned`, `spwLatched` | `spwHandleKind`, `spwSemanticFocusRoot`, `spwSemanticFocusKey`, `spwSemanticMatch`, `spwSemanticFocused` | `spwGesture`, `spwCharge`, `spwArmed`, `spwLastGesture`, `spwFieldGesture`, field CSS vars | `localStorage('spw-pins')` |
| `public/js/runtime/experiential.js` | header trace, breadcrumb dock, sample dock, `<html>` | `spwExperientialSurface`, sample state fields, breadcrumb state fields | contextual memo state, route/operator summaries | sample hover / hold / swipe gesture state, temporary memos | `localStorage('spw-pins')` reuse |
| `public/js/runtime/spells.js` | spell dock / board | none clearly canonical; mostly summaries of other systems | `spwSpellFamiliarity`, `spwSpellLiminality`, `spwSpellCognitive`, `spwSpellMeaningMode`, `spwViewport` | dock viewport compactness and replay affordance state | `localStorage('spw-checkpoint:*')` via checkpoints |
| `public/js/media/image-metaphysics.js` | image hosts and helper controls | host semantic identity like `spwImageSurface`, `spwImageKey`, `spwMedium`, `spwRealization`, `spwSubstrate`, `spwPhrase`, `spwImageProminence`, `spwImageResonance`, `spwImageEffect`, `spwAccentPalette`, `spwVisited` | `spwImageState`, `spwContrastState`, `spwImageLayout`, `spwImageMemoryState` mirrored onto helper strip/button/memory | `spwImageInput`, `spwImagePreview`, `spwControlsOpen`, `spwHoldState`, `spwImageGesture`, `spwImagePrimed`, `spwVisitBurst` | `localStorage('spw-visited-image-surfaces')` |
| `public/js/interface/composition.js` | `<html>` plus cauldron surface | `spwCauldronCount` | none | none | `localStorage('spw-cauldron')` |
| `public/js/interface/discovery-notices.js` | notice elements, stack root, modal root | element-local notice semantics: cadence, presentation, copy unit, locale, promo theme/kind/cta-style/handles | none | modal / toast presence and dismissal timing | `localStorage('spw-discovery-notice-dismissals')` |

## Ownership assessment

### Clear owners

- `page-state.js` is the clearest canonical owner for page-level lifecycle and arrival semantics.
- `attention-architecture.js` is the clear owner for section locomotion and reading-locus state.
- `shell-disclosure.js` is the clear owner for shell navigation pressure, topology, and intent.

These three modules already behave like canonical state writers and should remain privileged.

### Mixed owners

- `brace-gestures.js` mixes transient gesture residue with resolved semantic meaning and persistent pinning.
- `experiential.js` mixes inspect narration with interaction state and reuses pin persistence.
- `image-metaphysics.js` mixes semantic image identity with hover, hold, preview, and helper-control state on the same host.

These modules need stricter boundaries between:

- semantic identity
- inspect summaries
- active gesture residue
- persistence

### Reflective rather than canonical writers

- `spells.js` should be treated primarily as a reflective reader and narrator of existing grounded state unless a replay or restore action is explicitly committed.
- `composition.js` should remain small and explicit unless the cauldron becomes a larger canonical system with typed ingredient roles.
- `discovery-notices.js` should keep most of its writes local to notice instances and should not become a parallel page-state authority.

## Current collisions and ambiguities

### 1. Field state overlap

`brace-gestures.js` and `experiential.js` both write field-like wonder/context state. That creates ambiguity about whether the current field is:

- a live gesture atmosphere
- a route-level inspect summary
- a durable semantic context

Recommendation:

- reserve field-root writes for one owner
- split into explicit namespaces such as `semantic field`, `inspect field`, and `gesture field` if multiple layers must coexist

### 2. Pinning semantics are shared but not clearly governed

`brace-gestures.js` writes `spwPinned` / `spwLatched` and persists `spw-pins`. `experiential.js` consumes or reuses this persistence for bookmarks and breadcrumbs.

Recommendation:

- define one canonical pin registry owner
- make every other module a reader or dispatcher
- publish a visible inspect/reset surface for pin persistence

### 3. Image hosts combine identity and live interaction state too tightly

`image-metaphysics.js` writes both enduring identity (`spwMedium`, `spwSubstrate`, `spwImageSurface`) and highly transient interaction state (`spwHoldState`, `spwImageGesture`, `spwControlsOpen`) to the same host.

Recommendation:

- keep semantic identity on the host
- move helper and active gesture residue to helper descendants or runtime-only attributes with explicit inspect labels
- expose which values are semantic versus interactive in inspect mode

### 4. Reflective systems risk becoming silent authorities

`spells.js` summarizes cognition and familiarity from existing state, but if later expanded carelessly it could become a parallel owner of meaning-bearing state.

Recommendation:

- define spells as replay surfaces by default
- only allow canonical writes on explicit cast / restore / checkpoint actions

### 5. Modal and promo surfaces have semantics without ownership narration

`discovery-notices.js` writes meaningful local state like presentation, cadence, locale, and campaign handles, but there is no shared inspect vocabulary for whether a notice is preview, active, dismissed, or persistent.

Recommendation:

- classify notice state under the same inspect ladder used elsewhere
- distinguish local display state from persistent dismissal state

## Proposed precedence model

### Tier 1: canonical semantic writers

Only these modules should write page-level or section-level truth by default:

- `public/js/runtime/page-state.js`
- `public/js/runtime/attention-architecture.js`
- `public/js/runtime/shell-disclosure.js`
- selected semantic identity writes in `public/js/media/image-metaphysics.js`

### Tier 2: semantic adapters

These may write resolved meaning onto local hosts, but should not redefine page truth:

- `public/js/runtime/brace-gestures.js`
- `public/js/media/image-metaphysics.js`

### Tier 3: reflective inspect/narration systems

These should mostly read and narrate:

- `public/js/runtime/experiential.js`
- `public/js/runtime/spells.js`
- inspect surfaces under settings / console / badges

### Tier 4: ephemeral gesture systems

These may write temporary residue only:

- brace charge / armed / gesture traces
- hover / hold / primed / preview image state
- shell approach / contact / settling transitions

### Tier 5: persistence registries

Persistent state should be centralized by family and surfaced in inspect/reset UI:

- `spw-pins`
- `spw-cauldron`
- `spw-checkpoint:*`
- `spw-discovery-notice-dismissals`
- `spw-visited-image-surfaces`

## Browser audit implications

The first browser pass should explicitly test whether transient gesture state clears correctly and whether canonical state remains legible after:

- route transitions
- back/forward restoration
- touch scroll with aborted holds
- hover-to-focus transitions
- opening and closing shell overlays
- image helper preview followed by calm rest

Failures to watch for:

- stale `armed`, `preview`, `hold`, or `settling` datasets
- page-level truth being overwritten by local helper modules
- persistent state surviving without any visible provenance or reset path

## Immediate follow-up tasks

1. Build a writer-by-attribute table for the highest-risk shared keys:
   `field`, `pinned`, `latched`, `wonder`, `context`, `arrival`, `section`, `image state`.
2. Decide whether `brace-gestures.js` keeps any canonical semantic writes, or only writes resolved local annotations plus dispatch events.
3. Add an inspect vocabulary for persistence:
   `session`, `persistent`, `dismissed`, `restorable`, `resettable`.
4. Define one visible reset path per persistence family on `/settings/` or an inspect surface.
