---
name: patch-consolidator
description: Group mixed site changes into coherent patches before commit. Use when HTML, CSS, JS, images, and `.spw` edits have drifted together and need clearer boundaries, experience-slice grouping, or better commit shape.
---

# Patch Consolidator for spwashi.com

Read first:

- `../_shared/site-workflow.md`
- `../_shared/site-vs-workbench.md`

## Default Workflow

1. Inspect the current diff by **concern**, not only by file type.
2. Group changes into reviewable patches:
   - copy and routing
   - design-system / CSS tokens
   - runtime module + catalog registration
   - interactive-medium / scene / key-event slice
   - image curation
   - `.spw` inspection artifacts
   - agent/skills/plan ecology (→ `agent-optimization/`)
3. Call out cross-layer patches only when they serve one clear idea or one experience slice.
4. Leave unrelated user work untouched.
5. Use `./scripts/analyze-changes.sh` for a quick summary; restate boundaries in plain language.

## Suggested patch boundaries (site direction)

| Patch theme | Typical files | Split if mixed with |
|-------------|---------------|---------------------|
| Scene / entertainment medium | `interactive-medium.*`, `scene-interaction.*`, `spw-key-events.*`, film/play routes | unrelated topic copy |
| Dimension / tokens | `dimensions.css`, `dimension-vocabulary.spw`, layout-postures | route HTML only |
| Runtime catalog | `module-catalog.js`, new `public/js/runtime/*.js` | CSS unless same module |
| Page anatomy / handoff | `page-anatomy.js`, `topical-payload.js` | unrelated settings work |
| Skills / plans | `.agents/skills/`, `.agents/plans/` | public route features |

## Good Outputs

- suggested commit groupings with one-line intent each
- hidden coupling notes (e.g. CSS import order depends on JS dataset)
- files that must land together
- files that should be split to keep review honest