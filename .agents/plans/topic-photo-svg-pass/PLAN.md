# Plan: topic-photo-svg-pass

Improve a small cluster of topic routes by using existing `public/images/*` assets more deliberately, strengthening one SVG-heavy craft page, and adding new topic stubs for site design and math.

## Goal

Make the topic atlas feel more inhabited. The topic surfaces should stop reading like isolated text stubs and start behaving like a connected field guide with real visual references, better route cross-links, and richer diagrammatic cues. All photo references in this pass must come from images that already live in `public/`.

## Scope

- **In scope**: a bounded update to `topics/index.html`, `topics/architecture/index.html`, `topics/pedagogy/index.html`, `topics/craft/svg/index.html`, shared topic-facing CSS, two new topic stubs (`/topics/site-design/`, `/topics/math/`), and service worker route registration.
- **Out of scope**: new generated raster assets, external downloads, broad copy rewrites across the whole site, build tooling, or a full overhaul of every topic route.

## Hypothesis

Topic pages become more legible and memorable when abstract ideas are paired with a few grounded visual studies and when neighboring routes are surfaced as an explicit lattice. A stronger SVG page plus a couple of photo-backed stub routes should make the topic system feel less skeletal without diluting the hand-authored static-site character.

## Files

[NEW] `.agents/plans/topic-photo-svg-pass/PLAN.md` - human-facing plan.
[NEW] `.agents/plans/topic-photo-svg-pass/wip.spw` - living implementation state.
[MOD] `topics/index.html` - extend the atlas with new topic cards and a visual studies register.
[MOD] `topics/architecture/index.html` - add photo references and better connected stub structure.
[MOD] `topics/pedagogy/index.html` - add photo references and better connected stub structure.
[MOD] `topics/craft/svg/index.html` - improve the hero SVG and add a photo-backed reference section.
[NEW] `topics/site-design/index.html` - stub route for readable web surfaces, motifs, and publishing systems.
[NEW] `topics/math/index.html` - stub route linking geometry, lattices, rendering, and parser-adjacent math.
[MOD] `public/css/spw-surfaces.css` - shared topic photo/reference grid styles.
[MOD] `sw.js` - register new routes for precache/navigation resilience.

## Design guardrails

- Use only images already present in `public/images/`.
- Keep HTML semantic and hand-readable.
- Prefer shared class additions over repeated inline layout styles.
- Treat photos as reference material, not decorative wallpaper.
- SVG additions should explain structure, not merely ornament the page.

## Commits

1. `#[topics] — plan topic photo and svg pass`
2. `&[topics] — add topic visual studies and new stub routes`
3. `.[craft] — deepen svg storytelling and shared topic surface styling`
4. `![topics] — wire pwa routes and verify static hygiene`

## Validation

- `git diff --check`
- Manual sanity pass for balanced HTML and route links
- Confirm new routes are present in `sw.js`
- Confirm all newly added image references point into `public/images/`

