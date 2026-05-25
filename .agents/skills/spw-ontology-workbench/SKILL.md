---
name: spw-ontology-workbench
description: Build and refine site-facing ontologies in `.spw` for routes, interactions, semantic families, and editor inspection. Use when modeling concepts and relations that should stay inspectable beyond prose.
---

# Spw Ontology Workbench for spwashi.com

Read first:

- `../_shared/site-workflow.md`
- `../_shared/site-vs-workbench.md`

## Default Workflow

1. Identify the domain boundary: route taxonomy, component roles, settings state, image semantics, concept families, **agent contracts, planning ecology, or editor inspectability surfaces**.
2. Separate authored language from inferred runtime language.
3. Write or update `.spw` files that expose:
   - entities
   - relations
   - invariants
   - open seams
4. Keep the ontology inspectable in the editor; do not bury it only in JS constants or CSS selectors.
5. Use `.spw/_workbench` theory assets as references when useful, but keep the site ontology honest to the public system it describes.

When modeling the agent layer itself (see `agent-optimization/PLAN.md`), treat "planning surfaces", "skill affordances", "validation contracts", and ".spw dispatch for editors" as first-class domains.

## Good Outputs

- review bundles under `.spw/reviews/`
- route/topic maps
- state-flow or lifecycle notes
- semantic family registries
- agent/planning surface models (e.g., dispatch entries for `@agents`, `@plans`, editor seams, skill contracts) — see `agent-optimization/PLAN.md` and the `.spw/site.spw` agents block
