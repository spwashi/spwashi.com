# Model-Guided Refinement Rails

## Public Goal

Prepare this codebase for refinement by a model that can read `.spw`, follow explicit connections, and make competent local changes, but should not be expected to improvise tastefully through the full CSS and JavaScript surface.

The plan turns broad creative direction into rails:

- where to look first
- what not to touch
- how CSS, HTML, JS, and `.spw` names should line up
- which semantic concepts are fixed, stable, tending, experimental, or volatile
- how creative/marketing surfaces should become coherent enough that musicians and artists want to explore and extend them

This is not a new framework. It is a focus contract for future agents and collaborators.

## Core Principle

A less creative model should elaborate **one declared dimension at a time**.

Good dimensions:

- one audience register, such as musician, visual artist, engineer, or collaborator
- one Spw operator or operator family
- one component family, such as operator chips, promo cards, frame cards, tuning strips, or practice labs
- one experience slice, such as attention-resonance-field, musical-projection, creative-marketing-engine, or math-practice-labs
- one daily-kernel exercise, such as engineer + animator in a lab region or illustrator + designer in a studio region
- one CSS behavior, such as focus, resonance, material depth, rhythm, or reduced-motion safety

Bad dimensions:

- "make the site better"
- "clean up the CSS"
- "modernize JavaScript"
- "improve marketing" without naming audience, offer, proof, route, and cadence

## Semantic Capacity Rule

The codebase is expected to gain many more semantic hooks, routes, audience registers, practice beds, creative prompts, and cross-layer contracts. Future models should not respond to that growth by adding broad prose.

Use `.spw/conventions/semantic-capacity.spw` to decide the operation first:

- **cache:** hold an insight with evidence before it is stable
- **audit:** test whether current understanding matches code
- **align:** make surfaces share one vocabulary stem
- **prime:** prepare a creative expansion path without implementing it
- **contract:** promote a repeated pattern into durable guidance
- **archive:** reduce active semantic load while preserving context

When a value is inherently multi-part, keep the source shape as a list, set, facet, expression, or statement and serialize only at the DOM, CSS, or JSON-LD projection boundary that needs a scalar string.

For small cached insights, use:

- `.agents/plans/model-guided-refinement/templates/semantic-insight-cache.spw`

Do not create a new full plan when a single insight-cache entry would preserve the idea and make the next patch easier.

## Daily Kernel Rule

Use `.spw/conventions/daily-kernel.spw` when a task crosses professional engineering and creative practice. The daily kernel makes the exploration small enough for a less creative model:

- one focus
- one primary discipline and one bridge discipline
- one university-style region
- one brand-physics variable
- one intensity
- one semantic operation
- one output
- one validation path

Use `.agents/plans/daily-kernel-development/templates/daily-kernel-note.spw` when the task needs a one-session note or audit before implementation.

## First Reading Path For A Less Creative Model

Read in this order before editing:

1. `AGENTS.md`
2. `.spw/site.spw`
3. `.spw/conventions/model-guided-refinement.spw`
4. `.spw/conventions/site-semantics.spw`
5. The specific slice or plan named by the task
6. The target route HTML
7. The smallest relevant CSS file
8. The smallest relevant JS module only if the task requires runtime behavior

Stop after step 5 if the task is only planning or `.spw` refinement.

## Decision Rails

### HTML

Use HTML for:

- public meaning
- headings and route flow
- stable ids
- `data-spw-*` contracts
- links, copy, and component slots

Do not add wrappers only to carry metadata. Add `data-spw-feature` to an honest cluster that already exists or should exist semantically.

### CSS

Use CSS for:

- material disposition
- rhythm and spacing
- focus and selection clarity
- resonance projection
- responsive layout
- reduced-motion and debug affordances

Do not use CSS to invent a concept that HTML and `.spw` do not name. If a selector needs a new semantic hook, document the hook first in `.spw/conventions/model-guided-refinement.spw` or `site-semantics.spw`.

### JavaScript

Use JS for:

- progressive enhancement
- measurement
- mode switching
- state inspection
- cadence or feed rendering
- local events and reversible gestures

Do not edit JS just because it is visible. If a feature can be made clearer through HTML or CSS, do that first. A script is justified when it produces an observable consequence or makes a semantic relation inspectable.

### `.spw`

Use `.spw` for:

- durable meaning
- semantic fixity
- operator projection
- slice ownership
- claim chains
- handoff notes
- marketing/creative engine contracts

Do not use `.spw` as a dumping ground for impressions. Every durable section should name an owner surface, validation path, or future implementation gate.

## Semantic Fixity Tiers

Future models should classify every proposed semantic change before editing.

- **fixed:** canonical identity, safety, accessibility, source-of-truth paths, CSS layer order unless separately approved
- **stable:** shared component anatomy, operator meanings, body metadata families, route identity, product-line names
- **tending:** copy phrasing, local visual emphasis, practice-bed notes, component session improvements
- **experimental:** route-local sketches, visual seeds, reference assignments, one-off prototype data attributes
- **volatile:** generated state, debug output, runtime measurements, temporary console diagnostics

Implementation rule:

- fixed and stable changes need `.spw` + plan updates
- tending changes need local validation and a short note when meaning changes
- experimental changes must stay route-local or plan-local
- volatile changes should not become authored contracts

## Elemental Effects

Elemental language is allowed only when it maps to implementation.

- **earth:** material, ground, substrate, card depth, matte/glass distinction, stable layout
- **water:** flow, cadence, scroll rhythm, route progression, feed cycling, cauldron mixing
- **air:** spacing, breath, disclosure, legibility, low-friction entry, reduced density
- **fire:** action, accent, urgency, highlight, CTA, gesture consequence
- **metal:** structure, validation, sharp boundaries, indexes, contracts, schema, file tree
- **wood:** growth, practice beds, seasonal tending, artist/musician extension, product-line maturation

When adding elemental effects, choose one primary element and one secondary element. Do not blend all six in one patch.

## Creative Marketing Engine

Goal: build a coherent engine that musicians, artists, and other creative practitioners would want to explore and extend, without turning the site into generic promotion.

The engine should connect:

- product lines: `.spw/surfaces/product-lines.spw`
- promo/wonder cadence: `public/data/promo-wonder-cycle.json`
- route surfaces: `/design/`, `/play/`, `/recipes/`, `/topics/software/spw/`, `/about/website/`, `/contact/`
- visual language: palette, grain, operator chips, frame cards, promo cards
- reasons to return: daily/weekly cadence, practice beds, collectible moments, resonant clusters

Each marketing card or route-local offer should answer:

- **audience:** who is this for?
- **offer:** what can they do or understand now?
- **proof:** what existing route, artifact, or working surface demonstrates it?
- **resonance:** why would a musician or artist care?
- **extension:** how could they remix, commission, collect, cite, or build on it?
- **next action:** what link or contact path follows?

Allowed creative audiences:

- musician: rhythm, motifs, scores, loops, timbre, cadence, performance, session
- visual artist: substrate, palette, composition, figure/ground, texture, edition, studio
- writer/worldbuilder: lore, character, scene, motif, ritual, voice
- engineer/toolmaker: systems, grammar, runtime, API, validation, composability
- patron/collaborator: proof, cadence, support, commission, clear next step

Do not collapse these audiences into "creatives." Pick one primary audience per patch and one bridge audience at most.

## Implementation Sequence

### Phase 1 - Rails And Dispatch

- Add `.spw/conventions/model-guided-refinement.spw`.
- Add `.spw/conventions/semantic-capacity.spw` for insight caching, pattern audits, expansion priming, and `.spw` diff-value rules.
- Wire it into `.spw/conventions/index.spw` and `.spw/site.spw`.
- Add this plan to `.agents/plans/README.md`.
- Add one active claim in `site-semantics.spw` requiring future model-guided patches to name focus dimension and fixity tier.

### Phase 2 - Marketing Engine Contract

- Extend `product-lines.spw` with a creative marketing engine section.
- Define audience registers for musician and visual artist without removing engineer/librarian registers.
- Define the promo/wonder card contract before editing runtime.
- Audit `public/data/promo-wonder-cycle.json` for cards that already satisfy audience/offer/proof/resonance/extension/next-action.

### Phase 3 - CSS Cross-Language Map

- Pick one component family, preferably `promo-wonder-cycle`, `operator-chip`, or `frame-card`.
- Trace route HTML -> data attributes -> CSS selectors/tokens -> JS events/state -> `.spw` claim.
- Improve naming or local docs only where the trace breaks.
- Do not move CSS files in this phase.

### Phase 4 - One Creative Slice Pilot

- Create or extend a slice contract for `creative-marketing-engine`.
- Pilot one route-local improvement for musicians or artists.
- Keep the patch small: one route, one CSS surface, optional data feed edit, and one `.spw` note.

### Phase 5 - Model Handoff Template

- Add a small checklist that future models must fill in before implementation:
  - focus dimension
  - fixity tier
  - elemental primary/secondary
  - touched route/component/slice
  - validation command
  - what not to touch
- Add or reuse a semantic insight cache entry when the model discovers a valuable pattern that should not be implemented yet.

## Hard Stops For Future Models

Stop and ask or create a plan first if:

- the change would reorder CSS cascade layers
- the change would move files
- the change would edit more than one JS ownership layer
- the change would introduce a new `data-spw-*` family
- the change would alter canonical operator meaning
- the change would rewrite broad marketing copy across multiple routes
- the change would add dependencies

## Validation

Always run:

- `git diff --check`

Run targeted checks when relevant:

- `node --check <edited-js-file>`
- `npm run check:css` for CSS source changes
- `npm run check` for broad architecture changes
- targeted `rg` for new semantic names, anchors, data attributes, and plan slugs

## Status

- [x] Plan created
- [x] `.spw/conventions/model-guided-refinement.spw` wired into dispatch
- [x] `.spw/conventions/semantic-capacity.spw` wired into dispatch
- [x] semantic insight-cache template added
- [x] creative marketing engine semantics added to product-lines
- [ ] first model-guided component trace completed
- [ ] first musician/artist-facing pilot scoped and implemented
