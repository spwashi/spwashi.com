# Deploy Module Graph

## Public Goal
A first visit should feel like a local introduction: a small boot graph arrives first, richer catalogs introduce themselves by address, and `timings()` can name those dimensions. Authored `public/js` stays native ESM so the locality remains readable.

A catalog module earns its slot by a readable `describes` contract or by a distinct introduction (`when` / `timingArc`). Anonymous extra immediates are not worth recognizing.

**Recognition pass (2026-08-17):** Immediate is reserved for core boot and first-paint grammar (sigil split, operator annotate, bare-markup wrap, header nav-fit). Route widgets, inspect overlays, and measure narration arrive visible or idle. Keyboard/phase listeners are visible — not interaction — so the first key is not spent waking the module.

**Arrival attributes:** Layout tokens follow authored `data-spw-hydration`, not a late pass write. Phase/rail/measure attrs must look complete when absent and strip on cleanup. Load hosts stay as specific as the module's offer.

**Token cluster:** `--spw-lifecycle-presence` and `--spw-interaction-phase-weight` live in `tokens/dimensions.css` (temporal). Hydration pass surface is an alias. Phase weight is multiplied by `--spw-enhancement-factor`. Rail arrival does not fade content — discharge stays on the wall (`arrival-electrostatics`).

## Intense Improvement Pass (2026-08-17)

Operation: `align` · fixity: `tending`.

Turn catalog scheduling into deploy topology without making transport chrome part of the reading experience:

1. Bundle catalog targets into semantic packs keyed by the existing arrival contract: `foundation`, the four `idle-*` groups, `settled`, and module-addressed demand packs.
2. Emit pack membership, timing, `describes`, `updates`, imports, and compressed size in `asset-manifest.json` so `loadTrace` and build review speak the same language.
3. Preload only the static boot closure. Dynamic packs must remain demand-coupled even though Rolldown can see the whole graph.
4. Keep authored native modules in `dist/public/js` for addressability; semantic chunks optimize transport rather than replace the source topology.
5. Repair CSS flattening so block-form `@layer` sources survive route bundling, then demote only selector-gated CSS with proven feature/route ownership.

Targets from the pre-flight measurement:

- deploy boot: 230,801 B raw / 69,418 B gzip
- core CSS: 1,865,364 B raw / 339,420 B gzip
- catalog: 105 modules; 8 immediate; 34 in named idle chunks
- dev graph: 122–129 scripts on representative routes; use only as a graph-breadth signal, not a production request count

### Measured Result

- deploy topology: 64 semantic packs / 117 emitted chunks across 105 catalog modules
- static boot closure: 258,145 B raw / 80,749 B gzip across 5 preloaded files
- foundation pack: 8 immediate modules, 88,235 B raw / 27,480 B gzip; no static dependency on `visible-tuning-discovery`
- deploy manifest: each pack now names timing, member modules, `describes`, `updates`, imports, and raw/gzip bytes
- runtime inspection: lifecycle, audit, mounted events, and `loadTrace` records carry `transportHref`
- core CSS: 1,865,364 → 1,839,375 B raw (-25,989 B / -1.39%); gzip-9 339,420 → 335,082 B (-4,338 B / -1.28%)
- scoped CSS: kinetic-stage styles moved to the play route; seed-card styles follow the two route surfaces that host the module, services and new year
- browser proof: home, settings, services/new-year, and play reached runtime `ready` without console errors or horizontal overflow; the seed module hydrated from `visible-seed-cards`

The static boot closure is 11,332 B gzip larger than the former single-file entry because the full graph now carries Rolldown's loader and shared boundaries. That is an explicit trade for demand-coupled semantic transport and fewer unbundled module requests, not reported as a byte win.

## Acyclic Cut (2026-10-06)

Operation: `align` · fixity: `tending`.

The module graph has no cycles. The cut into packs had 16: a pack took only its entry, the entry's private dependencies stayed in the chunk rolldown makes for the dynamic import, and the two imported each other. Load order then decided whether a module read an initialised binding; `charge-field` never loaded on the live site for this reason.

- **Companions.** Discovery already groups an entry with the modules that travel only with it. Those join the entry's pack (`assignPackCompanions`). 16 cycles became 2.
- **Fold.** Chunks that import each other always load together, so one chunk carries them at no transport cost. Each remaining cycle folds into the pack in it that arrives first (`foldChunkCycles`), and the cut is made again. A cycle that touches the boot closure is not folded; it stays a warning that names the imports holding it.
- **Debug packs.** A definition with `debugOnly` or `timingArc: 'enhance-debug'` is addressed as `debug-<id>`. `layout-shift-audit` and `observation-beats` left `idle-lab`, and the ring through `composition-box-model` and `variant-selection` went with them.
- **Ledger.** `asset-manifest.json` carries `chunkCycles` (empty is the contract) and `foldedInto` on a pack another carries. `npm run check:built` fails on a recorded cycle.

Measured, built site, headless, 19 s after load:

| | before | after |
|---|---|---|
| chunk cycles | 16 | 0 |
| emitted chunks | 188 | 168 |
| `idle-lab` pack | 148,294 B / 44,496 gzip | 138,426 B / 40,591 gzip |
| script requests, `/care/` `/settings/` `/play/rpg-wednesday/` `/topics/software/spw/` | 108 · 107 · 109 · 107 | 91 · 90 · 91 · 90 |
| script gzip on the same routes | 532 · 520 · 549 · 522 KB | 512 · 500 · 527 · 501 KB |

Boot closure is unchanged (9 files, 87.5 KB gzip). One fold remains: the `kernel/site-settings.js` barrel rides in `foundation`.

Open, from the pack ledger: three visible packs (`interaction-progression`, `smart-console`, `spw-key-events`) and `variant-selection` statically import a module that lives in `idle-lab`, so the first of them to mount brings the whole idle pack early. `idle-default` and `idle-residue` import `seed-cards` and `region-menu`, so those two "visible" packs arrive at idle on every page. Each is a source import to move or a schedule to restate, one per patch.

## Non-Goals & Boundaries
- Vite is not the deploy artifact (`dist-vite/` stays a smoke build)
- No SPA, client router, or new npm packages (rolldown already ships with Vite 8)
- Do not rewrite all `/public/js` imports to relative paths
- Do not fold catalog `import()` targets into the boot chunk
- Do not give every transport chunk an entrance; module effects remain local to their authored seat
- Do not defer structural CSS merely to improve a byte report

## Seams & Minimal Touch Files
- Build: `scripts/ts/build/index.mts`, `scripts/ts/css-bundle.mts`, `scripts/template.mjs`, `sw.js`
- Runtime: `public/js/site.js`, `public/js/runtime/module-catalog*.js`
- Contracts: `scripts/tests/infrastructure-contracts.test.mjs`, `.spw/surfaces/runtime-module-medium.spw`
- Track here; cross-link `runtime-bootstrap-performance` only

## Validation Steps
1. `node --check public/js/site.js public/js/runtime/module-catalog.js public/js/runtime/module-catalog-normalize.js`
2. `npm run build:tools`
3. `npm run check:runtime` and `npm run check:pwa`
4. `npm run check:local`
5. Browser: home, settings, services/new-year, and play — one script entry, a bounded static preload closure, and catalog packs still arrive as `import()`s
6. Inspect `dist/asset-manifest.json`: every semantic pack names its member modules and only the static closure is preloaded
