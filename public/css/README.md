# CSS Tree

`style.css` is the public stylesheet entrypoint and owns cascade layer order. Root-level CSS files are compatibility wrappers for older direct links from route HTML.

`spw-compose.css` is the portable composition entrypoint. It exposes tokens, typography, grammar, components, handles, and light effects without the full site shell, route surfaces, or ornament layer.

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

When changing shared visual behavior, edit the layered implementation file first. Keep `style.css` as the ordered import registry, and keep root wrappers only for stable public URLs.

Use `spw-compose.css` when another site wants the theme/component language but should keep its own page shell and route layout.

Documentation route: `/design/composition/`.

Spellcasting language is useful when documenting composition: CSS tokens define
the field, component selectors define the target, and state attributes reveal the
cast result. Stylesheets are the disposition of the surface: they encode what the
browser should treat as calm, active, focused, readable, dimensional, or strange.

For extensible theming, prefer custom properties and semantic attributes over
route-specific selectors. A theme should be readable as a disposition layer before
it becomes a pile of overrides.

Query-driven demos can tune color and palette disposition with parameters like
`spw-palette=craft`, `spw-color-active-op=%23008080`, and
`spw-var-shape-component=8px` when JS opts into `applySpwQueryDisposition`.

SVG surfaces add a narrower, screenshot-friendly layer of tuning through
`public/css/systems/svg-surfaces.css`. Brand and QA states can drive
`--spw-svg-brand-accent`, `--spw-svg-brand-field`, `--spw-svg-stroke-scale`,
`--spw-svg-space`, `--spw-svg-flow-dash`, and `--spw-svg-flow-gap` through
`applySvgQueryTunability`.

Use `.spw-demo-rail` and `.spw-demo-card` from `public/css/effects/spw-demos.css`
when a route needs tasteful internal marketing: a short reason, a reproducible
demo link, and an honest next step. These are meant for discoverability and QA,
not broad campaign banners.
