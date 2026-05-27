# Plan: Context-Sensitive Component Variants + Agent Browser QA (Vision + Semantic DOM)

**Origin**: Direct user query (2026-05-27) after layout-shift-audit debug instrumentation work.  
**Approved high-level plan**: See the full session plan at the Grok plan file (summarized here for the local ecology).

## Goal
Make component variants on spwashi.com feel *alive* to their actual situation — size/layout container, local theming resonance, and content pressure — while giving coding agents (and humans in debug mode) the ability to both *view* the rendered browser state (vision/screenshots + rects) and *read* the rich semantic DOM we already author (`data-spw-*` + runtime state + bus + contracts).

Taste note: Extend the existing attribute-driven, CSS-first, highly inspectable system rather than layering a new variant engine on top of it.

## Scope
**In scope**:
- New feedback attributes written by runtime (building directly on `composition-box-model.js`): `data-spw-size-context`, `data-spw-content-tone` (and related local materiality/resonance when useful).
- CSS consumption of the new attrs in shared layers (frames, cards, systems/surfaces) alongside existing `@container` + `:has()` patterns.
- Gated browser-side agent QA surface (exactly following the `?debug=layout` / `?log=layout-shift` precedent just added): capture of labeled regions (semantic snapshot + rects + optional visual), live catalog slice, observation trace.
- Updates to `spwCompose` / `__SPW_SITE__` + debug wiring.
- New canonical semantic families documented in the design catalog + relevant `.spw` contracts.
- Cross-links to existing active plans (`screenshot-semantics`, `content-responsive-layout`, `instrumentation-legibility`, etc.).

**Out of scope (for first pass)**:
- Full Playwright/CDP automation or CI visual regression (only a note + optional future plan).
- Heavy inference heuristics (prefer explicit author hints + light runtime resolution).
- Changes to production visuals or behavior without the debug flag.
- New runtime npm dependencies.

## Files (Initial)
- [NEW] `.agents/plans/context-sensitive-variants-and-agent-qa/PLAN.md`
- [NEW] `.agents/plans/context-sensitive-variants-and-agent-qa/context-variants-qa.spw` (initial contract note)
- [MOD] `public/js/runtime/composition-box-model.js` (or small new resolver alongside it)
- [MOD] `public/css/components/frames.css`, `public/css/components/cards.css`, `public/css/systems/surfaces/*.css` (targeted rules)
- [MOD] `public/js/kernel/instrumentation.js` (spwCompose extensions)
- [NEW or MOD] `public/js/runtime/agent-observation.js` (gated, modeled on layout-shift-audit)
- [MOD] `public/js/site.js` (wiring + debug flag detection)
- [MOD] `design/catalog/` expectations + generator awareness (minimal)
- [MOD] `AGENTS.md` (guidance note once families stabilize)
- Cross-updates to relevant `.spw/conventions/` (site-semantics, composition-box-model, ornament-contract) only when the attributes become real.

## Key Architectural Decisions
- **Context resolver pattern**: Small runtime pass (in the composition/ semantic layer) that walks + infers + writes stable `data-spw-*` feedback. CSS remains the visual engine.
- **Debug gating**: Everything new for agent vision/QA lives behind `?debug=qa|agent|vision` (or combined with existing layout debug) + respects the existing runtime policy / logger machinery. Zero production cost or behavior change.
- **Reuse first**: Build on `snapshotInstrumentationTarget`, composition box model, bus, layout-shift-audit observer pattern, `spwCompose`, and the existing attribute model.
- **Agent-friendly output**: Clean JSON snapshots that pair visual geometry (rects, container role) with full semantic ancestry + state + links toward `.spw` philosophy. Optional canvas crops behind the flag.
- **Screenshot synergy**: This work makes runtime states richer so the human-taken screenshots promoted by the `screenshot-semantics` plan carry even more legible meaning.

## Phases & Commits (High Level)
1. **Tracking + contracts** — This PLAN + initial `.spw` note + catalog expectations.
2. **Phase 1 (size + content feedback)** — Resolver writes `data-spw-size-context` + `data-spw-content-tone`; first CSS consumers in frames/cards.
3. **Phase 2 (local theming)** — Optional local resonance/materiality feedback (lower priority).
4. **Phase 3 (agent surface skeleton)** — Gated capture + live catalog slice + trace, exposed on `spwCompose` and a `__spwAgentDebug` global. Reuse layout-shift patterns.
5. **Integration + polish** — State inspector / console surfaces, catalog regeneration, docs, cross-plan links, manual verification with the debug flag.

## Verification
- `node --check` on edited JS + `git diff --check`.
- Manual: Key routes (`/`, `/settings/`, `/design/`, `/topics/software/`) with `?debug=layout,qa` (or final flag); confirm new attrs appear, `spwCompose` methods work, capture produces usable artifacts.
- No breakage to existing catalog generation or `npm run check`.
- The new surfaces feel like a natural extension of the recent layout-shift debug work.

## Craft Guards (AGENTS.md)
- New semantic families go through shared layers first (components/systems or the resolver) — never one-off route CSS/JS.
- Debug-only agent instrumentation is strictly guarded (same pattern as the just-landed layout-shift-audit).
- Prefer writing `data-spw-*` (inspectable, CSS-reactive, catalog-visible) over new imperative APIs.
- Update `.spw` contracts and `design/` pages only after the families prove themselves in markup + CSS.
- No new runtime dependencies without a plan note and human review.
- Preserve hand-authored + progressive-enhancement character.

## Dependencies / Related Work
- Builds directly on the layout-shift-audit debug gating pattern (fresh in the tree).
- Complements (does not duplicate) `screenshot-semantics`, `content-responsive-layout`, `composition-box-model`, `instrumentation-legibility`.
- The site's existing strength in "screenshot-ready + prompt-native + data-spw-* legibility" is the foundation.

## Failure Modes to Watch
- Over-inference in the resolver → noisy or surprising attrs (mitigate: explicit hints win; resolver is advisory).
- Debug surface becoming too heavy (cap traces, make capture opt-in per call).
- New attrs escaping into prod HTML without the intended CSS (the catalog orphan detection + manual review will catch).

## Agentic Hygiene
- Rebase target: current main at time of first commit.
- This plan file itself is the primary tracking artifact.
- Use existing skills (spw-craft-quality, spw-semantics-rigor, patch-consolidator, review) for later stages if desired.

**Status**: Approved for execution. Phase 1 (size/content context feedback) landed. Phase 3 exploration active.

---

## Phase 3 Deepening: Beats, Screenshot QA Mode, Cauldron Integration, Discoverability (2026-05-27)

This section captures additional user direction after initial Phase 1 delivery.

### Core Concepts to Develop

**1. Beat Concept**
- Generalize the successful 5-second fixed debug window from `layout-shift-audit.js` (`DEBUG_WINDOW_MS` + `flushAndStopDebugCollectors`).
- Create a reusable `ObservationBeat` / window primitive that supports:
  - Configurable duration (default 5s, overridable via `?beat-window=3000`, CSS `--spw-qa-beat-window-ms`, or data attr).
  - Explicit reasons (`qa-mode`, `interaction-loop`, `cauldron-phase`, `frame-change`, `manual`).
  - Lifecycle states that mirror cauldron phases: `gathering` → `resonant` → `mature` → `flushed`.
  - `addMeasurement()` / `addSnapshot()` during the window.
  - Clean flush producing a coherent artifact payload.
- Cyclical rule application: During an active beat, registered "passes" (re-resolve context, snapshot attention field, refresh semantic expressions) can run at a controlled rhythm instead of raw observer firehose.
- Implementation: New small module `public/js/runtime/observation-beats.js` (modeled on layout-shift-audit + interaction-loop). Gated behind `isDebugQAEnabled()`.

**2. Screenshot QA Mode**
- A first-class, poweruser-optimized debug mode.
- Entry points:
  - Query: `?qa=screenshot-qa` or `?mode=screenshot-qa` (added as `debugPresets['screenshot-qa']`).
  - Extends existing `screenshot` + `inspect` presets (physics=screenshot + meaning=inspect + debug=qa,layout,agent + relevant logs).
  - One-click from `spwCompose.qa.enterScreenshotMode()`.
- Behavior in mode:
  - Enhanced semantic visibility (building on `data-spw-*` richness + new size-context/content-tone).
  - Auto or easy manual start of observation beats.
  - Prominent, low-friction capture controls.
  - Still produces beautiful human screenshots (does not fight the `screenshot-semantics` goals).

**3. Artifact Export Shape + Cauldron Integration**
- Consistent artifact shape (proposed):
  ```json
  {
    "type": "spw-qa-artifact",
    "version": "0.1",
    "capturedAt": 1716840000000,
    "mode": "screenshot-qa",
    "cauldronPhase": "resonant",
    "sizeContext": "narrow-hero",
    "contentTone": "operator-heavy",
    "activeBeats": [...],
    "semantic": { /* full snapshot from snapshotInstrumentationTarget + box model + context */ },
    "visual": { "rects": {...}, "imageDataUrl?": "..." },
    "beats": [ { measurements, snapshots, duration } ],
    "cauldronIngredients?": [...],
    "busRecent?": [...]
  }
  ```
- Cauldron semantics: A beat or full artifact can be "captured as ingredient" into the cauldron (`data-spw-cauldron-action="capture-beat"` or similar). "Mix" then produces a spell that is the serialized artifact (or a pointer to it).
- This turns the cauldron into a natural vessel for QA memory gardening — powerusers gather interesting observation moments, tend them, and plant durable "QA spells".

**4. Application Modes & Switching Ease**
- Leverage and extend the existing query disposition system (`applySpwQueryDisposition`, `SPW_QUERY_PRESETS`, `debugPresets`).
- Make mode switching extremely cheap:
  - Query params (primary for shareable/debug links).
  - `spwCompose` methods.
  - Gesture/keyboard chords in QA contexts (e.g. long-hold + swipe, or `?` key for QA palette).
- Normalize "application mode" as a first-class `data-spw-application-mode` (or reuse/extend `data-spw-page-modes` + `data-spw-debug-mode`).

**5. Learnability & Discoverability of Module Architecture**
- All new concepts must be immediately inspectable:
  - Written as stable `data-spw-*` attributes.
  - Exposed through `spwCompose.beats.*`, `spwCompose.qa.*`, and `__SPW_SITE__`.
  - Surface in state-inspector, console, and guide when in QA mode.
  - Documented in the design catalog (static + live slice expectations).
- Lifecycle normalization: Align `Beat` states with `InteractionLoop` states (`IDLE/PREVIEW/ACTIVATED/RESOLVED`) and `Cauldron` phases (`gathering/resonant/mature/decayed/empty`).
- Make the mental model legible: "Beats are short, intentional observation cauldrons for the agent eye."

**6. Lifecycle Normalization**
- Beats should be able to start/end in sync with cauldron phase changes or interaction loop transitions.
- Observation artifacts should carry their originating lifecycle context.

**7. Keyboard + Touchscreen Shortcuts & Gestures**
- In normal mode: Respect existing experiential + brace gesture system.
- In Screenshot QA Mode (or when any beat is active): Add lightweight, discoverable affordances:
  - Keyboard: `S` (or `Shift+S`) = capture current beat artifact; `?` = show QA help / current beat status; `Esc` in QA mode = clean exit.
  - Touch: Long-press on certain chrome or frames (in QA mode) surfaces capture + beat controls.
  - Visual anchors (reusing `spw-gesture-anchor` pattern from experiential.js) that explain "hold to start beat", "swipe to cycle capture targets".
- All shortcuts are opt-in / only active when QA/debug flags are present.

### Files (Phase 3 Additions)
- [NEW] `public/js/runtime/observation-beats.js` (core Beat primitive + QA helpers)
- [MOD] `public/js/kernel/instrumentation.js` (new `screenshot-qa` preset + `spwCompose.beats` / `spwCompose.qa` surface)
- [MOD] `public/js/site.js` (register observation-beats as gated enhancement, following layout-shift-audit pattern)
- [MOD] `public/js/interface/composition.js` (optional: one new cauldron action for "capture current beat")
- [MOD] `public/js/runtime/experiential.js` (light gesture/keyboard extensions for QA mode)
- [MOD] `.agents/plans/context-sensitive-variants-and-agent-qa/PLAN.md` + `context-variants-qa.spw`
- [MOD] `design/catalog/` expectations (new attributes and surfaces)

### Craft Guard for This Deepening
- All new behavior remains strictly behind debug/QA flags.
- No changes to production cauldron, gestures, or mode switching.
- New semantic families (`data-spw-active-beat*`, beat artifacts as cauldron ingredients) go through the existing attribute + bus + catalog machinery.
- Prioritize making the *existing* rich substrate (cauldron phases, interaction loops, site rhythm, data-spw context) more usable for agents and powerusers rather than inventing parallel systems.

### Success Criteria for This Slice
- Poweruser can type `?qa=screenshot-qa`, see enhanced visibility + an active beat, perform a gesture or keypress, and get a clean artifact (JSON + optional image) that references cauldron state.
- `spwCompose.beats.captureArtifact()` and `spwCompose.qa.*` are discoverable from console in the mode.
- The mental model ("beats are short observation cauldrons") is legible in data attributes, bus events, and inspector surfaces.

**Next concrete work**: Land the `observation-beats.js` module + wiring + basic Screenshot QA preset + artifact shape (as done in this session). Iterate on cauldron integration and gesture affordances based on early use.

### Surfacing, Lifecycle Normalization & Module Description Work (current slice)
- **Surfacing of beats**: 
  - Added `beats.snapshot()` + `beats.listActive()` to `window.__SPW_SITE__`.
  - Beats now appear in state-inspector snapshots (runtime.beats) and copy-to-clipboard output.
  - Rich contract exported from observation-beats (states, reasons, lifecycle ties, data attrs).
- **Page/region/component lifecycle**:
  - BEAT_STATES deliberately normalized to parallel cauldron phases (gathering/resonant/mature/flushed) and interaction-loop states.
  - Beat start/flush events carry `lifecycle` payload for downstream listeners (page, region, component, cauldron).
  - Observation beats now participate in the same "phase" storytelling as regions (QUEUED → HYDRATING → ENHANCED) and components.
- **Module description normalization**:
  - `inferModuleDimensions` now consistently tags lifecycle, qa-observation, beat modules.
  - Debug/QA modules (observation-beats) have normalized `describes` including explicit `lifecycle[...]` for discoverability in snapshots, catalog, and spell expressions.
  - Module records in snapshots and __SPW_SITE__ now better surface consequence/lifecycle intent for agent-readable "runtime spells".

All changes keep the attribute-driven, inspectable model and feed directly into existing inspectors, cauldron, and agent surfaces.

### Positionality + Time Context (current enhancement)
- Observation artifacts now carry a composable `context` block, not just raw beat ids. The block includes route, hash, local timestamp, timezone, scroll position/progress, viewport, active frame selector/rect, semantic snapshot, and composition-box snapshot.
- This makes "where/when was I reading?" a first-class design input for cognitive and metaphysical components. The same card can now be interpreted as a different local spirit when route, scroll, time, climate, or active frame changes.
- The public home copy now introduces this gently for technical readers and curious learners: navigation capability accumulates by return, and small contextual differences can become meaningful interface behavior rather than invisible state.

### Execution Notes (latest slice)
- Module system enhanced with `debugOnly` flag + better consequence/reason tracking in `shouldScheduleDefinition` and mount records (site.js).
- Cauldron made more functional (mixIngredients now returns `{html, functional}` with brace/physics context pulled live). Added `captureBeatAsIngredient` helper; beats/artifacts are first-class gatherable forces. Brace physics and site rhythm now influence cast forms.
- Gesture affordances wired in experiential.js (keyboard `s`/`?`/`b` for capture/status/beat in QA mode; long-press on frames starts beat; touch-friendly).
- Design copy lightly updated in `design/runtime/index.html` for discoverability of the new surfaces.
- All changes surgical, gated, and aligned with cauldron lifecycle + existing interaction semantics. Validated with node --check + git diff --check.
