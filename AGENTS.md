# AGENTS.md

## Project Overview
- This repository is a hand-authored site for `spwashi.com`: static routes, shared CSS/JS runtime, and editor-facing `.spw` inspection surfaces.
- Public nouns on routes: `.spw-frame`, `.spw-chip`. Do not author `.site-frame` or `.operator-chip` on public HTML.
- The main edit surfaces are:
  - route HTML in directory `index.html` files
  - shared CSS under `public/css/` (layer folders; `style.css` is the import registry)
  - shared JavaScript under `public/js/` (`kernel/`, `runtime/`, `interface/`, `semantic/`, `modules/`)
  - `.spw/` conventions and `.agents/plans/` notes when a concept should stay inspectable beyond one patch
- Treat `.spw/_workbench` as optional reference/tooling, not the default source of truth for site changes. Consume it (parser, lattice, doctor); do not fork grammar here.
- Creator-first copy: _"I'm Spwashi. I build software and make art."_

## Working Guidelines
- Clarify the public goal first: copy, route flow, interaction, semantic naming, or editor inspectability.
- Declare the Spw operation before editing: `cache` | `audit` | `align` | `prime` | `contract` | `archive`. If the task is two operations, it is two patches.
- Patch the smallest honest surface:
  - route HTML for copy, structure, and semantic attributes
  - shared CSS tokens/components/surfaces before page-local CSS
  - progressive-enhancement JS only when HTML/CSS cannot carry the behavior
  - `.spw` files when the concept or contract matters beyond one patch
- Prefer minimal, surgical edits that preserve the existing hand-written HTML structure.
- Keep pages framework-free unless explicitly requested; do not introduce runtime frameworks or client-side dependencies. A local-only build pipeline (`scripts/build.mjs`) and zero-dep introspection scripts are permitted — see the **Build pipeline** section below.
- Preserve existing copy, links, analytics snippets, and metadata unless the task requires changing them.
- Computer-use / Codex sessions: Sense first, one named patch, stop. Do not “implement from plans.” Written rules are suggestions; `check:agents` word budgets are the block. Do not Read a PLAN.md over ~200 lines unless Open first named that file.
- Concurrent sessions share this tree. Never `git stash`. Check `git status` / `git log` before assuming a regression is yours.
- If work spans multiple routes or shared layers, add or update a plan under `.agents/plans/<slug>/`.
- If a new reusable semantic family, runtime state, or sitewide contract is introduced, update the relevant `.spw` surface and wire it into `.spw/site.spw` when needed.
- If the work improves the agent/editor operating environment itself, use `.agents/plans/agent-optimization/PLAN.md` as the tracking document and invoke `spw-plan-maintenance` for plan, skill, `.spw`, and public editor-surface wiring. Success is a smaller next census, not more `index.spw` files.
- For repository-local questions, inspect local files, plans, and `.spw` surfaces before reaching for external web lookups. Use the network only when the user asks for external/current information, dependency installation/audit requires it, or local context cannot answer the question.

## Open first

AGENTS is the always-on gate. Open the matching plan or contract instead of inventing a parallel rule here.

**Sense first**

Open first names the file. Sense first runs the instrument. Guides without sensors are suggestions.

| Kind | Instrument |
|---|---|
| copy / voice | `npm run audit:copy:accessor` |
| catalog nouns | `npm run audit:module-selectors` |
| ink / chrome | `npm run visual:checks -- --ids=<fixture>` |

Explore/plan do not write. Patch is the only write role. Host gate: `scripts/harness-write-gate.mjs`. Contract: `.spw/conventions/agent-ecology.spw#harness`.

**Copy, language, voice**

| If the task is… | Open first |
|---|---|
| page-copy / pretext measure | `.spw/conventions/copy-flow.spw` plus `npm run audit:copy` |
| copy-unit / voice tone / clustered copy update | `.spw/conventions/copy-accessor.spw` plus `npm run audit:copy:accessor` |
| copy-unit as place / first-fold copy / 140-route verification | `.spw/caches/copy-hypermedia-key-2026-09.spw` plus `copy-accessor.spw` — do not twin routes with `.spw/<route>/index.spw` |
| Spw language (operators, braces, v04) vs runtime packs | `.spw/language/feature-utilization.spw` plus `npm run ecology:language` — do not conflate with `body[data-spw-features]` |
| creative capacity / dual-path language / agent preference | `.spw/caches/creative-capacity-2026-09.spw` plus `skill-invocation.spw#introspection` |

**CSS, attention, chrome**

| If the task is… | Open first |
|---|---|
| CSS first-paint spend or `@layer` vs load | `.agents/plans/core-css-spend-cut/PLAN.md` plus `.spw/conventions/css-instruction.spw` and `stylesheet-ecology.spw` |
| literate CSS / selector kinship | `.agents/plans/css-architecture-readability/PLAN.md` |
| catalog selector vs public HTML hosts | `.spw/audits/module-selector-depth-2026-09.spw` plus `npm run audit:module-selectors` |
| opacity / lighting ignoring attention | `.spw/conventions/attention-field.spw#ink_and_light_spend` plus `npm run visual:checks` |
| wonder types / field / ornament / doctrine | `.spw/conventions/wonder-architecture.spw` — six altitudes; do not add `data-spw-wonder-type` |
| pocket chrome missing or off-screen | `.spw/conventions/css-instruction.spw#flow_ownership` — do not `contain` or `position:relative` `html` / floating chrome |
| always-on context / token spend | `.spw/caches/agent-markdown-spend-2026-09.spw` plus `npm run check:agents` — I/O is not thinking |

**Plans, agents, commits**

| If the task is… | Open first |
|---|---|
| commit / history wording | `.agents/plans/history-reflow/PLAN.md` plus one full recent commit body (`git log -1 --format=%B`) |
| multi-route / shared layer | `.agents/plans/<slug>/` |
| recurring repo bond / unresolved historical churn | `.spw/caches/history-conflict-strands-2026-09.spw` plus `npm run wonder -- --surface history-conflict` |
| agent / editor environment | `.agents/plans/agent-optimization/PLAN.md` (gate, not diary) and `spw-plan-maintenance` |
| harness / write-deny | `.spw/conventions/agent-ecology.spw#harness` plus `npm run check:agents` — no ASTRA.md |
| model adapters (Claude, Grok, Gemini, GPT) | `CLAUDE.md`, `GROK.md`, `GEMINI.md`, `GPT.md` (backed by this file). No adapter for your model yet: this file alone is the gate — do not write a speculative `<MODEL>.md` |
| skill wrappers vs workbench | `.agents/README.md` |
| repo gotchas another agent already found | `.agents/MEMORY.md` — verified misses, not a note dump |
| PWA / service worker | `.agents/plans/pwa-experience/` plus `npm run check:pwa` |

## Commits

When proposing or writing a commit message:

- Sample a **full recent body**, not just subjects.
- Subject shape: `symbol[scope] short claim`.
- Close with **one** `#[episode]{}` that contains `~[scene]{}`, `![change]{}`, and `*[verify]{}`.
- Full grammar and rebase recipe live in `.agents/plans/history-reflow/PLAN.md`. Do not copy that plan into this file.
- `npm run check:local` does **not** validate commit grammar.

## Current Semantic Rails

Use these rails before broad creative, semantic, CSS, JS, or marketing work:

- **Model-guided refinement:** Use `.spw/conventions/model-guided-refinement.spw` and `.agents/plans/model-guided-refinement/PLAN.md` when a task needs explicit focus dimensions, semantic fixity tiers, elemental effects, cross-language CSS/HTML/JS/.spw tracing, or a creative marketing contract.
- **Semantic capacity:** Use `.spw/conventions/semantic-capacity.spw` when adding `.spw` meaning. Name the operation first: `cache`, `audit`, `align`, `prime`, `contract`, or `archive`. For small valuable insights that are not ready for implementation, use `.agents/plans/model-guided-refinement/templates/semantic-insight-cache.spw`.
- **Daily kernel:** Use `.spw/conventions/daily-kernel.spw` and `.agents/plans/daily-kernel-development/PLAN.md` when engineering work intersects animators, illustrators, designers, musicians, artists, or other collaborators. A daily kernel must name one focus, one discipline pair, one region, one brand-physics variable, one intensity, one semantic operation, one output, one validation path, and what not to touch.
- **Creative marketing engine:** Use `.spw/surfaces/product-lines.spw` plus `.spw/conventions/model-guided-refinement.spw#creative_marketing_engine` before changing promo/wonder, artist, musician, commission, or collaborator-facing offers. Each offer should name audience, offer, proof, resonance, extension, and next action.
- **Experience slices:** Use `.agents/plans/modular-experience-slices/PLAN.md` and `.spw/slices/` contracts when work needs durable ownership across route HTML, CSS, JS, `.spw`, validation, and practice beds.
- **Copy accessor:** Use `.spw/conventions/copy-accessor.spw` when naming or translating collectible copy. The dotted `data-spw-copy-unit` is the flat localization projection; `data-spw-semantic-expression` is the multidimensional handle. Extra dots nest categories; they are not extra dimensions. Do not invent a fourth accessor family.
- **Linguistic dual-path:** Consume the pinned workbench (v04, lattice, `/tools/spw-parser/`) or experiment through web semantics (HTML expressions, operator chips, CSS kinship). Walk one path per patch. See `.spw/language/feature-utilization.spw#dual_path`.
- **Wonder architecture:** Use `.spw/conventions/wonder-architecture.spw` before adding a wonder type, token, or attribute. Doctrine, the seven types, copy vocabulary, field state, ornament, and the engaged-wonder loop are six altitudes of one architecture. Astra planning/creativity/implementation primes on that file; harvest LSP questions with `npm run wonder`. Recurring bonds from this repo's history live in `.spw/caches/history-conflict-strands-2026-09.spw`. Do not add `data-spw-wonder-type`. Do not implement a lens from the prime.

Default decision rule:

1. If the task is a broad idea, create or update a `.spw` cache/audit/prime before touching HTML/CSS/JS.
2. If the task is cross-discipline but small, create a daily-kernel note or follow the daily-kernel fields.
3. If the task is an implementation, declare the semantic fixity tier and edit the smallest honest surface.
4. If the task introduces a reusable contract, wire it through `.spw/site.spw`, `.spw/conventions/index.spw`, and the relevant plan/index.

## Creator Identity

**Spwashi is a creator identity first, not just a place.** The canonical self-description is: _"I'm Spwashi. I build software and make art."_ Copy should lead with the person. The site can describe itself as a surface or space for the work, but Spwashi = the creator first.

## HTML And Assets
- Maintain semantic HTML structure with `header`, `nav`, `main`, and `footer` where applicable.
- Keep directory routing consistent: page changes should generally go in that route's `index.html`.
- Use root-relative asset links like `/public/css/style.css` to match the existing site.
- Favor accessibility basics: meaningful headings, descriptive link text, and `alt` text for images.
- Place shared CSS in `public/css/` and images in `public/images/` unless there is a clear existing subpattern to follow.
- Do not rename or move assets unless the task specifically requires it.

## Validation
- Run `git diff --check` after edits.
- Run `node --check <file>` for edited JS modules. TypeScript uses `npm run typecheck` (pre-commit does not `node --check` `.ts` / `.mts`).
- For **site runtime** feature packs (`data-spw-features`) or multi-audit work, run `npm run ecology`. Thoroughness: `.spw/audits/index.spw`. Loop: `.spw/conventions/recursive-improvement.spw`.
- For **Spw language** features (operators, braces, claims, v04 pillars), run `npm run ecology:language`. Entry: `.spw/language/feature-utilization.spw`. Loop: `.spw/language/recursive-improvement.spw`. Do not conflate language operators with the runtime pack token `operators`.
- For ordinary HTML/CSS/JS/`.spw` work that does not touch dependencies, prefer `npm run check:local`; it runs the local build, CSS/runtime/site contracts, generated-output checks, `check:agents`, module tests, and `git diff --check` without the network-backed npm audit. Versioned git hooks in `scripts/githooks/` run a fast staged syntax/whitespace gate on commit and `npm run check:local` on push (`SKIP_GIT_HOOKS=1` to skip). `npm run hooks:install` sets `core.hooksPath`.
- `check:local` can be green with stale committed CSS bundles and with fixture hosts a capture commit retargeted. Trace bundle hunks to the source commit; update fixture tests in the same commit as the host change. It does **not** validate commit grammar.
- After catalog selector or public class-noun edits: `npm run audit:module-selectors`.
- After ink, resonance, or pocket chrome: `npm run visual:checks` (attention-miss receipts, not JPEG goldens).
- After copy-unit / collectible lede / `data-spw-semantic-expression` HTML: `npm run audit:copy:accessor` and `npm run manifest`. Commit `public/data/site-search-index.json` and `public/js/generated/spw-expressions.js` if they moved — pre-push `check:local` fails on a stale agent route cache otherwise.
- After model-adapter edits: `npm run check:agents` (adapters must be git-tracked; always-on files must fit their word budgets).
- When touching `sw.js`, `manifest.webmanifest`, offline routes, or PWA runtime, also run `npm run check:pwa`.
- When proposing or writing a commit message, read one recent full body and include a closing `#[episode]{}`. Local check scripts do not catch a missing episode.
- Run `npm run audit` (or `npm run check`, which includes it) before landing changes that touch dependencies: `devDependencies`, `dependencies`, `package-lock.json`, install tooling, or any package resolution surface. A script-only `package.json` edit may use `check:local` plus targeted review unless the dependency graph changes.
- Agents must not introduce new npm packages (via `npm install`, `npx`, etc.) without an accompanying plan note under `.agents/plans/` (or `agent-optimization/`) and human review. Prefer `npm ci --ignore-scripts` for any temporary installs.
- Use targeted `rg` checks for anchors, asset paths, and semantic data attributes. `el.dataset.spwFooBar =` writers do not show up in a literal `data-spw-*` grep — check both forms.
- For content edits, sanity-check surrounding markup for balanced tags and broken relative/root-relative links.
- If a local preview step is needed, use `npm run dev`; otherwise avoid adding tooling just for validation.

## Model adapters (relative strengths, not exclusive owners)

`AGENTS.md` is the gate. Root adapters emphasize one focus so a model leans into what it is good at. Any model still follows Open first. A skill that needs four models in the room is unusable by the person holding one.

- **`GROK.md`** — anti-bloat: declare `cache|audit|align|prime|contract|archive`, one named slice, stop.
- **`CLAUDE.md`** — constitutional rigor: a11y, no new `data-spw-*` families, smallest honest surface.
- **`GPT.md`** — contract exactness plus **computer-use verify-first**: ESM `.js` imports, CSS layers, `audit:module-selectors` / `visual:checks`, one named patch, stop. Do not “implement from plans.”
- **`GEMINI.md`** — tool mastery: `.spw` graph, `visual:checks` / `wonder` / `lattice`, no background-task polling.
- **`.cursorrules`** and **`.github/copilot-instructions.md`** point at those adapters.

Shared sentence in every adapter: *This adapter emphasizes one focus. AGENTS.md is the gate. Any model still follows Open first.* Prove with `npm run check:agents` (adapters must be git-tracked; a green check on untracked files is a lie). Contract: `.spw/conventions/skill-invocation.spw#focuses`.

## Scope
- These instructions apply to the entire repository unless a nested `AGENTS.md` overrides them.

---

## Build pipeline

As of 2026-04, the site publishes through a local build step rather than serving the repo directly. This is a deliberate deviation from the earlier "no build tooling" rule, driven by the need for traceability (design catalog), HTML composition, and a proper dev/publish separation.

| Command | What it does |
|---------|--------------|
| `npm run dev` | Vite dev server for the source tree, with Spw HTML template rendering wired through `vite.config.ts`. |
| `npm run dev:legacy` | Previous zero-dep local dev server for fallback/template debugging. |
| `npm run build` | Typecheck, CSS bundles, then the static deploy builder into `dist/`. |
| `npm run build:tools` | Compiles typed build-control modules from `scripts/ts/` into `scripts/typed/` for Node scripts. |
| `npm run build:runtime` | Compiles selected TypeScript runtime modules from `public/ts/` into browser-ready modules under `public/js/typed/`. |
| `npm run build:vite` | Vite production smoke build into `dist-vite/` for bundler compatibility checks; not the deploy artifact. |
| `npm run catalog` | Regenerates the in-tree design catalog at `design/catalog/` (gitignored). |
| `npm run manifest` | Regenerates the route runtime manifest. |
| `npm run sitemap` | Generates `dist/sitemap.xml` from tracked route canonicals. |
| `npm run check:local` | Default offline/local validation: compile, CSS, runtime/site contracts, generated checks, `check:agents`, module tests. Does not copy `dist/`, and does not validate commit grammar. |
| `npm run check:agents` | Tracked adapters + always-on word budgets (`AGENTS.md`, MEMORY, this track's PLAN.md). A green check on untracked adapters is a lie. |
| `npm run audit:copy:accessor` | Census of `data-spw-copy-unit` vs Spw handles, topic clusters, voice seams. |
| `npm run audit:module-selectors` | MODULE_DEFS.selector vs public HTML hosts. |
| `npm run visual:checks` | Pocket stills; fail when ink/light ignore attention. |
| `npm run ecology` / `ecology:language` | Runtime feature packs vs Spw language. Do not merge inventories. |
| `npm run build:site:run` | Static deploy builder into `dist/`. Registers `scripts/lib/register-public-imports.mjs` so the catalog can load `/public/js` specifiers under Node. |
| `npm run check:pwa` | Service-worker, manifest, offline, and PWA runtime contracts. |
| `npm run check:runtime` | Validates JS runtime architecture contracts: module definition shape, import ownership, generated typed outputs, and root entrypoint boundaries. |
| `npm run check` | Full validation for dependency-sensitive or pre-landing sweeps. Includes `npm run audit --audit-level=moderate`, so expect a registry/network call. |

**Deploy:** `.github/workflows/deploy.yml` runs `npm run check:local`, then `npm run build:site:run`, then publishes `dist/` to GitHub Pages. `check:local` passing is not a `dist/` build. Binary deploy artifacts in `dist/` stay ignored; plaintext outputs can be tracked when useful for review.

**Design catalog:** `design/catalog/index.html` is a generated cross-reference of every site-facing `data-spw-*` attribute, custom-property token, CSS file, and `.spw` philosophy doc, with orphan detection. It excludes the installed workbench/tooling subtrees. See `scripts/generate-design-catalog.mjs`.

---

## Spw Design System

Public nouns: `.spw-frame` + `data-spw-kind="frame"`; chips are `.spw-chip`. Catalog `MODULE_DEFS.selector` must name those nouns (`npm run audit:module-selectors`). JS reading order: `public/js/README.md`.

CSS layers are cascade priority, not a load schedule: `reset → tokens → shell → typography → grammar → components → systems → routes → handles → effects → ornament`. `!important` only in `ornament`. Delivery lives in `style-core`, route/behavior bundles, and `deferred-styles.js`.

| Task | File |
|------|------|
| Colors, spacing, thresholds | `public/css/tokens/core.css` |
| Card glass/matte | `public/css/effects/material.css` |
| Brace / structural grammar | `public/css/grammar/syntax.css` |
| Shared / feature-gated layout | `public/css/systems/surfaces/*.css` or `public/css/components/*.css` |
| Route-only layout | `public/css/routes/*.css` |
| Wonder memory / ornament | `public/js/interface/wonder-memory.js` + `public/css/effects/wonder.css` + `public/css/ornament/ornament.css` |
| Settings / root dataset | `public/js/kernel/site-settings.js` + `site-settings-engine.js` (`setDatasetEntries`) |
| Navigation / spells / haptics | `public/js/runtime/navigation-spells.js`, `spells.js`, `experiential.js` |
| Section-handle / resonance | `public/js/runtime/attention-architecture.js` |
| New operator type | `operator-detection.js` (`OPERATOR_DEFINITIONS`) + `tokens/core.css` |
| Collectible lede | `data-spw-copy-unit` + optional `data-spw-semantic-expression`; `.spw/conventions/copy-accessor.spw` |

`body[data-spw-features]` gates shared CSS/JS packs. `data-spw-feature="name"` names an existing cluster. Do not wrap empty hosts. Body shell families (`data-spw-surface`, `data-spw-wonder`, page-family/role/modes) are listed in `.spw/surfaces/page-model.spw`.

Public chips: `a.spw-chip[data-spw-operator]`. Braces: `data-spw-form="brace"` + `data-spw-brace="objective|subjective"`. Accents: `data-spw-accent`. Canonical settings writes go through `site-settings-engine.js`, not ad-hoc `localStorage`.

| Sigil | Type | Use when |
|-------|------|----------|
| `#>` | frame | address a named handle |
| `?` | wonder | open a probe |
| `^` | integration | lift an inspectable register |
| `~` | potential | hold a path without collapsing it |
| `@` | perspective | situate a viewpoint |
| `!` | action | commit a move |
| `>` | concept-edge | project onto another surface |
| `<` | concept | open a topical boundary |
| `[` `]` | mode | select a variant |
| `{` `}` | direction | hold a practice |
| `(` `)` | scene | stage midprocess |

`data-spw-operator` matches the sigil (aliases: `object`→integration, `ref`→potential, `probe`→wonder, `surface`→concept-edge, `topic`→concept). Do not use `~` as a generic link.

Do not: change `style.css` layer order; add runtime frameworks; inline styles except JS-driven values; rename CSS without the `@import`; invent `data-spw-voice` / `data-spw-style` / a fourth copy-accessor; author `.site-frame` or `.operator-chip`; `contain:layout` or `position:relative` on `html` or `[data-spw-floating-chrome]`; spend `--spw-attention-opacity` from a `:root` calc of `--charge` / `--spw-resonance`.

Not always-on — Open first already names the owner: attention/ink → `attention-field.spw` + `visual:checks`; layout variants → `public/css/shell/layout.css`; hydration skeletons → `public/css/components/controls.css`.

Always-on context is I/O, not thinking. `npm run check:agents` fails if this file, MEMORY, an adapter, or the agent-optimization gate exceeds its word budget.
