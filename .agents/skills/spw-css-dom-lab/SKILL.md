---
name: spw-css-dom-lab
description: Small reversible HTML/CSS/DOM experiments. Keep them local until a second consumer appears.
---

# Spw CSS + DOM Lab for spwashi.com

Read first: `../_shared/site-workflow.md`, `../_shared/site-vs-workbench.md`.

## Intent (honest)

Labs were meant to stay cheap. The failure mode was graduating every interesting
experiment into shared tokens, an IMMEDIATE module, and a convention.

## Workflow

1. Name a hypothesis (feel, learnability, ergonomics)—one sentence.
2. HTML/CSS first; JS only for state, timing, or pointer logic.
3. Isolate: one selector family or one attribute; reversible.
4. Test: narrow + wide, coarse pointer, reduced motion.
5. **Promotion rule:** second real consumer **or** explicit product request—then
   fold into shared CSS/module/.spw. Otherwise leave route-local or delete.

## Do not

- Register a new catalog `immediate` module for a lab
- Invent a sitewide `data-spw-*` family for a one-route probe
- Import lab CSS into the core bundle “just in case”

## Systems-layer note

If modulating interactive modules, consume dimension / medium tokens; do not
fork viewport detection. Base layout stays in components/routes; systems tails
modulate.

## Validation

- Visual check on the host route
- `git diff --check`
- No catalog change unless promotion is intentional
