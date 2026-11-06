# Agent Optimization for spwashi.com

**Status 2026-11-06.** The gate holds and the census shrank. `AGENTS.md` is 3179 words against the 3200 in `ALWAYS_ON_SPECS` (`scripts/check-agent-contracts.mjs`), unchanged since 280c5a84 removed the archived-plan lines. Live plans fell from 154 `PLAN.md` (2026-09-20) to 52, with 186 archived; agentic-dev-contracts can follow. Next: A2 can land today; A1 waits only on the creator's review.

**Related:** [history-reflow](../history-reflow/PLAN.md) · [agentic-dev-contracts](../agentic-dev-contracts/PLAN.md) (archive candidate) · [spw-architecture-ecology](../archive/spw-architecture-ecology/PLAN.md) (wave H absorbed 2026-10-10).

## Public Goal

Make the agent operating environment (`.agents/`, skills, planning ecology, `.spw`
bridges, public editor surfaces, validation contracts) a first-class, low-friction
surface. Success is a smaller next census, not more `index.spw`.

The site stays hand-authored and human-primary. This track is editor inspectability,
not a new runtime. [Hypermedia geometry](./HYPERMEDIA.md) landed four of its five
items on 2026-09-04; the fifth is A4.

## Gate (not diary)

Open this file for agent/editor environment work. Do not append contribution
diaries here.

- Failure ledger below (do not relearn in session)
- Runtime source/lifecycle checks: [module contract owner](../module-contract-overhaul/PLAN.md#source-and-lifecycle-alignment-2026-09-16).
- Markdown spend: `.spw/caches/agent-markdown-spend-2026-09.spw`
- Pre-2026-09-06 contributions: `.agents/plans/archive/2026-09-06-agent-optimization-diary.md`
- Verified misses: `.agents/MEMORY.md`
- The block: `npm run check:agents` (tracked adapters + always-on word budgets)

Written rules are suggestions. A failing `check:agents` is not.
Do not apply AI onto a 12k PLAN as if that were the process.

## Current Baseline

- `AGENTS.md` is the always-on gate. Adapters emphasize; they do not exclusive-own.
- Harness: roles explore|plan|patch|review; explore and plan do not write (`scripts/harness-write-gate.mjs` + `.claude/settings.json`). `npm run sense -- copy|nouns|ink` is Sense first. Contract: `.spw/conventions/agent-ecology.spw#harness`.
- Skills are thin wrappers over the pinned workbench. Site-workflow holds layers and focuses.
- `agentic-dev-contracts` landed the cheap "what is this route?" + "did I break it?" questions.
- Public `/about/plans/` is still kept by hand: 36 plan links, 22 into `archive/`.
- Archive quota is the success metric (counts in Status). 2026-09-20 census: `.spw/audits/plan-spw-tree-2026-09.spw#recensus_2026_09_20`.

## Next slices

- **A1. Take the Build pipeline table out of `AGENTS.md`.** 540 words, the heaviest section, read every session. One pointer line stays; Working Guidelines' "see the **Build pipeline** section" follows it. The creator names the home (`.agents/README.md` has room); no required phrase lives there. Gate: the creator's review. Verify: `npm run check:agents` shows `AGENTS.md` near 2640/3200w.
- **A2. Thin the plan refs in `.spw/site.spw` (wave H).** 2026-11-06: 430 lines, 23 `@` refs into `.agents/plans/`, 12 into `archive/`. Each archive ref feeds one or two facets, so a ref and its uses leave together where the coordinators or `owner-registry.spw` already route. Ungated. Verify: `rg -c 'agents/plans/archive' .spw/site.spw` reaches 0; `npm run spw:integrity`.
- **A3 (proposal). Let the gate say where to cut.** `nearBudget()` in `scripts/check-agent-contracts.mjs` could name a near-budget file's heaviest `##` section (`heaviest: Build pipeline 540w`), so the instrument answers before anyone opens the file. Ungated. Verify: a case in `scripts/tests/check-output.test.mjs`.
- **A4. The last retired noun.** `public/js/interface/prompt-utils.js` alone still queries `.site-frame` (five lookups). No tracked page carries that class, so they match nothing on the 147 pages that mount it. `.spw-frame` wakes prompt behaviour that has never run; deleting them keeps today's page. Gate: a browser look at one promptable route. Verify: `rg -c site-frame public/js` reaches 0.

## Failure ledger (do not relearn)

- Catalog `selector` nouns lag public HTML. Open `.spw/audits/module-selector-depth-2026-09.spw`; `npm run audit:module-selectors`.
- `--charge` / `--spw-resonance` do not inherit. Open `attention-field.spw#ink_and_light_spend`. Prove with `npm run visual:checks`.
- `contain:layout` / `position:relative` on `html` steals floating chrome (95a2bf2f).
- Kitchen-sink “implement from plans.” Verify one pocket route, one named patch, stop.
- `check:local` can be green with stale CSS bundles (d26dbbdf) and retargeted fixture hosts (918b3daa).
- July module-census counts are not current. Quote 2026-09 kinship / selector-depth.
- Compact vs min: `spw-craft-quality` used to say 44px on every coarse button in `components/*.css` and stole pocket chrome. Open `.spw/caches/touch-control-class-2026-09.spw`.
- Generated plan `index.spw` that validates can still be thinner than hand-authored (239bca44).
- Always-on context is I/O, not thinking (Spotify Portal analogue, RT 2026-09-06). Word budgets live in `scripts/check-agent-contracts.mjs`.
- Guides without sensors are suggestions. Open first names the file; Sense first runs the instrument.
- Full `visual:checks` is dear. Cheap proof is `npm run visual:checks -- --ids=<fixture>`.
- `--force-generated` plan indexes must not concatenate Goal bullets. Goal is first paragraph or `PLAN_REFINEMENTS[slug].goal`.
- `npm run census` rewrites tracked `.spw/audits/language-census.spw`. As a sensor, revert it.
- A headless timeout is ground before it is page. `npm run sense -- doctor` (<1s) names sandboxed loopback, orphaned probes (`--reap`), stale bundles, sibling CSS. `smoke:nav` exits 3 on loopback.
- A push scratch checkout omits submodules. Archive workbench sources at the commit's gitlink before citation validation; borrow dependencies only. Contract: `agent-ecology.spw#harness`; regression: `check-pushed.test.mjs`.
- `spw:integrity` is ~80s of workbench parse (`.spw/workbench-report.spw#parse_cost`). Nightly CI runs it; locally, only when citations moved.
- A plan `.spw` without a first-line `# Review YYYY-MM-DD — ` decision fails `plans:index:check` for the whole tree (nightly too).

## Do not

- Rewrite `AGENTS.md` from a cache.
- Add a harvest line to a PLAN.md that already exceeds the gate budget.
- Generate more `index.spw` to record a census.
- Paint AI onto inherited diary workflow.
- Add `ASTRA.md` or symlink adapters. Astra primes `wonder-architecture.spw`; harvest with `npm run wonder`.

## Absorbed 2026-10-10 — spw-architecture-ecology wave H

`.spw/site.spw` slimness lives here: every agent that opens the dispatch hub pays for it. Landed: `translations.ecologies` routes through the coordinator conventions. Owed: A2, which keeps the `operational_layer`, `surfaces` and `integration_contract` facets and `translations.planning_tracks`, moving only their archived members. Rule kept: no new per-plan `@` ref in `site.spw` without an owner-registry entry.
