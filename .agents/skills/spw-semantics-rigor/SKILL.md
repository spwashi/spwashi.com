---
name: spw-semantics-rigor
description: Make the spwashi.com semantics model more rigorous across copy, HTML data attributes, CSS tokens, JS state, and `.spw` inspection files. Use for ontology cleanup, concept alignment, and runtime/state naming decisions.
---

# Spw Semantics Rigor for spwashi.com

Read first:

- `../_shared/site-workflow.md`
- `../_shared/site-vs-workbench.md`

## Default Workflow

1. Identify the semantic layer in question:
   - public copy
   - HTML/data attributes
   - CSS tokens or category families
   - JS datasets/events/state
   - `.spw` conceptual surfaces
2. Distinguish authored truth from inferred truth.
3. Look for drift in naming, role clusters, and lifecycle assumptions.
4. Prefer one canonical name per concept unless the distinction is real and teachable.
5. When the model matters beyond one patch, write it down in `.spw`.

## Good Outputs

- invariants
- role and cluster maps
- state-flow notes
- semantic drift audits
- renamed data attributes or events
