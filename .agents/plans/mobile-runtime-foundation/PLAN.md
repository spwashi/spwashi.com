# Plan: mobile-runtime-foundation

Define a mobile-first interaction/runtime foundation for page regions, portable inspect/invoke semantics, register behavior, and future block/script UI.

## Goal

The desired end state is a site runtime that treats mobile and coarse-pointer use as the primary case rather than a degraded desktop fallback. The immediate task is not to ship new chrome, but to formalize the implementation surface: page regions with ownership, portable interaction semantics that do not depend on hover, inspectable registers that back navigator/console projections, and a clean preparation layer for future Spw blocks and scripts as UI. The longer arc is a cognitive machine that can produce wonder without becoming noisy: structure should become more legible as the user engages it, and future Spw-backed components/pages should inherit that same ecosystem rather than bypass it. The taste note is **clarity + containment**: preserve the site's calm surface while making its deeper machinery easier to reason about, inspect, and extend.

## Scope

- **In scope**: define a page-region model, portable interaction semantics, shared register/runtime boundaries, inspectability rules, UX constraints for an effective cognitive machine, prefix/postfix symmetry rules, brace-physics and pivot semantics, and future-facing block/script host contracts; predict the runtime files and markup surfaces likely to change when implementation begins.
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
[NEW?] public/js/spw-keyboard-runtime.js - semantic dispatcher that normalizes prefix and postfix interaction paths
[NEW?] public/js/spw-interaction-runtime.js - portable inspect/invoke semantics across pointer, touch, and keyboard
[NEW?] public/js/spw-page-runtime.js - page-region ownership, pivots, and page-level host orchestration
[NEW?] public/js/spw-block-runtime.js - future host contract for declarative blocks and bound scripts

Craft guard:
- Keep each runtime file single-purpose; do not let `site.js` absorb region, register, and spell ownership all at once.
- Treat hover as an enhancement, not a required path; every revealed affordance must have a coarse-pointer and keyboard route.
- Navigator and console should become projections over shared state, not competing state containers.
- Prefix and postfix paths must normalize to the same semantic register writes rather than becoming separate interaction universes.
- Wonder should arise from structural revelation and reversible pivots, not from ornamental motion or permanent chrome.

## Commits

1. `#[mobile-runtime] - capture the planning artifacts and distilled semantics note`
2. `.[semantics] - formalize UX invariants, prefix/postfix symmetry, brace physics, pivots, and register invariants`
3. `&[runtime] - extract shared keyboard, interaction, and register runtime foundations from page-local behavior`
4. `&[blocks] - add region/page hosts plus contracts for declarative blocks, scripts, and inspect surfaces`
5. `![mobile-runtime] - verify coarse-pointer behavior, inspectability, and region containment`

Fuzz strategy:
- Explore loop: `fuzz:explore --target=mobile-runtime`
- Stabilize loop: `fuzz:stabilize --target=mobile-runtime`
- Ship gate: `fuzz:ship --target=mobile-runtime`

## Agentic Hygiene

- Rebase target: `main@659af4e7ad79b4d9c4641520fc2fbbae79fca0d5`
- Rebase cadence: before commit 1, before merge
- Hygiene split: none

## Dependencies

none

## Failure Modes

- **Hard**: mobile interactions still depend on hover-only revelation, so the runtime remains desktop-biased.
- **Hard**: navigator, console, and future spell surfaces keep separate private state, making inspectability incoherent.
- **Hard**: prefix and postfix interaction paths drift apart, so keyboard and touch teach different grammars.
- **Soft**: region annotations exist, but ownership is ambiguous, so overlays and local panels fight on small screens.
- **Soft**: block/script preparation leaks into ad hoc page code before the host contract is explicit.
- **Soft**: wonder is pursued as effects instead of pivots into clearer structure, so the system feels decorative rather than cognitive.
- **Non-negotiable**: the site must stay usable with touch, keyboard, and reduced-motion settings without requiring hidden gestures.

## Validation

- **Hypotheses**: a shared region/register model will reduce runtime duplication; portable inspect/invoke semantics will make mobile behavior easier to teach; prefix/postfix symmetry will let keyboard and touch feel like different entrances into the same grammar; block/script UI can be prepared without running the full language runtime in-browser.
- **Negative controls**: route structure, current visual voice, and basic static-site simplicity remain intact.
- **Demo sequence**: identify the active region on mobile, inspect a component without hover, invoke the same component with touch or keyboard, pivot into a deeper surface without losing orientation, and confirm navigator/console can describe the same underlying register state.

## UX Considerations

- **Calm at rest, charged when summoned**: the system should feel quiet until the user addresses it. Persistent chrome should stay sparse; depth should appear when requested.
- **Inspect before invoke on touch**: mobile users need a reversible way to reveal structure before commitment. Long-press, focus, or explicit inspect gestures must expose the same address that hover currently hints at.
- **Prefix/postfix symmetry**: keyboard will favor prefix casts (`operator -> target`), while touch will often favor postfix flows (`target -> available operators`). Both must resolve to the same intent and register transitions.
- **Brace-first containment**: a brace opens a face; on mobile that means only one dominant opened face per region stack. Secondary structure should collapse into sheets, overlays, or pivots rather than stealing width.
- **Pivots preserve orientation**: moving into a deeper structure should feel like a local structural turn, not a context loss. The user should know what opened, where they are, and how to dismiss it.
- **Wonder is earned revelation**: wonder should occur when the user discovers a deeper grammar or a new structure preserving their path, not when the UI simply animates more.

## Authoring Ecosystem

- **Spw-backed component**: stable identity, region ownership, inspect label, semantic kind/form/role, declared inputs, and optional script host.
- **Spw-backed page**: a composition of named regions, shared registers, block hosts, and inspect surfaces, not a one-off HTML route with bespoke runtime assumptions.
- **Authoring ladder**: static HTML route -> semantically annotated route -> region-aware route -> block-hosted route -> script-backed interactive route.
- **Host rule**: future blocks and scripts should attach to named hosts and write through registers rather than mutating arbitrary DOM islands.

## Spw Artifact

`.agents/plans/mobile-runtime-foundation/mobile-runtime-foundation.spw`
