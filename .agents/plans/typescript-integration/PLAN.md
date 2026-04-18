# Plan: typescript-integration

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
- JS delivery already has a chunk-friendly seam:
  - `public/js/site.js` mounts most behavior through route/selector-gated dynamic imports
- Asset identity is still coarse and manual:
  - many HTML routes still reference `?v=0.0.2` / `?v=0.0.1`
  - cache invalidation is editorially controlled rather than generated from content identity
- The build/export path will likely need a stronger notion of layered outputs if the site is later whitelabeled without forking the whole repo.
- The highest-complexity browser surfaces remain plain JS:
  - `public/js/site.js`
  - `public/js/site-settings.js`
  - `public/js/spw-page-metadata.js`
  - `public/js/spw-shared.js`
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
  - `scripts/generate-design-catalog.mjs`
  - `scripts/site-contracts.mjs`
  - `scripts/build.mjs`
  - `scripts/dev-server.mjs`
  - `scripts/generate-sitemap.mjs`
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
  - `public/js/site-settings.js`
  - `public/js/spw-page-metadata.js`
  - `public/js/spw-shared.js`
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

- Convert early:
  - `scripts/build.mjs`
  - `scripts/generate-design-catalog.mjs`
  - `scripts/site-contracts.mjs`
  - `scripts/dev-server.mjs`
  - `scripts/generate-sitemap.mjs`
- Extract early:
  - chunk/layer manifest types
  - release identity types
  - hash provenance helpers
  - precache manifest types
  - route-to-css/js ownership manifests
- Harden in JS first:
  - `public/js/site.js`
  - `public/js/site-settings.js`
  - `public/js/spw-page-metadata.js`
  - `public/js/spw-shared.js`
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
