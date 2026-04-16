# Plan: unsorted-image-rollout

Curate a small set of images from `00.unsorted/` and thread them into the site's most visible surfaces so heroes, cards, and screenshot regions feel more wonder-bearing and less text-only.

## Goal

The desired end state is a site where a few top-level routes immediately feel more visual without losing their editorial clarity. Images should not read like loose decoration. Each selected render should reinforce a nearby claim, echo the copy, and point the reader toward another route or section. The practical target is the surfaces people are most likely to screenshot first: the home hero, the topic atlas, and the main software-oriented hubs.

## Scope

- **In scope**: create plan artifacts, add a shared illustrated-card treatment, update existing hero/media regions to use curated `00.unsorted/` images, revise nearby copy/captions so the images deepen route discoverability, and keep the new figures compatible with the existing image interaction layer.
- **Out of scope**: bulk-sorting or renaming the whole `00.unsorted/` library, generating new artwork, editing unrelated UI modules already modified in the worktree, or building a full image-management system.

## Files

[NEW] `.agents/plans/unsorted-image-rollout/PLAN.md` - human-facing scope and guardrails.  
[NEW] `.agents/plans/unsorted-image-rollout/wip.spw` - living branch memory for the rollout.  
[EDIT] `index.html` - refresh the home hero studies and artifact cards with curated renders.  
[EDIT] `topics/index.html` - add a stronger image-backed hero and illustrated topic cards.  
[EDIT] `topics/software/index.html` - give the software hub a more tactile hero image tied to parser/runtime language.  
[EDIT] `public/css/spw-surfaces.css` - introduce a reusable illustrated-card pattern shared across surfaces.  
[EDIT] `public/css/topics-surface.css` - align topic-route hero/card styling with the new imagery.  
[EDIT] `public/css/home-surface.css` - tune the home surface so illustrated cards and hero studies match the existing palette and screenshot rhythm.

## Image Curation

- Prefer images that feel durable and route-adjacent rather than purely jokey.
- Favor pieces with teal/amber resonance so they sit naturally inside the current palette system.
- Use at least one `ChatGPT` render and at least a few hero/card images from the other `00.unsorted/` buckets.
- Keep asset references root-relative and reuse the current image interaction runtime instead of inventing a new widget layer.

## Copy Strategy

- Every new figure caption should either deepen a nearby argument or point to a nearby route.
- Card visuals should imply what kind of attention the route teaches before the reader opens it.
- Hero captions should reward screenshots by feeling self-contained rather than placeholder-ish.

## Commits

1. `#[plan] — map unsorted image rollout`
2. `&[surface] — add illustrated hero and card image treatment`
3. `.[content] — weave curated renders into home and topic hubs`
4. `![verify] — check static hygiene`

## Failure Modes

- **Hard**: the new images feel random, generic, or disconnected from the surrounding prose.
- **Hard**: image-heavy cards break the existing hand-authored layout rhythm or make link structure less clear.
- **Soft**: too many images land at once and flatten the sense of hierarchy instead of improving it.
- **Soft**: screenshots look busier but not more meaningful.
- **Non-negotiable**: keep the pages framework-free, semantic, and compatible with the existing image interaction system.

## Validation

- Run `git diff --check`.
- Sanity-check the updated hubs for balanced tags and anchor flow.
- Verify the new `00.unsorted/` paths are referenced correctly from the edited pages.
- Confirm the image-bearing cards still participate in the current hover/drag/hold interaction layer.
