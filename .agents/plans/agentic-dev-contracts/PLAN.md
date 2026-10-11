# Plan: agentic-dev-contracts

**Status 2026-10-10.** Landed: the route/runtime manifest and the one door, `npm run check:local`, which writes `.agents/state/runtime/check-local-last.json`. The `wonder_plan_script_door` probe in `index.spw` passes today: every instrument it names exists, `check` still runs `npm audit` first, and `check:local` does not. The plans-index and skills-index caches were never built and are struck. Next slice: none here; once the plans name `check:local` instead of `check`, this plan can be archived as landed.

Make the site cheaper for agents to understand and verify by giving the repo one explicit validation entrypoint and one generated route/runtime manifest derived from the authored HTML and staged runtime definitions.

## Goal

The desired end state is a repo where an agent can answer two basic questions cheaply: "what is this route?" and "did I break the site contract?" The first answer should come from a generated manifest instead of repeated ad hoc parsing. The second should come from a single check command instead of remembered shell rituals. This keeps the site hand-authored while making its structure more inspectable.

The next optimization layer is agentic development caching: derived, invalidatable summaries that help an agent avoid re-reading the same broad surfaces every turn while still treating authored files as the source of truth.

## Scope

- In scope: a generated route/runtime manifest, a unified `npm run check:local` entrypoint, and validation for required route metadata plus shared entry assets.
- In scope: SVG/spec maps derived from route HTML and public SVG assets so agents can find structural diagram surfaces without grepping the repo.
- In scope: repo-local script helpers that read route HTML and the `site.js` staged runtime registry.
- In scope: repo-local cache surfaces that summarize validation posture, route metadata, and recent maintenance sweeps.
- Out of scope: build tooling migration, browser E2E automation, production bundling, or a broader rewrite of page metadata conventions.
- Out of scope: caching model opinions, hiding source files behind generated summaries, or treating a past validation result as current without a source-tree invalidation check.

## Files

[NEW] `.agents/plans/agentic-dev-contracts/PLAN.md`
[NEW] `scripts/site-contracts.mjs`
[NEW] `scripts/generate-route-runtime-manifest.mjs`
[NEW] `scripts/check-site.mjs`
[MOD] `package.json`
[GEN] `/tmp/spwashi-route-runtime-manifest.json` by default, with `SPW_ROUTE_MANIFEST_OUTPUT` available for repo-local overrides such as `.agents/state/runtime/route-runtime-manifest.json`

## Semantic And Runtime Seams

- Authored truth lives in route HTML body datasets and shared head assets.
- Runtime truth lives in `public/js/site.js` staged module definitions.
- The manifest should preserve that boundary: derive route metadata from HTML, derive runtime modules from the staged registry, and avoid inventing a second semantics model.
- Validation should fail on missing required body metadata or missing shared entry assets, while softer drift like unknown related-route references can begin as warnings.

## Agentic Development Cache Contract

Cache only what is expensive to rediscover and cheap to invalidate. Every cache should name its source files, generating command or update ritual, invalidation trigger, and whether it is safe to commit.

Useful cache families:

- **Route/runtime manifest:** generated from route HTML and runtime module definitions. Answers "what route is this?" and "which modules may mount here?"
- **Plan census / owner map:** generated or manually refreshed from `.agents/plans/`. Answers "which plan owns this class of work?" without scanning 170 folders.
- **Validation posture memo:** short generated or manually recorded summary of the last relevant check command, command scope, date, and source tree identity. It may guide work, but it never replaces rerunning validation before landing.
- **Semantic dispatch cache:** `.spw/site.spw`, `.spw/conventions/index.spw`, and `planning-ecology.spw` references that route agents to owner concepts.
- **Patch boundary cache:** plan-local or archive notes that summarize what a prior broad conversation became, so future agents do not re-expand it into parallel work.

Non-cacheable or volatile:

- Browser observations without date, route, viewport, and reproduction path.
- A model's taste judgment without file evidence and validation.
- "Checks passed" claims that do not name the command and source-tree state.
- Generated summaries that no longer identify their source files.

Optimization rule: if an agent repeats the same census, route scan, or skill-routing audit twice, the next pass should either add a small generated artifact under `.agents/state/`, improve an existing README/index, or document why the repetition is safer than caching.

Validation boundary: `check-site` builds the manifest in memory and must stay
read-only. `npm run manifest` is the explicit cache refresh that writes
`.agents/state/runtime/route-runtime-manifest.json`; `manifest:tmp` provides the
same generated evidence when the editor cache is not writable.

Initial candidate artifacts:

- `.agents/state/runtime/route-runtime-manifest.json` remains the canonical generated route/runtime cache.
- `.agents/state/runtime/check-local-last.json` records the last local validation run (`check:local` writes it). It is advisory until validation is rerun.
- Struck 2026-10-10: `plans-index.json` and `skills-index.json` were never built. The plans README owner map and `.agents/skills/README.md` answer those questions by hand.

## Validation

- `node scripts/generate-route-runtime-manifest.mjs`
- `npm run check:local`
- `git diff --check`
- `node --check` for new/edited script modules
- For future generated agent caches: verify the artifact names its source files and invalidation basis, and keep generated outputs out of commits unless the repo already tracks that artifact class.

## Usage audit (2026-07)

Nested Spw: `.spw/audits/agentic-development-2026-07/`.

Finding: `.agents/state/runtime/route-runtime-manifest.json` can lag the tree (sample `generatedAt` 2026-04-17, `routeCount` 77, pre-refactor `./spw-*.js` import paths). Agents must run `npm run manifest` before trusting the cache. HTML required body keys and `data-spw-features` gating remain the strongest shared HTML features; TypeScript serves checks (`scripts/ts`), not route modules; Spw serves coordinates and audits.
