# Plan: media-feature-brief

Create a public field-guide route that explains the site's current media and interaction features for curious readers.

## Goal

The site has accumulated a PWA shell, Spw operator routes, frame navigation, console affordances, Pretext experiments, and a developing metaphysics of cognitive surfaces. This plan adds a concise public communication surface so media enthusiasts can understand what to notice and where to explore without needing to read the implementation notes first.

Taste note: improve clarity and expressiveness while preserving the hand-authored, calm-at-rest site voice.

## Scope

- **In scope**: a static field-guide page, links from existing public surfaces, Spw surface registration, and PWA cache/version updates for the new route.
- **Out of scope**: new runtime behavior, visual redesign, new dependencies, a press kit, analytics changes, or claims that unfinished planned interactions already exist.

## Files

```text
[NEW] about/website/index.html
[NEW] .agents/plans/media-feature-brief/wip.spw
[NEW] .agents/plans/media-feature-brief/media-feature-brief.spw
[NEW] .agents/plans/media-feature-brief/PLAN.md
[MOD] index.html
[MOD] about/index.html
[MOD] topics/software/index.html
[MOD] .spw/site.spw
[MOD] .spw/surfaces.spw
[MOD] sw.js
[MOD] manifest.webmanifest
```

### Craft guard

No changed file should exceed its current responsibility. The new route is a content surface using existing classes, not a CSS or JavaScript expansion. The plan intentionally avoids adding a new component system, runtime module, or route-specific stylesheet.

## Commits

1. `.[media] — publish website field guide for media enthusiasts`

The canonical running version lives in `wip.spw`.

## Agentic Hygiene

- Rebase target: `main@14442d42b8fe4d9d5bfec5906e652fbca98d5f22`
- Rebase cadence: before commit 1, before merge
- Hygiene split: none; worktree was clean before planning

## Dependencies

None. This is a static communication layer over already-published surfaces.

## Failure Modes

- **Hard**: the page implies features exist that are only planned.
- **Soft**: the page reads like internal architecture notes instead of an approachable media field guide.
- **Non-negotiable**: the page must remain navigable without JavaScript, accessible as semantic HTML, and cacheable by the current GitHub Pages PWA setup.

## Validation

- Confirm the new route and all added links use root-relative paths.
- Confirm `manifest.webmanifest` remains valid JSON.
- Confirm `.spw` syntax passes the workbench lint gate if available.
- Confirm `git diff --check` reports no whitespace errors.

## Spw Artifact

`.agents/plans/media-feature-brief/media-feature-brief.spw`
