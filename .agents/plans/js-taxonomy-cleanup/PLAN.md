# JS Taxonomy Cleanup

## Public Goal
Remove the `spw-` prefix from the JavaScript source tree, keep the runtime naming semantically legible by folder, and consolidate obvious shared primitives into their owning layer.

## Scope
- Rename prefixed source files in `public/js/` and the TypeScript sources in `public/ts/`.
- Update imports and file references in the site runtime, helper modules, and JS docs.
- Keep behavior stable; this pass is about naming, ownership, and path clarity.

## Likely File Groups
- `public/js/kernel/` for durable primitives, shared contracts, and runtime bridges.
- `public/js/interface/` for user-facing chrome and controls.
- `public/js/runtime/` for active processes and page-state loops.
- `public/js/semantic/` for projection, inference, and semantic helpers.
- `public/js/media/` for media and SVG helpers.
- `public/js/modules/` for route or feature bundles.
- `public/js/typed/` and `public/ts/` for generated or source typed helpers.

## Constraints
- Avoid introducing alias wrappers just to keep old paths alive.
- Prefer one canonical file per concept rather than parallel names.
- Preserve current event contracts and module behavior.

## Validation
- `node --check` on touched JS files
- `git diff --check`
- `npm run check`

## Out of Scope
- Runtime behavior changes unrelated to path and taxonomy cleanup.
- New features or semantic state additions.
