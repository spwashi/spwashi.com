---
name: spw-ontology-workbench
description: Model durable site concepts in .spw when relations must outlive a patch. Not every idea needs an ontology.
---

# Spw Ontology Workbench for spwashi.com

Read first: `../_shared/site-workflow.md`, `../_shared/site-vs-workbench.md`.

## Intent

Ontologies help when names and relations keep getting rediscovered. They hurt when
every experiment becomes a family in `site.spw`.

## When to use

- Route/component roles, settings state, image semantics that already recur
- Agent contracts or planning ecology **after** they have proven sticky
- Aligning or archiving competing models

## When not to use

- One-route copy experiments
- Premature “complete” maps of a half-built feature

## Workflow

1. Bound the domain (what is **out** of scope).
2. Separate authored language from runtime inference.
3. Operation first: cache / audit / align / prime / contract / **archive**.
4. Entities, relations, invariants, open seams—minimal set.
5. Keep it inspectable in `.spw`; do not only bury it in JS constants.
6. Workbench theory is reference only unless upstream truly changes.

Cross-discipline one-offs → daily-kernel shape, not a new ontology tree.

## Good outputs

- Small review bundles, state-flow notes, registries that replace confusion
- Archive notes that reduce active load
