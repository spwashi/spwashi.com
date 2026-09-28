# Module Contract Overhaul

## Public Goal

A settled page rests. Every module can say, in Spw, what it mounts on, what wakes it, what it reads, what it writes, and what it promises to leave unchanged. Those statements become checks and inspector queries instead of annotation that only reads well.

## Evidence (2026-09-14)

- Catalog: 114 defs × ~14 fields. The loader acts on `when`, `features`, `selector`, `rootMode`, `timingChunk`. `describes`, `evaluates`, `timingArc`, and `effectScope` are parsed for inspectors or projected onto DOM as `data-spw-module-*`/`data-spw-runtime-last-module-*`.
- No field describes rest: what wakes a module after mount, whether its writes can wake itself, or whether a second pass is a no-op. The idle render loop fixed in a7ceccd2 (sync-hub tasks feeding their own observer) lived in that gap.
- Writer census (import-graph scan of root writes vs declared `updates`): 166 undeclared root writes in module entry files; seven root attributes with two module writers (`data-spw-freshness-pulse`, `data-spw-spell-momentum`, `data-spw-collection-*`, `data-spw-component-motif`, `data-spw-metamaterial`).
- `--spw-site-rhythm-tempo` has three owners: settings (beat tempo), module-loader (load speed), and CSS mount-batch holds. It is a registered, transitioned, inherited root property, so each write animates across the tree.
- Settings `apply()` rewrote ~85 root custom properties unconditionally; any root custom-property change costs 200–400ms of style recalc on core.css.

## Contract Facets In Spw

Operators follow `public/js/kernel/operator-detection.js`. Flat catalog fields stay the authored source; the Spw form is a derived, parseable projection (module-load-contract.spw `orchestration_view`), and new facets land as flat fields first.

| facet | operator | flat source | actionable as |
|---|---|---|---|
| address | `#>` frame | `id` | owner lookup |
| layer | `#:` layer | `layer` | loader stage |
| substrate | `$` substrate/selector | `selector`, `rootMode`, page gates | mount gate |
| potential | `~` potential/hold | `when`, `timingArc`, `timingChunk` | schedule |
| wakes | `@` perspective/observer | new `wakes` | rest check, observer census |
| probes | `?` probe | `evaluates` | token read cache invalidation |
| acts | `!` action + `[mode]` role | `updates` | writer audit, conflicts |
| binds | `=` binding/constraint | new `rests` | lint: change-only, idempotent, single-writer |
| measure | `%` normalize/measure | `cost` / `costClass` | budget review |
| ground | `.` ground | `cost.commitment=residue` | storage census |
| integrates | `^` integration | `affordances`, `subfeatures` | capability coverage |
| scene | `(` scene | `visual` | capture/screenshot safety |

Sketch (pulse-beat-tuner):

```
#>pulse_beat_tuner #:enhancement
$[html]{single} ~[idle]{enhance-rhythm}
@{event:spw:settings:changed event:spw:interaction-phase timer:interval}
?{--spw-beat-interval-ms --spw-microinteraction-pulse-duration}
![structural]{data-spw-beat data-spw-playing} ![flourish]{data-spw-freshness-pulse}
={change-only}
```

## Phases

0. **Writers are declared** (this pass). `audit:module-writers` scans each module's local import graph for root writes (direct, `writeDatasetValue*`, write maps, `this.root` style maps), fails on new undeclared writes or new multi-writer root tokens, and holds today's findings in a baseline to empty. Settings and loader root style writes become change-only.
1. **Rest is declared.** Add flat `wakes` and `rests`. `formatModuleContractSpw(def)` + `parseModuleContractSpw` round-trip test; inspector and `listModuleCatalogIndex` read the projection; `data-spw-runtime-last-module-*` body mirror retires in favor of the inspector.
2. **Constraints are checks.** `rests` tokens map to rules: `change-only` (no raw `dataset.x =`/`textContent =` in observer or sync-task paths), `idempotent` (debug `registerDomSyncTask` second-run mutation report), `single-writer` (audit conflict), `rest` (CDP route check: mutations and long frames 30s after load).
3. **Settings as one projection table.** Dataset and style tokens carry owner, consumer, and change-only writes; one canonical settings event; UI sync writes through kernel helpers; ornament state is a declared projection, not ad hoc rail writes.
4. **Rendering keyed by signature.** A kernel `renderIfChanged(host, signature, render)` replaces `innerHTML = ''` rebuilds reachable from sync or observer paths.

## Human Decisions (sensation gates)

- Facet/operator mapping above, before any authored Spw contract strings land in the catalog.
- Rhythm tempo ownership: settings beat tempo vs load-derived tempo for the site-rhythm ornament.
- Beat root custom properties: scope to consumers vs keep root inheritance.
- Twinkle/phase/momentum JS constants reading their CSS tokens under tempo and reduced motion.

## 2026-09-14 Rhythm Authority And Scoped Beats

- `rhythmAuthority` (authored | tuner | runtime, query `rhythm`) picks the tempo author. Settings writes `--spw-tuner-rhythm-tempo`, module-loader writes `--spw-runtime-rhythm-tempo`, and only `components/runtime-states.css` writes `--spw-site-rhythm-tempo`. The settings page shows the site-rhythm rail in the author's operator color with a readout of tempo and author.
- CSS keys beats on `data-spw-beat-prime`; `data-spw-beat` (every tick) is named by no stylesheet. Beat and treat properties sit on their consumers. `audit:css-custom-properties` (check:css) rejects root rules keyed on periodic attributes and holds 197 self-referencing declarations (cycles, not accumulators) as a baseline.
- Cycles removed on the beat path: phase pulses reset `--spw-interaction-phase-weight` to 0, tuning reset rhythm density, treat splashes invalidated every palette depth color, blog prime beats dropped the accent to 0%.
- Forced recalc per change, laptop /topics/software/: non-prime tick 8ms (root) → 100ms (scoped) → 0ms (prime attribute); prime enter/exit ~200ms → 184ms; idle 13s recalc 8.2s → 7.1s (phone 10.5s → 8.0s).
- Open (sensation): prime beats still cost ~180ms because every chip, operator, and module is a consumer. Narrow the beat's consumers to the rail, probe chips, and settle windows.

## Non-Goals

- No new `data-spw-*` families; no catalog field fill for its own sake (@module_ecology_kinship thesis).
- No bundler, no new packages.

## Validation

1. `npm run audit:module-writers`
2. `npm run check:runtime`
3. `npm run test:modules:run`
4. `git diff --check`

## Source And Lifecycle Alignment (2026-09-16)

Operation: `align`. Fixity: `stable`. Public goal: modules load and release
reliably, with source contracts that catch browser failures before deployment.

Sense: `typecheck`, `check:runtime`, and the selector census passed. Inspection
found a three-argument type for a two-argument portable mount, an unused catalog
unmount hook, dynamic imports bypassing typed ownership, flat-only output checks,
and unresolved runtime names held in the binding baseline.

One patch spans the shared module types, loader lifecycle, runtime-contract
checker children, binding gate, and the two affected runtime modules. Compiler
diagnostics must fail on broken configuration, syntax, and unresolved imports;
unrelated inference debt remains outside the binding gate. Import ownership and
source/output parity must follow nested folders and lazy imports. Existing
schedules, route HTML, CSS, dependency versions, and public entry URLs stay fixed.

Proof: targeted lifecycle, import, and binding regression tests; `typecheck`,
`check:runtime`, `ecology`, `check:local -- --allow-dirty`, deploy build, and
`git diff --check`. Generated modules accompany their source edits.

Landed design: catalog definitions and vocabulary live under `runtime/catalog/`;
loader, scheduler, lifecycle, feature gates, and policy under `runtime/orchestration/`.
The generic registry is a strict typed kernel edge; browser primitives have no
catalog dependency. Active consumers and build/audit paths use their owners.

Verified: local gate passed 375 tests; deploy build passed; Chrome home/settings/
software reached ready with zero console errors; `visual:checks -- --ids=home-opening`
passed one pocket still. All 315 named `compose.js` exports remain unchanged.
Binding baseline is empty. Catalog token types are closed unions, erroneous
TypeScript cannot overwrite emitted output, and import checks enforce direction
between catalog, orchestration, primitives, and the portable registry.
In-flight mount cancellation and broad strict-JS inference cleanup remain outside
this alignment.

## Rest has an observable now — 2026-09-17

The missing field this plan names ("what wakes a module after mount, whether its writes can wake itself") gained a concrete shape on the read side: `kernel/measured-frame.js` runs every geometry lane in one pass with a declared `measure()` and `apply()`. A module that reads geometry can therefore say which lane it measures on and whether it writes root tokens in `apply()`. Candidate contract fields: `measures = lane name | none` and `applies = root tokens | host datasets | none`, checked against the writer census that already exists for `updates`. A module whose `apply()` writes a token that another lane's `measure()` reads is the self-waking shape the a7ceccd2 loop had; the lane ordering (split lanes read first, whole lanes between, split lanes write last) is the rule that keeps it a no-op.

## Closed effect vocabularies — 2026-09-27

Operation: `contract`. Fixity: `stable`. Creator ask: make every contract property useful to the runtime, and give decorative properties a descriptive type. Evidence: `effectScope` carried ~90 free tokens and cost inference read it by substring (`document-scroll` counted as both memory and listening); `evaluates` carried 536 words while the loader read only the eleven rail dimensions CSS keys on, and derived most of those from regexes over module ids; four `updates` lacked a role and `temporal` was ranked by the scheduler but missing from the grammar.

Landed: `effectScope` is a closed `EFFECT_SCOPE` array whose tokens each carry a host tier (host, document, shell, memory, channel, platform); `evaluates` is a closed `MODULE_DIMENSION` array, and the loader's id regexes retired; every update names a role, and `temporal` joined the grammar. `CATALOG_DEF_FIELDS` records each field's kind (gate, schedule, effect, capability, voice, lifecycle) and readers, and `describes` is the only voice. Types in `types/module-catalog.d.ts` are template-literal and union typed; the bindings gate holds the four family files to the full checker. Migration was verified output-neutral: 0 of 136 inferred costs and 0 rail dimension sets changed. Words dropped from `evaluates` remain in history; if "what a module considers" should come back, the `?` probe facet (`reads`) above is its checkable home.

Primed, not built (creator, 2026-09-27): a derived Spw projection per contract using the facet table above (the operator mapping is still the human decision this plan names); an atlas linking modules, settings, and CSS readers through the names they write and read, with bus events as edges and per-commit readability ratchets as the version axis; feature acknowledgments pinned per reader, keyed by a contract fingerprint ("later, or whenever").

## Contracts as Spw, and the atlas — 2026-09-27

Creator asks: describe module behavior with Spw expressions so viewers have structures to wonder about; an admin-panel view of the contracts and their implications, reachable from settings and a query parameter; visualizations of refactors, versions, and JS↔CSS relationships; the code more readable over time.

Landed: `catalog/contract-spw.js` derives one Spw sentence per contract from the facet table above (`#>` address, `#:` layer, `$` substrate and reach, `~` wake, `?` dimensions, `!` writes per role, `%` cost, `(` visual). It is derived, never authored, and the operator mapping is still this plan's human decision; loader records carry it (`__SPW_SITE__.listModules()`). `npm run atlas` writes `public/data/runtime-atlas.json` (families, contracts, one reader index from written names to the stylesheets that key on them, bus edges, git's rename ledger, readability ratchets, folio handles) and a static family table into `/design/runtime/`; the committed file's history is the version axis, and the deploy build regenerates a current copy. The explorer (`modules/design/runtime-atlas.js`, feature `runtime-atlas`) filters by family, host tier, and write role, opens a contract as Spw, follows a stylesheet back to every module that feeds it, replays a move from the rename ledger (the refactor animation, labeled a demo), and walks shared folio handles. Settings → Developer links it; `?spw-atlas=<id>` opens a module.

Next, primed: settings and ornaments as further actors in the same `[scope:]role:name` grammar with bus events as edges; per-commit ratchet series from the atlas history; `atlas:check` as a gate once its freshness cost is known.

## A scroll trace for the rest facet — 2026-09-28
Headless Chrome, /topics/software/ at 390 px, three touch gestures over ~12 s (the scroll-frame method): 130–350 root, body, header, and handle mutations and 55–70 long tasks per run. spatial-gravity's overlap pass cleared and re-added `data-spw-yielded` on every tracked element each frame, 35 rewrites of an unchanged state; it now decides yields first and writes differences (0–1 per run). Skipping pulse-beat-tuner and palette-treat-discovery did not move the long-task count, so ornament beats are not the scroll cost; a burst of ~100 `--spw-preset-*` root writes from pretext-presets lands once at idle. The long tasks stay open for a CDP trace per project_runtime_recalc_hot_paths. Shell direction hysteresis held: no oscillating header state. This is the change-only constraint (`rests`) measured in one module; the writer audit can grow a same-state rewrite detector from it.
