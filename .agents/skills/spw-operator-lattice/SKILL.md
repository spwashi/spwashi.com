---
name: spw-operator-lattice
description: Inspect and relate Spw operator usage across the spwashi.com site. Use for querying `.spw` files, HTML `data-spw-*` patterns, route semantics, and operator-driven cross-link structures.
---

# Spw Operator Lattice for spwashi.com

Read first:

- `../_shared/site-workflow.md`
- `../_shared/site-vs-workbench.md`

## Default Workflow

1. Pick the surface to inspect:
   - `.spw` files
   - HTML operator chips and anchors
   - JS or CSS data-attribute contracts
2. Query with `rg` first; only reach for workbench tooling if the question truly needs parser-aware analysis.
3. Compare authored operator language to runtime/operator styling language.
4. Record mismatches as editor-facing `.spw` notes when they affect future development.

## Typical Questions

- Which operators cluster around a route family?
- Where do public metaphors drift from runtime semantics?
- Which handles, chips, or attributes imply the same concept with different names?
