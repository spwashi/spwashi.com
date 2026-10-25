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

- `modular-experience-slices/PLAN.md` — use slice contracts when ownership spans HTML, CSS, JS, `.spw`, validation, and practice beds.
- `interaction-grammar/PLAN.md` — practical interactive circuits and the shared interaction-feedback loop (`runtime/interaction/loop.js`, `arc-taxonomy.js`); calm gesture intent on mobile.
- `floating-chrome-stack/FIX.md` — normalize floating chrome roles, tiers, console ownership, and viewport participation.
- `semantic-copy-depth/PLAN.md` — formalize entry/normal/dense/technical copy depth alongside the existing semantic layers.
- `component-region-personality/PLAN.md` — component real estate and region personality, so copy relates to a growing component ecology.
- `site-starter-component-kit/PLAN.md` — portable compose.css/compose.js starter boundary, component specimen promotion, and inventory command for spawning new sites.
- `spw-metaphysical-language/PLAN.md` — construct codex, sigil-property alignment protocol with drift ledger, production/manufacturing ladder past the screen, and industry integration briefs; use when work describes or arbitrates the Spw language itself.
- `homonym-renaming/PLAN.md` — the lexicon: verdicts on load-bearing homonyms (settle/prime/ground/phase) and the attribute/event clusters, anchored on `.spw/conventions/word-sets.spw`; use before adding, auditing or renaming shared vocabulary.
- `agent-optimization/PLAN.md` — gate, not diary. Use when the work changes the agent/editor operating environment. Prove always-on spend with `npm run check:agents -- --spend`.
- `landing-visual-hierarchy/PLAN.md` — the single landing owner: cluster rank, one promise and one next move per landing.

Small semantic discoveries do not always need a new plan. Use `.agents/plans/reference-assignment-template/templates/semantic-insight-cache.spw` for a single cache/audit/prime entry when implementation should wait.

## Owner Map - 2026-10-12

Every live folder, once, by area. Open a plan's `index.spw` for its disposition and its open questions (`npm run wonder`); this map only says where work goes. Where two plans touch one seam, the first named owns it and the other cites. "Holds" names an archived plan whose remaining work moved here.

**Spw language and vocabulary**

- `spw-metaphysical-language/` — the language itself: codex, sigil alignment, drift ledger; holds the codex shell from `spw-architecture-ecology`.
- `spw-language-v04/` — the parser's arrival in the site; profiles and typed references.
- `spw-quest/` — spw.quest, the guide and the install: a first reward before installing, and a plan surface agents review.
- `brace-semantics/` — what each brace pair means, labels the parser checks, one serializer for page, region and component, and the `< & >` instrument; five decisions go to the creator first.
- `operator-resonance-alignment/` — sigils as handles across routes, chips and capture; holds craft guard 3 from `operator-semantics-refinement`.
- `homonym-renaming/` — the lexicon: true homonyms and the attribute and event clusters; holds `language-reclustering`.
- `shell-model-vocabulary-consolidation/` — shell, chrome, edge and overlay words.
- `component-region-personality/` — component real estate and region personality.

**CSS, layout and tokens**

- `css-architecture-readability/` — canonical; literate ownership and traceability.
- `css-cascade-stratification/` — layer ownership; holds the pressed-state contract from `css-state-legibility`.
- `core-css-spend-cut/` — first paint ships structure; atmosphere arrives later.
- `data-attribute-css-token-refinement/` — anchored custom properties, and the runtime writes CSS reads; holds `css-sensitive-attribute-writes`.
- `layout-seat-squeeze/` — seats, squeeze, frame coverage and edges; holds `region-attenuation-coverage` and `alignment-content-fit`.
- `color-motion/` — canonical; colour and microinteraction timing.

**Chrome, navigation and interaction**

- `chrome-navigation-wonder/` — the shared shell, menus, rails and regions; holds `navigation-header-disclosure` and `page-region-discoverability`.
- `floating-chrome-stack/` (FIX) — floating chrome roles, tiers and clearance.
- `interaction-grammar/` — interactive circuits and calm gestures; holds the loop contract and `gesture-state-refinement`.
- `spellcraft-authoring/` — spells and the cauldron.
- `cauldron-lens-composition/` — what a lens does to a composition.
- `state-block-projections/` — state blocks and the lens seat; holds `attention-shell-contrast` and `mindful-collection-controls`.

**Settings, media and capture**

- `settings-ornament-resonance/` — the settings shelf: try a look and see what changed; holds the umbrella role of `runtime-settings`.
- `settings-theme-wiring/` (FIX) — every setting changes something visible, or it goes.
- `midjourney-design-concepts/` — canonical; concept studies, asset promotion and the image rule; holds what `style-image-cohesion` and `design-studio` left open.
- `screenshot-semantics/` — selection and priming for screenshots.

**Runtime and JS**

- `runtime-bootstrap-performance/` — boot cost, serial imports, observers.
- `runtime-plane-consolidation/` — canonical write, observe and schedule paths; holds `runtime-module-decomposition` and what `js-surface-ecology` left.
- `module-contract-overhaul/` — what each module mounts, reads, writes and leaves; holds `runtime-module-fluency` and the settings-changed consolidation.
- `engagement-clusters/` — the `@` wakes facet of the module contract.
- `deploy-module-graph/` — a small boot graph first; catalogs by address.
- `site-source-layout/` — the authored-site boundary; holds the decisions `typescript-integration` left.

**Copy, reading and topics**

- `semantic-copy-depth/` — copy depth and tone; holds voice, typography, `editorial-readability` and `audience-onboarding-copy`.
- `copy-localization/` — copy keys that land search on a sentence; locale editions later.
- `semantic-html-normalization/` — landmarks, ids, ARIA; JS-off parity.
- `topic-building-blocks/` — topics as a course; holds the field guides and `living-learning-surface`.
- `blog-blob-spw/` — the blog unit (Starter) and its `.spw`.
- `promo-wonder-cycle/` — daily and weekly lanes; holds the release-day receipts.
- `ecosystem-offer-2026-10/` — the season's offer copy; holds `funding-proof-cards`' rule.

**Routes and genres**

- `designer-conversation-canvas/` — measurement and interpretation for the specimen; holds the success test from `design-hub`.
- `landing-visual-hierarchy/` — the single landing owner; holds `landing-page-hierarchy-2026-08-21` and the Projects nav question.
- `profile-character-card-development/` — profile and character sheet as one model; owns the RPG Wednesday route after `rpg-portal-fantasy`.
- `literacy-precipitation-press/` — the north-star lore ladder.
- `folio-worktable/` — folio studies and readings.
- `model-collaborator-lore-surfaces/` — tools and lore for a human model; parked until a shoot is booked.
- `workers-wonder-kit/` — the workers' shared shell.
- `smut-today-crew/` — smut.today as a crew world: staff as the leads, a daily draw with pins.

**Reuse, agents and practice**

- `site-starter-component-kit/` — the portable artifact; owns the bundling pilot; holds `portable-css`.
- `ecosystem-architecture/` — ranks CSS and runtime slices by what they are worth to peers, adoption and the codebase, and lists what may travel through the peer kit; every slice cites its owner, and it holds no seam another plan holds.
- `modular-experience-slices/` — slice contracts; holds dimensional navigation.
- `reference-assignment-template/` — canonical; intern-sized briefs plus the insight-cache and tending templates; holds the ergonomics from `daily-kernel-development`.
- `agent-optimization/` — the agent gate.
- `agentic-dev-contracts/` — one validation entrypoint and one manifest.
- `history-reflow/` — commit grammar and the reflow method.

## Maintenance Snapshot - 2026-10-12

Tree census: **50 live folders (48 PLAN.md, 3 FIX.md)**. Two plans opened today: `spw-quest` and `smut-today-crew`, both written to be reviewed by agents before anything is built.

- **A plan sensor exists now.** `npm run audit:plans` checks each live plan against the tree: a dated Status and its age, relative links, `npm run` names, named repo paths, and cited commits (here or in the workbench). It prints a headline when clean and findings otherwise, and `--check` fails on a broken instruction. The plan-maintenance and feature-planning skills used `spw:plan:check` and `spw:plan:status`, which read the workbench's plans and fail here; they now point at this sensor. It is also an editor task that fills the Problems panel.
- **First run: 5 hard, 99 warn. Now 0 and 0.**
  - Twenty `npm run check` steps became `check:local`.
  - Renamed paths point at their successors: `handles/operators/`, `shell/chrome/`, `routes/surfaces/*.css`.
  - Proposed files are marked proposed: the codex, the sigil-property matrix, the blog weave script, two partials, and the Midjourney patches.
  - Two citations of a matrix that was never written now cite the plan that specifies it.
  - The audit learned to read a line that already says a file is proposed, gone or split, so history is not reported as drift.
- `history-reflow/BRIEF.md`, the August run's hand-off, moved into `HISTORY.md`.

## Maintenance Snapshot - 2026-10-10

Tree census: **48 live folders (46 PLAN.md, 3 FIX.md), 40 more archived**. Every live folder was reviewed for intent, detail and value in implementation; reasons per folder are in `archive/README.md`.

- **Archived 40:** 17 landed, 14 merged into an owner (each owner carries an `Absorbed 2026-10-10` section), 7 dormant, 2 superseded. The citations in 212 files followed the folders, including the GitHub links on `/about/plans/`. Broken relative links in live plans: 55 → 2. The two left were already broken (`spw-metaphysical-language` cites a `sigil-property-matrix.spw` that was never written).
- **Every live plan opens with a Status dated 2026-10-10:** what landed, the one next slice, and its gate. Status claims were checked against the tree, and stale paths, counts and the bare `check` script (which runs `npm audit` first) were corrected to `check:local`.
- **Questions for the creator are now harvestable:** 31 new `#>wonder` blocks in the owner plans, so `npm run wonder` lists them (158 open on 84 surfaces). The ones that unblock more than one plan: the arrival lever (`runtime-plane-consolidation`), the facet operator mapping (`module-contract-overhaul`), the Projects nav (`landing-visual-hierarchy`) and the lens seat (`state-block-projections`).
- **Small fixes found by the review landed with it:** the dead viewport-activation setting is gone from `/settings/`, the folio pill says 58 scanned, the curriculum description says what is built, and the spw.quest drift rule sits beside `INSTRUCTION_SETS`.

## Maintenance Snapshot - 2026-10-06

Tree census: **88 live folders (84 PLAN.md), 148 archived PLAN.md**. All 168 live folders were read against the tree and their own git history.

- **Archived 80** with a reason each (`archive/README.md`): 65 landed, 10 dormant with a named owner, 5 superseded by their own ownership notes. Content still owed went to its owner first: release-day receipts to `promo-wonder-cycle`, design-surfaces findings to `settings-theme-wiring/FIX.md`, craft guard 3 to `operator-semantics-refinement`.
- **Three shared seams given one owner** (named in the map above): kernel extraction, settings-changed consolidation, and the design bundling pilot.
- **Four folders no bucket named** now sit in `since_2026_07_12` in `index.spw`: design-studio, ecosystem-offer-2026-10, projects-hub, spw-document-room.
- **Oversized, still live:** midjourney-design-concepts (1052 lines), color-motion (860), css-architecture-readability (801), rpg-portal-fantasy (537), spw-metaphysical-language (520). The first three were checked patch by patch and open with what landed; their commit series, roadmaps and landing notes moved to a sibling `HISTORY.md` (146 lines), and the css-architecture-readability cap ratcheted 850 → 810. The next split is by patch family, not by date.
- Snapshots before 2026-10-06 moved to `archive/plan-index-snapshots-2026.md`.

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
