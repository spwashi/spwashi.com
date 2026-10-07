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
- `modular-experience-slices/PLAN.md` — use slice contracts when ownership spans HTML, CSS, JS, `.spw`, validation, and practice beds.
- `interaction-grammar/PLAN.md` — practical interactive circuits and the shared interaction-feedback loop (`runtime/interaction/loop.js`, `arc-taxonomy.js`).
- `gesture-state-refinement/PLAN.md` — calm gesture intent on mobile; leaf controls stay themselves; prime names the next verb.
- `navigation-header-disclosure/PLAN.md` — glyph hamburger on coarse/pocket; labeled Routes is inline-mode copy; overlay contract stays explicit.
- `floating-chrome-stack/FIX.md` — normalize floating chrome roles, tiers, console ownership, and viewport participation.
- `semantic-copy-depth/PLAN.md` — formalize entry/normal/dense/technical copy depth alongside the existing semantic layers.
- `spw-architecture-ecology/PLAN.md` — `.spw` topology, promotion protocol, ecology coordinators, owner registry, component-template surface, `site.spw` slimness, review graduation, language-ecology alignment, slice promotion, convention hygiene, and precipitated agent/editor indexes.
- `relational-attention-media/PLAN.md` — attention as self/local/global relation plus local media-seed production across genres.
- `component-region-personality/PLAN.md` — component real estate and region personality, so copy relates to a growing component ecology.
- `site-starter-component-kit/PLAN.md` — portable compose.css/compose.js starter boundary, component specimen promotion, and inventory command for spawning new sites.
- `spw-metaphysical-language/PLAN.md` — construct codex, sigil-property alignment protocol with drift ledger, production/manufacturing ladder past the screen, and industry integration briefs; use when work describes or arbitrates the Spw language itself.
- `language-reclustering/PLAN.md` — dimensional clusters for the attribute/event lexicon, census-driven trace coverage, event-grammar boundary (broadcast vs bus-local), nutritious-architecture practices; use when vocabulary is added, audited, or consolidated.
- `homonym-renaming/PLAN.md` — semantic-geometry verdicts on load-bearing homonyms (settle/prime/ground/phase), echo-vs-homonym criteria, alias-windowed rename mechanics; use before renaming any shared vocabulary.
- `agent-optimization/PLAN.md` — gate, not diary. Use when the work changes the agent/editor operating environment. Prove always-on spend with `npm run check:agents -- --spend`.
- `landing-visual-hierarchy/PLAN.md` — 2026-08-21 session: landing cluster rank, team desks, guild seating, climate models, and ontology-harmony ledger for experimental voices.

Small semantic discoveries do not always need a new plan. Use `.agents/plans/model-guided-refinement/templates/semantic-insight-cache.spw` for a single cache/audit/prime entry when implementation should wait.

## Owner Map - 2026-10-06

Every live folder, once, by area. Open a plan's `index.spw` for its disposition; this map only says where work goes. Where two plans touch one seam, the first named owns it and the other cites.

**Spw language and vocabulary**

- `spw-metaphysical-language/` — the language itself: codex, sigil alignment, drift ledger.
- `spw-language-v04/` — the parser's arrival in the site; profiles and typed references.
- `spw-architecture-ecology/` — `.spw` topology, promotion, owner registry; holds what `spw-surface-normalization` left.
- `operator-semantics-refinement/` — operators true to the lore; craft guards from `spw-operator-pages`.
- `operator-resonance-alignment/` — sigils as handles across routes, chips and capture.
- `language-reclustering/` — the attribute and event lexicon in declared clusters.
- `homonym-renaming/` — settle, prime, ground, phase: rename only true homonyms.
- `shell-model-vocabulary-consolidation/` — shell, chrome, edge and overlay words.
- `language-ladder-runtime-instrumentation/` — a development experience that teaches as it runs.
- `component-region-personality/` — component real estate and region personality.
- `spw-document-room/` — a `.spw` file opened as a room at `/open/`.

**CSS, layout and tokens**

- `css-architecture-readability/` — canonical; literate ownership and traceability.
- `css-cascade-stratification/` — layer ownership; holds the pressed-state contract from `css-state-legibility`.
- `core-css-spend-cut/` — first paint ships structure; atmosphere arrives later.
- `compositional-css-electrostatics/` — CSS as a projection of meaning, space and attention.
- `data-attribute-css-token-refinement/` — anchored custom properties.
- `css-sensitive-attribute-writes/` — runtime writes that CSS reads.
- `layout-seat-squeeze/` — seats and squeeze; holds content-responsive layout, page frames and grid density.
- `region-attenuation-coverage/` — every frame gets a seat or an authored decision.
- `alignment-content-fit/` — alignment from phone to wide desktop, after text scaling.
- `portable-css/` — routes to `.spw/caches/portable-css-2026-09.spw`.
- `color-motion/` — canonical; colour and microinteraction timing.

**Chrome, navigation and interaction**

- `chrome-navigation-wonder/` — the shared shell, menus and navigation; breadcrumbs are its Phase 2.
- `navigation-header-disclosure/` — the header disclosure and overlay contract.
- `floating-chrome-stack/` (FIX) — floating chrome roles, tiers and clearance.
- `attention-shell-contrast/` (FIX) — attention shell contrast across states.
- `page-region-discoverability/` — owner of record for regions, rails and anatomy.
- `gesture-state-refinement/` — calm gesture intent on mobile.
- `interaction-grammar/` — interactive circuits; holds the loop contract from `interaction-loop-contract`.
- `spellcraft-authoring/` — spells and the cauldron; absorbed the five spell plans and `cognitive-navigation`.
- `cauldron-lens-composition/` — what a lens does to a composition.
- `state-block-projections/` — Spw state blocks on components with real state.
- `mindful-collection-controls/` — undo and clear for collections.

**Settings, themes and install**

- `runtime-settings/` — the local-only settings surface.
- `settings-ornament-resonance/` — quick-start choices with visible comparisons.
- `settings-theme-wiring/` (FIX) — saved settings that do not reach panels.
- `shell-logo-branding/` — the mark in the shell.
- `pwa-experience/` — install, offline and update flow.

**Runtime and JS**

- `runtime-bootstrap-performance/` — boot cost, serial imports, observers; holds `locomotion-collapse-redistribution`.
- `runtime-module-decomposition/` — extractions into kernel contracts; owns the seam `runtime-plane-consolidation` Phase 6 names.
- `runtime-plane-consolidation/` — canonical contracts as the default path.
- `runtime-module-fluency/` — calm at rest, inspectable when asked.
- `module-contract-overhaul/` — what each module mounts, reads, writes and leaves; owns the settings-changed consolidation `language-reclustering` cites.
- `module-export-uniformity/` — export patterns and the runtime medium ecology.
- `engagement-clusters/` — the `@` wakes facet of the module contract.
- `deploy-module-graph/` — a small boot graph first; catalogs by address.
- `mobile-runtime-foundation/` — mobile regions, inspect and invoke.
- `js-surface-ecology/` — the shape of `public/js`.
- `typescript-integration/` — typed tooling and registries.
- `site-source-layout/` — the authored-site boundary.

**Copy, reading and topics**

- `semantic-copy-depth/` — copy depth and tone; holds voice, typography and `editorial-readability`.
- `audience-onboarding-copy/` — the entrance routes.
- `copy-localization/` — localization that keeps English source legible.
- `semantic-html-normalization/` — landmarks, ids, ARIA; JS-off parity.
- `topic-building-blocks/` — topics as a course; holds the math and learning-science field guides.
- `living-learning-surface/` — the curriculum report as concept-first lessons.
- `blog-blob-spw/` — the blog unit (Starter) and its `.spw`.
- `promo-wonder-cycle/` — daily and weekly lanes; holds the release-day receipts.
- `ecosystem-offer-2026-10/` — the season's offer copy; holds `funding-proof-cards`' rule.

**Media, image and capture**

- `midjourney-design-concepts/` — canonical; concept studies and asset promotion.
- `style-image-cohesion/` — the image grammar; holds `production-demonstration-pass`.
- `svg-surface-integration/` — SVG in the design ecosystem; holds canopy depth.
- `visual-capture-ecology/` — QA stills and capture cards; holds `rpg-asset-capture-frames`.
- `screenshot-semantics/` — selection and priming for screenshots.
- `relational-attention-media/` — attention as self, local and global relation.
- `pretext-whimsy-lab/` — bounded text physics.

**Routes and genres**

- `design-hub/` — `/design/`; owns the specimen.
- `designer-conversation-canvas/` — measurement and interpretation for the specimen.
- `design-studio/` — three small review surfaces for collaborators.
- `landing-visual-hierarchy/` — landing rank; `landing-page-hierarchy-2026-08-21/` is its measured companion.
- `rpg-portal-fantasy/` — RPG Wednesday as projection of topic merits.
- `profile-character-card-development/` — profile and character sheet as one model; holds `rpg-session-notes`.
- `literacy-precipitation-press/` — the north-star lore ladder.
- `folio-worktable/` — folio studies and readings.
- `projects-hub/` — the projects route.
- `model-collaborator-lore-surfaces/` — tools and lore for a human model.
- `workers-wonder-kit/` — wap.mom and smut.today workers.
- `quest-workbench-feedback/` — quest workbench and feedback entry.

**Reuse, agents and practice**

- `site-starter-component-kit/` — the portable artifact; owns the bundling pilot that `design-hub` and `designer-conversation-canvas` feed.
- `modular-experience-slices/` — slice contracts; holds dimensional navigation.
- `model-guided-refinement/` — rails for less creative models.
- `daily-kernel-development/` — the one-session kernel.
- `reference-assignment-template/` — canonical; intern-sized briefs.
- `recent-plan-templates/` — `.spw` templates for new plans.
- `agent-optimization/` — the agent gate.
- `agentic-dev-contracts/` — one validation entrypoint and one manifest.
- `history-reflow/` — commit grammar and the reflow method.

## Maintenance Snapshot - 2026-10-06

Tree census: **88 live folders (84 PLAN.md), 148 archived PLAN.md**. All 168 live folders were read against the tree and their own git history.

- **Archived 80** with a reason each (`archive/README.md`): 65 landed, 10 dormant with a named owner, 5 superseded by their own ownership notes. Content still owed went to its owner first: release-day receipts to `promo-wonder-cycle`, design-surfaces findings to `settings-theme-wiring/FIX.md`, craft guard 3 to `operator-semantics-refinement`.
- **Three shared seams given one owner** (named in the map above): kernel extraction, settings-changed consolidation, and the design bundling pilot.
- **Four folders no bucket named** now sit in `since_2026_07_12` in `index.spw`: design-studio, ecosystem-offer-2026-10, projects-hub, spw-document-room.
- **Oversized, still live:** midjourney-design-concepts (1052 lines), color-motion (860), css-architecture-readability (801), rpg-portal-fantasy (537), spw-metaphysical-language (520). The first three were checked patch by patch and open with what landed; their commit series, roadmaps and landing notes moved to a sibling `HISTORY.md` (146 lines), and the css-architecture-readability cap ratcheted 850 → 810. The next split is by patch family, not by date.
- Snapshots before 2026-09-27 moved to `archive/plan-index-snapshots-2026.md`.

## Maintenance Snapshot - 2026-09-27

Tree census: **163 live plans, 64 archived**. Nine folders opened since 2026-09-20 and none closed; the archive step in `spw-plan-maintenance` is the priority debt, not more indexes. Details and counts: `.spw/audits/plan-spw-tree-2026-09.spw#recensus_2026_09_27`.

- **Index check green again.** `topical-learning-links/learning-transfer.spw` had no first-line review since 2026-09-23; reviewed in place. Eleven folders opened 2026-09-19 through 2026-09-26 that this index never named now sit in `since_2026_07_12` (author `index.spw` on next touch, not in batch).
- **Citations:** 1094 root-anchored paths across live plans, 155 unresolved. One had a single new home and was rewritten (`quest-workbench-feedback`, the worker moved to `workers/spw-quest/`). The rest are split files the 2026-09-17 legend above already reads, deliberate non-paths, or never-committed `.agents/state` precipitates. Left as written.
- **Runtime/JS bucket order:** `typescript-integration` now records what landed (build, site-contracts, sitemap compiled from `scripts/ts`; thirteen typed browser modules) and shares three decisions with `site-source-layout`: the M0 ship-list import method, the M2 `public/ts` to `src/ts` tsconfig change, and L3 uncommitted output. Order is M0 decision, M0, M2; the `site/` move waits behind them.
- **Nearest archive candidates:** `release-day-resonance-2026-09-13` and `release-day-discovery-2026-09-26`, once their receipts are written into an owner plan.

**Deeper pass, same day: CSS tokens the runtime writes, and the Spw interpreter.** Seven folders archived with reasons (`archive/README.md`): two landed palette plans, the never-implemented `site-color-tuning`, `minimal-brace-disclosure`, the closed `css-scroll-dark-regression` fix, the `theme-text-contrast` receipt, and the `theming-icon-packs-public-versioning` umbrella split to four owners. Live count 157 after the moves (a folder landed from a concurrent session during the pass). Three ownership gaps closed on paper: `css-sensitive-attribute-writes` now names the property-write sensor (`style-property-contract.mts`; 40 files write 115 properties), `spw-language-v04` Phase 4 owns the parser's arrival in the site (v0.3.0 generated parser, on-demand runtime parser, build-time expression manifest; the v0.4 spec never reached the pinned workbench), and `semantic-html-normalization` owns JS-off parity and names the probe that does not exist yet. Reading order per cluster: `.spw/audits/plan-spw-tree-2026-09.spw#deeper_pass_2026_09_27`.

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
- `archive/plan-index-snapshots-2026.md` — maintenance snapshots 2026-06-19 to 2026-09-20 and the 2026-09-17 plan tree.

Archived plan folders: `archive/spw-css-architecture/` and `archive/css-semantic-modules/` landed and moved on 2026-07-02 in a ref-safe pass. The modular `public/css/` tree and its intent-variable contracts are their living successors; active selector/state work continues in `css-architecture-readability/` and `css-cascade-stratification/`.

Archive candidates should be notes whose intent is already superseded by a canonical track or a landed fix. Keep active backlog items out of `archive/` until the related work clearly lands or is replaced.
