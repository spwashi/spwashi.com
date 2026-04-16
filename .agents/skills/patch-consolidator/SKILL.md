---
name: patch-consolidator
description: Group mixed site changes into coherent patches before commit. Use when HTML, CSS, JS, images, and `.spw` edits have drifted together and need clearer boundaries or better commit shape.
---

# Patch Consolidator for spwashi.com

Read first:

- `../_shared/site-workflow.md`
- `../_shared/site-vs-workbench.md`

## Default Workflow

1. Inspect the current diff by concern, not only by file type.
2. Group changes into reviewable site patches such as:
   - copy and routing
   - design-system or CSS tuning
   - runtime/state behavior
   - image curation
   - `.spw` inspection artifacts
3. Call out cross-layer patches only when they serve one clear idea.
4. Leave unrelated user work untouched.
5. Use `./scripts/analyze-changes.sh` when you need a quick summary, then restate the patch boundaries in plain language.

## Good Outputs

- suggested commit groupings
- hidden coupling notes
- files that should move together
- files that should be split apart
