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

## Tooling (mounted `spw` CLI)

Prefer the mounted CLI over ad-hoc `rg`/`Read` sweeps of `.spw` — it understands
selectors, refs, and roots, and stays consumer-relative:

```bash
npm --prefix .spw/_workbench run spw -- doctor ../..                       # mounted-consumer readiness
npm --prefix .spw/_workbench run spw -- roots                              # declared workspace roots
npm --prefix .spw/_workbench run spw -- tree .spw --depth 3                # bounded surface tree
npm --prefix .spw/_workbench run spw -- select .spw/index.spw --selector navigable --summary
npm --prefix .spw/_workbench run spw -- query -- --from .spw --skim --selector pathRefs
```

Use `pulse <file.spw>` for a plan-only edit probe before hand-editing a surface;
reserve `mutate` for direct multi-file rewrites you've already reasoned through.
See `.spw/_workbench/docs/runtime/md/mounted-workbench.md`.
