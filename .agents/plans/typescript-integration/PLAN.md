# Plan: typescript-integration

**Status 2026-10-06.** Landed Scope and Shared Layout Steps below are the current state; the April Current Context predates landing.

**Related:** [pwa-experience](../pwa-experience/PLAN.md) · [core-css-spend-cut](../core-css-spend-cut/PLAN.md).

Integrate TypeScript into `spwashi.com` in a way that makes build/export tooling, contract documentation, and large runtime registries safer without forcing the published site into a framework migration or a browser-first bundler architecture.

## Public Goal

The desired end state is a site repo where TypeScript sharpens the parts that already behave like schema systems:

- the static build/export path
- the design catalog that documents `data-spw-*` and CSS tokens
- the route/runtime manifest
- the largest shape-heavy browser registries
- future chunk/layer manifests for whitelabel-ready composition
- release metadata that can carry both named releases and deterministic content identities

The public site should still read as hand-authored HTML/CSS/JS unless a later explicit decision changes that.

## Current Context

- The repo already has a static export entrypoint: `scripts/build.mjs`.
- The repo already has a contract-documentation surface: `scripts/generate-design-catalog.mjs`.
- The repo now also has a sitemap generation seam: `scripts/generate-sitemap.mjs`.
- The catalog script already scans:
  - `data-spw-*` attributes
  - CSS token definitions and reads
  - JS dataset writes
  - `.spw` philosophy mentions
- The route/runtime contract already exists in `scripts/site-contracts.mjs`.
- The service worker cache model is still hand-maintained in `sw.js`:
  - precache routes are listed manually
  - shell assets use broad network-first behavior
  - route coverage currently trails the sitemap surface
- CSS delivery is layered but still monolithic at the entrypoint:
  - every route points at `/public/css/style.css`
  - `style.css` imports shared layers and every route-surface stylesheet
- Scoped CSS delivery now has a typed manifest seam:
  - `scripts/ts/css-manifest.mts` declares core, route, and behavior scopes
  - `scripts/ts/css-bundle.mts` emits flattened route/behavior bundles and a generated browser behavior-scope module
  - runtime contracts validate `module def.features` against the CSS behavior-scope set
- JS delivery already has a chunk-friendly seam:
  - `public/js/site.js` mounts most behavior through route/selector-gated dynamic imports
- Asset identity is still coarse and manual:
  - many HTML routes still reference `?v=0.0.2` / `?v=0.0.1`
  - cache invalidation is editorially controlled rather than generated from content identity
- The build/export path will likely need a stronger notion of layered outputs if the site is later whitelabeled without forking the whole repo.
- The highest-complexity browser surfaces remain plain JS:
  - `public/js/site.js`
  - `public/js/kernel/site-settings.js`
  - `public/js/semantic/page-metadata.js`
  - `public/js/kernel/shared.js`
- The workbench has its own TS world, but the site should not inherit that build model by default.

## Recommendation

- Preferred direction: **scripts-first TypeScript, runtime-contract hardening second**.
- Make the existing build/catalog/manifest pipeline the first TS target.
- Treat the catalog as the main seam for better token and attribute documentation.
- Add a generated asset identity surface before any serious chunking push:
  - hashed or content-addressed asset records
  - semantic chunk ids
  - route-to-asset manifests
  - service-worker precache manifests derived from build outputs rather than handwritten arrays
- Prepare CSS chunking by separating:
  - always-on base layers
  - route-family layers
  - effect/ornament layers that can be gated or deferred
- Define chunk and layer boundaries before introducing any sophisticated hash or release tradition.
- Plan for output identity as two related but distinct surfaces:
  - deterministic content hashes for machine/cache truth
  - human-legible release names or traditions for editorial/whitelabel truth
- Keep most browser-delivered modules in JS at first, but add JSDoc typedefs and explicit normalization around the largest shared shapes.
- Prefer compiler preparation over compiler adoption:
  - make manifests, boundaries, and contracts explicit first
  - only then decide whether CSS compile or TS compile earns its complexity
- Delay any browser-side TS compile pipeline until the repo has a concrete reason to carry that weight.

## Scope

- In scope:
  - a site-root TS setup scoped to `scripts/` first
  - typed schemas for build output, design catalog output, and route/runtime manifests
  - typed asset and precache manifests
  - typed shared registries and settings shapes
  - typed chunk/layer metadata for future whitelabel packaging
  - typed release metadata that can express named releases and familiar content hashes
  - explicit migration phases and validation loops
- Out of scope:
  - template-driven route generation
  - converting all `public/js/*.js` to `.ts` in one pass
  - bundler-first migration of the public runtime
  - making `.spw/_workbench` the source of truth for site build decisions

## Workstreams

### 1. Script Project Foundation

- Add a TS config scoped to repo-local scripts.
- Decide how TS runs for Node tooling:
  - compiled script output
  - or a thin execution path for TS-only Node scripts
- Keep the site runtime out of this first config to avoid repo-wide noise.

### 2. Typed Documentation Surfaces

- Convert or harden these first:
  - `scripts/generate-design-catalog.mjs` (still plain JS, 3000 lines)
  - `scripts/site-contracts.mjs` (landed: wrapper over `scripts/typed/site-contracts/`)
  - `scripts/build.mjs` (landed: wrapper over `scripts/typed/build/`)
  - `scripts/dev-server.mjs` (still plain JS)
  - `scripts/generate-sitemap.mjs` (landed: wrapper over `scripts/typed/sitemap/`)
- Extract stable shapes for:
  - attribute records
  - CSS token definitions and consumer maps
  - route metadata
  - runtime module definitions
  - build summaries
  - sitemap entries
  - precache entries
- Add explicit vocabulary for:
  - chunk identity
  - layer membership
  - variant ownership
  - release naming
  - deterministic hash provenance
- This is the most direct path to better documentation of `data-spw-*` and CSS tokens.

### 2.5. Chunk And Release Semantics

- Model the future build output as composable layers rather than one opaque site bundle.
- Likely layer families:
  - base brand-agnostic shell
  - shared semantic/runtime contracts
  - route-family CSS surfaces
  - optional enhancement/effect bundles
  - brand or tenant overlays
  - release metadata
- Define typed records for:
  - chunk ids
  - layer ids
  - stable semantic names
  - content hashes
  - optional familiar aliases or named-release handles
- Define route-facing manifests for:
  - which CSS layers a route needs
  - which JS chunks a route may preload
  - which assets the service worker may precache or defer
- Keep generated browser bridge modules, such as `public/js/runtime/orchestration/behavior-scopes.js`, downstream of the typed CSS manifest rather than hand-maintained.
- If whitelabeling arrives later, variants should select and override chunks by declared layer policy rather than ad hoc file forks.

### 2.75. Cache Identity And Delivery Preparation

- Replace handwritten cache identity with generated identity.
- Generate cache/preroll manifests from build truth:
  - sitemap routes
  - hashed asset outputs
  - chunk ownership metadata
- Move service-worker policy toward:
  - network-first for HTML
  - cache-first or stale-while-revalidate for hashed CSS/JS/media
  - smaller hand-maintained fallback lists only where truly editorial
- Reduce asset overreach before introducing bundlers:
  - stop making every route load every route stylesheet
  - keep optional enhancement modules selector/route gated
  - prepare preload hints from manifests instead of hardcoded guesses

### 3. Browser Contract Hardening

- Keep the browser runtime in JS initially.
- Add JSDoc typedefs and explicit normalization to the biggest shared registries:
  - `public/js/site.js`
  - `public/js/kernel/site-settings.js`
  - `public/js/semantic/page-metadata.js`
  - `public/js/kernel/shared.js`
- Prefer extracting contract modules before converting full behavior-heavy files.

### 4. Optional Later Browser TS Path

- Only after the script/tooling path is typed and stable.
- Restrict any browser-side TS compile step to selected modules.
- Preserve authored HTML entry points and root-relative assets.
- Keep this separate from any future SSG or framework decision.

### 4.5. Optional CSS Compile Path

- Only after CSS boundaries are explicit in manifests.
- The first acceptable compiler role is mechanical:
  - resolve imports
  - emit route-aware bundles
  - preserve layer order
  - attach content hashes
- Do not use CSS compilation as a reason to erase the current layer vocabulary or hand-authored route ownership.

## File Triage

- Convert early (remaining):
  - `scripts/generate-design-catalog.mjs`
  - `scripts/dev-server.mjs`
- Converted (2026-06 through 2026-09; see the 2026-09-27 section):
  - `scripts/build.mjs`
  - `scripts/site-contracts.mjs`
  - `scripts/generate-sitemap.mjs`
- Extract early:
  - chunk/layer manifest types
  - release identity types
  - hash provenance helpers
  - precache manifest types
  - route-to-css/js ownership manifests
- Harden in JS first:
  - `public/js/site.js`
  - `public/js/kernel/site-settings.js`
  - `public/js/semantic/page-metadata.js`
  - `public/js/kernel/shared.js`
- Avoid for now:
  - route HTML
  - most small DOM-first modules
  - workbench TS config reuse

## Risks

- Reusing workbench TS assumptions would pull the site into the wrong architecture.
- Converting `site.js` or `site-settings.js` wholesale too early would create high-risk churn.
- Adding a browser compile step before typing the script/data pipeline would add machinery before clarifying contracts.
- A repo-wide TS config too early would create low-signal errors across files that are not the first migration targets.
- Preserving handwritten `?v=` query bumps instead of generated asset identity would keep cache invalidation brittle and labor-heavy.
- CSS chunking before route/layer ownership is explicit would likely break the current layer contract in hard-to-review ways.
- Bundling `site.js` aggressively before respecting its current route/selector-gated load seams would collapse a natural chunk boundary the repo already has.
- Introducing hashes before semantic chunk boundaries exist would create unstable or low-meaning output identities.
- Treating whitelabeling as a late naming pass instead of a layered composition problem would encourage forked builds and drift.
- Using only opaque hashes would miss the editorial or traditional value of familiar named releases.

## Validation

- Preserve existing checks:
  - `npm run build`
  - `npm run catalog`
  - `npm run sitemap`
  - `npm run check`
  - `git diff --check`
- Add TS validation only for the scoped script project first.
- When chunk/release semantics land, add stability checks for:
  - no-op rebuilds keep identical hashes
  - a localized change only invalidates the affected chunk set
  - named release metadata can move independently from content identity when appropriate
- When cache manifests land, add checks for:
  - sitemap coverage and service-worker precache coverage are intentionally related rather than drifting by hand
  - route CSS/JS manifests do not pull unrelated route bundles
- For browser contract hardening, pair typedef work with targeted smoke checks on:
  - `/`
  - `/settings/`
  - one design or topic route

## Decision Rule

- If the goal is better documentation and safer build/tooling, start with `scripts/`.
- If the goal is safer browser runtime state, use JSDoc plus extracted contract modules before broad `.ts` conversion.
- If the goal includes future whitelabeling, define chunk/layer identity and release semantics before chasing hash sophistication.
- If the goal is more effective caching, generate asset identity and precache manifests before adding bigger compilers.
- If the goal is CSS chunking, split ownership semantically first, compile second.
- If the goal is TS in the browser, start with JSDoc and extracted contract modules around `site.js` rather than forcing a full runtime pipeline.
- Do not adopt a full public-runtime TS-plus-bundler path unless that becomes its own explicit project.

## Implementation Increment - 2026-07-03 Types As Documentation

- `types/spw.d.ts` gained the G1 bundle dataset keys (`spwCauldronState`, `spwOp`, `spwEffects`) with template-literal grammar hints, plus exported mirror shapes `SpwIngredient`, `SpwEffectEntry`, `SpwOperatorSplit` - typechecked via the existing `types/**/*.d.ts` include.
- Runtime JS stays un-typechecked by policy (`checkJs: false`), so the JS side documents through plain JSDoc referencing the mirror shapes by name: `cauldron/contract.js` (CauldronStateParts typedef + helper signatures), `cauldron/storage.js` (normalizeIngredient), `kernel/shared.js` (splitOperatorExpression, composeOpBundle), `runtime/memory/effect-ledger.js` (record). IDE hover carries the contract on camera; the d.ts carries it through tsc.
- Pattern for future passes: shapes live once in `types/spw.d.ts`; JS declares "Mirror shape: X in types/spw.d.ts" rather than duplicating structure.

## Landed Scope And Shared Layout Steps - 2026-09-27

What this plan proposed in April has mostly landed, in a shape the earlier sections do not describe:

- Workstream 1 is done. `tsconfig.scripts.json` compiles `scripts/ts/**/*.mts` to `scripts/typed/`; the `?[execution_strategy]` question resolved as compiled, committed output with thin `.mjs` wrappers at the old script paths.
- Workstream 2 is largely done: `scripts/typed/build/`, `scripts/typed/site-contracts/`, `scripts/typed/sitemap/`, `css-manifest.mts`, `css-bundle.mts`, `runtime-contracts.mts`, `pwa-contracts.mts`, `json-contracts.mts`, and `scripts/ts/shared/build-topology.mts`. The catalog and dev server are the two convert-early files still in plain JS.
- Workstream 4 arrived early and small: thirteen typed browser modules in `public/ts/*.ts` compile to `public/js/typed/` under `tsconfig.runtime.json`, strict-checked by `tsconfig.public-sources.json`. The skill `spw-typescript-affordances` carries the source/output matrix.
- Workstream 2.75 has not landed: `sw.js` precache lists are still hand-maintained, and `?v=` bumps are still editorial.

Three steps in `site-source-layout/wip.spw` touch this plan's files. Each is one patch; the decision named in bold belongs here, not to the layout plan:

- **M0, one list of what ships.** A positive `SITE_ENTRIES` / `isServedPath` in `build-topology.mts`, imported by `vite.config.ts` in place of its own `ignoredSegments`. This is the typed build-topology record Workstream 2 asked for. **Decision:** how `vite.config.ts` imports it. The root `tsconfig.json` is strict and includes only `vite.config.ts`; the compiled `scripts/typed/*.mjs` have no declarations, so importing them means a cast (as `template.mjs` is cast today), while importing the `.mts` source needs `allowImportingTsExtensions` in the root tsconfig. Record the choice in `wip.spw` before M0 is built.
- **M2, typed browser source out of `public/`.** `public/ts` moves to `src/ts`. Output stays at `public/js/typed/`, the `/public/js/*` path alias stays, and no URL changes. **Decision:** `rootDir` and `include` in `tsconfig.runtime.json`, `tsconfig.public-sources.json`, and `tsconfig.public.json`. The touch list is in the layout plan's `wip.spw`; update the skill matrix in the same commit.
- **L3, stop committing typed output.** Today `public/js/typed/` and `scripts/typed/` are committed so the repo can be read without a build and so `check:runtime` compares source against output. `npm run dev` and `test:modules` already rebuild them. **Decision:** whether the skill's rule that the browser runs what the repo shows survives a gitignored output plane. Not decided; do not act on L3 from the layout plan alone.

Validation for M0 and M2 from this plan's side: `npm run typecheck`, `npm run build:runtime`, `npm run check:runtime`, `npm run check:generated`, and `git diff --stat public/js/typed scripts/typed` showing no output change.
