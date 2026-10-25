# Plan: designer-conversation-canvas

**Status 2026-10-10.** Landed: the measurement bus (1621ac6c), settings typography preview, frame metrics and the `/design/#conversation-canvas` frame; browser behaviour is not revalidated. Now holds design-hub's success test (Absorbed, below). Next slice: one real designer reviews the `#component-ecology-specimens` specimen from a bundle shaped by what that review asks for. Gate: the creator names that reviewer; no bundle schema before then.

**Review sitting:** [ui-review-sitting-2026-10](../../../.spw/caches/ui-review-sitting-2026-10.spw) — calls.reviewer, calls.first_portable.

**Related:** [pretext-whimsy-lab](../archive/pretext-whimsy-lab/PLAN.md). **Absorbed 2026-10-10:** [design-hub](../archive/design-hub/PLAN.md).

Make spwashi.com legible as a **conversation between author, designer, and runtime** — touchable specimens, named tokens, and a shared measurement bus on the public route.

## Goal

Designers should be able to open the public site, touch specimens, cite tokens by name, read objective typography telemetry, and leave subjective annotations that stay queryable beside measurements.

## Scope

- **In scope**: Pretext measurement bus as shared telemetry layer; settings typography preview; design hub conversation canvas frame; frame-metrics mount behind `metrics` feature; settings designer-handoff copy and links; `.spw` convention for conversation primitives.
- **Out of scope**: External design-tool import/export, collaborative commenting backend, site-wide pointer physics, replacing design catalog generation.

## Conversation primitives

| Primitive | Plain term | Site surface |
|-----------|------------|--------------|
| Specimen | touchable route fragment | `/design/components/`, hook anatomy, brace specimens |
| Token | named CSS / semantic alias | `/design/catalog/#tokens`, settings appearance |
| Measurement | objective typography telemetry | `pretext-measurement-bus.js`, settings preview, frame metrics |
| Annotation | subjective review note | settings semantic/climate, cauldron, wonder |

## Files

- `public/js/semantic/pretext-measurement-bus.js` — shared measure/read/publish API
- `public/js/modules/design/typography-measurement-preview.js` — settings live preview
- `public/js/runtime/page/frame-metrics.js` — bus-aware frame seams
- `public/js/runtime/regions/composition-box-model.js` — reads pretext signals into box snapshots
- `settings/index.html` — typography preview + designer conversation category
- `design/index.html` — conversation canvas frame
- `.spw/conventions/designer-conversation-canvas.spw` — inspectable contract

## Validation

- `npm run check:local`
- Settings `#typography-measurement-preview` updates telemetry when font scale / line spacing changes
- Design hub with `metrics` feature shows frame-metrics bars
- Live Pretext hosts on design/pretext routes publish `spw:pretext-measurement` events

## Typography and packing

`public/css/components/typography-packing.css` unifies three packing tiers (compact / balanced / roomy) with typography surfaces (`frame-note`, `spec-kicker`, `frame-copy`, settings prose). Settings `data-spw-line-spacing` and component `data-spw-density` route into the same ladder. Grids default to `data-spw-pack="fill balanced"` on the conversation canvas and rendering-context specimens.

See `.spw/conventions/typography-packing.spw`.

## Next

- State inspector panel for measurement bus snapshots
- Export conversation bundle (specimen URL + token list + telemetry JSON) for async designer review
- View-transition handoffs between settings preview and design specimens

## Evidence And Next Experiment — 2026-09-20

Operation `align`, fixity `tending`. The measurement bus, typography preview,
frame metrics, and `design/#conversation-canvas` are present in source. This
supports implementation presence, not a fresh claim of browser correctness.
The three Next items remain proposals; exports and transitions were not proved.
For one integrated handoff, pair a specimen URL and chosen token values with
optional telemetry and separately labeled author observations. The consumer is
a named reviewer, not the starter bundling pilot: that pilot is texture-slice
(`site-starter-component-kit/BUNDLING.md`) and does not list this specimen.
Test reproduction by a second author before generalizing the export schema.

## Absorbed 2026-10-10 — design-hub

Source: [design-hub](../archive/design-hub/PLAN.md). The `/design/` hub (cc8f33a0), the
`#component-ecology-specimens` specimen (`public/js/modules/design/experiments.js`,
`public/css/routes/surfaces/design.css`) and the design-facing links landed. Still owed,
as this plan's success test: a second-site author reproduces the specimen and explains
one token change without loading the site shell. Keep the hub site-first: route HTML and
shared CSS contracts carry it, with no new design-system runtime and no new `.spw`
ontology unless a reusable contract appears.

2026-10-25: the specimen's 15 buttons (`design/index.html:392-462`: thirteen set
environment, variant, behavior and posture; two copy the expression and the link)
work only with scripts on. A reproduction without the site shell has to bring that
script along or say what each button sets. The plans disagree on what travels first:
site-starter-component-kit's first-portable wonder assumes this plan builds the
specimen's export bundle, this plan writes no bundle schema before the review, and
[ecosystem-architecture](../ecosystem-architecture/PLAN.md) S4 proposes the Spw
instrument travel first.
