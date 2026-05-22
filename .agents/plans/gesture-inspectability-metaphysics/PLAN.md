# Plan: gesture-inspectability-metaphysics

Develop one integrated plan for brace gestures, inspectability, gesturability, and the site’s meta-physics model after a long period of runtime-heavy development with limited browser verification.

## Goal

Turn the site’s current interaction grammar into a coherent, browser-tested system instead of a set of adjacent local passes. The public result should be:

- brace gestures that feel deliberate on touch, pointer, and keyboard
- inspect surfaces that explain what the runtime believes is happening
- metaphysics layers that stay legible as interaction grammar, not decorative lore
- a validation loop that exercises real routes and real state transitions in the browser before further semantic expansion

Taste note: **inspectable wonder with operational discipline**.

## Why this plan now

Several strong local systems already exist:

- brace gesture state in `public/js/runtime/brace-gestures.js`
- section locomotion and resonance probe in `public/js/runtime/attention-architecture.js`
- spell / breadcrumb cognition in `public/js/runtime/spells.js` and `public/js/runtime/experiential.js`
- image metaphysics in `public/js/media/image-metaphysics.js`
- discovery overlays and shell chrome state in `public/js/interface/discovery-notices.js` and shell runtime modules
- semantic / philosophical contracts in `.spw/conventions/site-semantics.spw`, `.spw/conventions/attention-field.spw`, `.spw/conventions/ornament-contract.spw`, and `.spw/philosophy/cognitive-surface.spw`

What is missing is a single plan that:

1. treats these as one interaction ecology
2. defines browser-testable invariants
3. identifies the routes that should serve as canonical specimens
4. distinguishes durable semantic state from transient visual state and gesture residue

## Scope

- In scope: shared runtime contracts, shared CSS/state projections, route specimens used for validation, and `.spw` notes that keep the system inspectable.
- In scope: browser-audit planning for touch, pointer, keyboard, mobile, and wide desktop behavior.
- In scope: state ownership and precedence questions across shell, frame, card, overlay, ornament, and image helper layers.
- Out of scope: a full route-by-route copy rewrite, a visual redesign of every surface, or upstream workbench parser/tooling changes as the default path.

## Primary questions

1. Which interaction states are semantic truth, and which are temporary gesture traces?
2. Which surfaces are allowed to write canonical meaning-bearing datasets, and which should only write resolved or preview datasets?
3. How should brace gestures, attention cues, spells, collection, and image metaphysics reinforce each other instead of competing for the same user attention?
4. What is the minimum browser scenario set that falsifies the current model if it is incoherent?
5. Which route specimens best expose the system’s success or failure?

## Working direction

### 1. Build a state ownership map before new behavior

Document a unified state lattice across:

- page arrival / presence / transition
- section locomotion / reading groove / beat focus
- brace gesture phases
- shell menu pressure / topology / clarity
- spell familiarity / liminality / replayability
- image metaphysics interaction state
- collection / pinning / deviation / wonder memory

The key design rule:

- canonical semantic state should be stable, inspectable, and reversible
- transient gesture state should stay clearly temporary and should not silently become semantic truth

### 2. Treat browser verification as a feature, not only validation

Before expanding the interaction grammar, define a browser audit loop for:

- desktop pointer + keyboard
- mobile touch + scroll
- reduced-motion behavior
- dark/light + theme pack state carry
- restored / returning page state
- route-to-route state continuity

The site has enough runtime richness that “works in code review” is no longer sufficient.

### 3. Make inspectability a first-class public surface

The inspect model should answer:

- what state is active
- which module wrote it
- whether it is preview, armed, committed, or persistent
- what the user can do next
- how to get back to a calm, coherent baseline

Inspectability should not require reading source or opening devtools to understand the contract.

### 4. Keep metaphysics falsifiable

Metaphysics should remain grounded in interface consequences:

- attention field -> observable resonance or locomotion bias
- cognitive surface -> revisitable state and learned legibility
- ornament contract -> visible state source and reserved meaning
- brace physics -> inspectable polarity, charge, and consequence

If a metaphysical term cannot be tied to a visible state change, inspect panel, or reversible interaction, it should be treated as copy debt.

## Canonical route specimens

Use these as the minimum browser verification set:

- `/` — homepage shell, hero gestures, cauldron, spells, floating chrome, discovery notices
- `/settings/` — canonical settings state, deviation visibility, inspect vocabulary
- `/design/components/` — component anatomy, layout ownership, floating chrome reference
- `/topics/software/spw/` — operator semantics, resonance, metaphysics, inspect learning surface
- `/play/rpg-wednesday/library/` — threshold-heavy editorial flow with collectible and wonder-bearing surfaces
- `/tools/profile/` — stateful card editing and screenshot-oriented card semantics

Optional secondary specimens after the first pass:

- `/about/website/`
- `/topics/software/`
- `/play/rpg-wednesday/character/`

## Workstreams

### Workstream A: Runtime state inventory

Audit all shared writers of:

- `data-spw-*` semantic state
- resolved / preview / helper datasets
- root-level runtime attributes on `<html>` and `<body>`
- localStorage-backed persistent state

Deliverable:

- a table of canonical vs transient state and who owns each write path

### Workstream B: Gesture grammar consolidation

Focus files:

- `public/js/runtime/brace-gestures.js`
- `public/js/runtime/attention-architecture.js`
- `public/js/media/image-metaphysics.js`
- shell / region interaction modules

Questions:

- which gestures are inspect, invoke, collect, pin, compare, or pass-through
- how coarse pointers differ from fine pointers
- how hold / drag / release semantics should align across braces, cards, and image hosts

Deliverable:

- a normalized gesture vocabulary and conflict-resolution rules

### Workstream C: Inspectability surfaces

Focus files:

- `public/js/site.js`
- `public/js/runtime/experiential.js`
- `public/js/runtime/spells.js`
- `settings/index.html`
- related inspect CSS and shell surfaces

Questions:

- how users inspect active state without source reading
- how console helpers, settings inspect mode, and visible badges should align
- how much provenance should be visible by default vs opt-in inspect mode

Deliverable:

- a public inspectability ladder: calm -> visible -> verbose

### Workstream D: Metaphysics alignment

Focus files:

- `.spw/conventions/site-semantics.spw`
- `.spw/conventions/attention-field.spw`
- `.spw/conventions/ornament-contract.spw`
- `.spw/philosophy/cognitive-surface.spw`
- runtime modules that claim these models

Questions:

- which metaphysics claims already have concrete runtime support
- which claims are aspirational and should be marked as such
- where terminology drift exists between JS, CSS, and `.spw`

Deliverable:

- a model alignment note separating implemented, partial, and speculative metaphysics

### Workstream E: Browser audit harness

Define a repeatable browser checklist for each specimen route:

- initial load and settling
- keyboard-only navigation
- touch scroll without accidental activation
- long-press / hold behavior
- pointer hover / focus parity
- route transition and return-state persistence
- inspect mode visibility
- localStorage persistence and reset paths

Deliverable:

- a route-by-route browser audit script and issue bucket

## Likely files

- [NEW] `.agents/plans/gesture-inspectability-metaphysics/PLAN.md`
- [NEW] `.agents/plans/gesture-inspectability-metaphysics/wip.spw`
- [MOD] `public/js/runtime/brace-gestures.js`
- [MOD] `public/js/runtime/attention-architecture.js`
- [MOD] `public/js/runtime/spells.js`
- [MOD] `public/js/runtime/experiential.js`
- [MOD] `public/js/media/image-metaphysics.js`
- [MOD] `public/js/site.js`
- [MOD] `public/js/interface/composition.js`
- [MOD] `public/js/interface/discovery-notices.js`
- [MOD] `public/js/runtime/shell-disclosure.js`
- [MOD] `public/css/effects/wonder.css`
- [MOD] `public/css/ornament/ornament.css`
- [MOD] `public/css/shell/chrome.css`
- [MOD] `public/css/handles/operators.css`
- [MOD] `settings/index.html`
- [MOD] `.spw/conventions/site-semantics.spw`
- [MOD] `.spw/conventions/attention-field.spw`
- [MOD] `.spw/conventions/ornament-contract.spw`
- [MOD] `.spw/philosophy/cognitive-surface.spw`

## Risks

- **Hard**: transient gesture datasets silently become canonical semantics, causing inconsistent browser state and semantic drift.
- **Hard**: metaphysical language keeps expanding without a matching inspectable runtime, making the system harder to trust.
- **Hard**: browser-specific failures remain invisible because no shared specimen and audit loop exists.
- **Soft**: multiple inspect surfaces explain the same state differently.
- **Soft**: touch safety and scroll safety conflict with discoverability, producing either accidental triggers or hidden capability.
- **Soft**: the shell, frame, and image helper layers compete for the same edge space and attention budget.

## Sequencing

1. Inventory state ownership and route specimens.
2. Define the browser audit checklist and run it before major semantic changes.
3. Normalize gesture vocabulary and state precedence.
4. Align inspect surfaces and settings language with the actual runtime.
5. Tighten metaphysics claims to the implemented model.
6. Only then expand richer gesture / spell / ornament behavior.

## Validation

- `git diff --check`
- `node --check` for every edited JS runtime module
- targeted `rg` checks for `data-spw-*` state families and duplicated ownership
- browser verification on the canonical specimen routes at:
  - mobile narrow touch
  - desktop pointer
  - keyboard-only
  - reduced motion

## Out-of-scope decisions for now

- no framework migration
- no raw workbench parser changes as the default solution
- no large route copy rewrite before the runtime audit
- no new ornamental system that lacks a state producer and an inspect story
