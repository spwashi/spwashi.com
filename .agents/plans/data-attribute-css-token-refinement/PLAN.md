# Data Attribute and CSS Token Refinement Pass

## Public Goal

Establish clear bedrock anchors for shared CSS custom properties across the site, eliminate unanchored variable references, bridge authored thermodynamic and accent-strength HTML data attributes into active CSS properties, and preserve traceability across the design catalog and Spw conventions.

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

## Runtime and Cascade Rules

- **Bedrock first**: All shared tokens belong in `tokens/` layer (`core.css`, `dimensions.css`, `flourish-defaults.css`) before component or route usage.
- **Attr bridge**: `[data-spw-tangibility]` sets `--spw-tangibility` from the authored number when the browser can type `attr()`.
- **Backward compatibility**: All existing classes, structures, and cascade priorities remain intact.

## Validation

- `npm run check:css`
- `npm run catalog`
- `npm run check:local`
- `npm run ecology`
