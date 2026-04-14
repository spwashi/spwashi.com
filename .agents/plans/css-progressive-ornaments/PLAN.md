# Plan: css-progressive-ornaments

Refactor the site's CSS into explicit layers while preparing a progressive-enhancement surface for seasonal features and ornaments.

## Goal

The desired end state is a CSS architecture that keeps the GitHub Pages static deployment simple while making style ownership obvious: base page shell, Spw semantic components, runtime chrome, page surfaces, progressive enhancements, and seasonal ornaments should each have a clear home. The first implementation should be a no-behavior split that preserves the existing `<link href="/public/css/style.css?v=0.0.1">` contract. The taste note is **calm core, summoned delight**: seasonal features and ornaments may add wonder, but they must never become required for navigation, readability, accessibility, or layout stability.

## Scope

- **In scope**: plan a CSS file split, cascade ordering, route ownership, progressive enhancement rules, seasonal ornament gates, reduced-motion/fallback contracts, PWA cache considerations, and validation strategy for GitHub Pages.
- **Out of scope**: changing visual design in the first split, introducing Sass/PostCSS/Vite, adding a JavaScript season scheduler, or moving HTML pages to a generated build pipeline.

## Files

[NEW] `.agents/plans/css-progressive-ornaments/PLAN.md`
[NEW] `.agents/plans/css-progressive-ornaments/wip.spw`
[NEW] `.agents/plans/css-progressive-ornaments/css-progressive-ornaments.spw`
[MOD] `public/css/style.css` - become the stable import entrypoint during the split
[NEW?] `public/css/tokens.css` - design tokens, operator colors, timing/disclosure constants, seasonal token hooks
[NEW?] `public/css/base.css` - reset, typography, page shell, header/footer, generic media defaults
[NEW?] `public/css/spw-components.css` - frames, sigils, cards, panels, brace/block forms, operator tables/cards
[NEW?] `public/css/spw-runtime.css` - brace walls, navigator, console, metrics, PWA/update chrome
[NEW?] `public/css/surfaces-software.css` - software route, operator atlas, codeblock surfaces
[NEW?] `public/css/surfaces-pretext.css` - Pretext lab and later whimsy/physics surfaces
[NEW?] `public/css/surfaces-play.css` - RPG/play route-specific rules if needed
[NEW?] `public/css/enhancements.css` - opt-in progressive enhancement rules keyed by `data-spw-features`
[NEW?] `public/css/ornaments.css` - common ornament host rules and safety constraints
[NEW?] `public/css/seasons/*.css` - optional seasonal palettes, motifs, and small ornaments
[MOD?] `index.html` - only if seasonal or enhancement CSS is loaded through extra links rather than imported by `style.css`
[MOD?] `topics/software/index.html` - route-level feature flags if seasonal or enhancement affordances need explicit opt-in
[MOD?] `topics/software/pretext/index.html` - route-level feature flags for Pretext whimsy CSS
[MOD?] `public/js/pwa-update-handler.js` - only if progressive CSS is lazy-loaded later
[MOD] `sw.js` - cache split CSS files and bump app version after the split
[MOD] `manifest.webmanifest` - bump version when CSS asset graph changes
[MOD?] `.spw/conventions/site-semantics.spw` - record CSS layers, ornament safety, and progressive enhancement invariants

Craft guard:
- `style.css` must remain the only linked stylesheet until a later decision changes the page contract.
- No split file should exceed 600 lines; target under 400 lines where practical.
- Seasonal CSS may alter tokens, accents, decorative backgrounds, and small ornaments; it must not own core layout, navigation, focus visibility, or content availability.
- Progressive enhancements must be monotonic: when unsupported, disabled, offline, or reduced-motion, the page remains useful and structurally equivalent.
- Every motion/effect constant should move toward named timing/disclosure/stability tokens instead of anonymous milliseconds or curves.

## Commits

1. `#[css] - capture CSS split and progressive ornament plan`
2. `&[css] - split style.css into stable layered imports without visual changes`
3. `.[semantics] - formalize progressive enhancement and ornament safety contracts`
4. `&[ornaments] - add opt-in seasonal ornament host and one quiet seasonal proof`
5. `![css] - verify visual parity, reduced motion, offline cache, and mobile containment`

Fuzz strategy:
- Explore loop: `fuzz:explore --target=css-progressive-ornaments`
- Stabilize loop: `fuzz:stabilize --target=css-progressive-ornaments`
- Ship gate: `fuzz:ship --target=css-progressive-ornaments`

## Agentic Hygiene

- Rebase target: `main@6c9b7a41fa6aeaddba76d24fa0f95bc14ce705d9`
- Rebase cadence: before commit 1, before any visual split commit, before merge
- Hygiene split: none

## Dependencies

- `mobile-runtime-foundation` - region ownership, progressive inspect/invoke semantics, reduced-motion expectations, and no-dead-end interaction rules.
- `svg-surface-integration` - future SVG widgets and illustrations need a CSS host layer rather than ad hoc page styles.
- `pretext-whimsy-lab` - physics/whimsy CSS should land in a bounded enhancement/surface layer.
- `spw-operator-pages` - operator atlas CSS should migrate into the software surface/component layer during the split.

## Failure Modes

- **Hard**: the split changes visual behavior, breaks GitHub Pages paths, or leaves pages referencing missing CSS.
- **Hard**: seasonal rules become required for layout, hiding content or changing navigation when ornaments are absent.
- **Hard**: progressive enhancement CSS creates pointer-only or motion-only affordances with no touch, keyboard, or reduced-motion equivalent.
- **Hard**: `style.css` imports are not cached by the service worker, causing installed/offline pages to lose styling.
- **Soft**: files are split by chronology instead of responsibility, so the refactor preserves the same ambiguity in more files.
- **Soft**: ornament naming is cute but not operational, making future seasonal work hard to constrain.
- **Soft**: cascade layers are introduced before the team has verified browser support and fallback behavior for the site audience.

## Validation

- **Hypotheses**: a CSS split by responsibility will reduce future edit risk; keeping `style.css` as the import entrypoint will preserve GitHub Pages simplicity; ornament layers can add seasonal wonder without contaminating layout; progressive enhancement rules will keep experiments reversible.
- **Negative controls**: existing HTML links stay unchanged, route rendering stays visually equivalent after the no-behavior split, and reduced-motion users see no new motion burden.
- **Demo sequence**: load home, software, operator atlas, Pretext, play, and offline pages; compare before/after screenshots at mobile and desktop widths; disable cache/network after first load; enable reduced motion; then toggle a seasonal body/data feature and confirm only ornamental layer changes.

## Spw Artifact

`.agents/plans/css-progressive-ornaments/css-progressive-ornaments.spw`
