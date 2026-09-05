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
- Computer-use / Codex sessions: verify first (`npm run audit:module-selectors`, `npm run visual:checks`, one pocket route). One named patch. Stop. Do not “implement from plans.”
- Concurrent sessions share this tree. Never `git stash`. Check `git status` / `git log` before assuming a regression is yours.
- If work spans multiple routes or shared layers, add or update a plan under `.agents/plans/<slug>/`.
- If a new reusable semantic family, runtime state, or sitewide contract is introduced, update the relevant `.spw` surface and wire it into `.spw/site.spw` when needed.
- If the work improves the agent/editor operating environment itself, use `.agents/plans/agent-optimization/PLAN.md` as the tracking document and invoke `spw-plan-maintenance` for plan, skill, `.spw`, and public editor-surface wiring. Success is a smaller next census, not more `index.spw` files.
- For repository-local questions, inspect local files, plans, and `.spw` surfaces before reaching for external web lookups. Use the network only when the user asks for external/current information, dependency installation/audit requires it, or local context cannot answer the question.

## Open first

AGENTS is the always-on gate. Open the matching plan or contract instead of inventing a parallel rule here.

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

**Plans, agents, commits**

| If the task is… | Open first |
|---|---|
| commit / history wording | `.agents/plans/history-reflow/PLAN.md` plus one full recent commit body (`git log -1 --format=%B`) |
| multi-route / shared layer | `.agents/plans/<slug>/` |
| recurring repo bond / unresolved historical churn | `.spw/caches/history-conflict-strands-2026-09.spw` plus `npm run wonder -- --surface history-conflict` |
| agent / editor environment | `.agents/plans/agent-optimization/PLAN.md` and `spw-plan-maintenance` |
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
- After copy-unit / collectible lede work: `npm run audit:copy:accessor`.
- After model-adapter edits: `npm run check:agents` (adapters must be git-tracked).
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
| `npm run check:agents` | Tracked model adapters + shared emphasis sentence. Focuses are relative strengths, not exclusive owners. A green check on untracked adapters is a lie. |
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

## Spw Design System - Agent Reference

This site uses a layered CSS architecture and an ES module JavaScript system built around the **Spw language**: a readable plain-text grammar projected into HTML, CSS, JS, and `.spw` inspection surfaces.

Public HTML nouns: `.spw-frame` + `data-spw-kind="frame"`; chips are `.spw-chip`. Catalog `MODULE_DEFS.selector` strings must name the same nouns (`npm run audit:module-selectors`).

JS reading order: `public/js/README.md` (`site.js` → `runtime/module-catalog.js` → `module-loader.js` → `kernel/dom-contracts.js` → `kernel/shared.js` → `kernel/site-settings.js`).

### CSS layer order (lowest -> highest priority)
```text
reset -> tokens -> shell -> typography -> grammar -> components -> systems -> routes -> handles -> effects -> ornament
```
New styles override lower layers. Add to `ornament` only if you need to override everything else. These layers are cascade priority (which rules win), not a load, cache, or request schedule. Delivery — what file arrives, and when — lives in `style-core`, route/behavior bundles, and `deferred-styles.js`.

### Key files to edit for common tasks

| Task | File |
|------|------|
| Change shared colors, spacing, thresholds, or semantic tokens | `public/css/tokens/core.css` |
| Change card glass/matte behavior | `public/css/effects/material.css` |
| Change brace forms or structural grammar | `public/css/grammar/syntax.css` |
| Change shared surface layout or feature-gated component layout | `public/css/systems/surfaces/*.css` or `public/css/components/*.css` |
| Change route-only surface layout | `public/css/routes/*.css` or `public/css/routes/surfaces/*.css` |
| Change wonder-memory propagation, accent memory, or ornament response | `public/js/interface/wonder-memory.js` + `public/css/effects/wonder.css` + `public/css/ornament/ornament.css` |
| Change settings defaults, root data attributes, or deviation handling | `public/js/kernel/site-settings.js` (profiles + engine re-export) + `public/js/kernel/site-settings-engine.js` + `settings/index.html` |
| Change navigation tokenization or grounded route behavior | `public/js/runtime/navigation-spells.js` + `public/js/runtime/frame-navigator.js` |
| Change spell, checkpoint, or bookmark behavior | `public/js/runtime/spells.js` + `public/js/interface/haptics.js` + `public/js/runtime/experiential.js` |
| Change guide badge, interaction-context, or collection behavior | `public/js/interface/guide-badge.js` + `public/css/ornament/ornament.css` |
| Change section-handle / resonance probe | `public/js/runtime/attention-architecture.js` + `public/js/runtime/attention/` |
| Add a canvas accent to a frame | add `data-spw-accent="wave|vortex|crystal|lattice|flow"` to the element and tune shared accent CSS/JS only if needed |
| Add a new operator type | `public/js/kernel/shared.js` + `public/js/kernel/operator-detection.js` (`OPERATOR_DEFINITIONS`) + `public/css/tokens/core.css` |
| Add or rename a reusable feature cluster | route HTML + `.spw/surfaces/page-model.spw` when the model matters beyond one patch |
| Name or translate a collectible lede | `data-spw-copy-unit` + optional `data-spw-semantic-expression` on the same host; `.spw/conventions/copy-accessor.spw` |

### Page shell metadata

The `<body>` element is the page-level semantic truth. Preserve or extend these families before inventing one-off route metadata:

- `data-spw-surface`
- `data-spw-features`
- `data-spw-route-family`
- `data-spw-context`
- `data-spw-wonder`
- `data-spw-page-family`
- `data-spw-page-modes`
- `data-spw-page-role`
- `data-spw-page-seed`
- `data-spw-related-routes`

Example:

```html
<body
  data-spw-surface="software"
  data-spw-features="operators metrics navigator console"
  data-spw-route-family="editorial systems curriculum"
  data-spw-context="analysis"
  data-spw-wonder="comparison constraint locality"
  data-spw-page-family="curriculum"
  data-spw-page-modes="reading inspect compare build"
  data-spw-page-role="topic-register">
```

### Feature gating vs feature naming

These are different layers and should not be conflated:

- `data-spw-features="..."` on `<body>` gates shared runtime/CSS feature families such as `navigator`, `console`, `svg-surfaces`, or `pretext-lab`.
- `data-spw-feature="name"` names the outermost element of a coherent functional cluster within a route, such as a quick-tune card grid, a palette probe, or a runtime map.

Use `data-spw-feature` on an existing meaningful cluster. Do not add empty wrappers just to carry the attribute.

Example:

```html
<div class="vibe-widget-grid" data-spw-feature="settings-quickstart">
```

### Common component and interaction primitives

```html
<!-- Operator chips (public noun: .spw-chip) -->
<a class="spw-chip" href="..." data-spw-operator="probe">?[topic]</a>
<a class="spw-chip" href="..." data-spw-operator="frame">#>name</a>

<!-- Collectible lede: dotted localization key + optional Spw handle -->
<p data-spw-copy-unit="about.hook.lede" data-spw-semantic-expression="about[reading]{person}">…</p>

<!-- Inline topic markers -->
<span class="spw-topic" data-spw-topic>concept</span>

<!-- Brace form containers -->
<div data-spw-form="brace" data-spw-brace="objective">
<div data-spw-form="brace" data-spw-brace="subjective">

<!-- Canvas accent backgrounds -->
<section data-spw-accent="wave" data-spw-accent-palette="cool">
<section data-spw-accent="vortex" data-spw-accent-palette="warm">

<!-- Opt-in collectible guide badge behavior -->
<a class="spw-chip" data-spw-guide-badge="collect" href="/topics/software/spw/">
```

### Root runtime state

`public/js/kernel/site-settings.js` re-exports profiles + engine. `setDatasetEntries(...)` lives in `public/js/kernel/site-settings-engine.js`. Do not introduce direct localStorage writes for canonical settings outside that module.

Common runtime attributes written to `<html>` include:

- `data-spw-color-mode`
- `data-spw-palette-resonance`
- `data-spw-operator-saturation`
- `data-spw-semantic-density`
- `data-spw-grain-intensity`
- `data-spw-show-spec-pills`
- `data-spw-enhancement-level`
- `data-spw-wonder-memory`
- `data-spw-developmental-climate`
- `data-spw-deviation-count`
- `data-spw-deviations`
- `data-spw-deviation-state`

If you need the full current list, inspect `setDatasetEntries(...)` in `public/js/kernel/site-settings-engine.js`.

### Interaction, grounding, and collection state

Canonical interaction and retention state currently lives in shared JS and should be extended consistently:

- `data-spw-interaction-context="reading|browsing|inspecting|collecting|comparing"`
- `data-spw-collected="true"` and `data-spw-collection-strength`
- `data-spw-grounded="true|false"`
- `data-spw-grounded-in`
- `data-spw-grounded-wonder`
- `data-spw-pinned`

Prefer these existing names over inventing parallel state unless the distinction is real and teachable.

### Wonder, ornament, and spell direction

- Dispatch: `.spw/conventions/wonder-architecture.spw`. Authored types live on `body[data-spw-wonder]`. Runtime writes `data-spw-wonder-state`, `data-spw-field-wonder`, `data-spw-wonder-memory`. The probe operator (`?` / `data-spw-operator="probe"`) is not a synonym for the type list.
- `data-spw-wonder-state`, `data-spw-field-wonder`, and related memory-match state drive shared accent/ornament behavior.
- The ornament contract lives across `public/css/tokens/core.css`, `public/css/effects/wonder.css`, `public/css/ornament/ornament.css`, `.spw/conventions/ornament-contract.spw`, and `.spw/conventions/attention-field.spw`.
- Spells should be treated as **small replayable outcomes**, not merely collectible traces. Useful examples are restoring checkpoints or resuming a pinned working set.
- Serialization and readable Spw output support inspection, but they are not the primary value proposition of the spell surface.

### Material surface distinction

- **Glass surface** (`.frame-card`): semi-transparent `--card-bg`, `backdrop-filter: blur(12px)`
- **Matte surface** (`.mode-panel`): `--matte-surface` (warm, opaque, no blur)
- **Code surface**: `--surface-code` (dark, near-opaque)

### Operator color palette shorthand

| Operator | Color | CSS token |
|----------|-------|-----------|
| frame `#>` | teal | `--op-frame-color` |
| object `^` | amber | `--op-object-color` |
| probe `?` | violet | `--op-probe-color` |
| ref `~` | blue | `--op-ref-color` |
| action `@` | teal-dark | `--op-action-color` |
| topic `<` | sea-green | `--op-topic-color` |

Parser/runtime consequence (author chips against this, not the color nickname):

| Sigil | Type | Use when |
|-------|------|----------|
| `#>` | frame | address a named handle |
| `?` | wonder | open a probe |
| `^` | integration | lift an inspectable register |
| `~` | potential | hold a path without collapsing it |
| `@` | perspective | situate a viewpoint / enter a working posture |
| `!` | action | commit a move |
| `>` | concept-edge | project onto another surface |
| `<` | concept | open a topical boundary |
| `[` `]` | mode | select a variant |
| `{` `}` | direction | hold a practice |
| `(` `)` | scene | stage midprocess |

`data-spw-operator` must match the sigil (aliases: `object`→integration, `ref`→potential, `probe`→wonder, `surface`→concept-edge, `topic`→concept). Do not use `~` as a generic link.

### Component anatomy

Components follow a slot contract:

```text
header -> meta -> body -> figure -> actions -> footer
```

#### Lens / mode-switch pattern
- A `mode-switch` inside a `frame-topline` controls which content panel is visible.
- Each button is a `.frame-sigil` with `data-set-mode` and `aria-pressed`.
- JS sets `aria-pressed="true"` on the active button.
- Be mindful that mode-switch-specific pressed styles must win over generic `aria-pressed` states in `operators.css`.
- Mode-specific operator colors are usually scoped through `--active-op-color` in the relevant route surface CSS.

#### Frame anatomy axes
A `.spw-frame` can have two independent interaction axes:
1. **Lens** (`mode-switch`): filters content type.
2. **Form** (`data-spw-form-options`): changes structural presentation.

These should feel visually distinct. Lens is a content filter; form is a spatial grammar choice.

### Coordination triggers

Update `.spw` surfaces when:

- a new reusable semantic family or attribute contract is introduced
- a runtime state becomes part of the site's inspectable model
- a concept should remain legible to agents/editors beyond one implementation patch
- an insight should be cached, audited, aligned, primed, contracted, or archived for future semantic capacity

Add or update a plan under `.agents/plans/<slug>/` when:

- the work spans multiple routes
- the work touches both shared CSS/JS and route HTML
- the work changes how a concept should be understood, not just how it looks
- the work creates a durable daily-kernel, model-guided refinement, creative marketing, or experience-slice direction

### Do not
- Modify `style.css` layer declaration order.
- Add client-side frameworks or runtime npm dependencies (the local-only build pipeline is fine — see the Build pipeline section).
- Use `!important` outside the `ornament` layer.
- Add inline styles except for JS-driven dynamic values.
- Rename or move CSS files without updating the `@import` in `style.css`.
- Bypass `public/js/kernel/site-settings-engine.js` with direct localStorage writes for canonical settings.
- Introduce one-off `data-spw-*` names when an existing family already fits. No `data-spw-voice`, `data-spw-style`, or fourth copy-accessor family.
- Author `.site-frame` or `.operator-chip` on public routes. Catalog selectors must match public nouns (`.spw-frame`, `.spw-chip`).
- `contain:layout` or `position:relative` on `html` or `[data-spw-floating-chrome]` (steals pocket chrome).
- Spend `--spw-attention-opacity` from a `:root` calc of `--charge` / `--spw-resonance` (they do not inherit). Restate spend on the frame; lift with `.spw-frame:focus-within`, not `:has(:focus-within)`.
- Kitchen-sink “implement from plans.” Verify one pocket route, one named patch, stop.
- `git stash` in this tree. Concurrent sessions lose work that way.

---

## Attention Architecture

Progressive-enhancement system for section-context awareness and operator resonance. Centralizes mobile navigation and conceptual linking.

### Section-context handle

Mobile-first sticky chip that surfaces the current visible section by reading `data-spw-operator` and heading text.

**Files:** `public/js/runtime/attention-architecture.js`, `public/js/runtime/attention/section-handle.js`, `public/css/shell/chrome/section-context.css`

**HTML contract:**

```html
<a class="spw-section-handle"
   href="#main-content"
   data-spw-handle-state="hidden"
   aria-label="Jump to top of current section">
    <span class="spw-section-handle__op" aria-hidden="true">#&gt;</span>
    <span class="spw-section-handle__label">section</span>
</a>
```

**Behavior:**
- Hidden by default on desktop; visible on mobile/narrow screens when scrollY > 240px
- IntersectionObserver tracks all sections matching `main section[data-spw-kind], main article[data-spw-kind], main section[id], main article[id]`
- JS updates handle label from section heading, aria-label, or id
- Progressive enhancement: degrades to static "return to top" anchor if JS unavailable

**Integration:** add the `.spw-section-handle` element early in `<body>` on routes with long sectioned content (blog, about, topics).

### Resonance probe

Pinned operator focus/hover state that sets `html[data-spw-resonance-probe="operator-name"]` to trigger soft echo glow on matching operators across the page.

**Files:** `public/js/runtime/attention/resonance-probe.js` (mounted through `attention-architecture.js`), `public/css/effects/wonder.css`

**Behavior:**
- `focusin` on any `[data-spw-operator]` immediately pins that operator
- `mouseover` with 260ms delay allows hovering without committing
- `focusout` and `mouseleave` clear the pin
- CSS `:has()` selector (with `@supports`) applies `--spw-resonance` to matching operators
- Also sets `html[data-spw-resonance-family="family-name"]` from the pinned operator's `family` field in `operator-detection.js` (`OPERATOR_DEFINITIONS`). Kin operators that share a family — frame/layer/vibration ("resonance"), ground/binding ("grounding"), integration/subject ("relational"), concept-edge/concept ("conceptual") — get a fainter echo alongside the exact-match one. Regroup the CSS only if that `family` field changes; it is the source of truth, not the CSS.
- Also marks every other element sharing the hovered/focused chip's `data-spw-target` (a freeform destination label authored on quick-move chips, e.g. `data-spw-target="rpg-images"`) with `data-spw-target-kin="true"`, so a reader can see which chips lead to the same place. Matched directly in JS rather than enumerated in CSS, because target values are numerous and one-off unlike the small, fixed operator/family vocabulary.

**CSS contract** in `wonder.css`:
```css
:where([data-spw-operator]) {
  box-shadow: var(--spw-local-shadow, none),
    0 0 0 calc(1px * var(--spw-resonance, 0)) 
    color-mix(in srgb, var(--spw-operator-color, ...) 42%, transparent);
}
```

---

## Page Layout Variants

Desktop-aware layout system with flex/grid containers for better space utilization.

**Files:** `public/css/shell/layout.css`, `public/css/tokens/core.css`

**Variants** via `data-spw-layout` on `<body>` or `main`:

- `reading`: narrower column (default `--page-width-reading`)
- `wide`: moderate expansion (`--page-width-wide`)
- `atlas`: maximum breathing room (`--page-width-atlas`)
- `split`: two-column grid on ≥72rem, gutter rail on the right

**Gutter rail** (.spw-gutter-rail):
- Only renders on `split` layout at desktop breakpoints
- Positioned as secondary column with gap `--attention-rail-gap`
- Can hold secondary navigation, asides, or observational content

**Setup:** 
1. Add `data-spw-layout="wide"|"atlas"|"split"` to page `<body>`
2. On `split` layout, add `.spw-gutter-rail` element inside `<main>` or as flex sibling

---

## Conceptual Resonance (no-JS echo)

CSS `:has()` in `public/css/effects/wonder.css` still echoes matching operators on hover/focus-visible when JS has not pinned `html[data-spw-resonance-probe]`. Treat the **Resonance probe** section above as the authored contract (operator + family + `data-spw-target` kin). Regroup CSS only if `OPERATOR_DEFINITIONS.family` in `operator-detection.js` changes.

Physics tokens in `tokens/core.css`: `--attention-field-radius` (0.4), `--attention-field-decay` (0.65), `--attention-echo-duration` (480ms). Ink/light spend: `.spw/conventions/attention-field.spw#ink_and_light_spend`. Prove with `npm run visual:checks`.

---

## JSON Hydration Contract

Progressive enhancement pattern for async data loading with skeleton UI and error states.

**Files:** `public/css/components/controls.css`

**HTML contract:**

```html
<!-- Loading state -->
<div data-spw-hydration="loading">
  <div class="spw-skeleton" data-spw-skeleton-role="heading"></div>
</div>

<!-- Ready state -->
<div data-spw-hydration="ready">
  <!-- actual content -->
</div>

<!-- Error state -->
<div data-spw-hydration="error" aria-label="Failed to load data"></div>
```

**CSS states:**
- `[data-spw-hydration="loading"]`: shimmer overlay
- `[data-spw-hydration="ready"]`: fade-in settle animation
- `[data-spw-hydration="error"]`: error hint glyph

**Skeleton roles:** `heading`, `line`, `card` (different sizing)

**Integration:** Use this pattern for client-side JSON data sources (topic filters, topic discovery, runtime maps).
