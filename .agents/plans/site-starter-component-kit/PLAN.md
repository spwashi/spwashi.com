# Site Starter And Component Kit

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
the frame, card, and operator-chip families. Each stays attached to the typed
fixture registry and is checked for its selector and required slots.

`npm run component:screenshots -- --base http://127.0.0.1:4173` captures each
fixture at phone and desktop viewports into a temporary directory. These are
review artifacts for layout and screenshot selection—not committed golden
images and not a pixel-diff gate. Introduce visual baselines only after a
particular specimen has a real, repeatable visual regression to prevent noise
from becoming a maintenance burden.

## Patch Sequence

### Phase 1 - Inventory And Contract

- Add this plan.
- Add the `.spw` convention.
- Add the read-only starter inventory script and npm command.
- Update CSS/JS README entrypoints.

### Phase 2 - Starter Examples

- Add a small starter README or example host only after the inventory has been used at least once.
- Keep examples static-first and dependency-free.
- Do not copy Spwashi identity or route copy into examples.

### Phase 3 - Component Recipes

- Add one or two component recipe snippets for a frame, card, and tuning strip.
- Use the existing slot anatomy and data-spw families.
- Prefer route docs before adding new generated artifacts.

### Phase 4 - Scaffold Candidate

- Consider a local `starter:scaffold` only if repeated manual setup proves the inventory alone is not enough.
- Any scaffold must be zero-dependency unless a separate plan and human review approves package changes.
- Generated output should land outside tracked site source by default.

### Phase 5 - Source Layout Alignment

- If `site-source-layout/PLAN.md` moves the authored site into `site/`, update the inventory script and `.spw` references in the same patch.

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

## Status

- [x] Plan created
- [x] Starter inventory script added
- [x] npm script added
- [x] `.spw` convention wired into dispatch
- [x] Public `/about/plans/` register card added
- [ ] First starter example added
- [ ] Component recipe snippets added
- [ ] Scaffold candidate evaluated after real use
