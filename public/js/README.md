# JavaScript Tree

`site.js` is the public runtime entrypoint — a thin bootstrap shell that wires
`module-catalog.js`, `module-loader.js`, page state, and inspection surfaces.
Everything else should be readable as a module tree, not a pile of ad hoc helpers.

`compose.js` is the portable composition entrypoint. It exports reusable DOM
contracts, runtime helpers, staged-loader contracts, gesture/region vocabulary,
palette utilities, attention contracts, and interaction loop records without
mounting the full site runtime.

For new-site starter work, run `npm run starter:inventory -- --check` from the
repo root. It verifies that the portable composition entrypoints and referenced
imports still exist, then prints the component/design routes that explain the
boundary.

It also exports `SPW_COMPOSITION_CONTRACT`, a small documentation object for the
browser-field / script-spell / stylesheet-disposition model.

For console-oriented work, it exports `createSpwLogger`,
`markInstrumented`, `snapshotInstrumentationTarget`, and
`installSpwCompositionConsole`. These helpers let a page expose
`window.spwCompose` intentionally instead of relying on scattered ad hoc logs.

## Reading Order

If you are trying to learn the runtime, read in this order:

1. `public/js/site.js` for boot orchestration and `__SPW_SITE__` surfaces.
2. `public/js/runtime/module-catalog.js` for staged module definitions by layer.
3. `public/js/runtime/module-loader.js` for mount scheduling, batching, and token cascades.
4. `public/js/kernel/dom-contracts.js` for shared selector and dataset helpers.
5. `public/js/semantic/role-inference.js` for canonical region collection and role inference.
6. `public/js/kernel/shared.js` for the canonical operator registry and shared semantics.
7. `public/js/kernel/site-settings.js` (profiles + engine re-export). CORE mounts `site-settings-engine.js` to apply root datasets. `site-settings-ui.js` loads only when a settings form/scope exists or the settings route mounts.
8. `public/js/runtime/page-state.js` for the page lifecycle and attention contract.
9. `public/js/runtime/page-hooks.js` for page-unique hooks and generalizable handles.
10. `public/js/runtime/` for mounted processes, lifecycles, and page-state producers.
11. `public/js/interface/` for visible affordances and user-facing controls.
12. `public/js/semantic/` for projection, inference, and semantic helpers.
13. `public/js/modules/` for clustered route-specific feature bundles.

## Bootstrap Scheduling

The runtime keeps immediate core modules ordered because settings, shell state,
and minimal page behavior seed later layers. Feature, region, and enhancement
catalog families load after that core wave so their definition text is not part
of the first parse. Then `site.js` mounts eligible feature and enhancement
immediate layers in parallel through `runtime/module-loader.js`. Module definitions that require strict ordering
should stay in `CORE_DEFS` or move behind `VISIBLE`, `IDLE`, `INTERACTION`, or
`REGION` scheduling instead of depending on feature/enhancement array order.
Interaction helpers, reward affordances, prompt utilities, and route-local labs
should prefer `VISIBLE` when the first readable page state does not need them.

Performance marks use layer labels such as
`spw:immediate-layer:core:parallel` and
`spw:immediate-layer:enhancement:parallel`, with
`spw:immediate-non-core-layers` covering the overlapped feature/enhancement
wave.

## Folder Roles

- `kernel/`: durable primitives, settings (profiles/engine/ui split), shared contracts, and runtime bridges.
- `semantic/`: operator grammar, projection machinery, region role inference, narrative token lenses, and pretext helpers.
- `runtime/`: module catalog/loader, active processes, route grounding, page-state, frame-state, spells, inspectors, gates, and lifecycle loops.
- `runtime/page-hooks.js`: page-unique hooks, named handles, and console-facing page play helpers.
- `interface/`: visible affordances, guide behavior, haptics, local controls, and chrome response.
- `modules/`: page or feature bundles clustered by owner. Keep the first level folder-only; see `public/js/modules/README.md`.
- `media/`: image storage, image metaphysics, and SVG/media helpers.
- `typed/`: generated browser-ready modules from `public/ts/`; do not hand-edit generated output.

## Portable Modules

These are the best candidates when you want to reuse a file on another site:

- `compose.js` for a single import surface over the portable runtime helpers.
- `runtime/module-catalog.js` + `runtime/module-loader.js` for staged mount
  contracts without inlining bootstrap policy in a host page.
- `runtime/gesture-contract.js` + `runtime/region-profiler.js` for gesture and
  region harmony vocabulary shared with `site.js`.
- `semantic/role-inference.js` for `collectRegions()`, `collectAnnotationRegions()`,
  and shared role/kind/context inference.
- `runtime/runtime-helpers.js` for shared timing, parsing, mount, and registry
  helpers that can be reused without booting `site.js`.
- `SPW_RUNTIME_HELPERS_CONTRACT` for a compact summary of the helper layer's
  timing and mount vocabulary.
- `SPW_MODULE_LOADER_CONTRACT` + `MODULE_TIMING_STAGES` for mount lifecycle stages.
- `kernel/dom-contracts.js` for selector, dataset, and style helpers.
- `runtime/interaction-loop.js` for small interaction-state records and refresh events.
- `runtime/page-state.js` for page state, attention timing, and visibility hooks.
- `runtime/page-hooks.js` for page-unique hook discovery, focus, and pulse helpers.
- `runtime/composition-box-model.js` for component box-model snapshots, composition roles, and presence/overflow clues.
- `semantic/interaction-expression.js` for dependency-light Spw narration on an existing durable interaction event; parsing remains in `spw-expression-geometry.js`.
- `runtime/attention-architecture.js` for section locomotion and resonance pinning.
- `runtime/state-orchestrator.js` for frame-state toggles and relational focus helpers.
- `media/svg-tunability.js` for declarative SVG palette, pointer, stroke, spacing, and screenshot tuning.
- `media/image-store.js` for IndexedDB-backed image persistence.
- `semantic/pretext-utils.js` for CDN loading and pretext data fetch helpers.

## Spellcasting Model

For documentation, a spell is a small composition with four visible parts:
field tokens, a target selector, a gesture or state record, and a rendered result.
The portable entrypoint should help people inspect those parts without mounting
the full site runtime.

Scripts should read as spells: small repeatable actions that change the browser
document in visible, inspectable ways.

## Literate Extension Rule

Portable behavior should be explainable from the document outward: name the field
with tokens, name the target with selectors or `data-spw-*` attributes, name the
gesture in JS, and leave visible state for CSS to render.

## Console Instrumentability

Console helpers should reveal the same model:

- `markInstrumented(target, source)` writes `data-spw-instrumentation` and
  `data-spw-debug-source`.
- `snapshotInstrumentationTarget(target)` returns tag, classes, Spw dataset, and
  optional CSS token values.
- `installSpwCompositionConsole(window, { controls })` exposes
  `window.spwCompose.inspect`, `window.spwCompose.mark`, `window.spwCompose.log`,
  and any supplied `controls` namespaces for console or extension tuning.
- `window.spwCompose.controls.pageState` can expose page lifecycle and attention
  helpers such as `snapshot()`, `setPageState()`, `scheduleArrival()`, and the
  `states` / `presence` / `arrival` vocabularies.
- `window.spwCompose.controls.frameState` can expose frame focus helpers such as
  `focus()`, `pulse()`, and `setState()`.
- `window.spwCompose.controls.pageHooks` can expose page-unique landmarks and
  generalizable handles through `list()`, `resolve()`, `focus()`, and `pulse()`;
  this is a good discovery loop for incremental learning and page familiarity.
- `SPW_PAGE_STATE_CONTRACT` and `describePageStateSnapshot()` make page
  lifecycle state readable as data or as a short sentence.
- `SPW_PAGE_HOOK_CONTRACT` and `describePageHook()` do the same for named
  handles and page-unique anchors.
- `SPW_NARRATIVE_INSTRUMENTATION_CONTRACT` and
  `initNarrativeInstrumentation()` expose the prose-token lens used by
  narrative mode, so a page can reveal characters, locations, props, actions,
  themes, and dialogue contexts without hiding the source text.
  Copy can strengthen that lens by adding `data-spw-narrative-copy`,
  `data-spw-copy-depth`, or `data-spw-copy-label` to the most rewarding prose
  blocks.
- `window.spwCompose.controls.composition` can expose component box-model
  inspection through `inspect()`, `snapshot()`, and `annotate()` so standalone
  scripts can explain layout, presence, and story without the full site shell.
- Runtime policy is also readable as a sentence. `describeRuntimePolicy()`
  returns the current timing/audit/visuals posture, and `html[data-spw-runtime-policy]`
  can surface that summary for debugging, screenshots, or console narration.
- `applySpwQueryDisposition(root)` applies opt-in query parameters such as
  `spw-palette=craft`, `spw-color-active-op=%23008080`,
  `spw-var-shape-component=8px`, `spw-tune-density=compact`, and
  `spw-reflow=density`.
- Page-state datasets can also be preseeded through `spw-data-*` query values
  such as `spw-data-page-state=interactive`, `spw-data-page-presence=foreground`,
  and `spw-data-page-arrival=returning` when you need a reproducible browser
  console or extension setup.
- Composition boxes can be inspected without mounting a page-specific app. Use
  `window.spwCompose.controls.composition.inspect('#runtime-map')` for one
  component, `snapshot()` for the current page, and `annotate()` to write
  `data-spw-box-model`, `data-spw-composition-flow`, `data-spw-box-measure`,
  `data-spw-box-presence`, and `data-spw-box-story`. These snapshots are
  deliberately narrative-friendly: they describe whether a component is a
  stage, fold, control card, choice field, or readout, whether it is overfull,
  and what kind of reading/tuning action it can support.
- Runtime modules are inspectable and query-tunable. Use
  `spw-module-audit=on` to log why modules loaded or skipped,
  `spw-module-visuals=on` to let module dimensions influence handles and rails,
  `spw-runtime-timing=eager|defer|quiet|manual` to change global mount timing,
  `spw-module-timing=topic-discovery:immediate` for one module, and
  `spw-module-only=` or `spw-module-skip=` to isolate behavior in QA links.
  Console helpers live at `window.__SPW_SITE__.listModules()`,
  `snapshotModules()`, `auditModules()`, `mountModule(id)`,
  `discoverQuery()`, and `window.spwCompose.queryState()`.
  Query state is normalized before runtime boot into `data-spw-query-active`,
  `data-spw-query-keys`, `data-spw-query-presets`, and the matching
  `data-spw-runtime-*` / `data-spw-module-*` policy attributes.
  Keep the posture explicit: use audit-only URLs for precise, low-theatrics
  debugging; add module visuals only when screenshot-legible rails and handles
  help the page teach its script ecology. The runtime derives
  `html[data-spw-runtime-posture="minimal|precision|resonant|theatrical"]`
  from those choices so CSS and screenshots can name the current tuning posture.
- Query presets compose with the same mechanism. The canonical form is
  `spw-physics=calm|tactile|puppet|screenshot` and
  `spw-meaning=quiet|readable|inspect|screenshot`, while ergonomic aliases
  such as `physics=puppet&meaning=inspect` are accepted for quick QA links,
  screenshots, and repeatable lab setups.
- Query vocabulary is configurable. Forks and plugins can call
  `createSpwQueryContract({ aliases, physicsPresets, meaningPresets, handlers })`
  and pass that contract into `parseSpwQueryDisposition`,
  `applySpwQueryDisposition`, or `window.spwCompose.query`. Use this when a
  studio wants different names for the same instruments: brush, wash, exposure,
  calibration, reading mode, or any local vocabulary that should remain typed in
  the URL instead of hard-coded into parser internals.
- Logging is namespaced. Use `spw-log=spw-compose,spw-core` or `spw-log=*`
  with `spw-log-level=debug|info|warn|error` to tune console output.
- Loggers can describe their relationship to the page with `logger.describe()`
  and can attach target snapshots with `logger.trace(message, target)`.

## SVG Tunability

SVG hosts can opt into runtime tuning with attributes such as
`data-spw-svg-host` and `data-spw-svg-pointer`. The portable entrypoint exports
`applySvgQueryTunability`, `applySvgTunability`, and `SPW_SVG_PALETTES` so a
page can expose brand colors, palette reasons, stroke cadence, spacing, motion,
and pointer-field behavior without mounting the full site runtime.

Useful query examples include `spw-svg-palette=warm-offer`,
`spw-svg-accent=%23008080`, `spw-svg-field=%23f6ffff`,
`spw-svg-stroke=1.2`, `spw-svg-space=1rem`, and
`spw-svg-pointer=field`. Documentation route: `/design/experiments/svg/`.

## Structural Rule

Import implementation modules from the folder that owns the behavior. Keep
`/public/js/site.js` stable for route shells, and avoid adding new root-level
compatibility wrappers unless a file truly needs a migration shim.

`npm run check:runtime` enforces the hard part of that rule: runtime module IDs
must be unique, dynamic imports must resolve inside `public/js/`, generated
`typed/` modules must have `public/ts/` sources, only `site.js` plus
`compose.js` may live as root-level JavaScript entrypoints, and top-level
implementation folders must stay in the recognized ownership set:
`kernel/`, `runtime/`, `interface/`, `semantic/`, `modules/`, `media/`, and
`typed/`. Adding a new top-level family should be a contract change, not an
incidental file placement.

The same check also audits `element.style.setProperty(...)` calls. Literal
custom-property writes should either be consumed or defined somewhere under
`public/css/`, or belong to a documented runtime-generated family in
`scripts/ts/style-property-contract.mts`. Dynamic property writers are limited
to small tuner/bridge modules whose purpose is to project a known registry onto
CSS.

Documentation route: `/design/composition/`.
