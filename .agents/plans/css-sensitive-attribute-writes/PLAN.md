# CSS-Sensitive Attribute Writes

## Public Goal

Keep interaction state visually responsive without letting runtime discovery casually rewrite author-owned semantic attributes that CSS uses for route, context, wonder, and operator styling.

## Scope

- `public/js/runtime/interaction/brace-gestures.js`
  - Treat gesture/charge/pin attributes as transient visual state.
  - Treat `data-spw-resolved-*` attributes as optional inspection hints.
  - Avoid rewriting `data-spw-context`, `data-spw-wonder`, or `data-spw-operator` except for explicit user actions or future explicit opt-in.
- `public/js/kernel/dom-contracts.js`
  - Own the shared DOM write helpers for dataset and CSS custom-property mutation.
  - Make writes idempotent so repeated state sync does not force avoidable style work.
- Existing semantic runtimes that already import DOM contracts
  - Use the shared helpers for page metadata, component semantics, core site region state, and contextual UI module state.
- `public/css/routes/surfaces/design.css` (was `design-surface.css`)
  - Consolidate route-scoped selectors.
  - Make design-surface paper, panel, link, shell, grammar, website, and base aliases explicit.

## Runtime Rule

CSS-observed attributes fall into three groups:

- Author-owned routing attributes: `data-spw-context`, `data-spw-wonder`, `data-spw-operator`.
- Transient visual state: `data-spw-gesture`, `data-spw-charge`, `data-spw-field-wonder`, `data-spw-pinned`, `data-spw-latched`.
- Inspection hints: `data-spw-resolved-context`, `data-spw-resolved-wonder`, `data-spw-resolved-operator`, `data-spw-resolved-affordance`.

Runtime discovery should prefer inspection hints. It should only change author-owned routing attributes when the interaction itself is the point, such as an operator swap, or when a future explicit opt-in exists.

## Shared Writer Contract

- `writeDatasetValue(el, key, value)` replaces, removes, or no-ops when unchanged.
- `writeDatasetValueIfMissing(el, key, value)` fills authored gaps without overwriting existing HTML.
- `writeStyleValue(el, property, value)` replaces, removes, or no-ops when unchanged.

These helpers should be preferred for runtime attributes that CSS observes.

## Validation

- `git diff --check`
- `node --check public/js/runtime/interaction/brace-gestures.js`
- `npm run check`
- `npm run build`

## Custom-property writes — 2026-09-27

The attribute rule above has a token twin, and it already has a sensor. `scripts/ts/style-property-contract.mts` scans every `style.setProperty` in `public/js` and `public/ts` against the custom properties CSS defines: a property a runtime file writes must either be defined in CSS, belong to a runtime-owned family in `RUNTIME_PROPERTY_ALLOWANCES` (`--spw-runtime-*`, `--spw-preset-*`, `--pretext-*`, `--spw-lens-*`, `--spw-section-*`, `--design-ecology-*`, and a short list of single readouts), or come from a file named in `DYNAMIC_STYLE_WRITE_FILES` (eight files that build property names at runtime: canvas accents, dom-contracts, instrumentation, kernel/shared, site-settings-engine, design experiments, region menu, image provenance). `npm run check:runtime` runs it. `npm run audit:css-custom-properties` adds the cascade side: no periodic root writes, and self-referencing declarations held to a baseline of 178.

Measured today: 40 runtime files write 115 distinct custom properties. The heaviest writers are `semantic/pretext-presets.js` (24 calls, all under `--spw-preset-`), `media/image-metaphysics.js` (16), `modules/design/experiments.js` (10), `semantic/pretext-physics.js` (8), and `runtime/memory/wonder-memory.js` (7). Readers of computed properties are fewer and concentrated: `wonder-memory.js`, `media/canvas-accents.js`, `semantic/pretext-measurement-bus.js`, `runtime/orchestration/loader.js`.

Rule, stated once: a new property family a module writes joins the allowance list with an owner, or the module joins the dynamic-write list, in the same commit as the first write. Everything else is the shared-writer contract above through `writeStyleValue`. `data-attribute-css-token-refinement` owns the CSS-side bedrock those writes land on; this plan owns the JS side.
