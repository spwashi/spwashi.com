# Plan: ecosystem-architecture

**Status 2026-10-25.** S0 to S3 and S6 landed: the owner plans carry today's measure beside their dated figures and name the two seams, the expression manifest no longer ships the `.spw` seeds, the parallel operator tables read from the canon, one reader bundle serves the site and the quest, and the three offer pages share one services bundle. A ranked route through the CSS and runtime owner plans, chosen by what each move is worth beyond one page. Then the phase that spends it: spw.quest shows how Spw is developing and becomes a playground for constructs and specimens (slices G–I in [spw-quest](../spw-quest/PLAN.md)). Every slice names its owner, and this plan owns three things: the ranking, the list of what may travel, and one unowned item (S6). Next: S4 waits on the creator. G is merged to main (17f6a77e) to test live; the next Wrangler deploy carries it with the note. The cascade (S5), what travels first (S4), and the playground's look wait on the creator.

**Related:** [core-css-spend-cut](../core-css-spend-cut/PLAN.md) · [css-cascade-stratification](../css-cascade-stratification/PLAN.md) · [css-architecture-readability](../css-architecture-readability/PLAN.md) · [runtime-plane-consolidation](../runtime-plane-consolidation/PLAN.md) · [deploy-module-graph](../deploy-module-graph/PLAN.md) · [spw-language-v04](../spw-language-v04/PLAN.md) · [operator-resonance-alignment](../operator-resonance-alignment/PLAN.md) · [site-starter-component-kit](../site-starter-component-kit/PLAN.md) · [workers-wonder-kit](../workers-wonder-kit/PLAN.md) · [spw-quest](../spw-quest/PLAN.md)

## Value

The public CSS and JS pay three ways beyond the page that loads them. Each slice below moves at least one of them.

- **Peers.** Six worker units in `workers/` (autonomous-feedback, factshift-center, site-hub-next, smut-today, spw-quest, wap-mom). They take the site's material through `npm run build:peer-kit`: tokens, faces, sigil colors, and one script. The next peer site costs what the peer kit cannot carry.
- **Adoption.** spw.quest is Spw's front door. Its first reward is a line read on the worker. The specimens, joins, query and comparison stay on spwashi.com, and agents reach the quest through `/init` and `/llms.txt`.
- **Asset.** A forkable, measured codebase is teaching material and the strongest proof of the practice the site offers. It loses that value when an owner plan disagrees with the tree, and when one concept has five tables.
- **Risk.** The cascade the site ships is not the one its source declares, and two budgets sit at their edge.

## Measured 2026-10-25

| Fact | Number | Where |
|---|---|---|
| CSS source | 188 files, 3.17 MB, 86,991 lines | `public/css/` without `bundles/` |
| Core bundle | 1,761,812 B; 1721 of 1741 KiB budget; 196 KiB gzip | `css:payload` |
| Layer order | declared at `public/css/style-core.css:1`, stripped by `scripts/ts/css-bundle.mts:45` | 363 route rules flip under the declared order (home 67, about 45) via `audit:layer-flip` |
| Identical bundles | 3 services route bundles, 16,331 B each, same md5 | no owner |
| Route budget | `routes/website.css` 143,360 B = 140 KiB | `scripts/ts/css-manifest.mts` |
| Attribute selectors | 944 distinct `data-spw-*` names in CSS, 281 used once | `public/css/` |
| JS | 331 files, 4.69 MB; catalog 146 defs (owner plans cite 96, 105, 114) | `public/js/` |
| Unread payload | `SPW_PROJECTION_SEEDS` is 195 KB of the 338 KB expression manifest (33 of 64 KB gzip); `getProjectionSeeds()` has no caller | `public/js/runtime/expression/expression-resonance.js:636` |
| Parser bundles | 2 at `0eb1d1c0` (1 after S3): `spw-workbench-parser.js` 75.8 KB (spw-seed), `spw-workbench-reader.js` 87.5 KB (spw-lsp reader, also exports `parse`); same result on 990 of 990 `.spw` files | `build:spw-parser` |
| Operator tables | 1 canon (`public/js/kernel/operator-detection.js`, 19 definitions) and 5 parallel | geometry, operator-info, shared, profile builder, boonhonk mixer |
| Half-wired input | `ctx.routeFamily` is set at `public/js/site.js:498` and read by nothing | the arrival lever |
| Custom elements | 0 at runtime; the `<spw-*>` tags are build-time | `scripts/template.mjs` |
| spw.quest | committed, not deployed since 2026-10-14; 52 route tests; inlines its own CSS | `workers/spw-quest/` |

## What travels

A peer may take these from `public/` through the peer kit, and nothing else:

- **Bedrock tokens:** `public/css/tokens/core.css`, the `:root` values and the dark restatement, each with what it refers to. Taken today.
- **Faces:** `public/css/tokens/fonts.css` and `public/fonts/`. Taken today.
- **The operator table:** `public/js/kernel/operator-detection.js`. Taken today for colors.
- **The Spw instrument (proposed, S4):** the reader bundle, `public/js/semantic/spw-highlight.js`, the Edit and Copy corner of `public/js/modules/tools/spw-code.js`, `public/css/components/spw-source.css`, and `public/js/semantic/expression-query.js`.

Atmosphere, route surfaces, chrome and the catalog stay home. Anything travels once a peer uses it, and `build:peer-kit -- --check` holds the drift.

## Slices, ranked

**S0. Make the owner plans match the tree.** Lever: asset. Cost: one pass, no code. Owner: each plan named; the rows are in `wip.spw`. Gate: none.
- Stale counts:
  - catalog defs and the site.js baseline;
  - the "no bundle step" note in runtime-plane-consolidation;
  - flip counts 365 → 363;
  - the stylesheet-ecology figures;
  - the workbench pin in spw-language-v04;
  - interaction-grammar's "browser parser out of scope";
  - spw-quest's "What it is now", including `/read` and `/parser/`, and slice A, which `/read` superseded.
- Two seams to name:
  - **Where the layer order is declared.** readability and `css-instruction.spw` say `style.css`; it is declared at `style-core.css:1`.
  - **Which file is the one expression reader.** runtime-plane-consolidation Phase 4 says geometry; spw-language-v04 extends `expression-query.js`. Proposed: expression-query reads slots (no imports, read by search, the cauldron, the build scripts and `spw:routes`), and geometry reads layout from those slots.

Validation: `npm run audit:plans`.

**S1. Stop shipping what nobody reads.** Lever: every visitor. Cost: small. Owner: spw-language-v04 (Phase 4 owns the manifest).
- Move `SPW_PROJECTION_SEEDS` out of `public/js/generated/spw-expressions.js`. Either give it its own module for the first reader that asks, or leave it out of the build until one exists.
- Saving: 33 KB gzip on every page that carries an expression.
- Files: `scripts/build-expression-manifest.mjs` and `expression-resonance.js`.

Validation: `npm run manifest:staged`, `npm run check:built`, `npm run test:modules`.

**S2. One operator table.** Landed 2026-10-25: four views and one charge table that stays (owner plan, *One table*). Lever: asset, peers. Cost: small to medium. Owner: operator-resonance-alignment.
- The five parallel tables become views of `operator-detection.js`.
- When the workbench table lands (creator, 2026-10-11), this file becomes its adapter, and every reader already goes through it.

Validation: `npm run test:modules`, `npm run build:peer-kit -- --check`, `npm run check:workers`.

**S3. One reader for Spw in a browser.** Landed 2026-10-25: the parser bundle is gone, and spw.quest's `/parser.js` and worker readings are the reader. The quest's guide still imports `/parser.js`; pinning the dated `reader.min.js` stays note-shell PR 2. Lever: adoption, peers. Cost: small. Owner: spw-language-v04. Gate: none.
- The parser and reader bundles come from one revision. Today the site's code blocks, the parser tool, the console and spw.quest import different ones.
- The reader's `parse` gives the parser's AST, tokens, errors, warnings and events on all 990 authored `.spw` files (2026-10-25; only timing differs).
- So the parser bundle's importers can move to the reader, and one bundle serves the site and the quest (note-shell PR 2 pins `reader.min.js`).
- This drops a 75.8 KB bundle and one build output.

**S4. The Spw instrument travels.** Lever: peers, adoption. Cost: medium. Owner: site-starter-component-kit, which answers its first-portable wonder with a third option. workers-wonder-kit carries it.
- A peer-kit entry builds the instrument listed under What travels. spw.quest's file editor and the site's 34 highlighted blocks then paint from one source.
- The instrument should come first because a consumer for it already exists.
- It also sets the cut line for readability Patch 4's split of `grammar/syntax.css` (90 KB): what the highlighter needs travels, and the rest stays.
- Gate: the creator answers the first-portable wonder.

**S5. One cascade.** Lever: risk, forks. Cost: small code, gated by review. Owner: css-cascade-stratification, the only plan that may emit the order.
- Prepare its Phase 1 so the review takes one sitting: flip rows for home (67) and play (25) under `?spw-layer-order=declared`, plus declared-against-shipped phone stills.
- Then emit the order in every bundle. A fork that takes `compose.css` inherits the declared order, and today the site ships another.
- Gate: the creator's browser review.

**S6. One services bundle.** Landed 2026-10-25 as `services-surface`. Lever: asset. Cost: tiny. Owner: none yet; core-css-spend-cut takes it.
- The three identical services bundles become one in `css-manifest.mts`, with three aliases.

Validation: `npm run build:css:check`, `npm run check:built`.

**S7. The arrival lever.** Lever: every visitor; the largest runtime lever. Owner: runtime-plane-consolidation. Gate: its wonder, route family or engagement.
- 60 to 70 modules mount per route.
- `ctx.routeFamily` is already computed and read by nothing. That is evidence for the creator's call, not a decision.

The owners' other next slices keep their own order, and this plan does not rank them: the passive scroll listener, the operator-geometry flip, `rests: change-only`, the smart-console leaf, the starter compose walk, and the gesture census.

## Then spw.quest

Detail lives in [spw-quest](../spw-quest/PLAN.md), slices G–I.

- **G. Specimens.** Built, and merged to main 2026-10-26. A shelf of constructs read on the worker, each with where it lives on spwashi.com. Any two compare as ground, then the edge by slot (the reading `spw:routes -- --diff` gives routes).
- **H. Motion.** How Spw is developing, shown as the same specimen read by two parser releases.
- **I. Agents.** The shelf and the readings as Spw for an agent.

Order:
- G needs nothing from S0–S7. Its query box waits on S4, and H waits on S3 and a second release.
- All three are new routes that leave the note shell alone, and they ship after the note is deployed, in the order the note-shell design sets.

## Order

S0 → S1 → S2 → S3 → S4 → G → H → I. S5 and S6 can land at any point, and S7 follows the creator's answer.

## Guards

- No new `data-spw-*` family. No new npm package. Agents do not deploy: the Wrangler step is the creator's.
- HTML and CSS carry reading, and every page reads with scripts off, the quest included.
- Pacing, the look, and anything public about Spw's plans end at a proposal and a demo. The creator approves in a browser at phone width.
- A slice changes its owner's plan in the same commit, so no two plans claim one seam.

## Validation

- `npm run audit:plans` after S0.
- `npm run check:local` for every slice.
- `npm run check:workers` and `npm run build:peer-kit -- --check` for S2, S4 and the quest.
- `npm run audit:layer-flip` for S5.
- `npm run css:payload` before and after S1 and S6.
