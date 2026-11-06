# Plan: ecosystem-architecture

**Status 2026-11-06.** A ranked route through the CSS and runtime owner plans, chosen by what each move is worth beyond one page, then the phase that spends it: spw.quest as a playground for constructs and specimens (slices G–I in [spw-quest](../spw-quest/PLAN.md)). S0 to S3 and S6 landed on 2026-10-25 (Landed, below). G is live since the 2026-11-05 deploy (spw-quest Status). Since then the owned paths moved once: `expression-query.js` reads a brace pair as its slot in either order (9f2e3af4, spw-quest L), which the instrument in What travels now carries. This plan owns the ranking, the list of what may travel, and S6. Next: S4a, one paint for the site and the quest, once the creator answers the first-portable wonder. S5 (the cascade) and the playground's look also wait on the creator.

**Related:** [core-css-spend-cut](../core-css-spend-cut/PLAN.md) · [css-cascade-stratification](../css-cascade-stratification/PLAN.md) · [css-architecture-readability](../css-architecture-readability/PLAN.md) · [runtime-plane-consolidation](../runtime-plane-consolidation/PLAN.md) · [deploy-module-graph](../deploy-module-graph/PLAN.md) · [spw-inquiry-loop](../spw-inquiry-loop/PLAN.md) · [operator-resonance-alignment](../operator-resonance-alignment/PLAN.md) · [site-starter-component-kit](../site-starter-component-kit/PLAN.md) · [workers-wonder-kit](../workers-wonder-kit/PLAN.md) · [spw-quest](../spw-quest/PLAN.md)

## Value

The public CSS and JS pay three ways beyond the page that loads them. Each slice below moves at least one of them.

- **Peers.** Six worker units in `workers/` (autonomous-feedback, factshift-center, site-hub-next, smut-today, spw-quest, wap-mom). They take the site's material through `npm run build:peer-kit`: tokens, faces, sigil colors, and one script. The next peer site costs what the peer kit cannot carry.
- **Adoption.** spw.quest is Spw's front door. Its first reward is a line read on the worker. The specimens, joins, query and comparison stay on spwashi.com, and agents reach the quest through `/init` and `/llms.txt`.
- **Asset.** A forkable, measured codebase is teaching material and the strongest proof of the practice the site offers. It loses that value when an owner plan disagrees with the tree, and when one concept has five tables.
- **Risk.** The cascade the site ships is not the one its source declares, and two budgets sit at their edge.

## Measured 2026-10-25

Rows the landed slices settled are under Landed. The flip count was re-read on 2026-11-06.

| Fact | Number | Where |
|---|---|---|
| CSS source | 188 files, 3.17 MB, 86,991 lines | `public/css/` without `bundles/` |
| Core bundle | 1,761,812 B; 1721 of 1741 KiB budget; 196 KiB gzip | `css:payload` |
| Layer order | declared on line 1 of `public/css/style-core.css`; the bundler strips it (the `^@layer` replace in `scripts/ts/css-bundle.mts`) | 348 route rules in 17 bundles flip under the declared order on 2026-11-06 (home 70, about 45, play 25); 363 on 10-25 |
| Route budget | `routes/website.css` 143,360 B = 140 KiB | `scripts/ts/css-manifest.mts` |
| Attribute selectors | 944 distinct `data-spw-*` names in CSS, 281 used once | `public/css/` |
| JS | 331 files, 4.69 MB; catalog 146 defs | `public/js/` |
| Half-wired input | `ctx.routeFamily` is built in `public/js/site.js` (the `routeFamily: parseFeatureList` line) and no module reads it; `gesture-contract.js` and `sample-dock.js` read `body.dataset.spwRouteFamily` themselves | the arrival lever |
| Custom elements | 0 at runtime (the one `customElements.define` hit is factshift-center's vendored bundle); the `<spw-*>` tags are build-time | `scripts/template.mjs` |

## Landed

- **S0** (fd554339): owner plans carry today's measure beside their dated figures, and name where the layer order is declared and which file is the one expression reader.
- **S1** (180e4a0e): `SPW_PROJECTION_SEEDS` and `getProjectionSeeds` left the build; `spw-expressions.js` went from 63.3 to 30.7 KB gzip.
- **S2** (df32c50f): the parallel operator tables read their names from `operator-detection.js`; the boonhonk mixer's five charge rows stay (operator-resonance-alignment, *One table*).
- **S3** (4c454b32): one reader bundle serves the site and the quest; the 75.8 KB parser bundle is gone. Pinning the dated `reader.min.js` stays note-shell PR 2.
- **S6** (1633349a): the three byte-identical services bundles are one, `services-surface`, with three aliases in `ROUTE_SURFACE_ALIASES`.
- **G** (17f6a77e, live 2026-11-05): `/specimens` on spw.quest, a slot search over the shelf, and ground then edge for two lines.

## What travels

A peer may take these from `public/` through the peer kit, and nothing else:

- **Bedrock tokens:** `public/css/tokens/core.css`, the `:root` values and the dark restatement, each with what it refers to. Taken today.
- **Faces:** `public/css/tokens/fonts.css` and `public/fonts/`. Taken today.
- **The operator table:** `public/js/kernel/operator-detection.js`. Taken today for colors.
- **The Spw instrument (proposed, S4):** the reader bundle, `public/js/semantic/spw-highlight.js`, the Edit and Copy corner of `public/js/modules/tools/spw-code.js`, `public/css/components/spw-source.css`, and `public/js/semantic/expression-query.js`.

Atmosphere, route surfaces, chrome and the catalog stay home. Anything travels once a peer uses it, and `build:peer-kit -- --check` holds the drift. Today the kit's `SCRIPTS` (in `scripts/build-peer-kit.mjs`) carries one entry, `pinch-text-scale` for spw-quest.

## Slices, ranked

**S4. The Spw instrument travels.** Lever: peers, adoption. Owner: site-starter-component-kit, which answers its first-portable wonder with a third option. workers-wonder-kit carries it. Gate for both halves: the creator answers `wonder_site_starter_first_portable` (`../site-starter-component-kit/index.spw`).
- **S4a. One paint.** spw.quest paints its file editor with its own `paint` (`kit.paint` in `workers/spw-quest/src/file-reader.js`); the site paints its code blocks with `spw-highlight.js`. Add `spw-highlight` to `SCRIPTS` for spw-quest, and let `file-reader.js` call its `highlightSpw` in place of its own `paint`; the kit has to carry its root-relative import of `operator-detection.js`. Verify: `npm run build:peer-kit -- --check`, `npm run check:workers`, then one line in a quest file and the same line in a `code.language-spw` block on `/about/domains/spw.quest/` paint the same spans.
- **S4b. The cut line.** What the highlighter needs from `grammar/syntax.css` (90 KB) travels with `spw-source.css`; the rest stays. This sets readability Patch 4's split (`css-architecture-readability`, *Patch 4 - Large File Responsibility Split*). Verify: `npm run build:css:check`.
- The instrument comes first because a consumer for it already exists.

**S5. One cascade.** Lever: risk, forks. Cost: small code, gated by review. Owner: css-cascade-stratification, the only plan that may emit the order.
- Prepare its Phase 1 so the review takes one sitting: `audit:layer-flip` rows for home (70) and play (25) under `?spw-layer-order=declared`, plus declared-against-shipped phone stills.
- Then emit the order in every bundle. A fork that takes `compose.css` inherits the declared order, and today the site ships another.
- Gate: the creator's browser review.

**S7. The arrival lever.** Lever: every visitor; the largest runtime lever. Owner: runtime-plane-consolidation. Gate: `wonder_runtime_plane_consolidation_arrival_lever`, route family or engagement.
- 60 to 70 modules mount per route.
- `ctx.routeFamily` is computed and read by nothing, while two modules read the body attribute directly. That is evidence for the creator's call, not a decision.

The owners' other next slices keep their own order, and this plan does not rank them: the passive scroll listener, the operator-geometry flip, `rests: change-only`, the smart-console leaf, the starter compose walk, and the gesture census.

## Then spw.quest

Detail lives in [spw-quest](../spw-quest/PLAN.md), slices G–I.

- **G. Specimens.** Landed (above). Any two specimens compare as ground, then the edge by slot (the reading `spw:routes -- --diff` gives routes).
- **H. Motion.** How Spw is developing, shown as the same specimen read by two parser releases. Waits on S3's pinned reader and a second dated release (spw-quest *H. Motion*).
- **I. Agents.** The shelf and the readings as Spw for an agent.

G's query box waits on S4. All three are new routes that leave the note shell alone, in the order the note-shell design sets.

## Order

S4a → S4b → H → I. S5 lands when the creator has reviewed it; S7 follows the creator's answer.

## Guards

- No new `data-spw-*` family. No new npm package. Agents do not deploy: the Wrangler step is the creator's.
- HTML and CSS carry reading, and every page reads with scripts off, the quest included.
- Pacing, the look, and anything public about Spw's plans end at a proposal and a demo. The creator approves in a browser at phone width.
- A slice changes its owner's plan in the same commit, so no two plans claim one seam.

## Validation

- `npm run check:local` for every slice.
- `npm run check:workers` and `npm run build:peer-kit -- --check` for S4 and the quest.
- `npm run audit:layer-flip` for S5.
- `npm run css:payload` before and after any slice that moves CSS.
