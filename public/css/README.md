# CSS Tree

`style.css` is the public stylesheet entrypoint and owns cascade layer order. Route HTML should link either `style.css` or a concrete layer file; root-level compatibility wrappers are no longer part of the source layout.

`compose.css` is the portable composition entrypoint. It exposes tokens, typography, grammar, components, handles, and light effects without the full site shell, route surfaces, or ornament layer.

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

Use `compose.css` when another site wants the theme/component language but should keep its own page shell and route layout.

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
`applySvgQueryTunability`.

Use `.spw-demo-rail` and `.spw-demo-card` from `public/css/effects/demos.css`
when a route needs tasteful internal marketing: a short reason, a reproducible
demo link, and an honest next step. These are meant for discoverability and QA,
not broad campaign banners.
