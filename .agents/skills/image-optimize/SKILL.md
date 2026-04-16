---
name: image-optimize
description: Generate tracked responsive image variants for the spwashi.com site. Use when promoting images into `public/images/`, preparing hero/card assets, and producing lighter derivatives for public routes.
---

# Image Optimization for spwashi.com

Read first:

- `../_shared/site-workflow.md`
- `./references/size-tiers.spw`

## Default Workflow

1. Promote or copy the chosen source into a tracked area under `public/images/` before wiring public HTML to it.
2. Pick the surface type and intended prominence.
3. Run the variant generator when the source is worth keeping:
   - `bash .agents/skills/image-optimize/scripts/generate-variants.sh ...`
4. Keep the original untouched when it is a source-of-truth render; publish optimized derivatives instead.
5. Update HTML, captions, and alt text after the asset path is stable.

## Heuristics

- Optimize for the actual route role: hero, card, figure, or ornament.
- Prefer `webp`/`avif` derivatives when the tooling is available.
- Do not point public pages at ignored `00.unsorted` paths.
- Validate asset existence and public references after promotion.
