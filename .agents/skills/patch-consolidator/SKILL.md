---
name: patch-consolidator
description: Split mixed working trees into reviewable commits. Use when HTML/CSS/JS/.spw drifted into one blob.
---

# Patch Consolidator for spwashi.com

Read first: `../_shared/site-workflow.md`, `../_shared/site-vs-workbench.md`.

## Intent

Mixed diffs are normal when exploring. Shipping them as one commit is how review
and reverts die. This skill is for **shape**, not for inventing more work.

## Workflow

1. Group by **concern**, not only file type.
2. Typical buckets:
   - copy / routing
   - design tokens / shared CSS
   - runtime module + catalog
   - scene/interactive medium (only if that was the job)
   - images
   - `.spw` / plans / skills (meta—keep separate when possible)
3. Cross-layer only when one idea truly needs all layers.
4. Leave unrelated user work alone.
5. Optional: `./scripts/analyze-changes.sh` for a summary.

## Split table

| Theme | Typical files | Split if mixed with |
|-------|---------------|---------------------|
| Scene / play medium | interactive-medium, scene-interaction, play routes | unrelated marketing copy |
| Tokens / dimensions | dimensions.css, packing CSS | single route HTML only |
| Catalog / runtime | module-catalog, runtime/*.js | unrelated CSS |
| Skills / plans | `.agents/*` | public feature work |

## Outputs

- Suggested commit list with one-line intents
- Must-land-together notes
- What to leave out of this PR
