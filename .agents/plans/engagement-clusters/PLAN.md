# Engagement Clusters

Operation: prime. Fixity: experimental. Owner rail: `module-contract-overhaul` (the `@` wakes facet).

## Public Goal

A page loads what its reader engages, not everything its grammar could support. Behaviors arrive as clusters a reader approaches and chooses among, the arrival is felt as a response rather than a wait, and the clusters are something Spw can say.

## Evidence (2026-09-28)

- 56 modules mounted on all six sampled routes (home, about, a topic, contact, blog, folios); ~100 JS requests and ~1.6 MB of JS per page, nearly identical everywhere.
- 50 of 138 catalog defs have no gate beyond a selector every page satisfies: 10 have no selector, 17 name `html`, `body`, or `main`, the rest name nouns every page holds (frames, chips, semantic expressions). `operators navigator console` is authored on nearly every page that declares features.
- Real conditions live outside the catalog: settings checks inside modules (rhythm, treats, cognition), a debug filter in `site.js` (`layout-shift-audit`), page boilerplate.
- Module shape fuses arrival and engagement: one `mount` restores residue, decorates hosts, and installs handlers, so the scheduler can only choose "arrive for all of it". 35 of the 56 project state at mount; 81 declared `html`-scoped writes come from them, and every root write restyles the page (~300 ms at phone; `.spw/audits/runtime-recalc-cost-2026-09.spw`).
- `MOUNT_WHEN.INTERACTION` existed and no def used it: it fired every pending module on the first input anywhere, and `touch-gesture-contracts-2026-09.spw#f5` moved region-menu, charge-field, and navigation-locomotion off it because the first hold only started the import.

## Landed

- 0a974b23: `kernel/engagement.js` resolves engagement (focus, key, menu, press as a touch that lifts or holds and never one that scrolls, hover after a dwell), hears approach first, and hands the engagement over. Catalog `engages` (closed `ENGAGE_KIND`); `?spw-arming=engage` arms per host; `ctx.engagements`; `spw:engage:<id>` measures. Pilots: field-composition (honest selector by default; focus) and region-menu (a waking hold opens the menu).
- Measured: a cold first hold opens region-menu in ~2 s on a busy phone page, ~1.3 s of it the import, which measures 1.6–2.2 s under arrival too; arming moves the cost after the reader acts, where it is felt. A scroll starting on a host wakes nothing.

## Primed, not built

- **Spw containers prime clusters.** A concept bracket opens a topical boundary (`<`, `kernel/operator-detection.js`) and labels ride edges (`}_A`, `.spw/language/lore-alignment.spw`). Reading `<_foo` as a concept edge labeled `foo`: approaching it primes the cluster `foo` names (imports, no mounts); engaging an item in its `{ … }` direction space resolves a path, choosing which primed behaviors mount, by weight. Primed-but-unchosen behaviors cost a cached import, never a mount or a root write.
- **Assembly reading.** Wrapping changes an expression's key (content-addressed, the wrap chain as its traveler), thresholds are authored with an inference path, and the marks read as assembly code and functional programming: `.spw/caches/spw-assembly-2026-09.spw`, with a probe over the expression manifest.
- **Weights.** Candidate sources already on the page: `data-spw-salience-weight`, the operator charge role, familiarity demotion, the module offer ranking (`describeModuleOffer`). No new `data-spw-*` family.
- **Heuristics as language.** Engagement resolution (dwell, slop, hold) and path weights are heuristics; a dialect could name them so a page tunes them in Spw rather than in constants.
- **Dialects across dimensions.** How a dialect's vocabulary scales across surfaces, devices, familiarity, and themes without forking the grammar.
- **Attention toward theme material variance.** Retune attentional architecture (dwell, emphasis, reward) to vary with the theme's material rather than one global posture.
- **Arrival halves.** Split modules into a small arrival projection (often CSS, or a shared residue restorer) and an engagement half, so arming does not hide what a module draws on arrival (brace pins, grounded haptics, brace actions).

## Cross-references

| concern | owner plan or record |
|---|---|
| contract field, wake facet, Spw projection of contracts | `module-contract-overhaul` |
| arrival vs engagement halves; persist / project / toggle / emit | `runtime-module-decomposition` |
| first gesture on cold pages; no gesture framework | `.spw/audits/touch-gesture-contracts-2026-09.spw` (f3, f5, f7) |
| interaction as impulse, accumulation, discharge | `compositional-css-electrostatics` (workstream 3) |
| CSS that arrives with its cluster; core boundary | `core-css-spend-cut`; `css-cascade-stratification` for any layer change |
| pass cost and root writes | `runtime-bootstrap-performance`; `.spw/audits/runtime-recalc-cost-2026-09.spw` |
| concept brackets, labels, operator canon | `spw-metaphysical-language`; `.spw/language/lore-alignment.spw`; `operator-namespace-alignment.spw` |
| attention and material | `relational-attention-media`, `attention-shell-contrast`, `canopy-material-depth`, `lens-seat-and-secondary-materials` |
| theme families and wiring | `settings-theme-packs`, `settings-theme-wiring` |
| invited offers (reader-chosen potential) | `systems/module-potential.css`, scheduler `mountInvitedFeatures` |

## Human Decisions (sensation gates)

- Default arming: whether `engage` becomes the default, and the latency a first engagement may take before it reads as a wait.
- Which modules join a cluster first, given what each draws on arrival.
- The operator mapping for container priming: what `<_foo` and `{ … }` mean at runtime (`module-contract-overhaul` names this decision).
- Where weights come from, and whether a reader can see them.
- Whether `operators navigator console` stay page boilerplate or become shell.

## Arrival census — 2026-10-06 (slice 1)

`npm run audit:root-writes` (`npm run sense -- roots`). Source build, headless, 12 s past settle, no input. The probe hooks the root's four write doors (attribute methods, dataset, inline style, classList) before any script runs, keeps each write's call stack, and gives the write to the catalog module on that stack. `styled` counts changed writes on a token some stylesheet reads.

| route | mounted | write to root | quiet | changed writes | styled |
|---|---|---|---|---|---|
| `/` | 70 | 28 | 42 | 782 | 405 |
| `/about/` | 60 | 25 | 35 | 789 | 408 |
| `/topics/software/` | 62 | 28 | 34 | 909 | 419 |
| `/contact/` | 60 | 29 | 31 | 862 | 436 |
| `/blog/` | 62 | 29 | 33 | 908 | 439 |
| `/design/folios/` | 63 | 30 | 33 | 854 | 432 |

- **Quiet on all six (27):** attention-pinch-scale, brace-actions, cognition, component-semantics, concept-salience, console, discovery-notices, effect-ledger, expression-resonance, frame-navigator, frame-size-memory, gesture-anatomy, guide, guide-badge, haptics, module-effects, page-region-rail, pronunciation-hints, region-enhancer, semantic-crossrefs, semantics-gate, settings-momentum, sigil-anatomy, site-search, spells, spw-block-association, variant-selection. Nothing they do on arrival is root state. The census does not see writes to a module's own hosts, so "quiet" is the candidate list for arming, not the verdict.
- **Write on all six (23):** attention-reading-groove, brace-physics, cauldron, cauldron-fluency, charge-field, component-collection, experiential, hydration-passes, interactive-medium, learnability-ledger, loading-ecology, navigation-spells, operators, precipitation-request, pulse-beat-tuner, pwa-update-handler, region-menu, reward-ui, shell-disclosure, site-settings, state-inspector, topical-payload, tuning-discovery.
- **The runtime outranks most modules.** Styled writes summed over the six routes: site-settings 852 (one burst of ~25 ms per page), the loader 284, the pre-paint inline script 198, `site.js` 135, `updates-contract` 127, `page-state` 120, `dom-contracts` 114, `region-profiler` 79, `describes-contract` 37.
- **Body carries one module's annotation.** The loader and the two contract files write `data-spw-module-*` on a module's mount target. For a body-rooted module the target is `<body>`. The loader's attributes are written only when missing, so `<body>` keeps the first such module's; the describes and updates attributes are rewritten by each one (four to six times a page). Stylesheets read them, mostly under `data-spw-module-visuals="on"`. Taking the annotation off the root may change what those selectors match: a browser look first.
- **Unchanged rewrites.** `dom-contracts` writes the fifteen floating-chrome slot properties seven times a page; a third of its writes change a value. The caller is lost through its batch.

Limits: stacks name files only from source, so this is the dev graph; times are stretched by the probe; `observed` above `writes` in the output means an unhooked door.

## Next Slices

1. Done above. Next from it: read each quiet module's arrival writes to its own hosts, and decide the body annotation in a browser.
2. Cluster keys: arm an entry per container rather than per module (the kernel already takes arbitrary keys).
3. Warm-on-approach for a cluster, then mount-by-weight on engagement, behind the same flag, on one route.

## Validation

`npm run check:local`, `npm run typecheck`, `node --check` on touched JS, the engagement probe (headless: cold first hold, scroll-from-host, hover then alt-click, focus), `npm run plans:index:check`.

## Menu, badge, and lenses — 2026-09-28

- **Menu: tap travels, hold previews, brush scrubs.** A tap must stay one step from the page. e4d87502 fenced navigation chrome off from the reading engines (sigil priming, brace capture, inspect field) and rests idle mounting and the beat while the toggle menu is open; a tap still waited 3.6–6.6s headless under load, behind other modules' pointer handlers (collectible, DOM-sync hub) and the boot tail, which is the runtime-wide work above. Hold previews a route from what its link already carries (`data-spw-route-note`, `data-spw-nav-expression`) and keeps gather-to-cauldron as an offer inside the preview; brush slides across the chips previewing each, and a release on a chip after a hold travels; a plain swipe does nothing. Build as a flagged demo in its own module, not in `shell-disclosure.js`.
- **The header badge becomes "here, now".** Not a lens highlighter (creator: the wrong approach). A tap opens a utility: what is easy to do immediately in view (verbs gathered from the gesture contracts on screen: inspect a term, gather by holding, swipe the rail, open Routes) and where things go (the next room, the links in view with their route notes, the route menu). Found first: `annotation-layer`, which the badge wakes, is marked triggered by its visible gate and never loads (no load or mount record after 18s on the home page), so the badge has done nothing; trace that loader gap before hanging anything on the badge. Re-measured 2026-10-06 in dev (home, foreground tab): the layer now mounts, about 24s after load; tapping the badge's "read / inspect" control sets no visible state, and a click on the header landmark pins with zero region matches. The loader gap has closed, and the badge still has no job. That is the design call above, not a loader fix.
- **Lenses as Spw scripts modules can match.** A lens (reading, kernel, lattice, hospitality) authored as a Spw script; a module declares the expression it answers and the lens selects by matching it, an editorial surface as the workbench grows. Owners: `cauldron-lens-composition` (lens composition), `module-contract-overhaul` (the match as a contract facet), `.spw/caches/spw-assembly-2026-09.spw` (keys and travelers, so a match can follow a wrap).
