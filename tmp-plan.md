# CSS Inspection And Property Clustering Pass

## Public Goal

Make the CSS architecture easier to inspect and safer to refactor by pairing a debug-only layer owner overlay with a stronger property clustering convention in the shared CSS files that define layout, components, handles, effects, and ornament.

This is not full CSS provenance tracking. The layer label shows the cascade-resolved value of diagnostic custom properties on selected elements. It is an inspection aid for ownership and debugging, not a complete explanation of every declaration affecting an element.

## Scope

- Add debug owner labels for cascade-layer inspection.
- Add a `layers` debug visualization mode in the source debug stylesheet.
- Standardize property clustering in touched/high-value CSS ownership blocks.
- Connect debug labels to existing `data-spw-box-model` and `data-spw-composition-flow` metadata when present.
- Document the clustering convention for future CSS edits.

## Out Of Scope

- Do not change cascade layer order in `public/css/style.css`.
- Do not introduce global layout behavior for `data-spw-composition-flow`.
- Do not convert existing composition metadata into layout ownership.
- Do not reorder entire large CSS files.
- Do not add JS, runtime dependencies, or route HTML changes unless manual QA proves the debug mode needs one explicit hook.
- Do not use `!important`.

## Files

- `public/css/tokens/core.css`
  - Register `--spw-debug-layer-color`.
  - Define the default `--spw-debug-layer-owner` and color near the registered runtime/inspection properties.
- `public/css/reset/base.css`
  - Add the reset baseline owner marker on `html, body`.
- `public/css/shell/layout.css`
  - Add shell owner markers for `header`, `main`, `footer`, and `[data-spw-layout]`.
  - Cluster the touched `main` rule if edited.
- `public/css/typography/base.css`
  - Add typography owner markers for text-bearing elements using low-specificity selectors.
- `public/css/grammar/syntax.css`
  - Add grammar owner markers for `.site-frame`, `[data-spw-form]`, `[data-spw-brace]`, and `.spw-topic`.
  - Apply clustering cleanup to the `.site-frame` rule if touched.
- `public/css/components/foundation.css`
  - Add component owner markers near the existing base component ownership section.
  - Cluster touched ownership and region-flow blocks.
- `public/css/components/cards.css`
  - Add component owner markers for `.frame-card`, `.media-card`, `.operator-card`, `.plan-card`, and related card surfaces already owned by this file.
  - Cluster touched card ownership blocks.
- `public/css/systems/substrate-ecology.css`
  - Add systems owner markers only for selectors actually styled by this file.
- `public/css/handles/operators.css`
  - Add handles owner markers for `[data-spw-operator]`, `.operator-chip`, and `.frame-sigil`.
- `public/css/handles/cognitive-handles.css`
  - Add handles owner markers for `[data-cognitive-handle]`.
- `public/css/effects/material.css`
  - Add effects owner markers for `[data-spw-metamaterial]` and material-surface selectors this file actually owns.
- `public/css/effects/wonder.css`
  - Add effects owner markers for `[data-spw-wonder-state]`, `[data-spw-charge]`, and resonance/effect selectors this file actually owns.
- `public/css/ornament/canvas-accents.css`
  - Add ornament owner markers for `[data-spw-accent]`.
- `public/css/ornament/ornament.css`
  - Add ornament owner markers only for existing ornament-owned surfaces.
- `src/styles/entries/debug.css`
  - Add the `layers` debug visualization mode.
  - Include owner, box model, and composition flow in the label where attributes exist.
- `public/css/effects/debug.css`
  - Generated output from `npm run build:css`; do not hand-edit directly.
- `public/css/README.md`
  - Document the property cluster convention and debug owner label semantics.
- `.spw/conventions/css-instruction.spw`
  - Optional, only if the clustering/debug-owner convention should remain editor-inspectable beyond this patch.

## Debug Owner Contract

Activation:

```html
<html data-spw-debug-layers="on">
```

or:

```html
<html data-spw-debug="layers">
```

Meaning:

```text
owner label = current cascade-resolved diagnostic owner marker
owner label != complete styling provenance
```

Use custom properties:

```css
:root {
  --spw-debug-layer-owner: "none";
  --spw-debug-layer-color: #888888;
}

@property --spw-debug-layer-color {
  syntax: "<color>";
  inherits: true;
  initial-value: #888888;
}
```

Do not register `--spw-debug-layer-owner` unless browser support and syntax behavior are verified for string-valued custom properties. A plain inherited custom property is sufficient for `content`.

## Property Clustering Standard

Use this order for new or touched rule blocks. Do not churn untouched blocks just to enforce the convention.

```css
.selector {
  /* Debug / inspection */
  --spw-debug-layer-owner: "components";
  --spw-debug-layer-color: #9933cc;

  /* Local tokens */
  --component-local-accent: var(--active-op-color);

  /* Layout */
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  align-items: start;
  gap: var(--component-gap);

  /* Box */
  min-width: 0;
  padding: var(--component-pad);
  border: var(--component-border);
  border-radius: var(--component-radius);

  /* Typography */
  color: var(--ink);
  font-size: var(--text-size-sm);
  line-height: 1.45;

  /* Visual */
  background: var(--component-surface);
  box-shadow: var(--component-shadow);

  /* Interaction */
  transition: border-color var(--component-transition-base);

  /* Layering / containment */
  position: relative;
  z-index: var(--component-layer-base);
  isolation: isolate;
  container-type: inline-size;
}
```

Cluster names:

- `Debug / inspection`
- `Local tokens`
- `Layout`
- `Box`
- `Typography`
- `Visual`
- `Interaction`
- `Layering / containment`
- `Motion` when animation/keyframe-related values are the main concern
- `State projection` when selectors project semantic or runtime state

Rules:

- Add one small marker selector per layer/file rather than injecting debug variables into unrelated hover, focus, animation, or media-query blocks.
- Keep debug owner markers near the ownership selectors they describe.
- Do not let diagnostic variables mix with visual behavior in high-churn state blocks.
- Use `:where(...)` for owner-marker selectors unless a file already relies on a stricter specificity pattern.
- Prefer existing semantic hooks over guessed classes.
- For route files, use page-surface selectors as the owner boundary:

```css
:where(body[data-spw-surface="home"]) {
  /* Debug / inspection */
  --spw-debug-layer-owner: "routes";
  --spw-debug-layer-color: #a67c00;
}
```

## Debug Visualization

Add a dedicated block to `src/styles/entries/debug.css` with a comment explaining the semantics:

```css
/* Layer labels show cascade-resolved diagnostic markers, not full CSS provenance. */
:where(html[data-spw-debug-layers="on"], [data-spw-debug~="layers"]) :where(
  header,
  main,
  footer,
  section,
  article,
  nav,
  aside,
  .site-frame,
  .frame-panel,
  .frame-card,
  .operator-chip,
  [data-spw-feature],
  [data-spw-box-model],
  [data-spw-composition-flow]
) {
  outline: 2px solid color-mix(in srgb, var(--spw-debug-layer-color, #888888) 72%, transparent);
  outline-offset: 3px;
  position: relative;
}

:where(html[data-spw-debug-layers="on"], [data-spw-debug~="layers"]) :where(
  header,
  main,
  footer,
  section,
  article,
  nav,
  aside,
  .site-frame,
  .frame-panel,
  .frame-card,
  .operator-chip,
  [data-spw-feature],
  [data-spw-box-model],
  [data-spw-composition-flow]
)::after {
  content:
    "owner: " var(--spw-debug-layer-owner, "none")
    " | box: " attr(data-spw-box-model)
    " | flow: " attr(data-spw-composition-flow);
}
```

Implementation should fill in the full label styling with readable font, contrast, z-index, pointer-event behavior, and reduced-motion compatibility consistent with the existing debug stylesheet.

## Implementation Sequence

1. Add token defaults and color registration in `core.css`.
2. Add owner-marker selectors across the smallest useful set of layer files.
3. Apply property clustering only to touched/high-value ownership blocks.
4. Add the `layers` debug visualization block to `src/styles/entries/debug.css`.
5. Run the CSS build so `public/css/effects/debug.css` and its source map are regenerated.
6. Update `public/css/README.md`.
7. Update `.spw/conventions/css-instruction.spw` only if the convention needs editor-facing permanence.

## Risks

- The owner label can be mistaken for true styling provenance. Mitigate with naming, README docs, and an explicit comment in `debug.css`.
- Broad marker selectors can make labels noisy. Start with semantic and component surfaces, not every element.
- Pseudo-element labels can collide with existing debug `::before` labels. Use `::after` for layer labels and verify on pages with current CSS/layout debug modes.
- Property clustering can create noisy diffs. Limit cleanup to touched blocks and major ownership blocks.
- Later cascade layers can overwrite earlier owner labels by design. This is acceptable as long as docs describe the label as cascade-resolved diagnostic ownership.

## Validation

- `npm run build:css`
- `npm run check:css`
- `npm run check:generated`
- `npm run check`
- `git diff --check`

Manual checks:

- `/`
- `/settings/`
- `/design/`
- one content-heavy route such as `/blog/` or `/recipes/`

Manual debug setup:

```html
<html data-spw-debug-layers="on">
```

Check that:

- Labels render only in debug mode.
- Labels do not block interaction.
- Existing `data-spw-debug~="css"` and `data-spw-debug~="layout"` modes still work.
- Owner labels remain readable in light and dark palettes.
- Composition metadata appears when `data-spw-box-model` or `data-spw-composition-flow` is present.
