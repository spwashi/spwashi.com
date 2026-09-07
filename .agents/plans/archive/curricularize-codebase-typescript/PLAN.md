# Plan: curricularize-codebase-typescript

Use TypeScript as the site's reasoning backbone without forcing every handwritten frontend module through a costly rewrite. The goal is a codebase that can explain itself: what data each page carries, which events connect components, why runtime systems are shaped the way they are, and how those choices support marketing, learning, and collaboration.

## Public Goal

Make `spwashi.com` demonstrate the idea "curricularize your codebase": structure should be inspectable, teachable, and credible to experienced engineers while still supporting the public creator identity. TypeScript should trace the outline of the architecture people recognize: page data, event contracts, runtime phases, settings, and component ownership.

## Conversion Rule

Convert contracts before behavior.

The best early TypeScript targets are:

- event spines and event payload registries
- page metadata and route manifest data
- settings, local storage, and persistence shapes
- feed/configuration modules
- DOM helper modules with small stable APIs

Avoid spending budget on:

- large interaction modules whose architecture is still changing
- route-local visual experiments
- one-off animation files with little shared data value
- generated outputs under `public/js/typed/` or `scripts/typed/`

## First Pass

[MOD] `public/ts/spw-bus.ts` - move the event bus implementation behind strict event/detail/history types.
[MOD] `public/js/spw-bus.js` - keep the old import path as a wrapper over the compiled typed module.
[MOD] `public/ts/spw-runtime-environment.ts` - type the local-development runtime boundary.
[MOD] `public/js/spw-runtime-environment.js` - keep the old import path as a wrapper over the compiled typed module.

## Next High-Leverage Passes

1. `site-settings` contract extraction

Move closed setting keys, storage payloads, and root dataset projections into TypeScript first. Keep the large settings behavior in JS until the data shapes are stable.

2. Page data model

Create a typed page contract for body metadata, route families, page modes, related routes, and generated manifest entries. This should connect `scripts/ts/site-contracts` to runtime-facing docs without forcing every route to become generated.

3. Component architecture catalog

Type the component semantic snapshot shape currently produced by `spw-component-semantics.js` and surfaced by the design catalog. This is where "why this component exists" becomes inspectable instead of only visual.

4. Timing and event vocabulary

Centralize names for rhythm, spell, frame, settings, and attention events. The event bus should become the place where timing relationships are visible and discussable.

## Page Architecture Principle

Routes remain authored HTML. TypeScript should not hide page meaning behind generated templates. It should describe and verify the page architecture: what the route claims to be, what data it exposes, what runtime systems can attach, and which events it participates in.

## Validation

- `npm run build:runtime`
- `npm run typecheck`
- `npm run build:vite`
- `node --check` for wrapper JS files
- targeted `rg` checks that existing imports still resolve through stable public paths

## Out Of Scope

- converting every runtime file in one pass
- changing route HTML into TS-rendered components
- adding client-side frameworks
- rewriting visual experiments before their data contracts are stable
