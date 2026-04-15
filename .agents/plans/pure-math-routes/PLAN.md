# Plan: pure-math-routes

Add a small cluster of pure-math field-guide routes under `topics/math/` so the site can visualize abstract structure beyond the existing software-adjacent math pages.

## Goal

The desired end state is a math hub that no longer points only sideways into software topics, but also downward into a few durable pure-math lenses that are easy to browse visually. The new routes should make abstract ideas legible through diagrams, short conceptual groupings, and explicit neighborhood links rather than long formal exposition. The taste note is **expressive clarity**: the pages should feel like compact visual study sheets, not textbook stubs.

## Scope

- **In scope**: create a few new static pure-math routes beneath `topics/math/`, update the existing math hub to distinguish pure-math paths from software-adjacent neighbors, expose the routes from the topic atlas, add only the shared CSS needed for the new diagrams/cards, and register the pages in the service worker core routes.
- **Out of scope**: adding JavaScript visualizations, introducing new image assets or build tooling, rewriting the software math pages, or turning the site into a full math curriculum.

## Files

[NEW] `.agents/plans/pure-math-routes/PLAN.md` - human-facing scope and craft guard.
[NEW] `.agents/plans/pure-math-routes/wip.spw` - living branch memory.
[NEW] `topics/math/topology/index.html` - topology route focused on deformation, holes, and boundaries.
[NEW] `topics/math/symmetry/index.html` - symmetry route focused on actions, orbits, and invariants.
[NEW] `topics/math/combinatorics/index.html` - combinatorics route focused on finite structure, counting, and graph intuition.
[MOD] `topics/math/index.html` - turn the math hub into a parent route for the new pure-math pages.
[MOD] `topics/index.html` - expose the new math sub-routes from the topic atlas card.
[MOD] `public/css/topics-surface.css` - shared styles for pure-math diagrams, grids, and route cards.
[MOD] `sw.js` - register the new routes for precache/navigation resilience.

Craft guard:
- Keep each new page hand-authored, semantic, and readable as static HTML.
- Prefer shared classes in `topics-surface.css` over per-page inline layout styles.
- Use diagrams to teach one structural idea each; avoid decorative math wallpaper.
- Keep route copy short enough to scan on mobile without collapsing into glossary bullets.

## Commits

1. `#[math] — plan pure-math route expansion`
2. `&[math] — add pure-math field-guide routes`
3. `.[topics] — wire hub discoverability and shared visual language`
4. `![math] — verify static hygiene and route coverage`

## Agentic Hygiene

- Rebase target: `origin/main@66b78359e0129f530be7e31853098bc4fdd76998`
- Rebase cadence: before commit 1, before merge
- Hygiene split: none

## Dependencies

none

## Failure Modes

- **Hard**: the new pages read like renamed software routes instead of pure-math lenses.
- **Hard**: the math hub links to the new pages without clearly distinguishing them from the existing geometry/lattices/renderers cluster.
- **Soft**: the diagrams are visually dense but do not explain what to notice.
- **Soft**: added CSS overfits these pages and starts to sprawl beyond the topic surface conventions.
- **Non-negotiable**: all new routes remain framework-free, semantic, and navigable without JavaScript.

## Validation

- **Hypotheses**: a small trio of pure-math routes will make the math surface feel broader and easier to explore; short SVG diagrams will improve scanability without new runtime code.
- **Negative controls**: existing shared navigation, existing software math routes, analytics snippets, and asset paths remain intact.
- **Demo sequence**: open `/topics/math/`, move into `topology`, `symmetry`, and `combinatorics`, then return to `/topics/` and confirm the new routes are discoverable from the atlas card.

## Spw Artifact

None beyond `wip.spw`; the branch memory is the retained operational surface.
