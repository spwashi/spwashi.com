---
name: spw-typescript-affordances
description: Apply TypeScript thinking where it helps the spwashi.com repo without forcing the site into a TypeScript build. Use for mounted workbench code, typed helper scripts, and safer state-shape design in plain JS modules.
---

# Spw TypeScript Affordances for spwashi.com

Read first:

- `../_shared/site-workflow.md`
- `../_shared/site-vs-workbench.md`

## Default Workflow

1. Confirm the target actually benefits from typing:
   - mounted workbench scripts or TS files
   - complex JS state objects
   - event/detail payloads
   - configuration registries
2. Do not introduce a new TS build path for route code just because types would be nice.
3. In plain JS, prefer TS-inspired discipline:
   - normalization functions
   - closed string sets
   - JSDoc typedefs where they reduce ambiguity
   - explicit shape checks at boundaries
4. If the edit belongs upstream in `.spw/_workbench`, say so and patch the right surface intentionally.

## Validation

- `node --check` for edited JS
- workbench-side type or script checks only when workbench files changed
