# Plan: interaction-grammar

Develop practical interactive circuits that become satisfying and familiar over time, and rethink brace physics toward vocabulary that is more cognitively accessible — while using Spw to exercise spatial relationship and let other languages and notations shine through it.

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
