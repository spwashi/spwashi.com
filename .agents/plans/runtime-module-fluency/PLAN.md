# Runtime Module Fluency

## Public Goal

Make the site behave like a learnable visual instrument: calm at rest, expressive when practiced, and inspectable when a reader wants to understand which scripts changed behavior or visuals. The complexity should feel closer to a French horn than a random control panel: stable ground, repeated fingerings, and visually legible resonance.

## Scope

- `public/js/site.js`: expose runtime module definitions, mount reasons, timing policy, audit records, and console controls.
- `public/css/components/foundation.css`: translate module dimensions into subtle rails and handle treatments when module visuals are enabled.
- `src/styles/entries/debug.css`: make debug labels show module status and evaluated dimensions.
- `settings/index.html`: add query recipes that let readers enter reader, builder, inspector, and lab modes with meaningful diagnostics.
- `.spw/conventions/query-disposition.spw` and `.spw/conventions/site-semantics.spw`: keep query tuning, module lifecycle, and semantic motion inspectable beyond one patch.

## Lifecycle Tropes

- Page lifecycle: `native -> booting -> interactive -> hydrated -> enhanced -> settled`.
- Component lifecycle: `authored -> addressed -> loaded -> mounted -> ready -> resonant`.
- Module lifecycle: `defined -> scheduled -> loading -> mounted | failed | skipped`.
- Practice lifecycle: `read -> notice -> tune -> compare -> narrate -> reuse`.
- Tuning posture: `minimal -> precise -> resonant -> theatrical`, where `minimal` and `precise` should stay snappy and low-theatrics.

## Semantic Dimensions

- `semantic-density`: the module helps a component carry more labeled meaning without making the default reading path heavier.
- `visual-model`: the module affects surfaces that can become drawable, screenshot-worthy, or motif-generating.
- `spacing-semantics`: the module changes how space, folding, rails, or component containment communicate meaning.
- `routing`, `state`, `interaction`, and `surface`: the module affects navigation, browser memory, direct interaction, or route-specific behavior.

## Tuning Contract

- Minimal mode: native CSS and default timing; use this for reading and performance-sensitive checks.
- Precision mode: audit logs, clear data attributes, and minimal visual marks; use this when debugging or teaching what mounted.
- Resonant mode: rails, handles, and semantic echoes become visible; use this for screenshots and visual fluency practice.
- Theatrical mode: motion, palette, and screenshot-friendly staging can be stronger; keep this opt-in and reduced-motion safe.

## Constraints

- Static HTML remains the source of readable truth.
- Query parameters may tune behavior but should leave visible data attributes, console records, or CSS variables behind.
- Essential navigation and copy must not depend on JavaScript.
- Debug and module-visual modes should reveal complexity without becoming the default aesthetic.

## Validation

- `node --check public/js/site.js`
- `git diff --check`
- `npm run check`
- Spot-check settings query links and console helpers:
  - `window.__SPW_SITE__.listModules()`
  - `window.__SPW_SITE__.snapshotModules()`
  - `window.__SPW_SITE__.auditModules()`
  - `window.__SPW_SITE__.mountModule("topic-discovery")`

## Follow-Up

- Add a settings UI control for module visuals and audit mode if the query recipes prove useful.
- Let templates emit component lifecycle attributes consistently when route generation matures.
- Consider a dedicated article or design page that teaches the lifecycle tropes with examples for narrators, illustrators, and research-oriented RPG Wednesday collaborators.
