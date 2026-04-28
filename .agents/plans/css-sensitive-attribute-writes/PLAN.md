# CSS-Sensitive Attribute Writes

## Public Goal

Keep interaction state visually responsive without letting runtime discovery casually rewrite author-owned semantic attributes that CSS uses for route, context, wonder, and operator styling.

## Scope

- `public/js/brace-gestures.js`
  - Treat gesture/charge/pin attributes as transient visual state.
  - Treat `data-spw-resolved-*` attributes as optional inspection hints.
  - Avoid rewriting `data-spw-context`, `data-spw-wonder`, or `data-spw-operator` except for explicit user actions or future explicit opt-in.
- `public/js/spw-dom-contracts.js`
  - Own the shared DOM write helpers for dataset and CSS custom-property mutation.
  - Make writes idempotent so repeated state sync does not force avoidable style work.
- Existing semantic runtimes that already import DOM contracts
  - Use the shared helpers for page metadata, component semantics, core site region state, and contextual UI module state.
- `public/css/design-surface.css`
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
- `node --check public/js/brace-gestures.js`
- `npm run check`
- `npm run build`
