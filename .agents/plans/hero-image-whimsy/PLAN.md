# Plan: hero-image-whimsy

Raise image discoverability and delight across the static site by turning more route heroes into image-bearing surfaces and by finally mounting the existing shared image-interaction systems.

## Goal

The desired end state is a site where important routes introduce themselves with a visible hero image or diagram instead of leading with text alone, and where those surfaces feel tactile rather than inert. The interaction target is **whimsical legibility**: drag and touch should gently bend or energize the image, canvas accents should resonate with page palette, SVG filters should be available everywhere, and hero figures should feel more prominent without turning into novelty widgets.

## Scope

- **In scope**: create plan artifacts, mount the dormant shared SVG/filter/canvas/image modules from `public/js/site.js`, extend the image metaphysics layer with drag/touch/prominence state, add shared hero-image layout rules, and retrofit key math/software routes with hero figures using existing assets and portable SVG surfaces.
- **Out of scope**: new build tooling, new external dependencies, bitmap generation, route rewrites unrelated to hero discoverability, or page-specific bespoke animation systems.

## Files

[NEW] `.agents/plans/hero-image-whimsy/PLAN.md` - human-facing scope and craft guard.  
[NEW] `.agents/plans/hero-image-whimsy/wip.spw` - living branch memory.  
[MOD] `public/js/site.js` - mount SVG filters, canvas accents, and image metaphysics where the DOM needs them.  
[MOD] `public/js/spw-image-metaphysics.js` - add drag/touch energy, palette resonance, and prominence-aware state.  
[MOD] `public/css/spw-metaphysical-paper.css` - style tactile image response, hero emphasis, and reduced-motion fallbacks.  
[MOD] `public/css/spw-surfaces.css` - add reusable hero image/grid surface primitives.  
[MOD] `public/css/topics-surface.css` - apply topic-surface hero atmospheres to the shared hero-image pattern.  
[MOD] `topics/software/index.html` - add a hero image and deeper inline route links.  
[MOD] `topics/software/parsers/index.html` - add a parser hero figure tied to the new interaction layer.  
[MOD] `topics/math/index.html` - upgrade the existing hero figure to use the shared prominence hooks.  
[MOD] `topics/math/number-theory/index.html` - add a hero image beside the modular-arithmetic introduction.  
[MOD] `topics/math/category-theory/index.html` - add a hero image beside the composition introduction.  
[MOD] `topics/math/complexity/index.html` - add a hero image beside the budget framing.  
[MOD] `topics/math/field-theory/index.html` - add a hero image beside the arithmetic-habitat framing.

Craft guard:
- Preserve the hand-authored HTML structure and keep each edit route-local.
- Reuse existing assets and shared CSS classes before inventing route-specific ornaments.
- Keep interactions low-friction: tactile and expressive, not game-like or noisy.
- Respect accessibility and reduced-motion constraints.

## Commits

1. `#[images] — plan whimsical hero-image pass`
2. `&[runtime] — mount shared image and accent systems`
3. `.[surfaces] — add reusable hero-image layouts and tactile styling`
4. `![topics] — expand hero images across math and software routes`

## Agentic Hygiene

- Rebase target: `main@806cbc6`
- Rebase cadence: before commit 1, before merge
- Hygiene split: none

## Dependencies

none

## Failure Modes

- **Hard**: shared image modules mount too broadly and disturb non-hero imagery or SVG readability.
- **Hard**: hero image layouts fork between math and software routes instead of becoming reusable surface primitives.
- **Soft**: interactions feel decorative but do not improve discoverability or page hierarchy.
- **Soft**: canvas accents overpower copy or make figures harder to read on touch devices.
- **Non-negotiable**: pages remain readable and navigable when JavaScript is unavailable or reduced motion is enabled.

## Validation

- **Hypotheses**: more routes with hero imagery will improve scanability and route identity; drag/touch-aware image metaphysics will make image surfaces feel more intentional without requiring custom page scripts.
- **Negative controls**: existing route copy, page anchors, semantic metadata, and shared navigation remain intact.
- **Demo sequence**: visit `/topics/software/`, `/topics/software/parsers/`, `/topics/math/`, `/topics/math/number-theory/`, `/topics/math/category-theory/`, `/topics/math/complexity/`, and `/topics/math/field-theory/`; verify hero image presence, internal links, and calm interaction behavior on hover/touch.

## Spw Artifact

None beyond `wip.spw`; the branch memory is the retained operational surface.
