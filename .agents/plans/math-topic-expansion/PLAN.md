# Plan: math-topic-expansion

Expand the topic system with richer math and theory routes: upgrade the existing parsers page, add routes for complexity and field theory, and add number theory plus category theory pages with portable interactive diagrams.

## Goal

The desired end state is a broader, more navigable math/theory cluster that feels like a genuine field guide instead of a thin hub. The new routes should be intuition-first, cross-linked, and visually legible on static pages, with at least a couple of portable interactive diagrams that do not depend on build tooling or heavyweight runtimes. The taste note is **playful clarity**: the pages should feel mathematically serious, but still welcoming and fun to explore.

## Scope

- **In scope**: create new static routes for `complexity`, `field-theory`, `number-theory`, and `category-theory`; upgrade `topics/software/parsers/`; add a small shared JS module for portable interactive SVG-based math diagrams; update math/software/topic hub discoverability; extend shared topic CSS as needed; and register the new routes in the service worker.
- **Out of scope**: introducing build tooling, adding external dependencies, shipping large canvas-heavy demos, or rewriting the whole software/math atlas.

## Files

[NEW] `.agents/plans/math-topic-expansion/PLAN.md` - human-facing feature scope.
[NEW] `.agents/plans/math-topic-expansion/wip.spw` - living branch memory.
[NEW] `topics/math/complexity/index.html` - complexity route.
[NEW] `topics/math/field-theory/index.html` - field theory route.
[NEW] `topics/math/number-theory/index.html` - number theory route with portable interactive diagram.
[NEW] `topics/math/category-theory/index.html` - category theory route with playful insight and interactive composition diagram.
[NEW] `public/js/spw-math-diagrams.js` - page-scoped SVG interactivity for number theory and category theory.
[MOD] `topics/software/parsers/index.html` - upgrade from stub to structured field-guide page.
[MOD] `topics/math/index.html` - expose and connect the new routes.
[MOD] `topics/index.html` - expose the expanded math cluster.
[MOD] `topics/software/index.html` - add discoverability for parsers and complexity if appropriate.
[MOD] `public/css/topics-surface.css` - shared math route styling and interactive diagram controls.
[MOD] `sw.js` - precache new routes and assets.

Craft guard:
- Keep all interactivity portable, local, and readable in raw HTML/JS.
- Prefer SVG + DOM updates over heavier runtime graphics where possible.
- Every interactive region must still leave a meaningful static page if JS does not run.
- Keep new pages consistent with the field-guide tone already established in the math cluster.

## Commits

1. `#[math] — plan theory route expansion`
2. `&[math] — add number theory, field theory, category theory, and complexity routes`
3. `&[software] — deepen parser route and cross-link theory neighbors`
4. `.[topics] — add portable math diagram runtime and shared topic styling`
5. `![math] — verify static hygiene and route coverage`

## Agentic Hygiene

- Rebase target: `origin/main@66b78359e0129f530be7e31853098bc4fdd76998`
- Rebase cadence: before commit 1, before merge
- Hygiene split: current worktree contains unrelated local edits outside this feature slice; leave them untouched and scope validation to the files changed for this pass.

## Dependencies

none

## Failure Modes

- **Hard**: the new math routes feel disconnected from the existing hub and topic atlas.
- **Hard**: the interactive diagrams require JS to make sense instead of remaining legible as static SVG surfaces.
- **Soft**: category theory becomes jargon-heavy instead of insight-heavy.
- **Soft**: parsers remains a stub in practice despite more links and sections.
- **Non-negotiable**: no build tooling, no dependencies, and no destructive interaction with unrelated local edits.

## Validation

- **Hypotheses**: intuition-first routes plus portable interactive SVG diagrams will make the math cluster feel more inhabitable and exploratory; better cross-links will make theory pages easier to traverse as a network.
- **Negative controls**: existing nav, route families, analytics, and non-feature files remain intact.
- **Demo sequence**: open `/topics/math/`, enter `number theory` and interact with the modular diagram, open `category theory` and use the composition explorer, open `complexity`, `field theory`, and upgraded `parsers`, then return through the topic atlas.

## Spw Artifact

None beyond `wip.spw`; the branch memory is the retained operational surface.
