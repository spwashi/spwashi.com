# Language Ladder + Runtime Instrumentation

## Public Goal

Make the development experience on spwashi.com feel progressively teachable rather than merely executable. The codebase should help a developer relate to code as a staged practice: first read the structure, then observe the runtime, then tune the timing, then compare the effect of different JavaScript forms, and eventually use TypeScript where it sharpens contracts and makes philosophy-like distinctions between shape, behavior, and proof more explicit.

The experience should stay hand-authored, progressively enhanced, and inspectable. Static HTML remains the readable baseline, JavaScript adds learning and observation affordances when present, and TypeScript is introduced where it improves the contract layer without turning the site into a framework demo.

## Why this track exists

The site already has strong runtime vocabulary, but the developer experience is still split across several concerns:

- how a person discovers what a module does
- how they see when it loads, mounts, settles, or fails
- how they compare “plain JS” implementation choices against stronger-typed equivalents
- how timing stages are made legible during cascading module integration
- how the site can surface a programming-paradigm or philosophy lens without becoming abstract or academic

This track connects those concerns into one staged, reusable ladder.

## Scope

### In scope

- staged runtime timing vocabulary for module cascades
- explicit instrumentation for module scheduling, loading, mounting, settlement, and failure
- a developer-facing ladder for JS exploration before TS migration
- console and debug surfaces that can explain the same state in compact language
- small route copy or docs updates that teach the ladder without requiring prior context
- `.spw` notes when the concept needs to remain inspectable beyond one patch
- cross-references to the runtime and TypeScript tracks so the learning path is discoverable

### Out of scope

- framework migration
- turning the site into an educational app with a separate runtime
- hiding the public site behind a developer mode
- wholesale conversion of browser modules to TypeScript in one pass
- new dependencies or heavy build tooling just to prove the concept

## Design Principles

1. **Progressive first**
   - The site should still read well with JavaScript off.
   - The learning ladder should add insight, not dependency.

2. **Staged before total**
   - A developer should be able to see the pipeline in phases: authored -> scheduled -> loading -> mounted -> observed -> settled.
   - Each stage should be traceable in logs, datasets, and inspect surfaces.

3. **Language as exploration**
   - JavaScript should remain the primary hands-on medium.
   - TypeScript should arrive as a way to name contracts, invariants, and transition boundaries.
   - The ladder should encourage comparative reading: imperative vs declarative, mutable vs derived, runtime state vs typed shape.

4. **Philosophy as framing, not decoration**
   - The site can name programming paradigms, tradeoffs, and questions of representation.
   - That framing must stay attached to concrete code, runtime state, and visible effects.

5. **Instrumentable by design**
   - Module integrations should emit timing data that can be read by DevTools, console helpers, and the site’s own diagnostic surfaces.
   - The same event should be visible as a mark, a dataset, a log, and a human-readable sentence where useful.

## Likely Surfaces

- `public/js/site.js`
  - mount scheduling
  - module cascade ordering
  - performance marks and measures
  - developer-readable summaries

- `public/js/kernel/instrumentation.js`
  - logger posture
  - console helper shape
  - snapshots for module and contract inspection

- `public/js/runtime/runtime-helpers.js`
  - idle and deferred timing semantics
  - policy descriptions
  - helper vocabulary for staged mounting

- `public/js/runtime/*`
  - any module that participates in load, observe, settle, or recover lifecycles

- `settings/index.html`
  - developer-facing recipes for JS/TS exploration and runtime timing

- `public/js/README.md`
  - explain the ladder in the language of modules, contracts, and inspections

- `.spw/conventions/`
  - keep the ladder and timing vocabulary inspectable beyond one patch

- `.spw/site.spw`
  - if the ladder becomes a reusable site concept rather than a one-off note

## Timing Stages

The module cascade should be legible in discrete stages:

- **authored**: the route exists as static markup and can be understood without runtime help
- **scheduled**: the loader has decided the module should be considered
- **loading**: the module has started to resolve/import
- **mounted**: the behavior is live in the DOM
- **observed**: the page has enough state to describe the effect of the module
- **settled**: timing has cooled and the module has stopped making active changes
- **failed**: the integration did not mount, but the failure is readable and bounded

These stages should be mirrored in:

- performance marks/measures
- runtime debug records
- data attributes or state markers where they already fit the site model
- console/helper snapshots

## Learning Ladder

The developer experience should invite a sequence like this:

1. Read the route as static HTML.
2. Observe the shared runtime state.
3. Inspect a mounted module’s inputs, outputs, and timing.
4. Compare two JavaScript implementations for the same task.
5. Identify which patterns deserve extraction into shared helpers.
6. Introduce TypeScript when the shape of the contract is stable enough to benefit from explicit typing.
7. Use the typed contract to reason about the code as a system, not just a script.

The ladder should support programming-paradigm questions such as:

- imperative vs declarative flow
- event-driven vs pull-based observation
- local state vs shared contract
- derived state vs stored state
- runtime affordance vs compile-time guarantee

## Instrumentation Contract

The track should prefer the same observation surface across all stages:

- performance timing for boot and cascade stages
- structured logs via the site logger
- readable console helpers for inspection and copy/paste
- a small amount of stable state that can be queried from DevTools
- no duplicate parallel instrumentation systems unless a real need appears

The best outcome is not more logging. The best outcome is a clearer answer to:

- what mounted
- when it mounted
- why it mounted
- what changed because it mounted
- how to compare the JS and TS versions of that behavior

## Validation

- `git diff --check`
- `node --check` on edited JS modules
- targeted browser smoke for the runtime stages and console helpers
- `npm run check` when build/runtime contracts or public surfaces change
- review that the ladder remains understandable without runtime features enabled

## Related Tracks

- `runtime-module-fluency/PLAN.md`
- `runtime-load-instrumentation/PLAN.md`
- `typescript-integration/PLAN.md`
- `agent-optimization/PLAN.md`

## Next Questions

- Should the ladder be documented primarily on a public route, in settings, or both?
- Which module cascade is the first exemplar: page boot, settings, composition, or another route family?
- Which TypeScript boundary is the first useful one for the ladder: settings state, runtime manifest, or module registry shape?

