# Plan: spw-language-v04

Elaborate Spw as a language toward v0.4: profiles, typed references, executable claims, stem projection, register precipitates, and workbench submodule alignment — expressed as dimensionally rich `.spw` artifacts on spwashi.com before upstream grammar lands.

## Public Goal

Readers and agents on spwashi.com can inspect a coherent v0.4 language direction without waiting for the workbench submodule to catch up. Site copy on the Spw operator atlas should name the improvement stack in public language; local `.spw/language/v04/` should carry the inspectable contracts, claims, dimensions, and submodule bridge.

## Scope

- In scope: `.agents/plans/spw-language-v04/`, `.spw/language/v04/` pillar artifacts, `topics/software/spw/index.html` copy, dispatch wiring in `.spw/index.spw`, `.spw/site.spw`, `.spw/conventions/index.spw`, submodule update procedure in `submodule-bridge.spw`.
- Out of scope: landing full v0.4 parser/runtime in the workbench (upstream); breaking existing `.spw` files; npm dependency changes.

## Pillar Artifacts

All pillars live under `.spw/language/v04/pillars/` and dispatch from `.spw/language/v04/index.spw`:

1. `profiles-and-validator.spw` — file profiles, required blocks, validate-spw integration
2. `grammar-unification.spw` — one section AST, dialect deprecation
3. `operation-fixity-types.spw` — typed operation/fixity headers
4. `stem-projection.spw` — stem → HTML/CSS/JS/.spw projections
5. `typed-references-indexing.spw` — resolved refs, broken-link errors, index projections
6. `claim-probe-syntax.spw` — claim blocks, probe execution, CI hooks
7. `register-serialization.spw` — reg=probe, reg=projection, multi-sink emit
8. `runtime-goals-pipeline.spw` — goals + prime→precipitate pipeline
9. `precipitate-projections.spw` — indexes/manifests as language outputs
10. `lsp-editor-lenses.spw` — dimension lenses, go-to-owner, claim overlay
11. `core-experimental-namespace.spw` — small core, experimental profile boundary
12. `submodule-bridge.spw` — spw-workbench update path and pin ritual

## Phases

### Phase 1 — Site artifacts (this worktree)

- Land pillar `.spw` files with dimensions, owner_claim, editor_prompts, validation probes.
- Wire language registry into site dispatch.
- Add operator-atlas copy section `#language-evolution-v04`.

### Phase 2 — Workbench submodule (human-gated)

- Open upstream branch `feature/spw-language-v04` in `spw-workbench`.
- Port pillar contracts into `docs/specs/spw/v04/` and `lib/spw-v0.4.0/` scaffold.
- Extend `validate-spw` profiles from `profiles-and-validator.spw`.
- Pin `.spw/_workbench` submodule after review.

### Phase 3 — Precipitate to runtime

- Emit agent manifest slices from `register-serialization.spw`.
- Wire claim probes into `npm run check` where safe.
- Promote stable stems into `.spw/conventions/` via semantic-capacity contract operation.

## Submodule Update Procedure

1. `cd .spw/_workbench && git fetch && git checkout feature/spw-language-v04`
2. Land upstream spec + validator changes per `submodule-bridge.spw`.
3. `cd ../.. && git add .spw/_workbench && git commit -m "Pin workbench for Spw v0.4 spec"`
4. Run `npm run check:local` and `validate-spw` on touched `.spw` surfaces.

## Validation

- `git diff --check`
- `rg language-evolution-v04 topics/software/spw/index.html`
- `rg spw_language_v04 .spw`
- Manual read: `.spw/language/v04/index.spw` dispatch resolves all pillar paths
- Future: `node .spw/_workbench/.../validate-spw` on pillar files after submodule pin

## Status — 2026-09-27

- Phase 1 landed: the twelve pillars exist under `.spw/language/v04/pillars/`, the atlas carries `#language-evolution-v04`, and `npm run ecology:language` reports the claim and probe counts.
- Phase 2 has not started upstream. The pinned workbench (`3eaab6377672`, 2026-09-22) has no `docs/specs/spw/v04/` and no `feature/spw-language-v04` branch in the checkout; `submodule-bridge.spw` still describes the target layout. The worktree this plan named (`../wt-spw-language-v04`) is gone; work lands on `main`.
- Phase 3 is partly realized by other means: `npm run spw:integrity` parses every authored expression (912 today), the expression manifest below precipitates the parse into the runtime, and `ecology:language` is the probe. Claim probes are not yet in `npm run check`.

## Phase 4 — Interpreter in the site (landed under v0.3.0)

No plan owned the parser's arrival in the site, so this plan does, as the workbench-consumer path of `.spw/language/feature-utilization.spw#dual_path`. What exists:

- `public/js/semantic/spw-workbench-parser.js`: generated from spw-workbench v0.3.0 at `f2e5b61b9e3d` by `npm run build:spw-parser`; never hand-edited.
- `public/js/semantic/spw-runtime-parser.js`: the on-demand entry (`parse()`, not `parseExpression()`). Boot never imports it; console, the literal-parser tool at `/tools/spw-parser/`, and join specimens load it.
- `scripts/build-expression-manifest.mjs` to `public/js/generated/spw-expressions.js`: the kinship parse of every `data-spw-semantic-expression` happens at build time (subject, mode, parts, projection, scope, charge) so the page works with no parser loaded. The `rank` dimension was measured and dropped; the script's header still says 441 expressions where the tree now has 912.
- `public/js/semantic/expression-query.js` reads brace slots for search and the cauldron; `.spw/caches/spw-as-handle-2026-09.spw` (2026-09-27) is the prime for one grammar across search, cauldron, satchel, and texture.website, with a typed example. That cache is this phase's next slice; it lands as web-experiment patches, never bundled with a pillar change.

Invariants: build-time parse first, runtime parse on demand, the page complete without either; the site consumes the pinned grammar and forks nothing. A grammar bump is a workbench pin plus `build:spw-parser` plus `manifest:expressions` in one commit, verified by `spw:integrity`, `ecology:language`, and `check:local`.