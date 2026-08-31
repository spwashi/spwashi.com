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

## Metacognitive Utility

Runtime fluency should make a reader better at understanding the site, not only better at using a control panel. A mounted module should answer three questions when inspected:

- What did this script notice in the authored page?
- What did it change, defer, remember, or decline to mount?
- How can a reader or editor return to the prior state?

This is the performance-facing version of the site's hypermedia material value. The runtime turns page anatomy into a learnable substrate when timing, state, and consequence remain visible enough to form opinions without reading every source file.

Cache relation:

- Minimal and precision postures should favor low-cost warm return and clear reset paths.
- Resonant and theatrical postures may spend more animation or ornament budget, but they should explain that extra cost through diagnostics, state labels, or local copy.
- Module visuals should reveal load posture and semantic consequence, not merely decorate active scripts.

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
- Consider a small cache/posture teaching surface once `runtime-bootstrap-performance` distinguishes cold boot, warm return, restored posture, restored checkpoint, and debug/audit posture.

## Active Refinement - 2026-06-19 Conversation Audit

This plan owns the runtime/inspectability side of the broader architectural refinement audit.

Redistributed tasks:

- Keep lifecycle state names aligned with HTML and CSS contracts rather than adding parallel runtime-only vocabulary.
- When a module writes `data-spw-*`, confirm the state is either documented in an owner plan or intentionally transient.
- Prefer diagnostics that explain mounted behavior, timing, and state ownership over new visible controls.
- Coordinate with `css-state-legibility/PLAN.md` when runtime state needs hover/focus/pressed/verified/grounded styling.
- Coordinate with `semantic-html-normalization/PLAN.md` when runtime inference depends on stable landmarks, ids, or section labels.

Validation additions:

- `rg -n "dataset\\.|setAttribute\\(\\\"data-spw|data-spw-" public/js public/css **/index.html`
- `npm run check:runtime`

## Active Refinement - 2026-08-31 Orchestration View

- Keep catalog authoring flat and derive one loader-facing view with `schedule`, `gates`, `capabilities`, `effects`, `lifecycle`, and `cost`.
- Treat `subfeatures`, `triggers`, `affordances`, and `electrostatics` as orchestration inputs only when inspection and lifecycle records expose them.
- Keep `SPW_MODULE_EXPORT` authoritative for portable mount/refresh behavior; catalog schedule/effect mirrors are diagnostic and report drift after load.
- Use `texture-slice` as the working-tree proof: visible gate, stable capture affordance, reversible inline projection, and aligned catalog/export updates.
