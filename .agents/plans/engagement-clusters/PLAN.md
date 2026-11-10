# Engagement Clusters

**Status 2026-11-06.** Unchanged in what it owns since 2026-10-10: `kernel/engagement.js`, the catalog's two `engages` defs (field-composition, region-menu) and the two root sensors have not moved; the catalog commits since then (b5171318, 320fc4b9, 2c95bf13) mount other plans' modules. `arrival` is still the default arming (`policy.js`). Next slice: E1, read what each quiet module writes to its own hosts on arrival, which the root census cannot see. Gates: E1 needs a headless browser the sandbox allows; making `engage` the default is a sensation call; container priming waits on the facet operator mapping (`../module-contract-overhaul/wip.spw` `#>wonder_module_contract_overhaul_facet_operators`). The creator's open calls are in `index.spw`.

**Related:** [deploy-module-graph](../deploy-module-graph/PLAN.md) · [navigation-header-disclosure](../archive/navigation-header-disclosure/PLAN.md) · [chrome-navigation-wonder](../chrome-navigation-wonder/PLAN.md).

Operation: prime. Fixity: experimental. Owner rail: `module-contract-overhaul` (the `@` wakes facet).

## Public Goal

A page loads what its reader engages, not everything its grammar could support. Behaviors arrive as clusters a reader approaches and chooses among, the arrival is felt as a response rather than a wait, and the clusters are something Spw can say.

## Evidence (2026-09-28)

- 56 modules mounted on all six sampled routes (home, about, a topic, contact, blog, folios); ~100 JS requests and ~1.6 MB of JS per page, nearly identical everywhere.
- 50 of 138 catalog defs have no gate beyond a selector every page satisfies: 10 have no selector, 17 name `html`, `body`, or `main`, the rest name nouns every page holds (frames, chips, semantic expressions). `operators navigator console` is authored in `data-spw-features` on 162 of the 210 pages that declare features (2026-11-06).
- Real conditions live outside the catalog: settings checks inside modules (rhythm, treats, cognition), a debug filter in `site.js` (`layout-shift-audit`), page boilerplate.
- Module shape fuses arrival and engagement: one `mount` restores residue, decorates hosts, and installs handlers, so the scheduler can only choose "arrive for all of it". 35 of the 56 project state at mount; 81 declared `html`-scoped writes come from them, and every root write restyles the page (~300 ms at phone; `.spw/audits/runtime-recalc-cost-2026-09.spw`).
- `MOUNT_WHEN.INTERACTION` fired every pending module on the first input anywhere; `touch-gesture-contracts-2026-09.spw#f5` moved region-menu, charge-field and navigation-locomotion off it, because the first hold only started the import.

## Landed

- **Engagement arming** (0a974b23): `kernel/engagement.js` resolves engagement (focus, key, menu, press as a touch that lifts or holds and never one that scrolls, hover after a dwell), hears approach first, and hands the engagement over. Catalog `engages` (closed `ENGAGE_KIND`), `?spw-arming=engage` per host, `ctx.engagements`, `spw:engage:<id>` measures. Pilots: field-composition (focus) and region-menu (a waking hold opens the menu). A cold first hold opens region-menu in ~2 s on a busy phone page, ~1.3 s of it the import; arming moves that cost after the reader acts. A scroll starting on a host wakes nothing.
- **Arrival census** (2546df53, 25c09637): `npm run audit:root-writes` gives each root write to the catalog module on its stack. Table below.
- **Root precision** (0d2061e5): `npm run audit:root-ablation` removes a root token set and diffs every element's computed style. It led to runtime state on `<html>` alone (face97b8; `<body>` had carried 116–125 copied tokens per route, two of which moved anything) and to root hosts that no longer wear a module host's marks (9f886d70; `/` phone arrival shift 0.209 → 0.011).
- **Scripts off** (01b671dc, 837cfdde, 768c5c09): every lens panel opens when scripts never ran, settings chips show switched off with a note, and `audit:page-structure` counts only chip groups missing that note.
- **Invited offers** (f0cc32b9, e41068c1): one trigger record per module, and an invitation drawn only where a reader can accept it. Decided 2026-10-08 (creator): where a page has a shelf, invited instruments are shelf boxes rather than an edge (b2eda400 on `/settings/`). Elsewhere no default invitation draws yet.

## Arrival census — 2026-10-06

Source build, headless, 12 s past settle, no input. `styled` counts changed writes on a token some stylesheet reads.

| route | mounted | write to root | quiet | changed writes | styled |
|---|---|---|---|---|---|
| `/` | 70 | 28 | 42 | 782 | 405 |
| `/about/` | 60 | 25 | 35 | 789 | 408 |
| `/topics/software/` | 62 | 28 | 34 | 909 | 419 |
| `/contact/` | 60 | 29 | 31 | 862 | 436 |
| `/blog/` | 62 | 29 | 33 | 908 | 439 |
| `/design/folios/` | 63 | 30 | 33 | 854 | 432 |

- **Quiet on all six (27), E1's candidates:** attention-pinch-scale, brace-actions, cognition, component-semantics, concept-salience, console, discovery-notices, effect-ledger, expression-resonance, frame-navigator, frame-size-memory, gesture-anatomy, guide, guide-badge, haptics, module-effects, page-region-rail, pronunciation-hints, region-enhancer, semantic-crossrefs, semantics-gate, settings-momentum, sigil-anatomy, site-search, spells, spw-block-association, variant-selection. Quiet means no root state on arrival; what they write to their own hosts is unmeasured.
- **The runtime outranks most modules.** Styled writes summed over the six routes: site-settings 852 (one burst of ~25 ms per page), the loader 284, the pre-paint inline script 198, `site.js` 135, `updates-contract` 127, `page-state` 120, `dom-contracts` 114, `region-profiler` 79, `describes-contract` 37.
- **Unchanged rewrites, still open.** `dom-contracts` writes the fifteen floating-chrome slot properties seven times a page, and a third of its writes change a value. The caller is lost through its batch.
- **Timing words.** As a share of a route's arrival: immediate 19%, visible 72%, idle 67%, settled 95%; visible and idle do not separate. The machine was loaded, so the shares are sound and the seconds are not.

Limits: stacks name files only from source, so this is the dev graph; times are stretched by the probe; `observed` above `writes` means an unhooked door.

## Next slices

- **E1. Host-write census.** Touches `scripts/root-write-census.mjs`: a `--hosts` mode that wraps the same four write doors (attribute methods, dataset, inline style, classList) on each mounted module's own targets and attributes by stack as it does for the roots. Output: one row per quiet module with its host writes, changed and styled, over the six routes. Proposed form: each row also as the line Spw would say, `haptics[quiet]{hold}<frame>`, so arming a module later reads as one slot turning (`[quiet]` → `[armed]`). Gate: a headless browser the sandbox allows (`npm run sense -- doctor` first). Verify: the six-route run lists all 27; a module with no styled host write on any route is a first-cluster candidate (`wonder_engagement_clusters_first_cluster`).
- **E2. Cluster keys.** Touches `public/js/kernel/engagement.js` (it already takes arbitrary keys) and one catalog def: arm one entry per container rather than per module. Gate: E1's list and the creator's first-cluster call. Verify: `npm run test:modules`, plus the engagement probe below.
- **E3. Warm then choose.** Warm-on-approach for a cluster, then mount-by-weight on engagement, behind the same flag, on one route. Gate: the facet operator wonder and the weights wonder; ends at a browser demo for the creator.

## Validation

`npm run check:local`, `npm run typecheck`, `node --check` on touched JS, the engagement probe (headless: cold first hold, scroll-from-host, hover then alt-click, focus), `npm run plans:index:check`.

## Primed, not built

- **Spw containers prime clusters.** A concept bracket opens a topical boundary (`<`, `kernel/operator-detection.js`) and labels ride edges (`}_A`, `.spw/language/lore-alignment.spw`). Reading `<_foo` as a concept edge labeled `foo`: approaching it primes the cluster `foo` names (imports, no mounts); engaging an item in its `{ … }` direction space resolves a path, choosing which primed behaviors mount, by weight. Primed-but-unchosen behaviors cost a cached import, never a mount or a root write.
- **Weights.** Candidate sources the runtime already has: the salience weight `contextual-ui.js` writes as `--spw-salience-weight` (no route authors `data-spw-salience-weight`), the operator charge role, familiarity demotion, the module offer ranking (`describeModuleOffer`). No new `data-spw-*` family.
- **Arrival halves.** Split modules into a small arrival projection (often CSS, or a shared residue restorer) and an engagement half, so arming does not hide what a module draws on arrival (brace pins, grounded haptics, brace actions). Owner of the split: `runtime-plane-consolidation` (*Phase 6 — Decompose the overloaded modules*), since runtime-module-decomposition archived.
- Parked 2026-10-10, with no slice or sensor here: assembly reading (`.spw/caches/spw-assembly-2026-09.spw`), engagement heuristics named as a dialect, dialects across dimensions, and attention that varies with theme material.
- **Regions open with a goal, not with a promise** (2026-11-10, [character-constraint-onboarding-2026-11](../../../.spw/caches/character-constraint-onboarding-2026-11.spw)). A further region of the site may show once a reader has set a goal on the constrained character. A region that implies a community will meet the need stays quiet until the limit has been read. This does not change E1, and it adds no `engages` def.

## Menu, badge, and lenses — 2026-09-28

- **Menu: tap travels, hold previews, brush scrubs.** e4d87502 fenced navigation chrome off from the reading engines and rests idle mounting while the toggle menu is open; a tap still waited 3.6–6.6 s headless under load, behind other modules' pointer handlers and the boot tail. Hold previews a route from what its link already carries (`data-spw-route-note`, `data-spw-nav-expression`) and keeps gather-to-cauldron as an offer inside the preview; brush slides across the chips previewing each, and a release on a chip after a hold travels. Build as a flagged demo in its own module, not in `shell-disclosure.js`. Not started.
- **The header badge becomes "here, now".** Not a lens highlighter (creator: the wrong approach). A tap opens a utility: what is easy to do immediately in view, and where things go. Re-measured 2026-10-06: `annotation-layer` now mounts, about 24 s after load, and the badge still has no job. That is a design call, not a loader fix.
- **Lenses as Spw scripts modules can match.** A lens authored as a Spw script; a module declares the expression it answers and the lens selects by matching it. Owners: `cauldron-lens-composition`, `module-contract-overhaul`, `.spw/caches/spw-assembly-2026-09.spw`.

## Cross-references

| concern | owner plan or record |
|---|---|
| contract field, wake facet, Spw projection of contracts | `module-contract-overhaul` |
| arrival vs engagement halves; persist / project / toggle / emit | `runtime-plane-consolidation` Phase 6 (runtime-module-decomposition is archived) |
| first gesture on cold pages; no gesture framework | `.spw/audits/touch-gesture-contracts-2026-09.spw` (f3, f5, f7) |
| CSS that arrives with its cluster; core boundary | `core-css-spend-cut`; `css-cascade-stratification` for any layer change |
| pass cost and root writes | `runtime-bootstrap-performance`; `.spw/audits/runtime-recalc-cost-2026-09.spw` |
| concept brackets, labels, operator canon | `spw-metaphysical-language`; `.spw/language/lore-alignment.spw`; `operator-namespace-alignment.spw` |
| invited offers (reader-chosen potential) | `systems/module-potential.css`, scheduler `mountInvitedFeatures` |
| theme families and wiring | `settings-theme-wiring` |
