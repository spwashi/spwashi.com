# Plan: image-visit-metaphysics

Turn the current image-metaphysics prototype into a semantic interaction layer where Midjourney-derived images and SVG figures can be held to mark as visited, persist that visitation across pages, and expose a small Spw helper surface that explains and modulates image treatments without becoming decorative noise.

## Goal

The desired end state is an image system that behaves like the rest of the site: effects come from semantics, not randomness. Conceptual surfaces can feel distant or unresolved, hybrid surfaces can feel latent or aqueous, and realized surfaces can feel more settled and paper-sharp. Holding an image or SVG should mark it as visited, reward the reader with a persistent glow, and preserve that attention as a returnable memory rather than a transient hover flourish. The taste note is **wonder with legibility**: the interaction should stay playful, but every glow, blur, and helper handle should explain something about the surface rather than merely decorating it.

## Scope

- **In scope**: semantic image treatment mapping; hold-to-visit interaction; persistent visited glow for raster and SVG surfaces; a compact helper operator for image surfaces; localStorage persistence; thoughtful integration on existing image-bearing routes already in progress.
- **Out of scope**: global asset generation, server-backed gating, blanket image insertion across the whole site, changes to PWA icons or OG assets, and any rewrite of the broader CSS architecture.

## Files

[NEW] .agents/plans/image-visit-metaphysics/PLAN.md
[NEW] .agents/plans/image-visit-metaphysics/wip.spw
[NEW] .agents/plans/image-visit-metaphysics/image-visit-metaphysics.spw
[MOD] public/js/spw-image-metaphysics.js — replace random hover effects with semantic treatment logic, hold-to-visit persistence, and helper operator wiring
[MOD] public/css/spw-metaphysical-paper.css — style semantic image hosts, visited glow, helper chip, and hold state for raster/SVG surfaces
[MOD?] topics/software/compression/index.html — tighten image surface metadata and phrasing around the new scaffold
[MOD?] topics/software/schedulers/index.html — same for scheduler imagery
[MOD?] about/domains/lore.land/index.html — opt the existing poster/token studies into the same interaction model
[MOD?] index.html — only if a small number of existing study figures need explicit metadata to read better under the new image model

Craft guard:
- `public/js/spw-image-metaphysics.js` should stay a focused interaction module, not absorb settings, canvas, persona, or gate logic.
- `public/css/spw-metaphysical-paper.css` should own the image metaphysics presentation instead of leaking rules into `style.css`.
- Image placements should remain sparse and intentional. A new image must improve phrasing, spacing, or continuity.
- Visited state must remain understandable with motion off and without relying on color alone.

## Commits

1. `#[image-metaphysics] — capture semantic image visitation plan and Spw artifact`
2. `&[image-metaphysics] — replace random image effects with semantic treatments and hold-to-visit persistence`
3. `&[image-surfaces] — wire key raster and SVG surfaces into the helper model with better phrasing`
4. `![image-metaphysics] — verify imports, persistence, and nonintrusive visited-state behavior`

Fuzz strategy:
- Explore loop: `fuzz:explore --target=image-visit-metaphysics`
- Stabilize loop: `fuzz:stabilize --target=image-visit-metaphysics`
- Ship gate: `fuzz:ship --target=image-visit-metaphysics`

## Agentic Hygiene

- Rebase target: `historical@2569d51` (current local basis; mainline reachability unverified in this workspace)
- Rebase cadence: before commit 1, before merge
- Hygiene split: shared hot files already exist from parallel work in `public/js/site.js`, `public/css/style.css`, `public/js/spw-svg-filters.js`, and `topics/software/compression/index.html`; this pass should stay additive and avoid rewriting those surfaces beyond the image semantics it needs.

## Dependencies

- `brace-literacy-guides` — image helper phrasing should align with substrate/realization guidance rather than invent a parallel semantic system.
- `screenshot-semantics` — visitation and returnable image surfaces should remain compatible with later screenshot/prompt workflows.

## Failure Modes

- **Hard**: visited state is keyed inconsistently, so raster and SVG surfaces do not restore reliably across reloads.
- **Hard**: the helper surface becomes a control panel and overwhelms the image rather than clarifying it.
- **Soft**: semantic treatment mapping feels arbitrary because route markup does not expose enough realization/substrate context.
- **Soft**: the glow is attractive but not legible in reduced motion or lower-contrast themes.
- **Non-negotiable**: the base content remains readable and usable with JS disabled or image effects unsupported.

## Validation

- **Hypotheses**: semantic treatments will feel more intentional than randomized hover effects; hold-to-visit will create a clearer memory ritual than click toggles; a persistent visited glow will make returnable image surfaces legible across pages.
- **Negative controls**: icons, OG metadata assets, and ordinary inline images should remain untouched; image surfaces should not shift layout when the helper or visited state appears.
- **Demo sequence**: load a page with raster and SVG surfaces, hover to preview treatment, hold to mark visited, reload, and confirm that the glow and helper state restore without changing page layout.

## Spw Artifact

`.agents/plans/image-visit-metaphysics/image-visit-metaphysics.spw`
