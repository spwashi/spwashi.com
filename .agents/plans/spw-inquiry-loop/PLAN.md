# Plan: spw-inquiry-loop

**Status 2026-10-27.** Renamed from `spw-language-v04` at the creator's word, which answers the roadmap's `wonder_v04_name`: the plan is named for the loop it owns, and the pillar files and public anchors keep `v04`, since the workbench and inbound links cite them. Nested wonders and `npm run plans:twinkle` landed the same day (Slices, below). Reevaluated against the site and the workbench at `850077a` ([roadmap](../../../.spw/language/v04/roadmap.spw), `^"reevaluation_2026_10_27"`). There is no v0.4 to wait for: upstream versions capabilities, not the language (every package is 0.3.0, and its plans decline a global v0.4), and none of the twelve pillars reached it, while the asks tree did (five of fourteen landed). Of the pillars, typed references and the operation and fixity headers are confirmed; claims, precipitates and editor lenses stay active and partial; profiles, grammar unification, stems, registers, runtime goals, the experimental namespace and the submodule bridge are superseded, each pointing at what holds its intent now. Phase 2 as written is retired. The concept is restated as the loop closing (a question carries a probe, the probe runs, the answer lands on a claim with a receipt) and as a ledger of capabilities, each with a contract name, a consumer here and a receipt. The first slice of `inquiry.loop/1` has landed: `npm run wonder -- --run` runs the read-only wonder probes and keeps receipts in the claim protocol's terms, and `--contour` reads each wonder's lifecycle. The next is answering: an `~#answer` beside a run, wherever a receipt settles its question. Phase 4 has moved on since 2026-10-10: the mount is at `850077a`, every browser reader imports the reader bundle (S3 of [ecosystem-architecture](../ecosystem-architecture/PLAN.md)), and the handle seeds left the manifest (S1). Two questions wait on the creator in the roadmap: whether an answered wonder is a confirmed claim, and the two meanings of fixity. The expression-query slice below is unchanged.

**Related:** [spw-metaphysical-language](../spw-metaphysical-language/PLAN.md) (its passes run this loop) · [ecosystem-architecture](../ecosystem-architecture/PLAN.md) · [capability asks](../../../.spw/reviews/upstream-workbench-recommendations/capabilities.spw) · [operator-semantics-refinement](../archive/operator-semantics-refinement/PLAN.md) · [spw-document-room](../archive/spw-document-room/PLAN.md).

Close the loop a question runs on this site: probe, then a Spw update, then a refactor, then a test. A wonder carries a guess and a probe, the probe runs, the answer lands beside its receipt, and every plan that cites what moved can see that it moved. The capabilities the loop leans on are a ledger with contract names (`capabilities.spw`). Until 2026-10-27 this plan was `spw-language-v04`; its pillars are history below.

## Public Goal

A question asked anywhere in the site's `.spw` can be probed, answered and seen to have moved by every plan that leans on it, with a receipt a reader can open. The parser that reads Spw in the browser stays here too (Phase 4).

## Slices

- **Landed 2026-10-27.** `npm run wonder -- --run` runs the read-only probes and keeps receipts in `.spw/gen/wonder-runs.spw`; `--contour` reads each wonder as open, probed, answered or retired.
- **Landed 2026-10-27.** Nested wonders: a wonder may hold smaller wonders, each harvested with its parent named and its marks kept apart. The parser already held them; the harvest now does too, and its brace walk skips quoted text, which also restored a probe the old walk had cut short. The editor still folds a child's first probe and its terms into the parent's hint and reads at most eleven lines of a body; that is recorded as an ask in `capabilities.spw`.
- **Landed 2026-10-27.** `npm run plans:twinkle`: the concepts live plans share, lit where one moved after a citing plan last looked. Bright when a cited wonder or plan moved, dim when a cited file changed; scaffolding every plan carries is left out. The first reading: 52 plans, 146 shared concepts, 26 bright and 81 dim references.
- **Next.** Answer the wonders a run settles, each `~#answer` beside its receipt, and tend the plans `plans:twinkle` lights brightest. Then the expression-query prefix slice below.

## Scope

- In scope: `.agents/plans/spw-inquiry-loop/`, `scripts/wonder.mjs`, `scripts/plan-twinkle.mjs`, `capabilities.spw`, the roadmap and its reevaluation under `.spw/language/v04/`, the expression-query prefix slice, and the in-site parser (Phase 4). The pillar files are history and change only to keep their citations resolving.
- Out of scope: landing full v0.4 parser/runtime in the workbench (upstream); breaking existing `.spw` files; npm dependency changes.

## History: the v0.4 pillars (superseded 2026-10-27)

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

## History: the v0.4 phases

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
- Wire claim probes into `npm run check:local` where safe.
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
- Phase 2 has not started upstream. The pinned workbench (`3eaab6377672`, 2026-09-22) has no `docs/specs/spw/v04/` and no `feature/spw-language-v04` branch in the checkout; `submodule-bridge.spw` still describes the target layout. The worktree this plan named (`../wt-spw-inquiry-loop`) is gone; work lands on `main`.
- Phase 3 is partly realized by other means: `npm run spw:integrity` parses every authored expression (912 today), the expression manifest below precipitates the parse into the runtime, and `ecology:language` is the probe. Claim probes are not yet in `npm run check:local`.

## Phase 4 — Interpreter in the site (landed under v0.3.0)

No plan owned the parser's arrival in the site, so this plan does, as the workbench-consumer path of `.spw/language/feature-utilization.spw#dual_path`. What exists:

- `public/js/semantic/spw-workbench-parser.js`: generated from spw-workbench v0.3.0 at `f2e5b61b9e3d` by `npm run build:spw-parser`; never hand-edited. Retired 2026-10-25 ([ecosystem-architecture](../ecosystem-architecture/PLAN.md) S3): `public/js/semantic/spw-workbench-reader.js`, from the same build, gives the same `parse` on all 993 tracked `.spw` files and the same `parseExpression` on all 974 route expressions, so every browser reader of Spw imports it, and spw.quest carries it as `/parser.js`.
- `public/js/semantic/spw-runtime-parser.js`: the on-demand entry (`parse()`, not `parseExpression()`). Boot never imports it; console, the literal-parser tool at `/tools/spw-parser/`, and join specimens load it.
- `scripts/build-expression-manifest.mjs` to `public/js/generated/spw-expressions.js`: the kinship parse of every `data-spw-semantic-expression` happens at build time (subject, mode, parts, projection, scope, charge) so the page works with no parser loaded. The `rank` dimension was measured and dropped; the script's header still says 441 expressions where the tree now has 912. The `.spw` handle seeds it also emitted (195 KB, read by nothing since d779d339) left the build on 2026-10-25 ([ecosystem-architecture](../ecosystem-architecture/PLAN.md) S1); routes are its only input, so a `.spw` edit no longer moves its stamp.
- `public/js/semantic/expression-query.js` reads brace slots for search and the cauldron; `.spw/caches/spw-as-handle-2026-09.spw` (2026-09-27) is the prime for one grammar across search, cauldron, satchel, and texture.website, with a typed example. That cache is this phase's next slice; it lands as web-experiment patches, never bundled with a pillar change.

Invariants: build-time parse first, runtime parse on demand, the page complete without either; the site consumes the pinned grammar and forks nothing. A grammar bump is a workbench pin plus `build:spw-parser` plus `manifest:expressions` in one commit, verified by `spw:integrity`, `ecology:language`, and `check:local`.

## Workbench consumer pin — 2026-09-30

Operation `align`: advance the site mount from `3eaab6377672` to upstream main `229aedcf` (seven commits). Consume CLI citation-resolution, plan-index, and stream timestamp improvements; this does not claim Phase 2 has landed. Rebuild the browser parser and expression manifest from the same revision. The workbench dependency graph is unchanged; no packages installed.

Validation: `build:spw-parser`, `manifest:expressions`, `spw:integrity`, `ecology:language`, and `check:local`. Pre-push now extracts workbench sources and citation targets at the site commit's exact gitlink, reusing installed dependencies only. A regression compares the extracted parser source and citation file with their pinned Git blobs.
