# Style Image Cohesion

## Public Goal

Define a small, coherent image grammar for the site so creator identity, route atmosphere, and reference-document anatomy feel related without turning every page into the same screenshot.

## Current State

Revived from `wip.spw` during the 2026-06-21 planning ecology sweep. The detailed cache still lives in `wip.spw`; this file exists so the folder is navigable from the active plan tree and can be consolidated or implemented without relying on a hidden WIP artifact.

## Owner Surfaces

- `.spw/conventions/asset-management.spw`
- `.spw/conventions/style-development.spw`
- `.agents/skills/image-naming-magic/SKILL.md`
- `.agents/skills/image-optimize/SKILL.md`
- `public/images/`
- `index.html`, `about/index.html`, `about/website/index.html`, `topics/index.html`, `topics/software/index.html`, `topics/craft/`, `design/index.html`

## Scope

- Keep the first batch small enough to prove cohesion before broad route wiring.
- Use captions, alt text, and framing to explain why an image belongs on a page.
- Prefer shared visual grammar with route-specific crops, foregrounds, and material disposition rather than one-off decorative images.
- Keep image generation, naming, and optimization behind the local image skills so assets remain inspectable.

## Consolidation Notes

- This plan belongs in the media/image bucket of the active plan index.
- If implementation lands, fold the durable rules into `asset-management.spw` and archive this folder by index note unless direct citations require it to remain in place.
- If a later image system supersedes this plan, preserve `wip.spw` only as source context and move the current decision surface into the successor plan.

## Validation

- Check all referenced route and convention paths before promoting assets.
- Run the image naming and optimization workflows for any tracked image.
- Run `git diff --check` after copy or reference edits.
- Confirm pages remain readable without images and captions are specific enough to explain function, not just subject.
