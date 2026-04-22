# Plan: story-prompt-surface-pass

Make the flagship storytelling and design routes feel more playable, promptable, and visually specific without losing the hand-authored, inspectable quality of the site.

## Goal

The desired end state is a site where the design hub, component glossary, recipes hub, blog, and about page each feel like they have a distinct reason to exist. The design pages should double as direct-wiring demo surfaces. Recipes should feel like an invitational substrate rather than only a registry. The blog should read as a thread laboratory that rewards filming and wandering. The about page should lean into typography, storytelling, and practical direction instead of generic self-description. Across these routes, promptability should become a visible, reversible affordance rather than an accidental side effect.

## Scope

- **In scope**: shared prompt/demo interaction wiring, shared promptability styling, updated footer quick actions, route HTML rewrites for `design/`, `design/components/`, `recipes/`, `blog/`, and `about/`, integration of existing curated render studies, and small `.spw` residue to keep the new route-cluster ideas inspectable.
- **Out of scope**: a full copy rewrite of every route on the site, a new image processing pipeline, external asset downloads, or replacing the static hand-authored routing model.

## Files

[NEW] `.agents/plans/story-prompt-surface-pass/PLAN.md` - plan and guardrails.  
[NEW] `.agents/plans/story-prompt-surface-pass/wip.spw` - branch memory for promptability, trope boxes, and route differentiation.  
[MOD] `public/js/site.js` - mount prompt utilities when promptable surfaces are present.  
[MOD] `public/js/spw-prompt-utils.js` - make prompt controls opt-in, frame-aware, reversible, and useful for route-local prompt hosts.  
[MOD] `public/css/spw-components.css` - shared demo-control, trope-box, and prompt deck composition.  
[MOD] `public/css/spw-wonder.css` - prompt copy button styling and route-adjustable wonder block treatment.  
[MOD] `public/css/website-surface.css` - design-route promptability and direct-wiring polish.  
[MOD] `public/css/recipes-surface.css` - recipe storytelling / media-prose rhythm.  
[MOD] `public/css/blog-surface.css` - blog prompt lab / image-backed thread treatment.  
[MOD] `public/css/about-surface.css` - typography register and route-specific hierarchy.  
[MOD] `_partials/site-footer.html` - clearer quick actions and settings affordance wording.  
[MOD] `design/index.html` - richer demo framing, direct-wiring prompt deck, better CTA copy, and curated image study.  
[MOD] `design/components/index.html` - stronger glossary hero, live composition demo copy, shared footer include, and promptable specimens.  
[MOD] `recipes/index.html` - invitation/prompt framing, image-backed trope box, and stronger route cross-links.  
[MOD] `blog/index.html` - recording/storytelling cues, richer promptability, and additional image-backed interpretive section.  
[MOD] `about/index.html` - typography section, more personal/story-forward direction, and better cross-route CTA language.  
[MOD] `.spw/surfaces/page-model.spw` - note prompt decks / trope boxes as inspectable feature-level attractors.

## Design Guardrails

- Treat promptability as an explicit affordance, not a permanent debug overlay.
- Use existing curated images from `public/images/renders/unsorted-curation/` before inventing new assets.
- Keep route voices distinct while preserving shared component grammar.
- Favor dense, useful copy over ornamental explanation.
- Make playful interactions reversible and inspectable through DOM state.

## Validation

- `git diff --check`
- `node --check public/js/site.js`
- `node --check public/js/spw-prompt-utils.js`
- targeted `rg` checks for promptability hooks, image paths, and shared footer usage
- `npm run build`
