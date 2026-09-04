# Plan: interaction-grammar

Develop practical interactive circuits that become satisfying and familiar over time, and rethink brace physics toward vocabulary that is more cognitively accessible — while using Spw to exercise spatial relationship and let other languages and notations shine through it.

## Status — 2026-09-04

This plan's first commit-sequence (April 2026) was never run; the two halves of its
scope landed through other owners instead, and this file drifted out of sync with a
much larger implemented system. Reconciling that drift:

- **Brace physics vocabulary — resolved elsewhere.** `site-semantics.spw` and
  `operator-semantics.spw` settled the question this plan raised: the objective →
  subjective gradient is the primary brace-physics naming, and boon/bane survives
  only as optional valence coloring layered on top, never the left/right physics
  itself (`site-semantics.spw#brace_physics`, `operator-semantics.spw` caution note).
  That is a bridge, not a replacement — the taste note in this plan's Goal held.
- **Circuit/familiarity ladder — landed as `interaction-microstates.spw`, not the
  planned files.** `public/js/spw-component-semantics.js` and
  `public/js/spw-interaction-runtime.js` (listed below under Files) were never
  written under those names; the runtime reorganized into `public/js/runtime/` and
  `public/js/semantic/`. The actual circuit grammar is a phase ladder —
  `idle → approach → prime → charge → inspect → discover → settle`
  (`data-spw-interaction-phase`, owned by `interaction-progression.js`,
  `interaction-vocabulary.js`, `interaction-hops.js`, `interaction-story.js`) — plus
  a stated **reward contract**: every interaction resolves into feedback or reveals
  reachable arcs; silent absorption is a contract violation, not a neutral outcome
  (`.spw/conventions/interaction-microstates.spw#reward_contract`). Landmark hops,
  cauldron gather/inspect/release, and tap:travel / swipe:cycle verbs are cross-
  component instances of the same ladder (`#cross_component_hops`,
  landed 2026-09-03 in `724caa1b`).
- **Entry-level accessibility — held, and enforced by audit rather than by design
  review.** The 2026-09-03 reward-contract probe found the ladder's real failure
  mode was not gamification (the risk this plan worried about) but silent gates —
  13 of 37 gesture-contract authorings (every route's hero hook) were wired to a
  CSS rule that had no matching selector in `brace-gestures.js`, so tapping or
  holding a hook did nothing. Fixed by adding the missing selector clause, not by
  redesigning the ladder. This is the shape of scrutiny this plan should keep
  asking for: audit *whether the contract is held*, not just whether it is stated.
- **Still open, and now the actual scope of this plan:** everything here is a
  *per-interaction* phase arc (idle to settle within one gesture). Nothing yet
  distinguishes a first-time visitor's arc from a returning visitor's — the
  "practiced → fluent → habitual" cross-session ladder from the Goal below is
  unbuilt. So is the multi-language-surface work (Spw framing other notations in
  the Pretext lab) and the 24 of 37 gesture contracts the 2026-09-03 probe left
  unaudited (see `interaction-microstates.spw#wonder_interaction_microstates_1`).
  See `wip.spw` for the refreshed open-question list and probe queue.

The Goal, Scope, and Craft guard below are still the right target; the Files list
and Commits sequence describe a 2026-04 implementation path that a different,
better-documented path already superseded. Route new work through
`interaction-microstates.spw` first, and land here only what that convention
cannot own (cross-session familiarity, vocabulary taste calls, multi-language
framing).

## Goal

The desired end state is a site interaction system that rewards familiarity: repeated use builds skill and fluency, interactions have a recognizable grammar, and the underlying physics metaphor is legible enough to discuss, teach, and play with. A secondary aim is to make Spw useful as a substrate for exercising cognition and spatial relationship — where the grammar can illuminate how other languages, notations, and structures work rather than replacing them. The immediate task is twofold: design a progression ladder for interactive circuits (how interactions become familiar, then fluent, then habitual); and rethink whether the boon/bane vocabulary that names brace physics is cognitively accessible or whether it needs a bridge, supplement, or replacement. The taste note is **practiced grammar + honest physics**: interactions should feel learnable the way a musical instrument is learnable — rewarding fluency without requiring it — and the physics should work at the level of ordinary physical intuition before it becomes Spw doctrine.

## Scope

- **In scope**: interactive circuit design (entry-level, practiced, fluent, habitual patterns); brace physics vocabulary audit (boon/bane legibility test, candidate alternatives, bridge terms, and the case for keeping them); progressive enhancement as a skill ladder; familiarity feedback design (repetition rewards, feedback quality, learning gradient); Spw as spatial cognitive exercise; multi-language surfaces where Spw frames other notations.
- **Out of scope**: gamification, points, badges, or explicit skill tracking; replacing the Spw vocabulary outright; making content or interactions gated by proficiency; implementing a browser-side Spw parser.

## Files

[NEW] .agents/plans/interaction-grammar/PLAN.md
[NEW] .agents/plans/interaction-grammar/wip.spw
[NEW] .agents/plans/interaction-grammar/interaction-grammar.spw
[MOD?] .spw/conventions/site-semantics.spw — extend brace physics with accessible vocabulary options and circuit definitions
[MOD?] .spw/conventions/style-development.spw — log brace physics vocabulary decision and circuit ladder as explicit taste choices
[MOD?] public/js/spw-component-semantics.js — encode circuit level and familiarity state into component metadata
[MOD?] public/js/spw-interaction-runtime.js — implement circuit recognition, practice feedback quality, and spatial address
[MOD?] public/css/style.css → public/css/enhancements.css — circuit-level progressive enhancement keyed by familiarity state
[MOD?] topics/software/index.html — demonstrate multi-language surfaces where Spw frames other notations

Craft guard:
- Interactive circuits must have an entry level requiring no prior knowledge; depth should be available but never mandatory.
- Brace physics vocabulary changes must be bridged — any new terms must coexist with existing operator atlas documentation and site-semantics.spw.
- Familiarity feedback should be subtle — the site should feel practiced-in, not gamified.
- No circuit may trap focus, require specific timing, or penalize error states.
- The vocabulary decision (boon/bane vs. alternatives) must be logged as an explicit taste choice in the stream before any commit changes terminology.
- Spw framing of other languages must make those languages more legible, not subordinate them to Spw.

## Commits

1. `#[circuits] — capture interaction grammar plan, circuit taxonomy, and brace physics vocabulary audit`
2. `.[semantics] — formalize circuit levels, familiarity model, brace physics vocabulary decision, and multi-language framing rules`
3. `&[runtime] — implement circuit recognition and practice-level feedback in the interaction runtime`
4. `&[circuits] — add familiarity-keyed enhancement rules and multi-language surface patterns`
5. `![circuits] — verify entry-level accessibility, practice feedback, brace physics legibility, and spatial address`

Fuzz strategy:
- Explore loop: `fuzz:explore --target=interaction-grammar`
- Stabilize loop: `fuzz:stabilize --target=interaction-grammar`
- Ship gate: `fuzz:ship --target=interaction-grammar`

## Agentic Hygiene

- Rebase target: `main@14442d42b8fe4d9d5bfec5906e652fbca98d5f22`
- Rebase cadence: before commit 1, before merge
- Hygiene split: none

## Dependencies

- `mobile-runtime-foundation` — circuit design must be mobile-first; brace physics vocabulary lives in shared runtime semantics; spatial address requires shared registers.
- `css-progressive-ornaments` — circuit-level enhancements live in the enhancement layer.
- `screenshot-semantics` — practiced and fluent circuit states are exactly the kind of state worth capturing; the two plans share vocabulary for address legibility.
- `cinematic-handles` — familiarity feedback timing (practice-settle, fluency-reveal) should use named timing tokens.
- `pretext-whimsy-lab` — the whimsy lab is a prime venue for multi-language surfaces and wonder about physics; circuit grammar should extend there naturally.

## Failure Modes

- **Hard**: brace physics vocabulary is changed without bridge terms, so operator atlas pages and site-semantics.spw become inconsistent.
- **Hard**: interactive circuits create a two-tier experience where practiced users access more content, stranding casual visitors.
- **Soft**: familiarity feedback becomes gamification — progress indicators or reward tokens that feel extractive rather than reflective.
- **Soft**: circuit grammar is only legible to users who already know Spw vocabulary rather than being inductively learnable from spatial behavior.
- **Soft**: multi-language surfaces reduce other languages to syntax fragments framed by Spw, rather than letting those languages demonstrate their own expressive power.
- **Non-negotiable**: every interaction circuit must remain fully accessible and content-complete to first-time visitors with no prior knowledge of the site.

## Validation

- **Hypotheses**: circuit progression will make the site feel deeper over time without requiring upfront investment; a more accessible brace physics vocabulary will improve legibility of the operator atlas and Pretext surfaces; Spw framing of other languages will make spatial relationships between notations more visible.
- **Negative controls**: all content remains accessible to first-time visitors; operator atlas pages remain standalone-legible; the framed languages remain legible on their own terms.
- **Demo sequence**: visit as a first-time user — identify the entry circuit; return after repeated use — identify what new recognition is available; test brace physics vocabulary with a user unfamiliar with Spw; view a multi-language surface and confirm the framed language teaches something about itself.

## Spw Artifact

`.agents/plans/interaction-grammar/interaction-grammar.spw`
