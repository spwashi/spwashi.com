# Plan: spw-inquiry-loop

**Status 2026-11-06.** The loop runs and has not been run since it landed: `npm run wonder -- --run` keeps receipts in `.spw/gen/wonder-runs.spw` (last written 2026-10-27), `--contour` reads each wonder's lifecycle, nested wonders harvest, and `plans:twinkle` lights the concepts that moved. Five of 267 wonders are answered, each by a creator decision. Next is answering, where a decision or a commit has settled a question, then the prefix half of the expression-query slice, which spw-metaphysical-language's variety roadmap now cites. Renamed from `spw-language-v04` at the creator's word on 2026-10-27 (297debb6); upstream versions capabilities rather than the language, so there is no v0.4 to wait for ([roadmap](../../../.spw/language/v04/roadmap.spw) `^"reevaluation_2026_10_27"`, 77a52b58), and the expressiveness goals the asks serve are kept there as `^"expressiveness_goals"` (eedc6e04). Two questions wait on the creator in the roadmap: whether an answered wonder is a confirmed claim, and fixity's two meanings.

**Related:** [spw-metaphysical-language](../spw-metaphysical-language/PLAN.md) (its passes run this loop) · [ecosystem-architecture](../ecosystem-architecture/PLAN.md) · [capability asks](../../../.spw/reviews/upstream-workbench-recommendations/capabilities.spw) · [operator-semantics-refinement](../archive/operator-semantics-refinement/PLAN.md) · [spw-document-room](../archive/spw-document-room/PLAN.md).

Close the loop a question runs on this site: probe, then a Spw update, then a refactor, then a test. A wonder carries a guess and a probe, the probe runs, the answer lands beside its receipt, and every plan that cites what moved can see that it moved. The capabilities the loop leans on are a ledger with contract names (`capabilities.spw`). Until 2026-10-27 this plan was `spw-language-v04`; its pillars are history below.

## Public Goal

A question asked anywhere in the site's `.spw` can be probed, answered and seen to have moved by every plan that leans on it, with a receipt a reader can open. The parser that reads Spw in the browser stays here too (Phase 4).

## Slices

Landed 2026-10-27:
- `npm run wonder -- --run` runs the read-only probes and keeps receipts in the claim protocol's terms; `--contour` reads open, probed, answered or retired (533a3bbb).
- Nested wonders harvest as their own questions with the parent named; the brace walk skips quoted text, which restored a probe the old walk had cut. The editor still folds a child's first probe into the parent's hint; that is an ask in `capabilities.spw` (34cb136e).
- `npm run plans:twinkle` lights a reference whose target moved after the citing plan last looked; first reading 52 plans, 146 shared concepts, 26 bright, 81 dim (8a3dfe7c).

Next, one commit each:
1. **Answer what has settled.** Read `npm run -s wonder -- --contour` ("moved"), and write `~#answer(date)` only where the block can cite a creator decision or a commit. Touches the wonders' own files. Waits on nothing. Verified by the contour's answered count rising with each answer naming its source.
2. **Prefix sigils in the query reader** (patch 2 of `.spw/caches/spw-as-handle-2026-09.spw`). Seven route expressions lead with an operator; `parseExpressionQuery('?topics{kin}<learn>')` reads subject `""`, and `readExpressionSlots` keeps `?topics` as the word. Both read the prefix as its own slot and the word without it. Touches `public/js/semantic/expression-query.js` and `scripts/tests/expression-query.test.mjs`, with the seven manifest lines as fixtures. Waits on nothing; the trailing half waits on `#>wonder_spw_inquiry_loop_trailing_probe`. spw-metaphysical-language's variety slice 1 takes its prefix half from here.
3. **Contour lines as Spw (a proposal).** `--contour` prints each wonder as one line whose slots are its state: `?brace_semantics_curly_name[probed]{definition, direction, behavior}<2026-10-27>`, the `$%` set in the body, the lifecycle in the mode, the last receipt's date as projection. An answer then visibly turns one slot (`[probed]` to `[answered]`), so reading the sensor teaches the slot grammar. Touches `scripts/wonder.mjs`. Verified by `node --test scripts/tests/wonder-lifecycle.test.mjs` and each line parsing in `spw-workbench-reader.js`.
4. **`help --json` upstream.** `#>wonder_plan_help_json`; on 2026-11-06 `npm run spw -- --help --json` still prints the text manual.

## Scope

- In scope: `.agents/plans/spw-inquiry-loop/`, `scripts/wonder.mjs`, `scripts/plan-twinkle.mjs`, `capabilities.spw`, the roadmap and its reevaluation under `.spw/language/v04/`, the expression-query prefix slice, and the in-site parser (Phase 4). The pillar files are history and change only to keep their citations resolving.
- Out of scope: landing full v0.4 parser/runtime in the workbench (upstream); breaking existing `.spw` files; npm dependency changes.

## History: v0.4

- **Landed, now history.** Twelve pillar files under `.spw/language/v04/pillars/`, dispatched from `.spw/language/v04/index.spw`, and the atlas section `#language-evolution-v04` (Phase 1, by 2026-09-27); `npm run ecology:language` counts their claims and probes. Superseded 2026-10-27 (77a52b58): typed references and the operation and fixity headers are confirmed; claims, precipitates and editor lenses stay active and partial; the rest point at what holds their intent now (roadmap `^"reevaluation_2026_10_27"`). The pillar files change only to keep their citations resolving.
- **Retired 2026-10-27.** Phase 2 (an upstream `feature/spw-language-v04` branch, `docs/specs/spw/v04/`, a pinned v0.4 workbench) and the submodule procedure written for it: upstream versions capabilities instead, and the mount moves by the consumer pin below.
- **Realized by other means.** Phase 3: `npm run spw:integrity` parses every authored expression, the expression manifest precipitates the parse into the runtime, and `ecology:language` is the probe. Claim probes are not in `npm run check:local`.

## Validation

- `git diff --check`
- `node --test scripts/tests/wonder-lifecycle.test.mjs` and `npm run -s wonder -- --contour`
- `rg -n 'id="language-evolution-v04"' topics/software/spw/index.html` (inbound links still land)
- `.spw/language/v04/index.spw` dispatch resolves every pillar path

## Phase 4 — Interpreter in the site (landed under v0.3.0)

No plan owned the parser's arrival in the site, so this plan does, as the workbench-consumer path of `.spw/language/feature-utilization.spw#dual_path`. What exists:

- `public/js/semantic/spw-workbench-parser.js`: generated from spw-workbench v0.3.0 at `f2e5b61b9e3d` by `npm run build:spw-parser`; never hand-edited. Retired 2026-10-25 ([ecosystem-architecture](../ecosystem-architecture/PLAN.md) S3): `public/js/semantic/spw-workbench-reader.js`, from the same build, gives the same `parse` on all 993 tracked `.spw` files and the same `parseExpression` on all 974 route expressions, so every browser reader of Spw imports it, and spw.quest carries it as `/parser.js`.
- `public/js/semantic/spw-runtime-parser.js`: the on-demand entry (`parse()`, not `parseExpression()`). Boot never imports it; console, the literal-parser tool at `/tools/spw-parser/`, and join specimens load it.
- `scripts/build-expression-manifest.mjs` to `public/js/generated/spw-expressions.js`: the kinship parse of every `data-spw-semantic-expression` happens at build time (subject, mode, parts, projection, scope, charge) so the page works with no parser loaded. The `rank` dimension was measured and dropped; the script's header still says 441 expressions where the manifest now holds 986. The `.spw` handle seeds it also emitted (195 KB, read by nothing since d779d339) left the build on 2026-10-25 ([ecosystem-architecture](../ecosystem-architecture/PLAN.md) S1); routes are its only input, so a `.spw` edit no longer moves its stamp.
- `public/js/semantic/expression-query.js` reads brace slots for search and the cauldron; `.spw/caches/spw-as-handle-2026-09.spw` (2026-09-27) is the prime for one grammar across search, cauldron, satchel, and texture.website, with a typed example. Its patch 2 is Slice 2 above; it lands as web-experiment patches, never bundled with a pillar change.

Invariants: build-time parse first, runtime parse on demand, the page complete without either; the site consumes the pinned grammar and forks nothing. A grammar bump is a workbench pin plus `build:spw-parser` plus `manifest:expressions` in one commit, verified by `spw:integrity`, `ecology:language`, and `check:local`.

## Workbench consumer pin

Operation `align`: the mount moves to an upstream revision, the browser parser and expression manifest are rebuilt from that same revision in the same commit, and the move claims nothing about the language version. Pins so far: `3eaab6377672` to `229aedcf` (2026-09-30), seven moves on 2026-10-12 and 2026-10-13 recorded in `wip.spw` (to `0eb1d1c0`, f51b316c), `850077a` (b956329b, 2026-10-27), and the current `27fa1e3d` (2026-11-06: seven upstream commits, one of code, `3f53adf2`, seed's slot reader; every route expression reads the same, so the manifest moved only its stamp, and spw.quest's carried `/parser.js` moved with the mount). Pre-push extracts workbench sources and citation targets at the site commit's exact gitlink; no packages are installed.

Validation: `build:spw-parser`, `manifest:expressions`, `spw:integrity`, `ecology:language`, and `check:local`.
