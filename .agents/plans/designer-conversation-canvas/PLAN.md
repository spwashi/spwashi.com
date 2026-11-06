# Plan: designer-conversation-canvas

**Status 2026-11-06.** Unchanged since 2026-10-10. Landed: the measurement bus (1621ac6c), the settings typography preview, frame metrics and the `/design/#conversation-canvas` frame; no browser has revalidated them since 2026-09-20. Since then the plan's files moved only by a header (cf793f47) and one design-hub sentence (90ad0ba1); b5d9f407 took eight unread controls off `/settings/` and left the preview and the designer-handoff card. Holds design-hub's success test (Absorbed, below). Next slice: D1, one real designer reviews the `#component-ecology-specimens` specimen, and the bundle takes the shape that review asks for. Gate: the creator names the reviewer (`wonder_designer_canvas_first_reviewer`); no bundle schema before then.

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

- **D1. One reviewer, one specimen.** Hand the named reviewer `/design/#component-ecology-specimens`: its link, the tokens it cites, and its measurements, with the author's observations labeled apart from the telemetry. Touches nothing until the review says what to carry. Gate: the creator names the reviewer. Verify: the reviewer restates one token change in their own file. The consumer is a person, not the starter bundling pilot, which is texture-slice (`site-starter-component-kit/BUNDLING.md`) and does not list this specimen.
- **D2 (proposed). The specimen read with scripts off.** The readout already prints the state as Spw, `component-specimen[soft]{calm.rest.split}` (`data-design-ecology-readout="expression"`), and its four slots are the four button groups. With scripts off the 13 set buttons answer nothing. Proposed: under the scripts-off hook (`html:not([data-spw-runtime-stage])`), the buttons step back as the lens switches do and each slot names its choices in plain words beside the line (environment: calm, social or inspect), so a reviewer without the shell reads what each button would set. Touches `design/index.html` and `public/css/routes/surfaces/design.css`. Gate: the creator's look in a browser. Verify: `npm run audit:page-structure` counts 13 fewer script-only buttons on `/design/`.
- **D3. The export bundle.** Specimen URL, token list and telemetry JSON, shaped by D1 and reproduced by a second author before any schema is generalized.
- Retired 2026-11-06: a state-inspector panel for bus snapshots and view-transition handoffs between the settings preview and the specimens. Neither has a reader asking for it, and the transitions are a sensation call with no demo.

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
