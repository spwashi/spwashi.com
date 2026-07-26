---
name: spw-operator-lattice
description: Inspect Spw operator usage across .spw, HTML data-spw-*, and route links. Use for operator/cross-link audits—not to sprinkle more chips everywhere.
---

# Spw Operator Lattice for spwashi.com

Read first: `../_shared/site-workflow.md`, `../_shared/site-vs-workbench.md`.

## Intent

Operators are a real grammar on this site. Overusing chips as decoration made
pages noisier without teaching more.

## Use when

- Auditing operator consistency (frame/probe/object/…)
- Fixing broken conceptual cross-links
- Aligning colors/tokens with operator identity

## Avoid

- Adding operator chips to every paragraph “for density”
- New operator types without shared definitions + tokens

## Workflow

1. Query existing usage (`.spw`, `data-spw-operator`, chips) with the mounted
   `spw` CLI, not raw `rg`, so counts/coupling reflect real refs, not string hits.
2. Prefer reusing established operators over inventing synonyms.
3. Change shared definitions/tokens only when the lattice truly shifted.
4. Keep public copy readable without requiring operator literacy.

## Tooling (mounted `spw` CLI)

```bash
npm --prefix .spw/_workbench run spw -- analyze .spw --selectors ops:frame,ops:body,boon,bone   # hit densities by operator
npm --prefix .spw/_workbench run spw -- map .spw --hubs 12                  # hubs / cycles / familiarity strands
npm --prefix .spw/_workbench run spw -- formula .spw --family field         # named formula catalog, pattern discovery
```

## Validation

- Mounted `analyze`/`map` above for operator counts and cross-links
- `rg` only as a fallback for `data-spw-operator` string hits in HTML/JS
- Spot-check contrast and focus states
