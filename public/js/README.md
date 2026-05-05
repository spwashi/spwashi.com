# JavaScript Tree

`site.js` is the public runtime entrypoint. Most other root-level `.js` files are compatibility wrappers that preserve existing `/public/js/*.js` URLs for pages, service-worker caches, tests, and older imports.

Implementation files live in semantic folders:

- `kernel/`: durable primitives, settings, shared contracts, and typed-runtime bridges.
- `semantic/`: operators, lattice/projection machinery, component semantics, and pretext helpers.
- `runtime/`: active processes, route grounding, spells, inspectors, gates, and lifecycle loops.
- `interface/`: visible affordances, guide behavior, haptics, local controls, palette/chrome response.
- `modules/`: page or feature bundles such as blog, services, RPG Wednesday, tools, profile, and care.
- `media/`: image storage, image metaphysics, and SVG/media helpers.
- `typed/`: generated browser-ready modules from `public/ts/`; do not hand-edit generated output.

Working rule: move obvious files into these folders, keep wrappers for public URLs, and merge duplicates only after proving the callers share the same contract.
