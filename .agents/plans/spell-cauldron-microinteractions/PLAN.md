# Plan: Spell + Cauldron Microinteractions

## Public Goal

Make the cauldron feel like a working vessel and spells feel like composed, inspectable outputs.

```text
term / card / route / image -> prime -> collect in cauldron -> compose spell -> publish / copy / route / proof
```

## Current Patch

- Header utility controls now rest as a compact horizontal quick-tune strip on mobile instead of a wrapped grid.
- Footer cauldron copy now distinguishes ingredients from spell outputs.
- Cauldron exposes count-based states: `empty`, `primed`, `mixing`, `spell-ready`.
- Spell preview is separate from the ingredient list and uses `data-spw-spell-candidate`.
- Haptics exposes transient `data-spw-prime-state="candidate|primed|collected"` so prime state does not overload `data-spw-grounded`.
- Cauldron actions are tiered with `data-spw-action-tier="primary|growth|output|cleanup"`.
- Expanded console now reserves footer clearance through `--spw-bottom-chrome-clearance`.
- The home `Three good first loops` illustrated cards use compact mobile media so empty image space does not read as a broken panel.

## State Contract

- `data-spw-prime-state`: transient working selection.
- `data-spw-ingredient-state`: collected ingredient lifecycle.
- `data-spw-cauldron-state`: vessel readiness.
- `data-spw-spell-state`: draft, copied, published, or spent.
- `data-spw-operator-sequence`: transformation path for spell preview and prompt mining.
- `data-spw-source-route`: where an ingredient came from.
- `data-spw-source-element`: source key or element expression.

## Guardrails

- Hover previews.
- Hold primes.
- Explicit action collects, composes, copies, or publishes.
- Do not put cauldron composition into the header.
- Keep animations small; state clarity should carry the satisfaction.

## Validation

- `node --check public/js/interface/composition.js`
- `node --check public/js/interface/haptics.js`
- `git diff --check`
- `npm run check:local`

## Ownership Note - 2026-07-03

Merged into `spellcraft-authoring/PLAN.md` as the consolidated owner of spell/cauldron authorship, selection, and styling. This file stays as reference; route new work to the owner plan.
