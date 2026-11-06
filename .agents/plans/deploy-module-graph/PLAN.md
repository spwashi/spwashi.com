# Deploy Module Graph

**Status 2026-11-06.** The acyclic cut landed 2026-10-06 (f05b02d2): 0 chunk cycles, guarded by `check:built`. `public/js/generated/spw-expressions.js` is 145,418 B (31,211 B at gzip -9 on 2026-11-06) across 986 expressions, down from 331.9 KB on 2026-10-12. Three static imports still pull a pack ahead of its own schedule. Read against the 2026-10-27 pack ledger, each pays off differently, so the order changes: D1 first. `modules/tools/spw-paste.js` imports `../cards/seed-card.js`, so `idle-default` brings `visible-seed-cards` (6,645 B gzip) to about 55 pages with a provenance image, and only 4 pages host a seed card. D2 is `smart-console`'s `getKnowledgeMap` import, which matters on `/settings/` alone. D3 waits on engagement arming. Details under **Next slices**. Gate: `npm run check:built` and the pack ledger in `dist/asset-manifest.json`.

**Related:** [engagement-clusters](../engagement-clusters/PLAN.md) · [module-contract-overhaul](../module-contract-overhaul/PLAN.md) · [runtime-module-decomposition](../archive/runtime-module-decomposition/PLAN.md). **Absorbed 2026-10-10:** the expression-harvest leftover of [js-surface-ecology](../archive/js-surface-ecology/PLAN.md).

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

Landed 2026-08-17 (6036a09e bundles the static `site.js` graph; 723048df puts module timing into deploy transport). The result was 64 semantic packs and 117 chunks over 105 catalog modules. Each pack in `asset-manifest.json` names its timing, members, `describes`, `updates`, imports and raw/gzip bytes, and `loadTrace` records carry `transportHref`. The static boot closure went from 69,418 B gzip in one file to 80,749 B over 5 preloaded files. That 11,332 B is Rolldown's loader and shared boundaries, a trade for demand-coupled transport, not a byte win. Core CSS lost 1.39% when kinetic-stage and seed-card styles moved to the routes that host them.

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

Pack ledger, same day: three visible packs (`interaction-progression`, `spw-key-events`, `variant-selection`) and `idle-chrome` reached into `idle-lab` for one function, the pulse duration, which lived in `pulse-beat-tuner`. The first of them to mount brought the whole idle pack early. The reader moved to a leaf, `runtime/physics/pulse-timing.js`; those four no longer import `idle-lab`.

### Next slices (2026-11-06)

Pack figures are from `dist/asset-manifest.json` built 2026-10-27. Route counts come from `rg` over the authored HTML. One source import per commit; each is verified by `npm run check:built` and the pack's `imports` in a fresh ledger.

- **D1 — the seed card from paste.** `modules/tools/spw-paste.js:24` imports `SeedCard`, `SEED_HOMES`, `deliverSeedHome`, `ensureSeedCardStyles` and `readSeedText` from `modules/cards/seed-card.js`. Because of it, `idle-default` (`image-provenance`, `spw-paste`) carries `visible-seed-cards` (19,928 B / 6,645 gzip). `image-provenance` mounts wherever a render, folio, panel, prime or pad image appears (about 55 HTML files), but only 4 files host `[data-seed-card]` and 1 hosts `[data-paste-open]`. Move the paste's seed-card reads behind a dynamic `import()` when a paste is opened, or move `readSeedText` and `SEED_HOMES` to a leaf as `pulse-timing.js` was. Done when `idle-default` no longer lists the seed-cards chunk in its `imports`.
- **D2 — the knowledge map.** `interface/smart-console.js:20` imports `getKnowledgeMap` from `runtime/memory/cognitive-core.js`. That function is one `querySelectorAll('[data-spw-knowledge="gained"]')`, and the import makes `visible-smart-console` (4,066 B / 1,759 gzip) bring `idle-lab` (137,247 B / 40,287 gzip). The console is hosted only on `/settings/`, and `cognition` (no selector, `idle-lab`) already loads `idle-lab` at idle everywhere. So D2 moves `/settings/`'s `idle-lab` from visible to idle and saves no bytes. Move the query to a leaf. Done when `visible-smart-console` no longer imports `idle-lab`.
- **D3 — the region menu from the link trail.** `runtime/experiential/breadcrumb-spell.js:28` imports `openRegionMenuForElement` and its siblings from `runtime/regions/region-menu.js`, so `idle-residue` carries `visible-region-menu` (22,804 B / 7,320 gzip). Under arrival arming, `region-menu` mounts at visible on any page with a `.spw-chip`, so the import costs nothing extra today. It starts to matter when `engage` arming becomes the default, which is a sensation call in [engagement-clusters](../engagement-clusters/PLAN.md). Parked until then.
- **Proposal — timing inversions as a ledger.** `check:built` already fails on a recorded cycle. It could also list, apart from that failure, each pack whose static `imports` reach a pack scheduled for a different `when`. One plain line per pack would say who brought whom: `visible-smart-console (1.8 KB gz) brings idle-lab (40.3 KB gz) early`. A cycle is drift, and it fails. An inversion is a decision, so it is printed beside the verdict and never fails. A clean build prints one headline: `0 cycles · 3 inversions`.

## Non-Goals & Boundaries
- Vite is not the deploy artifact (`dist-vite/` stays a smoke build)
- No SPA, client router, or new npm packages (rolldown already ships with Vite 8)
- Do not rewrite all `/public/js` imports to relative paths
- Do not fold catalog `import()` targets into the boot chunk
- Do not give every transport chunk an entrance; module effects remain local to their authored seat
- Do not defer structural CSS merely to improve a byte report

## Seams & Minimal Touch Files
- Build: `scripts/ts/build/index.mts`, `scripts/ts/css-bundle.mts`, `scripts/template.mjs`, `sw.js`
- Runtime: `public/js/site.js`, `public/js/runtime/catalog/*.js`
- Contracts: `scripts/tests/infrastructure-contracts.test.mjs`, `.spw/surfaces/runtime-module-medium.spw`
- Track here; cross-link `runtime-bootstrap-performance` only

## Validation Steps
1. `node --check public/js/site.js public/js/runtime/catalog/index.js public/js/runtime/catalog/normalize.js`
2. `npm run build:tools`
3. `npm run check:runtime` and `npm run check:pwa`
4. `npm run check:local`
5. Browser: home, settings, services/new-year, and play — one script entry, a bounded static preload closure, and catalog packs still arrive as `import()`s
6. Inspect `dist/asset-manifest.json`: every semantic pack names its member modules and only the static closure is preloaded

## Absorbed 2026-10-10 — js-surface-ecology (expression harvest)

From [js-surface-ecology](../archive/js-surface-ecology/PLAN.md) (`.spw/audits/js-tree-value-2026-09.spw` `next.3`). `public/js/generated/spw-expressions.js` holds every route's expressions. It grew from 264 KB at the audit to 326 KB on 2026-10-10, then dropped to **145,418 B (142.0 KiB across 986 parsed expressions, re-measured 2026-11-05)** after `SPW_PROJECTION_SEEDS` was retired and slot records were compacted. `public/js/runtime/expression/expression-resonance.js:638` loads it at idle via `import('/public/js/generated/spw-expressions.js')` to build the cross-route kin index. Its compressed cost, measured 2026-11-06 on the source: 31,211 B at gzip -9, which is less than `idle-lab`'s 40,287. Whether a per-route split still pays is `index.spw` `#>wonder_deploy_module_graph_manifest_split`. If it does, keep precomputed cross-route kin edges as the shared index, and measure idle gzip before and after.
