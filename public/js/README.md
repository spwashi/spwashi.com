# JavaScript Tree

`site.js` is the public runtime entrypoint. Implementation modules live below semantic folders instead of root-level compatibility wrappers.

Implementation files live in semantic folders:

- `kernel/`: durable primitives, settings, shared contracts, and typed-runtime bridges.
- `semantic/`: operators, lattice/projection machinery, component semantics, and pretext helpers.
- `runtime/`: active processes, route grounding, spells, inspectors, gates, and lifecycle loops.
- `interface/`: visible affordances, guide behavior, haptics, local controls, palette/chrome response.
- `modules/`: page or feature bundles such as blog, services, RPG Wednesday, tools, profile, and care.
- `media/`: image storage, image metaphysics, and SVG/media helpers.
- `typed/`: generated browser-ready modules from `public/ts/`; do not hand-edit generated output.

Working rule: import implementation modules from the folder that owns the behavior. Keep `/public/js/site.js` stable for route shells, but do not add new root-level module wrappers.
