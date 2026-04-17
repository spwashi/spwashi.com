# Plan: design-hub

## Public Goal

Create a top-level `/design/` hub that declares design as a first-class public surface on the site, gives collaborators a shared page for team communication, and exposes real rendering-context tests built from the existing Spw/Pretext contracts.

The hub should do three things at once:

- explain how global and local data attributes shape display context
- provide circuits into the existing design-facing routes and feature sets
- act as a stable manual test page for split layout, pretext flow, material/context variants, and mobile reading behavior

## Likely Files

- `design/index.html`
- `about/website/index.html`
- `topics/site-design/index.html`
- `index.html`

Optional only if the route genuinely needs new styling beyond shared surfaces:

- `public/css/design-surface.css`
- `public/css/style.css`

## Semantic / Runtime Seams

- Keep the hub site-first: route HTML plus existing shared CSS contracts should do most of the work.
- Prefer existing page metadata families:
  - `data-spw-surface`
  - `data-spw-route-family`
  - `data-spw-context`
  - `data-spw-page-family`
  - `data-spw-page-role`
  - `data-spw-layout`
- Use the existing shell split-layout contract so the hub also tests the newly repaired rail behavior.
- Use real pretext/material attributes instead of mock API prose where possible:
  - `data-spw-flow="pretext"`
  - `data-text-wrap`
  - `data-spw-pretext-depth`
  - `data-spw-pretext-cache`
  - `data-spw-context`
  - `data-spw-metamaterial`

## Planned Shape

### Route: `/design/`

- Opening frame that declares intent and explains the page as:
  - design hub
  - communication surface
  - rendering-context test bench
- Circuit section linking outward to:
  - `/about/website/`
  - `/topics/site-design/`
  - `/topics/software/pretext/`
  - `/topics/software/renderers/`
  - `/topics/architecture/`
  - `/settings/`
- Context stack section that distinguishes:
  - global/root state
  - page/body state
  - component/region state
  - slot/local state
- Rendering context tests showing multiple variants built from real data attributes.
- Mobile interaction notes for compact navigation, section handles, control density, and hover/focus assumptions.
- Gutter rail with quick jumps / questions so the page also exercises split layout.

### Link updates

- Add explicit `/design/` links from the existing design-facing pages so the hub reads as the current coordination route rather than an isolated experiment.

## Validation

- `git diff --check`
- targeted sanity read for changed HTML around headers, rails, and closing tags
- no JS edits unless a runtime gap appears

## Out Of Scope

- A full new design-system runtime
- Replacing `/topics/site-design/` or `/about/website/`
- Formalizing a new `.spw` ontology unless the route introduces a genuinely new reusable contract
