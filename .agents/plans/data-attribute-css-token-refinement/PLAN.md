# Data Attribute and CSS Token Refinement Pass

**Status 2026-11-06.** Items 1 and 2 have landed and still hold. All eleven named bedrock tokens are defined, ten in `tokens/core.css` and `--ornament-radius-pill` in `tokens/flourish-defaults.css`. The typed `attr()` bridges are the `@supports` block at `tokens/dimensions.css:436-449`. Since 2026-10-10 the token files changed only in b8339b22 (unused commit tokens removed) and 0206fb41 (three dark operator colours); neither touches the bedrock. Item 3, fallback hygiene, is the creator's call (`index.spw#wonder_token_fallback_hygiene`). As first written, its report would be empty: on 2026-10-27 every reference without a fallback in its five files named a defined token. A sharper form finds real drift and is drafted below. The absorbed design.css alias question is half answered: five of the seven alias families sit explicit at the top of `routes/surfaces/design.css`. The plan stands as the bedrock rule and the JS-side write rule, and is close to an archive candidate once item 3 is decided.

**Related:** [portable-css](../archive/portable-css/PLAN.md) · [core-css-spend-cut](../core-css-spend-cut/PLAN.md). **Absorbed 2026-10-10:** [css-sensitive-attribute-writes](../archive/css-sensitive-attribute-writes/PLAN.md).

## Public Goal

Establish clear bedrock anchors for shared CSS custom properties across the site, eliminate unanchored variable references, bridge authored thermodynamic and accent-strength HTML data attributes into active CSS properties, and preserve traceability across the design catalog and Spw conventions.

Tokens that travel to other hosts are specified in `.spw/caches/portable-css-2026-09.spw`. That sheet reuses these attributes. It does not add a family.

## Scope

1. **Token Bedrock (`public/css/tokens/core.css`, `public/css/tokens/flourish-defaults.css`, `public/css/tokens/dimensions.css`)**:
   - Define canonical `:root` values for `--ink-muted`, `--line-dim`, `--border-soft`, `--card-border`, `--boundary-rail-width`, `--boundary-rail-width-strong`, `--overlay-gradient-fade-bottom`, `--page-bg`, `--danger`, `--ease-smooth`, `--ornament-radius-pill`, and standard alias primitives.
   - Supply matching dark mode and theme pack adaptations.

2. **Data Attribute Bridges (`public/css/tokens/dimensions.css`, `.spw/conventions/data-spw-attribute-governance.spw`)**:
   - Map authored thermodynamic continuum attributes (`data-spw-tangibility`, `data-spw-viscosity`, `data-spw-coherence`) onto corresponding CSS custom properties (`--spw-tangibility`, `--spw-viscosity`, `--spw-coherence`).
   - Map authored `data-spw-accent-strength` into `--spw-accent-strength`.

3. **Fallback Hygiene Across Grammar and Systems**:
   - Ensure `public/css/grammar/syntax.css`, `public/css/components/foundation.css`, `public/css/systems/pretext-physics.css`, `public/css/effects/metaphysical-paper.css`, and `src/styles/entries/design-experiments.css` have robust local fallbacks.
   - Sharper form, measured 2026-11-06 outside `bundles/`. The drift is in tokens read *only* through fallbacks, not in missing fallbacks. 89 custom properties are read with a fallback and never defined in CSS, HTML or `public/js`, and 11 of the 80 whose fallbacks parse disagree between call sites. `--shape-panel` resolves to 1rem, 0.75rem or 0.82rem depending on where it is read, and `--matte-surface` to four different surfaces. Slice, if wanted: a report-only `audit:css-custom-properties` section that lists fallback-only tokens with more than one fallback value. Ungated, and not a `check:local` gate. The shape tokens among them are `component-region-personality`'s to define ("One role, many shapes"); this plan's bedrock rule says where they land (`tokens/core.css`).

## Theory

- **One phenomenon, one name.** `--ink`, `--line`, `--shadow-base` are canonical. `--text-color`, `--border-soft`, `--font-mono` exist only because the corpus already speaks those dialects.
- **The attribute is the number.** Thermodynamics project with typed `attr()`, not a catalog of float selectors.
- **Aliases do not invent bounce.** New easing names must map to the motion ladder the site already chose.
- Owner rail: `css-architecture-readability`. Do not grow a parallel token ontology.
- JS writes into these tokens are governed by `css-sensitive-attribute-writes` (custom-property section, 2026-09-27) and enforced by `scripts/ts/style-property-contract.mts`.

## Runtime and Cascade Rules

- **Bedrock first**: All shared tokens belong in `tokens/` layer (`core.css`, `dimensions.css`, `flourish-defaults.css`) before component or route usage. If `css-cascade-stratification` splits `tokens/` into `registry` (`@property`), `scales`, and `aliases`, bedrock is the lowest of the three and this rule stands.
- **Attr bridge**: `[data-spw-tangibility]` sets `--spw-tangibility` from the authored number when the browser can type `attr()`.
- **Backward compatibility**: All existing classes, structures, and cascade priorities remain intact.

## Absorbed 2026-10-10 — css-sensitive-attribute-writes

Plan: [css-sensitive-attribute-writes](../archive/css-sensitive-attribute-writes/PLAN.md). Attributes that CSS observes fall into three groups. Runtime discovery writes only the third.

- **Author-owned routing:** `data-spw-context`, `data-spw-wonder` and `data-spw-operator`. Runtime may change these only on an explicit user action (an operator swap) or behind an explicit opt-in.
- **Transient visual state:** `data-spw-gesture`, `-charge`, `-field-wonder`, `-pinned` and `-latched`.
- **Inspection hints:** `data-spw-resolved-context`, `-wonder`, `-operator` and `-affordance`.

Landed: in `runtime/interaction/brace-gestures.js`, `syncDiscoveredMarkup` skips every key in `CSS_OBSERVED_SEMANTIC_DATA_KEYS` (`:175`) unless `isCssObservedMutationEnabled` (`:608`) says the opt-in is set, and the only direct write is the user swap of `spwOperator` (`:750`). Writes go through `kernel/dom-contracts.js` (`writeDatasetValue`, `writeDatasetValueIfMissing` and `writeStyleValue`), which do nothing when the value is unchanged. Custom-property rule: a property family a module writes for the first time joins `RUNTIME_PROPERTY_ALLOWANCES` with an owner, or its file joins `DYNAMIC_STYLE_WRITE_FILES`, in the same commit. The sensor is `scripts/ts/style-property-contract.mts`, run by `npm run check:runtime`. Design alias consolidation, re-read 2026-11-06: the `--design-surface-*` block at the top of `routes/surfaces/design.css` (`:11` on) makes the paper, panel, link, shell and base aliases explicit; grammar and website have no alias there. Writing those two is the only part left, and it is small and ungated.

## Validation

- `npm run check:css`
- `npm run catalog`
- `npm run check:local`
- `npm run ecology`
