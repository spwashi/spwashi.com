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

## Non-Goals

- No new `data-spw-*` families; no catalog field fill for its own sake (@module_ecology_kinship thesis).
- No bundler, no new packages.

## Validation

1. `npm run audit:module-writers`
2. `npm run check:runtime`
3. `npm run test:modules:run`
4. `git diff --check`
