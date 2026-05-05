# JavaScript Tree

`site.js` is the public runtime entrypoint. Everything else should be readable as a
module tree, not a pile of ad hoc helpers.

## Reading Order

If you are trying to learn the runtime, read in this order:

1. `public/js/site.js` for the bootstrap lifecycle and module loading policy.
2. `public/js/kernel/spw-dom-contracts.js` for shared selector and dataset helpers.
3. `public/js/kernel/spw-shared.js` for the canonical operator registry and shared semantics.
4. `public/js/runtime/` for mounted processes, lifecycles, and page-state producers.
5. `public/js/interface/` for visible affordances and user-facing controls.
6. `public/js/semantic/` for projection, inference, and semantic helpers.
7. `public/js/modules/` for route-specific feature bundles.

## Folder Roles

- `kernel/`: durable primitives, settings, shared contracts, and runtime bridges.
- `semantic/`: operator grammar, projection machinery, semantic inference, and pretext helpers.
- `runtime/`: active processes, route grounding, spells, inspectors, gates, and lifecycle loops.
- `interface/`: visible affordances, guide behavior, haptics, local controls, and chrome response.
- `modules/`: page or feature bundles such as blog, services, RPG Wednesday, tools, profile, and care.
- `media/`: image storage, image metaphysics, and SVG/media helpers.
- `typed/`: generated browser-ready modules from `public/ts/`; do not hand-edit generated output.

## Portable Modules

These are the best candidates when you want to reuse a file on another site:

- `kernel/spw-dom-contracts.js` for selector, dataset, and style helpers.
- `runtime/spw-interaction-loop.js` for small interaction-state records and refresh events.
- `runtime/spw-attention-architecture.js` for section locomotion and resonance pinning.
- `media/spw-image-store.js` for IndexedDB-backed image persistence.
- `semantic/pretext-utils.js` for CDN loading and pretext data fetch helpers.

## Structural Rule

Import implementation modules from the folder that owns the behavior. Keep
`/public/js/site.js` stable for route shells, and avoid adding new root-level
compatibility wrappers unless a file truly needs a migration shim.
