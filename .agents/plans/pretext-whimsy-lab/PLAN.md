# Plan: pretext-whimsy-lab

Explore Pretext capabilities toward whimsy and text-physics in a bounded experimental lab that stays honest about what the library can actually compute.

## Goal

The desired end state is a Pretext surface that can move from observatory to playful typographic physics lab without lying about the substrate. The immediate task is to map which kinds of whimsy and physical intuition are honest consequences of line prediction, height estimation, mixed-script handling, width transforms, and explicit constraint mappings, and which are just generic animation wearing a Pretext badge. This track should stay explicitly experimental and likely centered on the existing Pretext page, while preparing patterns that later SVG widgets or Spw-backed pages can borrow. The taste note is **measured delight + legible force**: typographic play should feel surprising and generous, but still inspectable, mobile-first, and grounded in real layout data.

## Scope

- **In scope**: define an honest capability lattice for Pretext in this repo; outline a ladder from observatory to whimsical/physical projection; define deterministic physics profiles and constraint families; predict experiment families, controls, telemetry, and feature-gating; map how SVG-backed projections and mobile-first interactions can support the lab without turning it into a separate app.
- **Out of scope**: replacing the current observatory outright, depending on glyph-outline data Pretext does not provide, introducing an unconstrained particle engine, or making whimsy a site-wide default mode.

## Files

[NEW] .agents/plans/pretext-whimsy-lab/PLAN.md
[NEW] .agents/plans/pretext-whimsy-lab/wip.spw
[NEW] .agents/plans/pretext-whimsy-lab/pretext-whimsy-lab.spw
[MOD?] topics/software/pretext/index.html - add experimental regions, experiment selectors, and bounded whimsy surfaces
[MOD?] topics/software/index.html - link into the whimsy lane or explain its place in the software surface
[MOD?] public/js/pretext-lab.js - either widen or split the existing observatory runtime
[MOD?] public/js/pretext-utils.js - capability adapters, caching, or fallbacks for experiment families
[MOD?] public/css/style.css - whimsy surface containment, responsive stacking, and experiment-specific SVG/text styling
[MOD?] public/js/spw-shared.js - shared helpers or registers if the lab starts projecting richer inspect state
[MOD?] public/js/spw-console.js - optional projection of truthful experiment telemetry
[NEW?] public/js/pretext-whimsy-lab.js - separate experiment runtime so observatory logic stays readable
[NEW?] public/js/pretext-physics-profiles.js - deterministic force profiles and constraint mappings derived from line metrics
[NEW?] public/js/pretext-whimsy-presets.js - curated playful presets and experiment definitions
[NEW?] public/images/illustrations/pretext/*.svg - optional authored SVG scaffolds or static fallbacks for experiment projections

Craft guard:
- Keep the observatory path and the whimsy path separable; do not bury all experiment logic inside `pretext-lab.js`.
- Build experiments only from data Pretext actually returns: prepared handles, line text, line widths, line count, and height.
- Treat physics as explicit constraint mappings over line boxes, not as free decorative particles.
- Favor one active whimsical surface at a time on mobile; secondary projections should stack or collapse.
- Whimsy should be explainable through telemetry and inspect surfaces, not through hidden randomness.
- Maintain explicit offline/error states because the Pretext bridge still depends on a CDN import.

## Commits

1. `#[pretext] - capture the whimsy lab plan and distilled capability lattice`
2. `.[pretext] - formalize whimsy doctrine, physics profiles, experiment boundaries, and truthful telemetry rules`
3. `&[pretext] - split the observatory runtime from the whimsy experiment runtime`
4. `&[physics] - add first layout-driven physical projections and inspect surfaces`
5. `![pretext] - verify touch, responsiveness, offline degradation, and telemetry honesty`

Fuzz strategy:
- Explore loop: `fuzz:explore --target=pretext-whimsy-lab`
- Stabilize loop: `fuzz:stabilize --target=pretext-whimsy-lab`
- Ship gate: `fuzz:ship --target=pretext-whimsy-lab`

## Agentic Hygiene

- Rebase target: `main@d4e504661006b947d6f60591814b8f21020bed96`
- Rebase cadence: before commit 1, before merge
- Hygiene split: none

## Dependencies

`mobile-runtime-foundation` - shared doctrine for page regions, portable inspect/invoke semantics, prefix/postfix symmetry, and brace pivots so the lab remains a truthful site surface rather than a detached toy.

`svg-surface-integration` - shared host strategy for layout-driven drawings, widgets, and inspectable projections. Exploration can begin before the full SVG runtime lands, but the rendering model should not diverge from it.

`css-progressive-ornaments` - CSS split and enhancement doctrine for keeping Pretext whimsy, physics surfaces, and seasonal ornaments bounded, cacheable, and reduced-motion safe.

## Failure Modes

- **Hard**: the lab starts claiming Pretext can do glyph-level or arbitrary visual behaviors that it cannot actually compute.
- **Hard**: the lab drifts into canned particle effects or arbitrary physics that are no longer seeded by measured line structure.
- **Hard**: whimsy overwhelms the observatory, so the user can no longer tell what is measured versus what is embellished.
- **Hard**: experiment state lives only in visual effects and not in inspectable telemetry or registers.
- **Soft**: the lab becomes desktop-biased through hover-driven reveals or wide multi-panel layouts that collapse poorly on phones.
- **Soft**: whimsy becomes an isolated art toy instead of a reusable pattern source for later widgets and pages.
- **Non-negotiable**: if the CDN import fails or the experiment surface is disabled, the page must still explain what happened and preserve the existing observatory path.

## Validation

- **Hypotheses**: Pretext's line and height outputs are enough to support a bounded family of playful, inspectable physical projections; separating observatory and whimsy runtimes will preserve clarity; mobile-first containment and truthful telemetry will keep the lab teachable.
- **Negative controls**: the current Pretext observatory remains understandable, the rest of the site does not inherit whimsy by accident, and the library bridge stays thin.
- **Demo sequence**: open the Pretext page, switch from observatory to a whimsy experiment, change text/width/line-height, verify the playful surface updates from the same prepared handle and reports honest metrics, then simulate an offline or failed-load state and confirm the surface degrades explicitly.

## Spw Artifact

`.agents/plans/pretext-whimsy-lab/pretext-whimsy-lab.spw`
