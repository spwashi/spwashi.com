# Site Starter And Component Kit

**Status 2026-11-06.** Since 2026-10-10 only header and index hygiene touched this plan's paths; `npm run starter:inventory -- --check` still exits 1 on four present files (K1). A second road opened beside this one: the peer kit (`scripts/build-peer-kit.mjs`, b4651803) carries tokens, faces and operator colours to the workers, and ca401c44 sent the first `public/js` module to another site that way (`pinch-text-scale`, to spw.quest). [ecosystem-architecture](../ecosystem-architecture/PLAN.md) S4 proposes the Spw instrument travel next, names this plan its owner, and waits on `wonder_site_starter_first_portable`, which now offers three pieces. Next slice: K1, ungated.

**Related:** [ecosystem-architecture](../ecosystem-architecture/PLAN.md) (S4) · [designer-conversation-canvas](../designer-conversation-canvas/PLAN.md) (the specimen) · [portable-css](../archive/portable-css/PLAN.md) (absorbed 2026-10-10) · [typescript-integration](../archive/typescript-integration/PLAN.md) · [component-variant-alignment](../archive/component-variant-alignment/PLAN.md) (archived).

**A library tier (the creator, 2026-11-08):** [runtime-library-architecture](../../../.spw/caches/runtime-library-architecture-2026-11.spw) measures `compose.js` at 102 files and 36,014 lines, more than `site.js`. It proposes L1, a read-only `audit:library` over the six pieces that already travel clean (gesture-measure, pinch-text-scale, spw-expression, the reader, texture-slice, the peer kit), alongside K2. It also proposes L5, a `library/` tier with `compose.js` as its barrel, held for K3 and `wonder_site_starter_first_portable`.

## Public Goal

Make this repository useful as a source for new static sites and new component work without turning `spwashi.com` into a generic framework. A future builder should be able to answer three questions quickly:

- Which files are portable starter-kit material?
- Which public routes are component-design specimens?
- Which parts are personal Spwashi site shell, copy, route identity, or runtime behavior that should stay behind?

This is a codebase reuse and design-systems track. The first patch establishes the inventory and contract; later patches may add scaffold templates only after the portable boundary proves stable.

## Model-Guided Rail

- Focus dimension: `component` with `engineer-toolmaker` as the audience register.
- Semantic fixity: `stable` for the portable boundary; `tending` for examples and docs; `experimental` for any future scaffold output.
- Primary element: `metal` for boundaries, manifests, and validation.
- Secondary element: `wood` for growing new sites and maturing reusable components.
- Owner surfaces: `compose.css`, `compose.js`, `/design/composition/`, `/design/components/`, `.spw/conventions/site-starter-component-kit.spw`, and this plan.
- Validation path: `npm run starter:inventory -- --check`, `node --check scripts/starter-inventory.mjs`, `git diff --check`, and `npm run check:local` for broader patches.

## Current Baseline

Already strong:

- `public/css/compose.css` is a portable CSS entrypoint that excludes the full site shell, route surfaces, and ornament layer.
- `public/js/compose.js` is a portable JS entrypoint that exports reusable DOM contracts, runtime helpers, palette/query/SVG/component inspection helpers, and console instrumentation.
- `/design/composition/` documents standalone bundle use.
- `/design/components/` acts as the component glossary and specimen cabinet.
- `design/catalog/` can be regenerated for data attributes, CSS tokens, and image inventory.
- `site-source-layout/PLAN.md` already separates future source-root clarity from framework migration.

Main gap:

- The portable files, design routes, and extraction boundary were scattered across READMEs and route copy. There was no single local command or `.spw` convention that said "start here when spawning a new site or component."

## Initial Implementation

This track starts with:

- `scripts/starter-inventory.mjs`: read-only inventory of starter entrypoints, CSS imports, JS exports, component CSS files, design docs, and site-specific boundaries.
- `npm run starter:inventory`: command wrapper for the inventory.
- `.spw/conventions/site-starter-component-kit.spw`: durable contract for starter extraction and component promotion.
- README links from `public/css/README.md` and `public/js/README.md`.
- A public `/about/plans/` card so the track is visible from the plan register.
- Plan and dispatch wiring so future agents can find the track by `starter`, `component`, `portable`, or `compose`.

## Portable Boundary

Treat these as the preferred starter-kit entrypoints:

- `public/css/compose.css`
- `public/js/compose.js`

Carry their referenced implementation files only when the host site needs the behavior. Do not default to the full shell.

Keep these as Spwashi-specific unless a later extraction plan proves otherwise:

- `public/css/style.css`
- `public/js/site.js`
- route CSS under `public/css/routes/`
- shell chrome under `public/css/shell/`
- ornament under `public/css/ornament/`
- route modules under `public/js/modules/`
- personal copy, images, analytics, CNAME, service worker behavior, and route identity.

## Component Promotion Rule

A component is ready to travel only when it has:

- slot anatomy (`header`, `meta`, `body`, `figure`, `actions`, `footer` where relevant)
- named semantic state through existing `data-spw-*` families
- shared CSS ownership under `public/css/components/` or a documented local route surface
- optional JS that is progressive, inspectable, and imported through `compose.js` only if it is portable
- a specimen or explanation on `/design/components/`, `/design/composition/`, or a focused design route
- a validation path that includes inventory plus local checks

## Component Fixture And TypeScript Promotion (2026-07)

The component kit now prepares a Storybook-esque workflow without importing a
component framework or adding a package. `public/ts/component-fixtures.ts` is
the typed registry of real hand-authored specimens; its generated browser
output is consumed through `public/js/kernel/component-fixtures.js`, keeping
runtime callers on a stable plain-JS facade. `scripts/component-contracts.mjs`
checks that every fixture has a live specimen route, declared CSS owner,
selector, and required slot anatomy. `scripts/tests/component-fixtures.test.mjs`
then exercises both the JS facade and those contracts with Node's test runner.

Promotion rule for a future JavaScript abstraction:

1. Keep DOM-led behavior in JS unless a closed data contract needs stronger checks.
2. Move only the data-oriented abstraction to `public/ts/<name>.ts`.
3. Compile it to `public/js/typed/<name>.js` through `build:runtime`.
4. Preserve a small `public/js/kernel/<name>.js` re-export facade for JS modules.
5. Add a Node test plus fixture/contract coverage before a runtime module consumes it.

This is preparation, not a mandate to convert site modules or to build a
general-purpose Storybook clone. Browser screenshots and visual baselines remain
an opt-in next layer once a component has a concrete visual regression history.

### Snippets And Layout Evidence

`design/components/snippets/` contains minimal, copyable HTML specimens for
the frame, card, operator-chip, and tuning-strip families. Each stays attached
to the typed fixture registry and is checked for its selector and required slots.

The public `/design/components/#component-recipes-capture` section now exposes
the frame, card, and tuning-strip recipes beside the page/component/template
capture path. The recipes stay static-first; stateful behavior remains an
optional host concern rather than a requirement of the portable markup.

The portable `compose.css` entrypoint now follows the modular operator-handle
split and declares its `systems` layer explicitly, so starter inventory checks
and isolated template captures resolve the same current CSS graph as the site.
The responsive browser pass also moved the `frame-grid--2up` / `--3up` packing
rules into their systems-layer owner; later base-grid rules no longer erase the
modifier contract and recipe cards now render two-up wide, one-up compact.

`npm run component:screenshots -- --base http://127.0.0.1:4173` captures each
fixture at phone and desktop viewports into a temporary directory. These are
review artifacts for layout and screenshot selection—not committed golden
images and not a pixel-diff gate. Introduce visual baselines only after a
particular specimen has a real, repeatable visual regression to prevent noise
from becoming a maintenance burden.

## Patch Sequence

Landed: Phase 1, inventory and contract (8626a8ed: `scripts/starter-inventory.mjs`, `npm run starter:inventory`, `.spw/conventions/site-starter-component-kit.spw`, the CSS/JS README links and the `/about/plans/` card). Phase 3, recipe snippets for frame, card, operator chip and tuning strip in `design/components/snippets/`, exposed on `/design/components/` (dc4399d8). Host mount (6b75bc59) and `audit:portable` (480d92bc), from [BUNDLING.md](./BUNDLING.md).

- **K1. Make the inventory honest.** `parseJsExports` in `scripts/starter-inventory.mjs` joins every re-export specifier onto `public/js/`, so `compose.js`'s four root-relative re-exports (lines 225, 407, 415, 420) become `public/js/public/js/…` and `--check` calls them missing. Resolve `/public/js/` from the repo root as `resolveImport` in `scripts/portable-audit.mjs` does, and add a test with one relative and one root-relative specifier to the list in `scripts/module-tests.mjs`. Folding the walk into `audit:portable` waits: that audit starts from the module catalog and exports no resolver. Ungated. Verify: `npm run starter:inventory -- --check` exits 0; `node --check scripts/starter-inventory.mjs`.
- **K2 (proposal). One line per travelling piece.** The inventory reads `compose.js` alone, and none of the pieces that travel or are proposed to (`pinch-text-scale`, texture-slice, the Spw instrument) is a `compose.js` export. After K1 it could also read the two roads that carry code today, `SCRIPTS` in `scripts/build-peer-kit.mjs` and the verdicts `npm run audit:portable` prints, and give each piece one line: where it lives, which road carries it, who runs it. Ungated.
- **K3. The first pilot.** texture-slice ([BUNDLING.md](./BUNDLING.md) steps 2–3), the design specimen, or the Spw instrument (ecosystem-architecture S4a). Gate: the creator answers `wonder_site_starter_first_portable`. The bundle's layer set is `wonder_site_starter_layer_set`.

Held until their condition: a starter README or example host once the inventory has been used (Phase 2), static-first, dependency-free, with no Spwashi identity or route copy; a zero-dependency `starter:scaffold` only if manual setup repeats, writing outside tracked source (Phase 4); inventory and `.spw` paths move in the same patch if `site-source-layout/PLAN.md` moves the site into `site/` (Phase 5).

## Risks

- Exporting too much turns the personal site into a generic starter and weakens the creator identity.
- Exporting too little leaves future sites guessing which files matter.
- A scaffold script before the boundary is tested could freeze the wrong tree shape.
- Component examples can become decorative if they lack slot/state/CSS ownership and validation.

## Validation

- `npm run starter:inventory -- --check`
- `npm run component:check`
- `npm run component:screenshots -- --base <local-or-preview-url>`
- `npm run test:modules`
- `node --check scripts/starter-inventory.mjs`
- `git diff --check`
- `npm run check:local` when CSS, JS, route HTML, or build behavior changes

## Absorbed 2026-10-10 — portable-css

[portable-css](../archive/portable-css/PLAN.md) only routed to `.spw/caches/portable-css-2026-09.spw`; its entry was never built (`public/css/style-portable.css` does not exist). What is still owed:

- `public/css/compose.css` is already the portable CSS entrypoint (see Portable Boundary). Reconcile toward it; do not add a second entry beside it.
- pc-006's layer set differs. It ships reset, tokens, typography, grammar and the `.spw-frame` / `.spw-chip` components, and refuses shell/chrome, systems and routes. `compose.css:11` declares `tokens, typography, grammar, components, systems, handles, effects`: no reset, and it carries systems. Choose one set before emitting a portable bundle (`wonder_site_starter_layer_set`).
- pc-007 holds: the autonomous-feedback and spw-quest workers keep `workers/lib/shell.js` until that bundle exists.

The claims stay in the cache; this section only names what is open.

## Capability bundling prime (2026-09-20)

[BUNDLING.md](./BUNDLING.md) holds the extraction sequence and [bundling.spw](./bundling.spw) the imagined authored and distribution trees (operation `prime`, fixity `experimental`). Its census, 37 CSS imports and 315 JS exports, still held on 2026-11-06.
