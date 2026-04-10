# Plan: svg-surface-integration

Integrate SVG widgets, illustrations, and interactive components into the site's design ecosystem without adding build tooling or breaking the hand-authored page structure.

## Goal

The desired end state is a site that can use SVG as a first-class surface language: small widgets, inspectable illustrations, and deeper interactive components can share one mobile-first host contract instead of each becoming a special case. The immediate task is to define that ecosystem before implementation: when SVG should stay external and static, when it should become inline and addressable, how it participates in brace/block semantics, how it pivots into deeper structure on touch, and how future Spw-backed components and pages can project through the same substrate. The taste note is **diagrammatic warmth + inspectable restraint**: the site should gain clearer structure and a little more wonder, not more ornamental motion.

## Scope

- **In scope**: define a taxonomy for SVG illustrations, widgets, and interactive components; choose an asset strategy for inline versus external SVG; predict runtime and CSS seams for mobile-first containment and inspectability; define host contracts for SVG-backed surfaces; map how future Spw-backed components/pages can author through this system.
- **Out of scope**: shipping a full widget library in this pass, introducing a build pipeline or icon compiler, converting every existing raster asset, or treating SVG as a replacement for all HTML layout.

## Files

[NEW] .agents/plans/svg-surface-integration/PLAN.md
[NEW] .agents/plans/svg-surface-integration/wip.spw
[NEW] .agents/plans/svg-surface-integration/svg-surface-integration.spw
[MOD?] .spw/site.spw - record site-level decisions and resolve open questions about SVG-backed surfaces
[MOD?] .spw/conventions/site-semantics.spw - extend component grammar with illustration/widget/component host rules
[MOD?] index.html - integrate a first inspectable illustration or SVG-backed surface on the home route
[MOD?] about/index.html - integrate a relational illustration or diagram surface for the land cluster / domain material
[MOD?] topics/software/index.html - add SVG-backed widgets or projection demos near interactive codeblocks and grammar surfaces
[MOD?] topics/software/pretext/index.html - bridge layout-driven SVG projections into the Pretext lab when warranted
[MOD?] public/css/style.css - add SVG host sizing, touch semantics, reduced-motion rules, and illustration/widget containment
[MOD?] public/js/site.js - runtime wiring for first-class SVG hosts if page-level orchestration is needed
[MOD?] public/js/spw-shared.js - shared helpers for SVG host identity, region ownership, and register reads
[MOD?] public/js/spw-component-semantics.js - annotate inline SVG targets and normalize inspect/invoke semantics for them
[MOD?] public/js/spw-console.js - inspect surfaces for SVG host and node state if projection needs to stay honest
[NEW?] public/js/spw-svg-runtime.js - shared host/runtime layer for inline SVG surfaces and node targeting
[NEW?] public/js/spw-svg-widgets.js - reusable bounded widgets built on the host contract
[NEW?] public/js/spw-svg-illustrations.js - optional illustration hydration, labeling, or layer toggles
[NEW?] public/images/illustrations/*.svg - authored SVG assets for static or semi-static surfaces

Craft guard:
- Keep `spw-svg-runtime.js` single-purpose and under 400 lines if possible; do not let it absorb all page orchestration.
- Use inline SVG only when nodes need inspect, invoke, or live CSS/runtime control; keep static art external.
- Maintain viewBox discipline, stable node ids, and CSS-token-driven colors instead of scattering hard-coded fills.
- One SVG host should have one clear interaction owner and one clear pivot path on mobile.
- Respect reduced motion and minimum touch targets; no pointer-only hit regions.

## Commits

1. `#[svg] - capture the SVG surface integration plan and distilled taxonomy`
2. `.[svg] - formalize SVG host semantics, authoring rules, and brace-aware interaction contracts`
3. `&[svg] - add shared SVG host runtime and containment primitives`
4. `&[widgets] - integrate first SVG widgets and inspectable illustrations into site surfaces`
5. `![svg] - verify touch, keyboard, reduced-motion, and fallback behavior`

Fuzz strategy:
- Explore loop: `fuzz:explore --target=svg-surface-integration`
- Stabilize loop: `fuzz:stabilize --target=svg-surface-integration`
- Ship gate: `fuzz:ship --target=svg-surface-integration`

## Agentic Hygiene

- Rebase target: `main@d4e504661006b947d6f60591814b8f21020bed96`
- Rebase cadence: before commit 1, before merge
- Hygiene split: none

## Dependencies

`mobile-runtime-foundation` - shared doctrine for regions, portable inspect/invoke semantics, registers, prefix/postfix symmetry, and brace pivots that SVG hosts should reuse rather than bypass.

## Failure Modes

- **Hard**: SVG enters the site as dead art only, so illustrations, widgets, and interactive components each invent their own semantics and host rules.
- **Hard**: inline SVG nodes become pointer-only targets, breaking touch and keyboard inspectability.
- **Hard**: interactive SVG surfaces write private DOM state instead of registers, so console/navigator or future mirrors cannot describe them honestly.
- **Soft**: SVG replaces ordinary HTML where plain markup would have been simpler, making authoring and accessibility worse.
- **Soft**: illustration and widget layers become visually busy, so wonder collapses into ornament.
- **Non-negotiable**: the site must remain usable and legible when SVG scripts fail, motion is reduced, or touch is the primary input mode.

## Validation

- **Hypotheses**: a shared SVG host contract will let illustrations, widgets, and interactive components evolve without splintering the runtime; inline-versus-external rules will keep authoring tractable; mobile-first inspect/invoke semantics will make SVG surfaces teachable rather than gimmicky.
- **Negative controls**: route structure, existing hand-authored HTML, and the site's calm default state remain intact.
- **Demo sequence**: open a page with an SVG host, inspect a labeled node on touch and keyboard, invoke a local pivot without losing orientation, confirm console or local inspect surfaces can name the active node, and verify the same surface still degrades to a readable static state.

## Spw Artifact

`.agents/plans/svg-surface-integration/svg-surface-integration.spw`
