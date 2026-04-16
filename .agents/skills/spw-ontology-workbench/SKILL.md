---
name: spw-ontology-workbench
description: Build and refine site-facing ontologies in `.spw` for routes, interactions, semantic families, and editor inspection. Use when modeling concepts and relations that should stay inspectable beyond prose.
---

# Spw Ontology Workbench for spwashi.com

Read first:

- `../_shared/site-workflow.md`
- `../_shared/site-vs-workbench.md`

## Default Workflow

1. Identify the domain boundary: route taxonomy, component roles, settings state, image semantics, or concept families.
2. Separate authored language from inferred runtime language.
3. Write or update `.spw` files that expose:
   - entities
   - relations
   - invariants
   - open seams
4. Keep the ontology inspectable in the editor; do not bury it only in JS constants or CSS selectors.
5. Use `.spw/_workbench` theory assets as references when useful, but keep the site ontology honest to the public system it describes.

## Good Outputs

- review bundles under `.spw/reviews/`
- route/topic maps
- state-flow or lifecycle notes
- semantic family registries
