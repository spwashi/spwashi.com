# CSS Tree

`style.css` is the public stylesheet entrypoint and owns cascade layer order. Route HTML should link either `style.css` or a concrete layer file; root-level compatibility wrappers are no longer part of the source layout.

`compose.css` is the portable composition entrypoint. It exposes tokens, typography, grammar, components, handles, and light effects without the full site shell, route surfaces, or ornament layer.

For new-site starter work, run `npm run starter:inventory -- --check` from the repo root. It lists the files currently treated as portable starter material and the site-specific surfaces that should not be copied by default.

Implementation files live in folders that match the cascade layers:

- `reset/`
- `tokens/`
- `shell/`
- `typography/`
- `grammar/`
- `components/`
- `systems/`
- `routes/`
- `handles/`
- `effects/`
- `ornament/`

When changing shared visual behavior, edit the layered implementation file first. Keep `style.css` as the ordered import registry.

`npm run check:css` enforces that `style.css` imports each implementation file
through the layer implied by its top-level folder. Root-level CSS is limited to
the two entrypoints, `style.css` and `compose.css`; add new implementation files
inside the layer folder that owns the behavior.

## Readability Conventions

For new CSS and for rule blocks already touched in a patch, cluster declarations in this order:

1. Debug / inspection custom properties
2. Local tokens
3. Layout
4. Box
5. Typography
6. Visual
7. Interaction
8. Layering / containment

Do not churn large files only to reorder old declarations. The convention is meant to make active changes reviewable, not to produce noisy mechanical diffs.

## Proof Posture

Spacing and interactive states are part of the site's proof of care. Before a
feature-oriented commit, shared CSS should preserve readable measure, stable
gaps, visible focus, touch-friendly controls, and clear rest/hover/focus/active/
selected/disabled/loading/dismissed states across representative reachable
routes.

Treat fundraising-facing polish as maintainability made visible. Prefer
trustworthy spacing, durable state indicators, collision-free floating chrome,
and recovery paths over isolated screenshot effects. A featured surface should
still feel coherent when a reader moves to neighboring routes.

Layer-owner debug labels use `--spw-debug-layer-owner` and `--spw-debug-layer-color` as inherited diagnostic markers. They show the cascade-resolved owner marker for selected elements when `html[data-spw-debug-layers="on"]` or `data-spw-debug="layers"` is active. They are not complete CSS provenance and should not be described as proof of which file supplied every declaration.

Route surfaces can split under `routes/surfaces/` when a route grows into clear domains. Import those fragments directly from `style.css`; do not add one-file aliases or route shims.

Focused review slices can live under `routes/surfaces/` as well when they are meant to sit beside a longer catalog or experiment page. Keep them narrow and route-local, and let shared enhancement JS fill in any generated rail or SVG summary.

Reusable component styles belong under `components/`. The component layer is split by family (`foundation`, `surfaces`, `signals`, `cards`, `frames`, `pretext`, `content`, `controls`, and `runtime-states`) so filenames describe the local contract instead of repeating the project prefix. Card-specific component styles live in `components/cards/`; route folders should only own route-local layout and page identity.

Use `compose.css` when another site wants the theme/component language but should keep its own page shell and route layout. The durable boundary is tracked in `.spw/conventions/site-starter-component-kit.spw`.

Documentation route: `/design/composition/`.

Spellcasting language is useful when documenting composition: CSS tokens define
the field, component selectors define the target, and state attributes reveal the
cast result. Stylesheets are the disposition of the surface: they encode what the
browser should treat as calm, active, focused, readable, dimensional, or strange.

For extensible theming, prefer custom properties and semantic attributes over
route-specific selectors. A theme should be readable as a disposition layer before
it becomes a pile of overrides.

Runtime-written custom properties are part of the CSS contract. If JS writes a
literal `--token` with `style.setProperty(...)`, the token should appear in
`public/css/` or be registered as a generated runtime family in
`scripts/ts/style-property-contract.mts`. Keep dynamic property writers narrow:
settings, query tuning, instrumentation, and design labs may project registry
values, but route modules should usually write named attributes or explicit
custom properties.

Query-driven demos can tune color and palette disposition with parameters like
`spw-palette=craft`, `spw-color-active-op=%23008080`, and
`spw-var-shape-component=8px` when JS opts into `applySpwQueryDisposition`.

SVG surfaces add a narrower, screenshot-friendly layer of tuning through
`public/css/systems/svg-surfaces.css`. Brand and QA states can drive
`--spw-svg-brand-accent`, `--spw-svg-brand-field`, `--spw-svg-stroke-scale`,
`--spw-svg-space`, `--spw-svg-flow-dash`, and `--spw-svg-flow-gap` through
`applySvgQueryTunability`. Use `spw-svg-env=studio|proof|poster|model` when the
same authored SVG needs to be compared as an in-page diagram, proof sheet,
featured capture, or rendering-model handoff. Use `data-spw-svg-persona` on the
host figure as an audience facet; keep `<title>` / `<desc>` geometry-first and
let the figcaption register (`.spw-svg-figure > figcaption::before`) surface the
facet instead of repeating persona lists in prose. Use `spw-svg-persona=<token>` or
`data-spw-svg-persona-select` chips to activate a lens: matching hosts write
`data-spw-svg-persona-match="true"`, others recede, and `--spw-svg-persona-harmony`
develops property resonance on the page.

Use `.spw-demo-rail` and `.spw-demo-card` from `public/css/effects/demos.css`
when a route needs tasteful internal marketing: a short reason, a reproducible
demo link, and an honest next step. These are meant for discoverability and QA,
not broad campaign banners.

## Reading The Tree: Chapters, Genomes, And Moseying

CSS here is a medium for literature as much as layout. The 2026-07-03 chunking
pass split the two largest surfaces into chapter files whose banners follow a
shared anatomy:

- **Reads as:** one line of honest voice — what this chapter is about, written
  for a person browsing, not a build tool.
- **Was:** provenance (which file and sections it came from), so history stays
  traceable without archaeology.
- **Genome:** an auto-derivable signature — the state attributes the chapter
  senses (`aria-*`, `data-*`), how many custom properties it defines, and which
  `-intent` hooks it consumes. When a chapter's behavior changes, its genome
  changes; regenerate the lines with the probes below rather than hand-editing.
- **Probe:** how to toggle or observe the chapter live.

Chapter directories so far: `handles/operators/` (ten chapters, the operators
codex) and `shell/chrome/` (five chapters, the stage). `style-core.css` imports
chapters in reading order; order within a layer is load-bearing, so new
chapters are inserted, never appended casually.

### Naming anatomy

File and selector names narrate in the same grammar: **place** (layer or
directory: shell, handles, routes), **body part** (header, navigation,
sigils-and-chips), **disposition** (adaptive, attention-states,
state-semantics). A reader should be able to guess a file's contents from its
path aloud, and vice versa.

### Moseying probes

Tree commands as invitations, not audits:

- `tree public/css -L 2` — the table of contents.
- `tree public/css/handles/operators` — one codex, chapter by chapter.
- `rg -l 'aria-pressed' public/css` — who senses pressing?
- `rg "Reads as:" public/css -A0` — every chapter's opening line at once.
- `rg "var\(--[a-z-]+-intent" public/css -o | sort | uniq -c` — the intent
  vocabulary in circulation.
- `rg -c '\.operator-chip' public/css` — scatter check for a shared species.

### Toggling in the browser, tuning as a shared pastime

- DevTools > Sources > `public/css/...` — chapters are small enough to disable
  wholesale and feel what a page loses; that felt difference is the chapter's
  real documentation.
- `html[data-spw-debug-layers="on"]` — paints layer ownership so readers see
  which stratum is speaking.
- Editors tuning `@layer` order or chapter membership should do it in a demo
  copy first (see `.agents/plans/symphonic-loading-layered-editions/demo/`),
  because layer choreography is a felt decision reviewed in a browser.

### Microinteraction and state documentation

State contracts live nearest the rules that project them: shared pressed/hover
behavior in `handles/operators/state-semantics.css`, route palettes through
`-intent` variables only, and the philosophy in
`.spw/conventions/site-semantics.spw`. When a selector changes interaction
behavior, record the contract beside the selector or in the relevant `.spw`
surface — a chapter whose genome and prose disagree is a bug.
