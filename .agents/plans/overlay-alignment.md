# Plan - Overlay Architectural Alignment

## Objective
Refine the overlay CSS logic and selector architecture to improve aesthetic consistency, reduce selector redundancy, and ensure "physics-aware" rendering across the site.

## Proposed Changes

### 1. Refine Overlay Primitives (public/css/spw-tokens.css)
- Introduce configurable overlay direction, opacity, and color-mix variables.
- Standardize the "shell overlay" into a family of gradient primitives.

### 2. Semantic Overlay Registry (public/css/spw-material.css)
- Move away from class-specific pseudo-elements (e.g., `.frame-card-media::after`).
- Introduce `[data-spw-overlay]` as a first-class semantic attribute.
- Support values like `fade-bottom`, `fade-top`, `scrim-dark`, and `material-glow`.
- Use `:where()` to keep specificity low and allow local overrides.

### 3. Progressive "Auto-Overlay" (public/css/spw-surfaces.css)
- Use `:has()` to automatically apply appropriate overlays to containers based on their content (e.g., any container holding an `img` gets the bottom-fade overlay by default).
- Refactor `.frame-card-media` to use these new universal patterns.

### 4. Logic Review
- Audit `color-mix` usage to ensure overlays remain readable in both Light and Dark modes.
- Coordinate with `componentDensity` settings to scale overlay opacity.

## Verification
- Visual audit of `/design/materials/` and `/design/components/`.
- Check dark mode resonance on media cards.
- Ensure no regressions in mobile navigation overlays.
