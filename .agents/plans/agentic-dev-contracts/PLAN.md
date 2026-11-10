# Plan: agentic-dev-contracts

**Status 2026-11-10.** Landed, and ready for `archive/`. The route/runtime manifest (154c28d3) and the one door, `npm run check:local` (`scripts/check-local.mjs`), stand; the door writes `.agents/state/runtime/check-local-last.json`. The output reading in [tooling-output-2026-11](../../../.spw/caches/tooling-output-2026-11.spw) keeps the paste line as the noisy-crash token, and the door, the audit laws, and the receipt as the gestalt. It does not add a slice here. The condition the 2026-10-10 Status set is met: d13a532f turned the last twenty audit-first validation steps into `check:local`, and no live plan names the audit-first script. Both wonders in `index.spw` are answered from the tree, so nothing needs carrying to [agent-optimization](../agent-optimization/PLAN.md) first. The plans-index and skills-index caches were never built and stay struck. Next slice: the move itself; this folder owns no other work.

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

Landed: `scripts/site-contracts.mjs`, `scripts/generate-route-runtime-manifest.mjs`, `scripts/check-site.mjs` and their `package.json` scripts (154c28d3). The last two now import builds of `scripts/ts/generate-route-runtime-manifest.mts` and `scripts/ts/check-site.mts`. The manifest writes `.agents/state/runtime/route-runtime-manifest.json` by default (`ROUTE_MANIFEST_OUTPUT` in `scripts/ts/site-contracts/index.mts`); `SPW_ROUTE_MANIFEST_OUTPUT` overrides it, and `manifest:tmp` points it at `$TMPDIR`.

## Semantic And Runtime Seams

- Authored truth lives in route HTML body datasets and shared head assets.
- Runtime truth lives in `public/js/site.js` staged module definitions.
- The manifest should preserve that boundary: derive route metadata from HTML, derive runtime modules from the staged registry, and avoid inventing a second semantics model.
- Validation should fail on missing required body metadata or missing shared entry assets, while softer drift like unknown related-route references can begin as warnings.

## Agentic Development Cache Contract

Cache only what is expensive to rediscover and cheap to invalidate. Every cache should name its source files, generating command or update ritual, invalidation trigger, and whether it is safe to commit.

Useful cache families:

- **Route/runtime manifest:** generated from route HTML and runtime module definitions. Answers "what route is this?" and "which modules may mount here?"
- **Plan census / owner map:** generated or manually refreshed from `.agents/plans/`. Answers "which plan owns this class of work?" without scanning every plan folder (57 on 2026-11-06).
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

Finding: `.agents/state/runtime/route-runtime-manifest.json` can lag the tree (sample `generatedAt` 2026-04-17, `routeCount` 77, pre-refactor `./spw-*.js` import paths). Since then `check-site` names the cache `fresh`, `stale`, `reused`, `missing` or `invalid` on its `[check] manifest=` line, and reads the cache only when it can reuse it; otherwise it parses the routes in memory. On 2026-11-06 the cache held 208 routes from that morning. HTML required body keys and `data-spw-features` gating remain the strongest shared HTML features; TypeScript serves checks (`scripts/ts`), not route modules; Spw serves coordinates and audits.
