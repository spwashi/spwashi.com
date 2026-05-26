# Runtime Load Instrumentation

## Public Goal
Make the staged runtime bootstrap and dynamic module loading (core → feature → region → enhancement layers) first-class observable behavior for editors, debuggers, and performance tooling.

- Use the standard Performance API (marks + measures under `spw:*` namespace) so DevTools timelines, traces, and RUM see boot phases and per-module import/mount costs with zero custom code.
- Wire the existing `createSpwLogger` + `spw-log` / `log-level` query controls into the load path using the `LIFECYCLE` relation so structured load traces respect site-wide diagnostics posture.
- Extend the public `modules` surface (`window.__SPW_SITE__.modules`, `spwCompose.modules`) with a `timings()` snapshot that correlates Performance entries with the existing per-module `loadMs`/`durationMs` records and spell expressions.
- Preserve all current behavior, data attributes, bus events, audit, and snapshots. No new visual weight, no new data-spw-* state unless it emerges from existing page/module state.

This improves **editor inspectability** and **runtime debug surface** for the load process, extending the module fluency, instrumentation legibility, and timing-data-localization work.

## Scope (smallest honest surface)
- `public/js/site.js` (the single bootstrap + mount orchestration file)
  - Add logger import + instantiation
  - Add `performance.mark`/`measure` at phase and per-module boundaries
  - Use logger for lifecycle transitions and failures (replaces/augments direct `console.warn`)
  - Expose `timings()` helper on the modules control surface and `__SPW_SITE__`
  - Minor comment updates to the module contract header

No other JS, CSS, HTML, or .spw files touched in the initial patch (perf mark names and logger usage are additive instrumentation, not a new DOM semantic family or runtime state attribute).

## Why this patch
- Current state already captures excellent internal timings (`loadMs`, `mountMs`, `durationMs`, `moduleAudit`, registry records, `data-spw-runtime-*`, snapshots as "module spells").
- Missing: external standardized observability (Performance API) and consistent use of the Spw logger infrastructure that already powers debug surfaces everywhere else.
- No perf marks/measures existed anywhere in the JS runtime before this change.
- Visual inspectability (per follow-up clarification): load state and timings remain visible through the pre-existing responsive data attribute surfaces (`data-spw-runtime-*`, per-module annotations, page-state) + devtools element inspector (works on desktop and mobile) + the new quantitative `timings()` API. No new visual DOM chrome added in the minimal patch.

## Contract notes
- Performance entries: `spw:boot:start`, `spw:immediate-layer`, `spw:page-interactive`, `spw:module:<id>:load`, `spw:module:<id>:mount`, `spw:site-ready`, `spw:full-boot`, etc.
- Logger: `namespace: 'spw-runtime'`, `role: 'lifecycle'`, `relation: 'lifecycle'` for phase and module events.
- These join the existing bus events (`spw:module-mounted`, `spw:page-*`), registry records, and query-driven policy as the observable load model.
- Future .spw surfaces (site-semantics, timing-data-localization, page-model) can reference the `spw:*` perf names when editor inspection of load health is needed beyond one patch.

## Validation (per AGENTS.md)
- `node --check public/js/site.js`
- `git diff --check`
- `npm run check` (or at minimum the audit + typecheck portions)
- Browser smoke (with/without diagnostics query params):
  - `?log=spw-runtime&log-level=debug` → structured lifecycle records in console
  - Performance recording shows `spw:` marks/measures during load
  - `window.__SPW_SITE__.modules.timings()` (or equivalent) returns filtered entries
  - Existing `listModules()`, `snapshotModules()`, `auditModules()` continue to work unchanged
- Targeted rg for the new marks and logger calls

## Status
- [ ] Plan written
- [ ] JS edits landed (logger + marks + timings export)
- [ ] Validation commands pass
- [ ] No behavior or visual change for normal visitors
- [ ] Plan + code comments serve as the inspectable note for future agents (no immediate .spw edit required)

## Follow-up (non-blocking)
- If a dedicated load-diagnostics surface or state-inspector block for "load health" proves valuable, add a small entry to `.spw/conventions/narrative-instrumentation.spw` or `site-semantics.spw` and run `spw-plan-maintenance`.
- Consider a builder/inspect query preset that turns on both audit + perf-visible load (already possible via existing recipes).
- Correlate module load timings with layout-shift-audit or frame-metrics when both are active.

## Ornament: Site Rhythm Display (added follow-up)
**User request:** "there should be an ornament that can display site rhythm" + prior clarification that instrumentation must be visually inspectable on desktop and mobile.

**Public goal for this increment**
Provide a visual projection (in the `ornament` CSS layer) of the site's temporal/runtime activity rhythm — the cadence of module loading, active layer intensity, region tempo field, and overall "pulse" of the runtime — using the data already surfaced by the load instrumentation and existing runtime state writers.

This makes the previously internal/DevTools-only timings *visually present* on the live page in a subtle, inspectable, responsive way (no hover-only, works on narrow screens via existing chrome/attention patterns).

**Scope (kept minimal)**
- Small extension in `public/js/site.js` (inside the existing `updateRuntimeStateTokens` / sync paths we already touch): compute + write 1-2 CSS custom properties (`--spw-site-rhythm-tempo`, `--spw-site-rhythm-density`) derived from the runtime layer counts, avg module timing, and page state. No new heavy module.
- Additive rules in `public/css/ornament/ornament.css` (the correct top layer) that define a `.spw-site-rhythm` (or `[data-spw-ornament="site-rhythm"]`) host. It re-uses the existing primitives (`.spw-ornament-rail`, `.spw-ornament-meter`, nodes, spirit-sequence seams) so the visual language stays consistent.
- The ornament is driven purely by CSS custom properties + data attrs the runtime already writes (plus the two new rhythm tokens). Placement is author-controlled (can live in shell chrome, as a floating minimal element following the `.spw-section-handle` pattern for mobile visibility, or inside a debug/inspect region).
- Update this plan + the canonical `.spw/conventions/ornament-contract.spw` (add "rhythm rail / site-rhythm meter" to vocabulary and runtime_exposure_contract).

**Design constraints respected**
- Ornament only (does not own layout or primary semantics).
- Uses the exact primitives and token system already present in ornament.css.
- Responsive by construction (small footprint, inherits shell spacing tokens, no desktop-only positioning).
- Opt-in / progressive: the visual can be present at low opacity in inspect/debug postures or explicitly placed by routes that want the "living instrument" feel.
- No new JS runtime features beyond 2-3 lines in the already-central sync function.

**Visual form (smallest honest)**
- A compact horizontal or vertical "rhythm rail" or meter.
- Number / activation of nodes ≈ `--spw-runtime-layer-count` + active layers.
- Pulse / animation rate or "playhead" speed driven by `--spw-site-rhythm-tempo` (faster when recent module activity is high / avg load time low; calmer in quiet states).
- Subtle glow / intensity on the whole element tied to enhancement + feature intensity.
- Can degrade to a static beautiful rail when JS or the new vars are absent.

**Validation additions**
- The ornament appears and reacts when the runtime vars are present (test with `?view=inspect` and normal load).
- Stays small and non-intrusive on mobile viewports.
- `git diff --check`, `node --check`, full `npm run check`.
- Ornament contract in `.spw` updated so future agents/editors see the new vocabulary entry.

**Status for this increment**
- [ ] Plan section added
- [ ] Runtime rhythm tokens wired in site.js sync
- [ ] Ornament CSS rules added in ornament.css (re-using existing rail/meter/node vocabulary)
- [ ] Ornament contract `.spw` updated
- [ ] Full validation passes
- [ ] Documented example host markup for routes that want it visible by default or in inspect mode

This directly fulfills the request to have a visual, cross-device inspectable ornament for site rhythm while staying inside the "smallest honest surface" rule.
