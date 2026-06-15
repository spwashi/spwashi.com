# Plan: designer-conversation-canvas

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
- `public/js/modules/typography-measurement-preview.js` — settings live preview
- `public/js/runtime/frame-metrics.js` — bus-aware frame seams
- `public/js/runtime/composition-box-model.js` — reads pretext signals into box snapshots
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