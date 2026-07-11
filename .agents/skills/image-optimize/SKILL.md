---
name: image-optimize
description: Generate lighter public image derivatives when promoting assets. Skip for throwaway experiments.
---

# Image Optimization for spwashi.com

Read first: `../_shared/site-workflow.md`, `./references/size-tiers.spw` if present.

## Workflow

1. Promote or copy the source into a tracked `public/images/` area before linking HTML.
2. Match surface role (hero, card, figure, ornament).
3. Run the variant script when the asset will stay:
   - `bash .agents/skills/image-optimize/scripts/generate-variants.sh …`
4. Keep masters when they are source-of-truth; publish derivatives.
5. Update HTML, captions, alt after paths stabilize.

## Heuristics

- Optimize for the real route role
- Prefer modern formats when tooling allows
- Do not optimize the whole unsorted pile “for completeness”
