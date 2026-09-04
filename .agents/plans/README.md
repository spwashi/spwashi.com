# Plan Index

This directory holds the stable, reviewable plan tracks for the site.

## Canonical Tracks

- `css-architecture-readability/PLAN.md` - literate CSS ownership, debug labels, and UX behavior traceability.
- `color-motion/PLAN.md` - behavior/personality audit, palette tuning, operator distinction, and microinteraction timing.
- `midjourney-design-concepts/PLAN.md` - UX concept studies, animation references, inspiration workflow, and asset promotion rules.
- `reference-assignment-template/PLAN.md` - intern-sized reference briefs for component improvements and experiments.

Use these plans as the canonical starting point instead of the `tmp-plan*.md` scratch files at the repo root.

Current emphasis: make behavior inspectable, keep the site's voice recognizable, and keep the codebase navigable by concept name.

Reference assignments should give an intern a small set of site references, one UX question, one component behavior, and a validation path.

## Current Semantic Rails

Use these when a task is broad, cross-disciplinary, or likely to create reusable meaning:

- `model-guided-refinement/PLAN.md` — choose focus dimensions, fixity tiers, elemental effects, and cross-language traces before implementation.
- `daily-kernel-development/PLAN.md` — run one-session kernels for engineers, animators, illustrators, designers, musicians, artists, and collaborators without broad rewrites.
- `spw-surface-normalization/PLAN.md` — keep `.spw` surfaces navigable, dimensional, and reviewable as semantic capacity grows.
- `modular-experience-slices/PLAN.md` — use slice contracts when ownership spans HTML, CSS, JS, `.spw`, validation, and practice beds.
- `dimensional-expression-navigation/PLAN.md` — connect 0D handles through 4D replay paths with content-responsive navigation and honest authored/contextual boundaries.
- `interaction-loop-contract/PLAN.md` — centralize shared interaction-feedback states, refresh reasons, and cancel/eligibility handling.
- `gesture-state-refinement/PLAN.md` — calm gesture intent on mobile and document the resulting interaction grammar.
- `navigation-header-disclosure/PLAN.md` — keep header disclosure roles, overlay state, and compact action ownership legible.
- `floating-chrome-stack/FIX.md` — normalize floating chrome roles, tiers, console ownership, and viewport participation.
- `semantic-copy-depth/PLAN.md` — formalize entry/normal/dense/technical copy depth alongside the existing semantic layers.
- `spw-architecture-ecology/PLAN.md` — `.spw` topology, promotion protocol, ecology coordinators, owner registry, component-template surface, `site.spw` slimness, review graduation, language-ecology alignment, slice promotion, convention hygiene, and precipitated agent/editor indexes.
- `relational-attention-media/PLAN.md` — attention as self/local/global relation plus local media-seed production across genres.
- `webpage-trope-vocabulary/PLAN.md` — literal website/reference-document anatomy, route-specific restaurant/garden anchors, shared `data-spw-anatomy` vocabulary, and floating chrome island rules.
- `site-starter-component-kit/PLAN.md` — portable compose.css/compose.js starter boundary, component specimen promotion, and inventory command for spawning new sites.
- `spw-metaphysical-language/PLAN.md` — construct codex, sigil-property alignment protocol with drift ledger, production/manufacturing ladder past the screen, and industry integration briefs; use when work describes or arbitrates the Spw language itself.
- `language-reclustering/PLAN.md` — dimensional clusters for the attribute/event lexicon, census-driven trace coverage, event-grammar boundary (broadcast vs bus-local), nutritious-architecture practices; use when vocabulary is added, audited, or consolidated.
- `homonym-renaming/PLAN.md` — semantic-geometry verdicts on load-bearing homonyms (settle/prime/ground/phase), echo-vs-homonym criteria, alias-windowed rename mechanics; use before renaming any shared vocabulary.
- `agent-optimization/PLAN.md` — use when the work changes the agent/editor operating environment itself.
- `landing-visual-hierarchy/PLAN.md` — 2026-08-21 session: landing cluster rank, team desks, guild seating, climate models, and ontology-harmony ledger for experimental voices.

Small semantic discoveries do not always need a new plan. Use `.agents/plans/model-guided-refinement/templates/semantic-insight-cache.spw` for a single cache/audit/prime entry when implementation should wait.

## Maintenance Snapshot - 2026-09-04

Trajectory review of the 29 commits ahead of `origin/main` (interaction runtime,
electrostatics, climate-deferred CSS, screenshot/capture, and the pocket-frame
plan wave). Two findings:

**Interaction semantics reconciled.** `interaction-grammar/` — the named owner of
"a site interaction system that rewards familiarity... a recognizable grammar" —
had not been touched since 2026-04-09 despite both halves of its scope landing
under other owners since: the boon/bane vocabulary question resolved in
`site-semantics.spw`/`operator-semantics.spw` (objective/subjective is the primary
brace-physics axis; boon/bane is optional valence coloring), and the circuit/
familiarity ladder it asked for landed as `.spw/conventions/interaction-microstates.spw`
(phase ladder `idle → approach → prime → charge → inspect → discover → settle`,
a stated reward contract — "never silent absorption" — and cross-component hops
for landmarks, cauldron gather/inspect/release, `tap:travel`/`swipe:cycle`).
`interaction-grammar/PLAN.md`, `wip.spw`, and `index.spw` are now reconciled
against that reality: what landed is cited back to its real owner, and what is
genuinely still open — cross-session familiarity (practiced → fluent → habitual
*across visits*, not within one interaction arc), the multi-language Pretext
surface, and 24 of 37 gesture contracts the 2026-09-03 reward-contract probe left
unaudited — is the plan's real remaining scope. `microinteraction-motion-lifecycle/`
(the plan that actually landed this week's hop/cluster work) got its missing
`index.spw` so it is inspectable the same way its siblings are.

**Index drift: 16 active plans are not yet cited above.** Commits from
2026-08-16 through 2026-09-04 landed real work owned by `module-export-uniformity/`,
`runtime-module-decomposition/`, `operator-resonance-alignment/`,
`microinteraction-motion-lifecycle/`, `creator-pathways/`, `core-css-spend-cut/`,
`layout-seat-squeeze/`, `resume-record/`, `deploy-module-graph/`,
`dimensional-expression-navigation/`, `css-scroll-dark-regression/`,
`data-attribute-css-token-refinement/`, `semantic-classname-layers/`,
`public-entrance-runtime-payload/`, `wrap-job-utility/`, and
`alignment-content-fit/` — none of them named in this file's active-owner
lists. All 16 have real `PLAN.md`/`FIX.md` content (none are zombie folders);
`data-attribute-css-token-refinement/` and `module-export-uniformity/` already
carry a full `index.spw`, but `microinteraction-motion-lifecycle/`,
`creator-pathways/`, `core-css-spend-cut/`, `layout-seat-squeeze/`,
`resume-record/`, `deploy-module-graph/`, `dimensional-expression-navigation/`,
`semantic-classname-layers/`, `public-entrance-runtime-payload/`,
`wrap-job-utility/`, and `alignment-content-fit/` still do not, which breaks the
plan-index convention's `standalone_rule` (an index must be readable without
opening `PLAN.md` first). Author those on next touch rather than in a batch —
each needs an accurate `conceptual_model` and `connection_points`, which this
pass did not have standing to guess for plans it did not implement.

Separately, a smaller pattern worth watching: several older plans (confirmed in
`interaction-loop-contract/PLAN.md`) still name pre-reorg flat paths
(`public/js/spw-state-inspector.js`, `public/js/spw-image-metaphysics.js`) for
work that landed under `public/js/runtime/` (`interaction-loop.js`,
`state-inspector.js`) instead. Treat any plan citing a bare `public/js/spw-*.js`
path as a stale-path candidate until confirmed against the current tree, the
same way `interaction-grammar/` was reconciled here.

## Maintenance Snapshot - 2026-07-12

Plan indexes now expose standalone semantics: `conceptual_model`, `plan_refinement` (tone, accuracy, direction, inspiration, alignment), `research_bridge`, `connection_points`, and `archive_status` (see `.spw/conventions/plan-index.spw`). Hand-refined plans live in `scripts/plan-refinements-data.mjs`. Validate reviewed indexes with `npm run plans:index:check`; rebuilding them requires an explicit `--force-generated` review. Local research routes through 2026-07 audits and appendices via `planning-ecology.spw#research_bridge_map`.

**Completed / implemented reference:** 13 plans are retained in place for citation safety; see `archive/2026-07-12-review-execution.md` for the full list and routing notes.

Dated record: `archive/2026-07-12-plan-ecology-semantics-architecture.md`. Audit: `.spw/audits/plan-ecology-semantics-2026-07.spw`.

### Review Execution - 2026-07-12

Every non-archive `index.spw` carries a first-line `# Review 2026-07-12 —` verdict. Those verdicts
have been propagated into structured `^"review_disposition"` blocks and executed **additively — no
folder moves**, so direct citations stay valid. Full ledger: `archive/2026-07-12-review-execution.md`.

- **73 plans reclassified** out of the backlog: **38 merged** into owners, **13 completed/implemented
  reference**, **13 rework** (kept active but rescoped, `rescope = required`), **7 split**, 1 idea-cache,
  1 tooling. The remaining ~112 plans held a `keep`/`retain` verdict and stay active owners.
- **Superseded sources** now set `owner_claim.status = "superseded"` and carry `merged_into`/`route_to`
  pointers; **merge owners** declare an `^"absorbs"` list. Find merged sources with
  `grep -rl 'disposition = \`merge\`' .agents/plans --include=index.spw`.
- **Consolidation hotspots:** `chrome-navigation-wonder` absorbed 5 shell/menu plans;
  `style-image-cohesion` + `topic-photo-svg-pass` absorbed the loose image passes;
  `css-architecture-readability` absorbed `css-maintainability-refactor` (archived 2026-08-18);
  `runtime-settings` absorbed the settings-discoverability/low-friction passes.
- **Do not regenerate:** `maintain-plan-directory-indexes.mjs` is guarded (`guardReviewedPlanTree`)
  while review markers exist — `--force-generated` would destroy these authored verdicts. Edit by hand.

## Maintenance Snapshot - 2026-06-30

The active tree is large enough that directory names alone are not a usable interface. The prior census found 173 active top-level plan folders plus `archive/`, 160 active `PLAN.md` files, 50 active `wip.spw` files, 13 total `FIX.md` files, and 11 true `FIX.md`-only tactical queues. The nonstandard folders remain intentional template tooling in `recent-plan-templates/`, revived image/style ownership in `style-image-cohesion/`, and empty local overgrowth in `mobile-density-operator-semantics/`.

Use virtual buckets before physical moves:

- Semantic rails and editor operations: `model-guided-refinement/`, `daily-kernel-development/`, `modular-experience-slices/`, `spw-surface-normalization/`, `agent-optimization/`, `agentic-dev-contracts/`. Use `agentic-dev-contracts/` for generated route/runtime facts, future plan/skill indexes, validation posture memos, and other invalidatable agent-development caches.
- CSS, layout, and interaction: `css-architecture-readability/`, `core-css-spend-cut/`, `css-state-legibility/`, `component-box-model-responsive-audit/`, `card-grid-density-audit/`, `floating-chrome-stack/`, `gesture-aria-hygiene/`, `attention-shell-contrast/`.
- Runtime, JS, and validation: `runtime-bootstrap-performance/`, `runtime-load-instrumentation/`, `runtime-module-fluency/`, `js-surface-ecology/`, `js-taxonomy-cleanup/`, `site-source-layout/`, `typescript-integration/`. Use this bucket for cold/warm load posture, cache strata, module mount cost, and metacognitive inspection utility.
- Media, image, and sensory material: `style-image-cohesion/`, `midjourney-design-concepts/`, `relational-attention-media/`, `site-color-tuning/`, `theme-palette-marketability/`.
- Public route, proof, and genre systems: `design-hub/`, `webpage-trope-vocabulary/`, `professional-skill-development-worldbuilding/`, `rpg-portal-fantasy/`, `expressive-layout-tropes-fidget-manuscript/`.
- Templates and tooling: `recent-plan-templates/` is a template source, not an active backlog item. Use its leaflet precipitation template for small .spw byproducts before promoting them into plans or conventions. `site-starter-component-kit/` owns the portable starter/component inventory boundary, not generated starter output yet.
- Fix queue: `FIX.md`-only folders remain active tactical work unless a dated archive note says the fix has landed or been superseded. Completed/superseded FIX references from this sweep are `overlay-layer-ownership/`, `menu-containment-navigation/`, `mobile-image-effects/`, and `runtime-route-css-regressions/`.

Consolidation posture:

- Prefer index-level archival before moving folders with direct citations.
- Give WIP-only folders a small `PLAN.md`, merge them into a clear owner plan, or archive them by index note when next touched.
- Split or cold-archive oversized plan artifacts before editing them broadly; `midjourney-design-concepts/`, `color-motion/`, `css-architecture-readability/`, and `rpg-portal-fantasy/` are the largest active candidates.
- Record recursive maintenance passes in `agent-optimization/PLAN.md`, `archive/README.md`, and `.spw/conventions/planning-ecology.spw`.
- Keep `/about/plans/` aligned with these buckets so the public editor surface exposes the same routing architecture as this README.

The dated record for this sweep lives in `archive/2026-06-30-plan-maintenance.md`.

## Maintenance Snapshot - 2026-06-19

The plans directory is an active ecology, not a flat list of equally current work. Treat the four canonical tracks as stable starting points, then route new work into the relevant bucket:

- Semantic rails: `model-guided-refinement/`, `daily-kernel-development/`, `spw-surface-normalization/`, `modular-experience-slices/`, `relational-attention-media/`, `agent-optimization/`.
- Runtime and architecture: `runtime-bootstrap-performance/`, `runtime-load-instrumentation/`, `runtime-module-fluency/`, `js-surface-ecology/`, `js-taxonomy-cleanup/`, `site-source-layout/`, `typescript-integration/`, `floating-chrome-stack/`.
- CSS, layout, and interaction: `css-maintainability-refactor/`, `component-box-model-responsive-audit/`, `vertical-rhythm-container-audit/`, `card-grid-density-audit/`, `card-anatomy-interactions/`, `state-satchel-card-gesture-fixes/`.
- Content, route, image, and RPG systems: keep route-specific work local unless it introduces a reusable semantic family or public editor contract.

Completed-reference decisions from this sweep live in `archive/2026-06-19-plan-maintenance.md`. Completed plans may remain in their original directories when other plans still cite them directly; physical archive moves should update references in the same patch.

Conversation audit redistribution from this sweep lives in `archive/2026-06-19-conversation-audit-redistribution.md`. Treat the broad audit prompts as archived source context and continue work in the assigned owner plans instead of creating parallel "all fronts" plans.

## Reviewed Plan Tree

The plan tree is not a uniformly active backlog. Treat each plan's `index.spw` `review_disposition` and `owner_claim.status` as the source of truth; merged and completed references remain in place for citation safety.

High-signal active owners:

- `design-hub/PLAN.md`
- `site-starter-component-kit/PLAN.md` - make compose.css, compose.js, design specimens, and component promotion rules usable for spawning new sites without copying the full Spwashi shell.
- `css-architecture-readability/PLAN.md`
- `compositional-css-electrostatics/PLAN.md` - active satellite for CSS/runtime parity, five-channel compositional tokens, gesture electrostatics, expression topology, rule-use theater, and raw-image integration; vocabulary decisions remain with their owner tracks.
- `site-color-tuning/PLAN.md`
- `chrome-navigation-wonder/PLAN.md` - shared shell, menu containment, floating chrome, and navigation wonder ownership.
- `shell-model-vocabulary-consolidation/PLAN.md` - census-then-glossary consolidation of shell/chrome/edge/overlay words and the 1,049-name `data-spw-*` attribute vocabulary; model and grammar choices gate on human review.
- `spellcraft-authoring/PLAN.md` - consolidated owner of spell/cauldron authorship: write/edit/decompose spells, select and style elements/concepts/artifacts through -intent channels, Stagecraft + G1/G2 attribute refit, live-performance and capture-interpretation constraints. Supersedes the five prior spell/cauldron tracks (each carries a merged-into note).
- `literacy-precipitation-press/PLAN.md` - north-star lore ladder: named esoteric effects -> bulletin boards -> print precipitation -> publishing surface -> paper manufacturer tuned to learnability and genre; editorial rungs gate on Spwashi.
- `runtime-bootstrap-performance/PLAN.md` - reduce serial loading, immediate layer width, observer cost, and warm-return friction while preserving staged policy-driven loading, cache-stratum ownership, and full observability.
- `floating-chrome-stack/FIX.md` - normalize floating chrome roles, tiers, console ownership, and discovery-credit alignment.
- `gesture-aria-hygiene/FIX.md` - keep gesture controls and ARIA state truthful while mobile interaction grammar settles.
- `attention-shell-contrast/FIX.md` - preserve readable attention shell contrast across route and ornament states.
- `modular-experience-slices/PLAN.md` - bolder file tree evolution supporting explicit "experience slice" ownership, practice beds, and tending-note handoffs. The first concrete pilot is `math-practice-labs`, with `attention-resonance-field` as the next slice contract candidate.
- `interaction-loop-contract/PLAN.md` - shared interaction-feedback contract for state inspector and image metaphysics, now broadening toward other guarded runtime surfaces.
- `gesture-state-refinement/PLAN.md` - mobile gesture cleanup, intentional menu / brace behavior, and console-facing inspection helpers.
- `navigation-header-disclosure/PLAN.md` - generated header disclosure, menu overlay state, and compact action ownership.
- `semantic-copy-depth/PLAN.md` - copy-depth tiers for entry, normal, rich, dense, technical, and genre surfaces.
- `spw-surface-normalization/PLAN.md` - lightweight normalization of .spw writing style (headers, ^"sections", references, ~#metadata) to align with workbench self-modeling while preserving local voice, plus mechanisms for greater navigability and explicit dimensionality (temporal rhythms, practice depth, semantic layer, collaboration phase).
- `model-guided-refinement/PLAN.md` - rails for less creative models: focus dimensions, semantic fixity tiers, elemental implementation effects, cross-language CSS/HTML/JS/.spw tracing, and the creative marketing engine contract for musicians/artists/collaborators.
- `daily-kernel-development/PLAN.md` - one-session development exercise for semantic capacity, brand physics, regional sensory design, and cross-discipline ergonomics across engineers, animators, illustrators, designers, musicians, and collaborators.
- `pretext-whimsy-lab/PLAN.md` - bounded Pretext measurement and projection work, now using a live/static host contract so typography physics stays opt-in and inspectable.
- `designer-conversation-canvas/PLAN.md` - touchable specimens, named tokens, and Pretext measurement bus for designer handoff on the public site.

Meta / ecology work:
- `agent-optimization/PLAN.md` - maturing the `.agents/`, skills, `.spw` bridges, and public editor surfaces for lower friction agent and editor operation (follows from the prior active plans review).

Completed/merged references retained in place (full routing ledger: `archive/2026-07-12-review-execution.md`):

- `overlay-layer-ownership/FIX.md` - `data-spw-overlay` is now a documented site contract and remains as rationale.
- `menu-containment-navigation/FIX.md` - the primary route/menu containment work landed on 2026-06-28; deferred items now route through shell and floating-chrome tracks.
- `mobile-image-effects/FIX.md` - the mobile raster effect work is superseded by the current `metaphysical-paper.css` and `image-metaphysics.js` locations.
- `runtime-route-css-regressions/FIX.md` - the missing visitation/bootstrap and route-structure failures have been repaired or superseded by current runtime and route sources.
- `component-semantics-document-host/FIX.md` - the document-host contract landed and remains available as implementation rationale.

## Archived Notes

Archived historical notes live in `archive/`. Use them as reference only:

- `archive/design-hub-expansion.md`
- `archive/overlay-alignment.md`
- `archive/2026-06-19-plan-maintenance.md`
- `archive/2026-06-19-conversation-audit-redistribution.md`
- `archive/2026-06-21-planning-ecology-recursive-maintenance.md`
- `archive/2026-06-30-plan-maintenance.md`
- `archive/2026-07-02-triage-css-spw-physics.md`
- `archive/2026-07-02-css-html-audit-alignment-responsive-performance.md`
- `archive/2026-07-02-clustering-progressive-enhancement-js-composability.md`
- `archive/2026-07-12-plan-ecology-semantics-architecture.md`
- `archive/2026-07-12-review-execution.md`

Archived plan folders: `archive/spw-css-architecture/` and `archive/css-semantic-modules/` landed and moved on 2026-07-02 in a ref-safe pass. The modular `public/css/` tree and its intent-variable contracts are their living successors; active selector/state work continues in `css-architecture-readability/` and `css-state-legibility/`.

Archive candidates should be notes whose intent is already superseded by a canonical track or a landed fix. Keep active backlog items out of `archive/` until the related work clearly lands or is replaced.
