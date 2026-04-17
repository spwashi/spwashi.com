# Plan: agentic-dev-contracts

Make the site cheaper for agents to understand and verify by giving the repo one explicit validation entrypoint and one generated route/runtime manifest derived from the authored HTML and staged runtime definitions.

## Goal

The desired end state is a repo where an agent can answer two basic questions cheaply: "what is this route?" and "did I break the site contract?" The first answer should come from a generated manifest instead of repeated ad hoc parsing. The second should come from a single check command instead of remembered shell rituals. This keeps the site hand-authored while making its structure more inspectable.

## Scope

- In scope: a generated route/runtime manifest, a unified `npm run check` entrypoint, and validation for required route metadata plus shared entry assets.
- In scope: SVG/spec maps derived from route HTML and public SVG assets so agents can find structural diagram surfaces without grepping the repo.
- In scope: repo-local script helpers that read route HTML and the `site.js` staged runtime registry.
- Out of scope: build tooling migration, browser E2E automation, production bundling, or a broader rewrite of page metadata conventions.

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

## Validation

- `node scripts/generate-route-runtime-manifest.mjs`
- `npm run check`
- `git diff --check`
- `node --check` for new/edited script modules
