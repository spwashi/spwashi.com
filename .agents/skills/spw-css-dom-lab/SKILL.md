---
name: spw-css-dom-lab
description: Design and run small, reversible UI experiments for the spwashi.com site using HTML, CSS, and DOM APIs. Use for interaction prototypes, device-aware surface tests, container-query layout variants, and stateful experiments without new dependencies.
---

# Spw CSS + DOM Lab for spwashi.com

Read first:

- `../_shared/site-workflow.md`
- `../_shared/site-vs-workbench.md`

## Default Workflow

1. Name the hypothesis: what should feel more learnable, vivid, ergonomic, or inspectable?
2. For cross-discipline experiments, fill daily-kernel fields first.
3. Start with HTML/CSS; add JS only for state, timing, sampling, or pointer logic.
4. Keep experiments reversible:
   - isolate to one selector family or data attribute
   - avoid inline styles (except dynamic CSS vars from runtime)
   - prefer progressive enhancement
5. Test against: desktop reading, narrow viewport, coarse pointer, reduced motion, and declared intensity.
6. If the pattern survives, fold into shared tokens, systems CSS, runtime module, `.spw` contract, or insight cache — not a page trick.

## Systems-layer experiment rules

- Base behavior → module CSS (`scene-interaction.css`, `spw-key-events.css`, etc.)
- Device/register modulation → `interactive-medium.css` (imported **after** modules it tunes)
- Canonical token defaults → `dimensions.css` or `tokens/core.css`
- Do not reorder `style-core.css` layers for experiments; use file position within the same layer

## Good Targets

- scene bed layout variants (`container-type: inline-size`, `@supports`)
- touch vs hover affordances (`data-spw-hover-mode`)
- reveal/stagger timing via `--spw-medium-reveal-stagger-step`
- packing-tier parity on interactive hosts
- menus, chips, settings widgets, wonder/resonance controls
- daily-kernel studio/lab/theater experiments

## Promotion checklist

Before folding an experiment into shared code:

- [ ] Works without JS? If not, registered in `module-catalog.js`?
- [ ] Tokens named in `dimension-vocabulary.spw`?
- [ ] Snapshot or serialize path for inspection?
- [ ] Reduced-motion and touch paths verified?

## Validation

- `git diff --check`
- `node --check` on touched JS
- `rg` for experiment selectors/attrs
- optional browser smoke at 2 viewport widths