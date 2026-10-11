# Data Attribute and CSS Token Refinement Pass

**Status 2026-10-10.** Items 1 and 2 have landed. All ten named bedrock tokens are defined: nine in `tokens/core.css`, plus `--ornament-radius-pill` in `tokens/flourish-defaults.css`. The typed `attr()` bridges sit at `tokens/dimensions.css:436-441`. Item 3, fallback hygiene, is unverified and has no sensor: `audit:css-custom-properties` checks only self-references and periodic root writes. If item 3 is wanted, its slice is a report-only check for `var()` references with no definition and no fallback in the five files it names. The plan stands as the bedrock rule, and it now also holds the JS-side write rule (below).

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

Landed: `brace-gestures.js:175-179` and `:643-645` skip the routing keys unless the opt-in is set (`:608`), and the only direct write is the user swap at `:750`. Writes go through `kernel/dom-contracts.js` (`writeDatasetValue`, `writeDatasetValueIfMissing` and `writeStyleValue`), which do nothing when the value is unchanged. Custom-property rule: a property family a module writes for the first time joins `RUNTIME_PROPERTY_ALLOWANCES` with an owner, or its file joins `DYNAMIC_STYLE_WRITE_FILES`, in the same commit. The sensor is `scripts/ts/style-property-contract.mts`, run by `npm run check:runtime`. Still open: whether the `routes/surfaces/design.css` alias consolidation landed is unverified.

## Validation

- `npm run check:css`
- `npm run catalog`
- `npm run check:local`
- `npm run ecology`
