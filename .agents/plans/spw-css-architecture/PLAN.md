# Plan: spw-css-architecture

Reconsider the site's CSS architecture so Spw braces and operators become first-class semantic design primitives instead of incidental decoration scattered across oversized surface files.

## Goal

The site should express Spw grammar visibly and consistently: braces should read as containment and charge, operators should act as meaningful handles for emphasis, selection, and timing, and decorative motion or texture should project from those semantics rather than compete with them. The current end state is not "more layers in `style.css`"; it is a smaller, clearer root stylesheet that delegates to focused modules for tokens, grammar, ornaments, and surface overrides. Taste note: improve layering, containment, and expressiveness without losing the calm static-HTML feel of the site.

## Scope

- In scope: decomposing `public/css/style.css` responsibilities; defining a stable semantic CSS substrate for braces, operators, selection handles, and resonance/timing states; moving surface-specific overrides into smaller files; aligning SVG/blog/craft surfaces to consume shared grammar tokens instead of ad hoc local styling.
- Out of scope: redesigning every page at once, shipping a new JS-heavy interaction system, changing the site's core typography, or finishing the currently dirty staged snapshot before the architecture is agreed.

## Files

[NEW] `.agents/plans/spw-css-architecture/PLAN.md`
[NEW] `.agents/plans/spw-css-architecture/wip.spw`
[MOD] `public/css/style.css` - shrink toward root imports, global tokens, and minimal base/layout ownership
[NEW] `public/css/spw-tokens.css` - operator/bracket/color/timing custom-property bank
[NEW] `public/css/spw-grammar.css` - brace physics, operator states, semantic handles, and shared structural selectors
[NEW] `public/css/spw-ornaments.css` - decorative projections, filters, fractal corners, and non-semantic atmospheric surfaces
[NEW] `public/css/spw-selection.css` - emphasis, focus, selection, and resonance timing affordances
[MOD] `public/css/svg-surfaces.css` - consume shared operator/brace tokens rather than isolated SVG-specific values
[MOD] `public/css/spw-whimsy.css` - reduce to taste/affect projection rather than owning semantic interaction rules
[MOD] `public/css/blog-surface.css` - express cards/lines/buttons through shared grammar hooks
[MOD] `public/css/craft-surface.css` - keep page-specific palette and type adjustments separate from grammar primitives
[MOD?] `public/js/site.js` - only if a small DOM/data-attr hook is needed for reversible selection/resonance experiments
[MOD?] `index.html` - only if the root surface needs one explicit feature gate or semantic data attribute

Craft guard:
- `public/css/style.css` is already 3276 lines and carries too many responsibilities; target a root file under 500 lines after extraction.
- `public/css/blog-surface.css` is already 1617 lines; do not move more semantic ownership into it.
- Any new CSS file should aim for one reason to change and stay under 400 lines; flag anything trending beyond 600.

## Commits

1. `#[spw-css] — carve shared tokens and semantic grammar out of style.css`
2. `&[spw-css] — extract ornamental and selection/resonance layers behind explicit gates`
3. `&[spw-css] — rewire blog, craft, svg, and core site surfaces onto the shared grammar substrate`
4. `![spw-css] — verify selector coverage, preview truth, and reduced-motion/static behavior`

Fuzz strategy:
- Explore: `fuzz:explore --target=spw-css`
- Stabilize: `fuzz:stabilize --target=spw-css`
- Ship: `fuzz:ship --target=spw-css`

The canonical running version lives in `wip.spw`.

## Agentic Hygiene

- Rebase target: `main@3296ac01bb2dccb94b42938ef2517038fd2c4482`
- Rebase cadence: before commit 1, before merge
- Hygiene split: the worktree is already dirty with staged lore/blog/image work plus an unstaged Gemini-owned `public/css/style.css` layering refactor; this plan must not pretend the tree is clean, and commit 1 should begin only after that ownership boundary is resolved

## Dependencies

none

## Failure Modes

- Hard: semantic primitives are extracted, but page surfaces still duplicate or override them so the architecture remains tangled.
- Soft: braces/operators become more visible but still read as ornament instead of useful handles for selection, emphasis, or timing.
- Soft: new CSS files exist, but ownership boundaries remain unclear, so future edits drift back into `style.css`.
- Non-negotiable: HTML remains the semantic source of truth, reduced-motion behavior stays intact, and decorative projections never become required for comprehension.

## Validation

- Hypotheses: a contributor can answer "where do brace physics live?", "where do operator colors/states live?", and "where do page-specific overrides live?" without opening multiple unrelated files.
- Negative controls: existing home/blog/craft/lore routes remain readable without decorative motion, and palette/type changes do not leak across surfaces accidentally.
- Demo sequence: `/`, `/blog/`, `/topics/craft/`, `/about/domains/lore.land/`, an SVG surface route, and one reduced-motion browser session.

## Spw Artifact

None beyond `wip.spw`; the branch memory is the retained operational surface until the architecture settles enough to deserve a distilled protocol artifact.
