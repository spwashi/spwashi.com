# Plan: mobile-runtime-foundation

Define a mobile-first interaction/runtime foundation for page regions, portable inspect/invoke semantics, register behavior, and future block/script UI.

## Goal

The desired end state is a site runtime that treats mobile and coarse-pointer use as the primary case rather than a degraded desktop fallback. The immediate task is not to ship new chrome, but to formalize the implementation surface: page regions with ownership, portable interaction semantics that do not depend on hover, inspectable registers that back navigator/console projections, and a clean preparation layer for future Spw blocks and scripts as UI. The taste note is **clarity + containment**: preserve the site's calm surface while making its deeper machinery easier to reason about, inspect, and extend.

## Scope

- **In scope**: define a page-region model, portable interaction semantics, shared register/runtime boundaries, inspectability rules, and future-facing block/script host contracts; predict the runtime files and markup surfaces likely to change when implementation begins.
- **Out of scope**: shipping the full spell system now, running the Spw parser in the browser, redesigning page aesthetics, or implementing block/script execution in this pass.

## Files

[NEW] .agents/plans/mobile-runtime-foundation/PLAN.md
[NEW] .agents/plans/mobile-runtime-foundation/wip.spw
[NEW] .agents/plans/mobile-runtime-foundation/mobile-runtime-foundation.spw
[MOD?] .spw/site.spw - resolve site-level open questions once the runtime model is settled
[MOD?] .spw/conventions/site-semantics.spw - extend the semantic contract with regions, portable intents, and register invariants
[MOD?] index.html - annotate region ownership and primary mobile surfaces
[MOD?] about/index.html - annotate region ownership and primary mobile surfaces
[MOD?] contact/index.html - annotate region ownership and primary mobile surfaces
[MOD?] play/index.html - annotate region ownership and primary mobile surfaces
[MOD?] topics/software/index.html - annotate region ownership and higher-voltage runtime affordances
[MOD?] topics/software/pretext/index.html - annotate region ownership and deeper lab affordances
[MOD?] public/css/style.css - shift interaction styling toward coarse-pointer-first semantics and region containment
[MOD?] public/js/spw-shared.js - shared helpers for region identity, interaction intent, and register reads
[MOD?] public/js/site.js - runtime wiring for page regions, active region state, and global interaction arbitration
[MOD?] public/js/spw-component-semantics.js - selection-to-intent mapping and inspectability hooks
[MOD?] public/js/frame-navigator.js - projection of shared registers instead of local-only route inventory
[MOD?] public/js/spw-console.js - projection of shared registers instead of local-only action history
[NEW?] public/js/spw-register-runtime.js - shared register store and inspectable runtime surface
[NEW?] public/js/spw-interaction-runtime.js - portable inspect/invoke semantics across pointer, touch, and keyboard
[NEW?] public/js/spw-block-runtime.js - future host contract for declarative blocks and bound scripts

Craft guard:
- Keep each runtime file single-purpose; do not let `site.js` absorb region, register, and spell ownership all at once.
- Treat hover as an enhancement, not a required path; every revealed affordance must have a coarse-pointer and keyboard route.
- Navigator and console should become projections over shared state, not competing state containers.

## Commits

1. `#[mobile-runtime] - capture the planning artifacts and distilled semantics note`
2. `.[semantics] - formalize page regions, portable interaction intent, and register invariants`
3. `&[runtime] - extract shared interaction and register runtime foundations from page-local behavior`
4. `&[blocks] - add host contracts for declarative blocks, scripts, and inspect surfaces`
5. `![mobile-runtime] - verify coarse-pointer behavior, inspectability, and region containment`

Fuzz strategy:
- Explore loop: `fuzz:explore --target=mobile-runtime`
- Stabilize loop: `fuzz:stabilize --target=mobile-runtime`
- Ship gate: `fuzz:ship --target=mobile-runtime`

## Agentic Hygiene

- Rebase target: `main@2e5af2bfc1af373583f2a846dcd36445b826f7d7`
- Rebase cadence: before commit 1, before merge
- Hygiene split: none

## Dependencies

none

## Failure Modes

- **Hard**: mobile interactions still depend on hover-only revelation, so the runtime remains desktop-biased.
- **Hard**: navigator, console, and future spell surfaces keep separate private state, making inspectability incoherent.
- **Soft**: region annotations exist, but ownership is ambiguous, so overlays and local panels fight on small screens.
- **Soft**: block/script preparation leaks into ad hoc page code before the host contract is explicit.
- **Non-negotiable**: the site must stay usable with touch, keyboard, and reduced-motion settings without requiring hidden gestures.

## Validation

- **Hypotheses**: a shared region/register model will reduce runtime duplication; portable inspect/invoke semantics will make mobile behavior easier to teach; block/script UI can be prepared without running the full language runtime in-browser.
- **Negative controls**: route structure, current visual voice, and basic static-site simplicity remain intact.
- **Demo sequence**: identify the active region on mobile, inspect a component without hover, invoke the same component with touch or keyboard, and confirm navigator/console can describe the same underlying register state.

## Spw Artifact

` .agents/plans/mobile-runtime-foundation/mobile-runtime-foundation.spw `
