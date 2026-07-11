---
name: spw-typescript-affordances
description: Use TypeScript where checks and contracts pay off. Do not convert the public site to a TS app.
---

# Spw TypeScript Affordances for spwashi.com

Read first: `../_shared/site-workflow.md`, `../_shared/site-vs-workbench.md`.

## Intent (honest)

It was unclear whether the site should become a TypeScript codebase. What proved
useful was typing **build and validation**, not rewriting every module.

## Use TypeScript for

| Surface | Why |
|---------|-----|
| `scripts/ts/site-contracts/` | Route body keys, manifest shape |
| `scripts/ts/runtime-contracts.mts` | Catalog mount/feature hygiene |
| `scripts/ts/css-manifest.mts` | BEHAVIOR_SCOPES / ROUTE_SCOPES |
| `public/ts/*` (few files) | bus, feeds, dom-contracts—portable edges |

## Prefer plain JS for

- Route modules, most `interface/` and `runtime/` processes
- Quick progressive enhancement
- Anything that is mostly DOM narrative

In plain JS: closed string sets, `Object.freeze` contracts, normalize helpers,
JSDoc at boundaries when it reduces real ambiguity.

## Feature / bundle hygiene (adjacent)

- Catalog `features:` must match CSS behavior scope keys when used as gates.
- New modules: prefer `visible` / `idle` / `interaction`; `immediate` + enhancement → `timingArc` or reclassify. `npm run check:runtime` reports the aggregate mount-hygiene debt and reserves per-module warnings for ungated or broad-effect cases.
- Review CSS under layer folders; treat `bundles/*` as generated.
- Manifest: `npm run manifest` → `.agents/state/runtime/route-runtime-manifest.json`.

## Validation

- `npm run build:tools` after `scripts/ts/**` edits
- `npm run check:runtime` for catalog/contract work
- `node --check` for plain JS
