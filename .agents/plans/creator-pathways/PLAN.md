# Creator pathways

## Public Goal

Let a writer move from a manuscript or notes to a credible public series home, with a small taste pass and a clear next step, while math practice beds remain learning tools rather than sales funnels.

## Non-Goals & Boundaries

- Do not make a new product taxonomy, pricing calculator, or campaign layer.
- Do not make a lab state persist beyond the current document, or make it a conversion metric.
- Do not require Spw, `.scene`, or Dregg participation to begin creator work.
- Do not change canonical operator meanings or CSS layer order.

## Integration Contract

- Focus: writer/worldbuilder, bridged to engineer/toolmaker.
- Operation/fixity: `align` / stable for the route and runtime contract; tending for offer copy.
- Elements: wood primary (a serial can grow by chapters), metal secondary (one inspectable next-step state).
- A `data-spw-semantic-expression` capsule is an authored projection. A math lab may mark its own next-step host `data-spw-channel="live"` for the current document only; it must not write storage, select a priced SKU, or transmit a second event through the site bus.

## Seams & Minimal Touch Files

- Routes: `/services/creator/`, `/services/ecosystem/`, `/services/`, `/topics/math/combinatorics/`, `/about/domains/lore.land/`, and the home entry card.
- Shared runtime: `public/js/modules/math/diagrams.js`, `public/js/runtime/expression-resonance.js`.
- Shared CSS: `public/css/systems/expression-resonance.css`.
- Durable surface: `.spw/surfaces/product-lines.spw` and `.spw/conventions/semantic-expression-consequence.spw`.

## Validation Steps

1. `node --check public/js/modules/math/diagrams.js`
2. Inspect the two rendered lab SVGs: their labelled-by IDs resolve after every control change.
3. `npm run manifest && npm run check:local`
4. Verify the path: home → creator series home → taste → contact; separately, combinatorics lab → an explanatory practice or learning route, never a price point.
