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
- `spw-metaphysical-language/PLAN.md` — the theory taken up through four passes (copy, parse to layout, CSS depth, a field only if earned), with the construct codex, sigil-property alignment, production ladder and industry briefs as reference; use when work describes or arbitrates the Spw language itself.
- `homonym-renaming/PLAN.md` — the lexicon: verdicts on load-bearing homonyms (settle/prime/ground/phase) and the attribute/event clusters, anchored on `.spw/conventions/word-sets.spw`; use before adding, auditing or renaming shared vocabulary.
- `agent-optimization/PLAN.md` — gate, not diary. Use when the work changes the agent/editor operating environment. Prove always-on spend with `npm run check:agents -- --spend`.
- `landing-visual-hierarchy/PLAN.md` — the single landing owner: cluster rank, one promise and one next move per landing.

Small semantic discoveries do not always need a new plan. Use `.agents/plans/reference-assignment-template/templates/semantic-insight-cache.spw` for a single cache/audit/prime entry when implementation should wait.

## Owner Map - 2026-10-12

Every live folder, once, by area. Open a plan's `index.spw` for its disposition and its open questions (`npm run wonder`); this map only says where work goes. Where two plans touch one seam, the first named owns it and the other cites. "Holds" names an archived plan whose remaining work moved here.

**Spw language and vocabulary**

- `spw-metaphysical-language/` — the language itself: four passes from copy to depth, then codex, sigil alignment, drift ledger; holds the codex shell from `spw-architecture-ecology`.
- `spw-inquiry-loop/` — the loop a question runs (probe, Spw update, refactor, test), the capability ledger, `plans:twinkle`, and the parser's arrival in the site. Was `spw-language-v04` until 2026-10-27.
- `spw-quest/` — spw.quest, the guide and the install: a first reward before installing, and a plan surface agents review.
- `factshift-center/` — factshift.center on factshift.com's ground: a held line of Spw laid out as its anatomy, the app's snapshot, and what the canvas shows about the language.
- `neuroplasticity-topic/` — a topic on plasticity as factshift's question asked of the learner: four ideas, each with a figure and an interactive on factshift.center's canvas; claims wait on their sources.
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
- `topic-building-blocks/` — topics as a course: the root shelf, one home for each repeated figure, and the shared tuner; holds the field guides and `living-learning-surface`.
- `blog-blob-spw/` — the blog unit (Starter) and its `.spw`.
- `promo-wonder-cycle/` — daily and weekly lanes; holds the release-day receipts, and since 2026-11-06 the season offer's two creator questions (prices as shipped, the film backer) and `funding-proof-cards`' rule.

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

## Maintenance Snapshot - 2026-11-08

The creator, 2026-11-08: developing the granularity and alignment of the plans is valuable for foresight and for establishing a communicable backlog.

- **Alignment across owners.** [update-clusters-2026-11.spw](./semantic-copy-depth/update-clusters-2026-11.spw) groups granular commits across the plans that share the entrance (clusters A to F). Each owner plan keeps its slice and points back: component-region-personality, interaction-grammar, spw-inquiry-loop.
- **Planes.** [spw-planes](./spw-planes/PLAN.md) holds four agent reports as `.spw`, with 21 wonders in one harvested file. Its next moves without a taste call are R2 and R3.
- **Ecosystem.** Two wonders in [ecosystem-architecture](./ecosystem-architecture/index.spw): what each site keeps or plays (interactive and archival purposes, slanted toward utility), and what spwashi.com should carry to lore.land, whose own plans grow that domain's theory and creative use.
- **Theory caches grown in place.** cognitive-informatics-interaction now has roots, branches by axis, and cii-006 to cii-009. Three neighbour caches were added the same days: plugin ecology, syntax and runtime, and factshift's cognitive substrate.

## Maintenance Snapshot - 2026-11-06

Plan pass, asked as granularity, meaningful reference, creativity and updated wonder. Eight readers took the 54 live plans by area; one coordinator verified their boldest claims, archived one plan and ran the gates.

- **Granularity.** Next work in each plan is a numbered slice one session can land: the paths it touches, its gate (none, a sensor, or the creator's look) and its check. Landed narrative became Landed lines with commits. PLAN and FIX prose went from 9,219 to 7,709 lines; css-architecture-readability 807 -> 400, midjourney-design-concepts 1,073 -> 649, color-motion 868 -> 696, chrome-navigation-wonder 221 -> 84.
- **Meaningful reference.** Every path, line, anchor and commit kept was opened. Drifting line numbers became function names or anchors; three cited hashes that were not this repo's (factshift's app commits, a Wrangler version id) now say where they live. `npm run audit:plans`: 27 warn -> 0.
- **Drafts verified.** A finished session left slice tables in six plans. Kept: the dual image hold, the unread seat and lens wiring, the badge's raw duration. Cut as false: two-way hydration through the satchel, a `probe | frame | surface` figure vocabulary, a hand-edited provenance registry (provenance already exists in `image-provenance.js`), and a parse failure the reader does not have.
- **Creativity.** Each plan that had gone hygienic carries one buildable proposal, as a slice or as an alternative in a wonder: the cauldron lens as the `[mode]` slot, a walk trail written as `origin ~> step ~> now`, a terms card whose slots are the terms, washi-tape spells as the press's first paper artifact, a lab's scripts-off figure as a hand-drawn scan, sensors that print a reader count or a writer as one Spw line.
- **Updated wonder.** Plan wonders 74 -> 112; probes without `~#expect` site-wide 195 -> 140. `scripts/wonder.mjs` now reads a dated `~#answer(…)` like a plain one, so the answered count is honest (11).
- **Findings worth a slice:** six of the seven properties `applyModuleSemantics` writes on every module host have no reader (runtime-bootstrap-performance B3); `serializeElementToSpw` and `hydrateElementFromSpw` have no callers, and hydrate turns pasted claims into `data-spw-*` attributes (brace-semantics 3.5); `spw-paste.js` pulls the seed-card pack onto about 55 pages for 4 hosts (deploy-module-graph D1); the scan placed on `/topics/software/` on 2026-11-05 renders through the watercolor treatment by default (midjourney-design-concepts slice 5, a look).
- **Archived:** [ecosystem-offer-2026-10](./archive/ecosystem-offer-2026-10/PLAN.md), by its own October rule; its questions moved to [promo-wonder-cycle](./promo-wonder-cycle/PLAN.md). Candidates held with evidence: agentic-dev-contracts (both wonders answered; cited from `site.spw` and two conventions), operator-resonance-alignment, shell-model-vocabulary-consolidation, data-attribute-css-token-refinement (after its item 3), model-collaborator-lore-surfaces (parked by its own gate).

## Maintenance Snapshot - 2026-11-05

Design-philosophy pass. The creator gave directions through the day; each now sits with one owner, and every taste call is a question rather than a rule. The evidence is in [chrome-ecology-2026-11](../../.spw/caches/chrome-ecology-2026-11.spw) (a theory read against what runs, with a live probe of floating chrome) and in censuses dated in each plan.

- **The floating chrome theory may need revising** → [floating-chrome-stack](./floating-chrome-stack/FIX.md): a six-line revision (a host that answers in the page's words, z that follows how long a thing stays, width places and the pointer sizes, rungs not slots, one carry corner, a ground over text), its first line sharpened the same evening: each floating piece is one Spw expression whose slots carry the page's words and work as its controls, so the chrome is more useful, more Spw native, and teaches one construct per piece; the satchel offers the page's own Spw first. Waits on the creator's words; changes end at live demos.
- **Harmony across components** → [component-region-personality](./component-region-personality/PLAN.md): a class that renders by its element, one role with many radii, three undefined shape tokens, three chip dialects on one Home screen. The principle "role, not element" is a question there; [color-motion](./color-motion/PLAN.md) holds the timing half (an invalid `calc()` that drops card motion, chip timing that snaps, the focus ring).
- **Useful, informative, playful** → [interaction-grammar](./interaction-grammar/PLAN.md): receipts computed and never painted, the settings credit as the model, loops that do not close, one hold on two clocks. [settings-ornament-resonance](./settings-ornament-resonance/PLAN.md) asks whether its patch bay and those receipts share the satchel, and takes spw.quest's `/pivot` as a model for guided trying.
- **More of the creator's own art, linking pages, more immediately, and thematically whole** → [midjourney-design-concepts](./midjourney-design-concepts/PLAN.md), with the first screen at [landing-visual-hierarchy](./landing-visual-hierarchy/PLAN.md): 23 of 214 route pages open on hand-made art, 138 carry no image, and the registry does not record who made an image, so the first slice is that field, after the creator says which families are theirs.
- **Spw integration, editing, mutation, composability** → [spw-metaphysical-language](./spw-metaphysical-language/PLAN.md) holds the wonder; [brace-semantics](./brace-semantics/PLAN.md) holds the then-and-now question about early readings (a highlighter per container, `<of>`, `<&>`); [spw-quest](./spw-quest/PLAN.md) holds the instruments that already mutate a line and the proposed performances and typed placeholders. The public statement of what the language should let you say is on `/topics/software/spw/#expressiveness-goals`.

## Maintenance Snapshot - 2026-10-25

UI and UX pass. Seventeen plans for spwashi.com's chrome, interaction, layout, settings, capture, reading and access were read against the tree.

- **One sitting for the looks.** [`ui-review-sitting-2026-10.spw`](../../.spw/caches/ui-review-sitting-2026-10.spw) collects every browser look these plans wait on. It is grouped by where the reader stands (`/design/`, home, `/settings/`, `/topics/`, the hubs), and each look carries its question, its options, how to look, and what it unblocks. What can land without a look comes first, in the order a reader would notice it.
- **Every gate names a place to look.** Three looks had no still (Services, the settings presets, `/play/`). screenshot-semantics now adds those recipes first.
- **Timing is judged live.** A still is one frame, and capture mode hides floating chrome, the section handle and the state inspector. So the console size, the presets and card timing are looked at live or recorded.
- **One hand per file.** Home had three plans queued and `settings/index.html` had four; the sitting orders them. Breadcrumbs, the menu toggle, the pocket corner, the cauldron and the entrance copy each have one owner now.
- **Access has an owner.** No sensor checked contrast or touch targets. semantic-html-normalization takes them, and the first small fix is the Edit and Copy controls on Spw code blocks.
- **Drift corrected, with a wip entry in each plan:** paths that moved, line numbers that shifted under the 2026-10-25 Home rewrite (`eff5abfd`), stale counts, and archived dependencies. Two plans whose Status and wip named different next slices now name one (spellcraft-authoring, color-motion).

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
