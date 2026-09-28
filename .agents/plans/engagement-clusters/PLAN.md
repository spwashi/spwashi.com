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

## Next Slices

1. A census of the 56: arrival writes vs handler-only, per module, measured, not read from code alone.
2. Cluster keys: arm an entry per container rather than per module (the kernel already takes arbitrary keys).
3. Warm-on-approach for a cluster, then mount-by-weight on engagement, behind the same flag, on one route.

## Validation

`npm run check:local`, `npm run typecheck`, `node --check` on touched JS, the engagement probe (headless: cold first hold, scroll-from-host, hover then alt-click, focus), `npm run plans:index:check`.
