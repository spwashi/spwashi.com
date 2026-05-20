# JavaScript Tree

`site.js` is the public runtime entrypoint. Everything else should be readable as a
module tree, not a pile of ad hoc helpers.

`compose.js` is the portable composition entrypoint. It exports reusable DOM
contracts, runtime helpers, palette utilities, attention contracts, and
interaction loop records without mounting the full site runtime.

It also exports `SPW_COMPOSITION_CONTRACT`, a small documentation object for the
browser-field / script-spell / stylesheet-disposition model.

For console-oriented work, it exports `createSpwLogger`,
`markInstrumented`, `snapshotInstrumentationTarget`, and
`installSpwCompositionConsole`. These helpers let a page expose
`window.spwCompose` intentionally instead of relying on scattered ad hoc logs.

## Reading Order

If you are trying to learn the runtime, read in this order:

1. `public/js/site.js` for the bootstrap lifecycle and module loading policy.
2. `public/js/kernel/dom-contracts.js` for shared selector and dataset helpers.
3. `public/js/kernel/shared.js` for the canonical operator registry and shared semantics.
4. `public/js/runtime/page-state.js` for the page lifecycle and attention contract.
5. `public/js/runtime/page-hooks.js` for page-unique hooks and generalizable handles.
6. `public/js/runtime/` for mounted processes, lifecycles, and page-state producers.
7. `public/js/interface/` for visible affordances and user-facing controls.
8. `public/js/semantic/` for projection, inference, and semantic helpers.
9. `public/js/modules/` for route-specific feature bundles.

## Folder Roles

- `kernel/`: durable primitives, settings, shared contracts, and runtime bridges.
- `semantic/`: operator grammar, projection machinery, semantic inference, and pretext helpers.
- `runtime/`: active processes, route grounding, page-state, frame-state, spells, inspectors, gates, and lifecycle loops.
- `runtime/page-hooks.js`: page-unique hooks, named handles, and console-facing page play helpers.
- `interface/`: visible affordances, guide behavior, haptics, local controls, and chrome response.
- `modules/`: page or feature bundles such as blog, services, RPG Wednesday, tools, profile, and care.
- `media/`: image storage, image metaphysics, and SVG/media helpers.
- `typed/`: generated browser-ready modules from `public/ts/`; do not hand-edit generated output.

## Portable Modules

These are the best candidates when you want to reuse a file on another site:

- `compose.js` for a single import surface over the portable runtime helpers.
- `runtime/runtime-helpers.js` for shared timing, parsing, mount, and registry
  helpers that can be reused without booting `site.js`.
- `kernel/dom-contracts.js` for selector, dataset, and style helpers.
- `runtime/interaction-loop.js` for small interaction-state records and refresh events.
- `runtime/page-state.js` for page state, attention timing, and visibility hooks.
- `runtime/page-hooks.js` for page-unique hook discovery, focus, and pulse helpers.
- `runtime/composition-box-model.js` for component box-model snapshots, composition roles, and presence/overflow clues.
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
- `window.spwCompose.controls.composition` can expose component box-model
  inspection through `inspect()`, `snapshot()`, and `annotate()` so standalone
  scripts can explain layout, presence, and story without the full site shell.
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
  `snapshotModules()`, `auditModules()`, and `mountModule(id)`.
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

Documentation route: `/design/composition/`.
