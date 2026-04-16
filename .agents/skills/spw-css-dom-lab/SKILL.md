---
name: spw-css-dom-lab
description: Design and run small, reversible UI experiments for the spwashi.com site using HTML, CSS, and DOM APIs. Use for interaction prototypes, visual grammar tests, and stateful surface experiments without introducing build tooling.
---

# Spw CSS + DOM Lab for spwashi.com

Read first:

- `../_shared/site-workflow.md`
- `../_shared/site-vs-workbench.md`

## Default Workflow

1. Name the hypothesis in plain language: what should feel more learnable, vivid, or inspectable?
2. Start with HTML/CSS; add JS only if the experiment needs state, timing, sampling, or pointer logic.
3. Keep the experiment reversible:
   - isolate it to one selector family or data attribute
   - avoid one-off inline styles
   - prefer progressive enhancement over mandatory runtime behavior
4. Test the experiment against both desktop reading and touch interaction assumptions.
5. If the pattern survives, fold it back into shared tokens, surfaces, or runtime utilities instead of leaving it as a page trick.

## Good Targets

- menus, chips, and settings widgets
- hero figures and image ornaments
- page-index discoverability
- palette, wonder-memory, and resonance controls
- structural ornaments that teach state

## Validation

- `git diff --check`
- `node --check` on touched JS files
- targeted `rg` checks for the experiment's selectors or data attributes
