# Plan: media-publishing

Add static media publishing infrastructure for featured pages, topics, and components.

## Goal

Create a lightweight publishing layer that can market and reference current site surfaces without introducing a build pipeline. The feature should let a JSON file configure weekly and daily focus, featured pages, featured topics, and featured components, then progressively render those into existing HTML frames. Taste note: improve clarity, inspectability, and editorial rhythm while preserving the static, hand-written site.

## Scope

- In scope: JSON focus config, progressive renderer, home/field-guide hosts, reusable styles, PWA cache registration.
- Out of scope: CMS accounts, remote APIs, analytics personalization, image asset migration, social-share automation.

## Files

[NEW] `public/data/media-focus.json` - editorial focus, featured pages, topics, and components.
[NEW] `public/js/media-publishing.js` - progressive renderer for focus and collection hosts.
[MOD] `public/js/site.js` - optional feature loader.
[MOD] `index.html` - home media focus host and feature opt-in.
[MOD] `about/website/index.html` - field-guide publishing register host and feature opt-in.
[MOD] `public/css/style.css` - media publishing component styles.
[MOD] `sw.js` - cache config and renderer.
[MOD] `manifest.webmanifest` - app version bump.

Craft guard:
- `public/css/style.css` is already large; keep styles grouped and component-scoped.
- `media-publishing.js` should stay under 300 lines and use data-driven rendering only.
- Do not reference uncommitted image moves; the layer must work text-first.

## Commits

1. `#[media] - add configurable publishing focus layer`

Fuzz strategy:
- Explore: inspect existing home and field-guide feature frames.
- Stabilize: JS syntax check and JSON parse.
- Ship gate: diff whitespace check and commit-review poll.

## Agentic Hygiene

- Rebase target: `origin/main@e54abe1a9001e23b01da0051eeaf038804daaa21`
- Rebase cadence: before commit and before merge.
- Hygiene split: pre-existing image asset moves/deletions are unrelated and must remain untouched.

## Dependencies

none

## Failure Modes

- Hard: malformed JSON prevents rendering.
- Soft: featured cards feel like generic marketing instead of useful navigation.
- Non-negotiable: no build tooling, no remote API dependency, no broken no-JS fallback.

## Validation

- Hypotheses: a visitor can see the current editorial focus and follow surfaced pages/topics/components.
- Negative controls: existing frame navigation, console, settings, and RPG gameplay features continue loading.
- Demo sequence: `/`, `/about/website/`, offline cache after service-worker update.

## Spw Artifact

None beyond `wip.spw` yet; the JSON contract and renderer are the durable artifact for this pass.
