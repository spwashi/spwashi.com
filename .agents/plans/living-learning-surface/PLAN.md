# Plan: living-learning-surface (Curriculum Integration — Teaching Technical Fundamentals Through Economic Theory)

**Public Goal**: Turn the 16-page curriculum report into interactive, concept-first learning experiences on spwashi.com. Learners progress through 6 economic-analogy CS modules as quests, manipulate bounded analogies in simulations + mandatory boundary tests, produce exportable proof-card artifacts, track progress locally (no login), and synthesize in capstone portfolios. The site becomes a *living, usable LMS* that demonstrates its own principles (readable systems, developmental climate as equity, constructive play, local-first, recursive notice→name→fold→note→return loop).

This directly extends the existing Town Library / RPG Wednesday learning library (Cask guide already maps to Memory/Buffers), learning-science-enhancement work, proof cards, quests, settings climates, math-lab interactivity patterns, and Spw operator/frame grammar.

## Scope & Phasing
**Phase 1 (Quick wins, surgical)**: Dedicated `/curriculum/` stub route + Memory module (1 of 6) as semantic frames. Reusable boundary-test checklist UI (first-class after analogies). Cask/Liquidity Keeper link from library. Settings "Learning Mode" preset stubs + local progress dashboard stub. Home + library discovery cards. This plan + minimal .spw bridge.

**Phase 2**: 1-2 prototype simulations (memory budget allocation; packet/market routing) following math-interactive-lab + SVG/canvas patterns. Proof-card generators for 2-3 modules. Real curriculum-state.js with JSON/MD/Spw/Obsidian exports. Spw projection examples.

**Phase 3+**: Remaining modules + cross-cutting stabilizing-vs-novel thread. Reusable 4-criterion rubric scorer. Capstone portfolio synthesis view. PWA/offline curriculum manifest. RPG scenarios in play/rpg-wednesday/. Curriculum Spw dialect (liquidity, boundary, externality registers) + workbench mode.

**In Scope**: New route HTML (curriculum/), library/home/settings extensions, progressive JS modules (boundary tests, state, sims), CSS only if shared tokens/components insufficient, .spw for new semantic families, coordination with existing plans.

**Out of Scope (v1)**: Full 6-module copy authoring; multi-user sync; live data embedding; new npm deps without review; top-level nav overhaul beyond discovery CTAs; commercial flywheel content.

## Key Architectural Choices
- **Placement**: Dedicated `/curriculum/index.html` (precedent: /town/) as primary Living Learning Surface for depth + legibility. *Tight* two-way integration with `/play/rpg-wednesday/library/` (quests, Cask guide cards, artifact handoff, college bridge). Home discovery via existing Town Library gateway patterns.
- **Operators**: Start with existing (`#>`, `?`, `~`, `>`, `@`, `!`) + curriculum-specific `data-spw-curriculum-op` or compound sigils (e.g. `#>liquidity_buffer`). Defer new prefix machinery (shared.js regex + CSS tokens) until dialect proven in 2+ modules. Curriculum Spw library in .spw/ for editor inspectability.
- **Interactivity**: Follow `topics/math/...` math-interactive-lab + data-control + SVG (or canvas) pattern for sims. Canvas `data-spw-accent` for ornament. Always provide textual "paper fallback" + instructions. Boundary tests as mandatory, reusable checklist + reflection logger that feeds local proof artifacts.
- **State**: Canonical settings (Learning Mode presets that compose existing `currentDevelopmentalClimate`, `semanticDensity`, `layoutTuner`, etc.) in site-settings.js. Learner progress/artifacts in new namespaced `curriculum-state.js` (localStorage `spwashi:curriculum:*`, exportable, Obsidian-friendly). No bypass of site-settings.
- **Equity**: Realized via developmental climate + local-first (no accounts, works on shared/loaned devices, fictional examples only, low-bandwidth fallbacks, pre-labeled diagrams, TTS-friendly exports).
- **Assessment**: Proof cards (screenshot-ready frames per /cards/ aesthetic) + 4-criterion rubric (technical, analogical fit, tradeoffs, reflection). Every module ends with boundary test before "complete".

## Files Likely to Change
**Phase 1**:
- New: `curriculum/index.html` (shell + Memory module frames using site-frame/frame-card grammar, Cask links, boundary-test form, artifact export stub).
- Mod: `play/rpg-wednesday/library/index.html` (Curriculum Study Routes / Economic Foundations section with Cask memory quest; links to /curriculum/).
- Mod: `index.html` (home — enhance Town Library gateway or add Study Routes discovery with chips to curriculum + library).
- Mod: `settings/index.html` + `public/js/kernel/site-settings.js` (Learning Mode presets panel + curriculum progress stub).
- New (small/progressive): `public/js/modules/curriculum-boundary-test.js` (or inline first).
- New: `.agents/plans/living-learning-surface/PLAN.md` (this file) + optional wip.spw.
- Optional early: `public/js/kernel/shared.js` (compound sigils), `public/css/tokens/core.css` (if new op colors), `.spw/conventions/curriculum-pedagogy.spw` or extension of operator-semantics.spw + site.spw wiring.
- Mod: `AGENTS.md` (reference new curriculum frame patterns if they become reusable).

**Later Phases**: `public/js/modules/curriculum-simulations.js` (or extend math-diagrams), `public/js/modules/curriculum-state.js`, more curriculum/ anchors or sub-pages, proof generators, RPG arcs, .spw surfaces, design-catalog updates (auto).

## Semantic Contracts to Extend
- `data-spw-surface="curriculum"`, `data-spw-features="... curriculum-simulations boundary-tests proof-artifacts"`, `data-spw-page-family="curriculum"`, `data-spw-page-modes="quest simulate reflect synthesize"`, `data-spw-wonder="analogy boundary equity institution disruption"`.
- `data-spw-kind="module|boundary-test|proof-artifact|quest"`, `data-spw-role="guide|simulation"`.
- Existing frames/cards, operator chips, section handles (for long pages), developmental climate textures.
- New (when justified): `data-spw-curriculum-module`, `data-spw-boundary-test`, `data-spw-artifact-type`.

Guide precedent: Cask (`^cask` in library) — "protect the sanctity of the sealed interior" + boundary/ethics quests. Map directly to Memory module (liquidity/buffers, sealed vs leaky, household volatility).

## Validation
- `git diff --check`, `node --check <edited-js>`, `npm run check` (full or targeted) before landing.
- `rg` for new anchors, `/curriculum/`, `data-spw-curriculum*`, Cask links.
- Design catalog run + orphan review (new data-spw-*, tokens, .spw notes).
- Visual + interaction review: frames/cards contain on mobile/desktop; boundary checklists are first-class and no-JS functional; exports round-trip; Learning Mode visibly affects curriculum surface; progress survives refresh.
- Accessibility: meaningful labels, keyboard for controls, ARIA where interactive.
- Pedagogical: Memory module demonstrates full contract (economic parallel + tech trace + *mandatory* boundary test + Cask quest + artifact path). Analogy stress-tests prevent over-extension.

## Risks & Mitigations
- **Analogy overextension** (report's own caution): Boundary-test UI is *mandatory and visible* after every mapping; always return to native technical traces/models.
- **Scope creep**: Phase 1 = 1 module + core UI/state stub only. Full 6-module rollout iterative.
- **Spw curve for novices**: Visual/RPG/canvas primary entry; Spw optional projection layer. Parsons-style or worked examples reduce blank-page load.
- **Maintenance**: Core remains static + local. New features progressive/opt-in. Open-source curriculum extensions via workbench if relevant.
- **Evidence**: Position as rigorously tested teaching hypothesis inside broader active-learning/PBL/simulation evidence base (per report guidance).

## Coordination
- Updates or cross-refs in: `rpg-wednesday-learning-library/PLAN.md`, `learning-science-enhancement/PLAN.md`.
- After significant land: run `spw-plan-maintenance` skill to refresh .agents/plans/, .spw bridges (including agents/planning dispatch), public editor surfaces, skills discoverability.
- If planning/agent surfaces themselves improve (new curriculum authoring skill, Spw curriculum workbench mode): track under `agent-optimization/`.

## Commit Shape (Example Phase 1)
1. `#[plan] — living-learning-surface curriculum integration plan (economic analogies for CS fundamentals)`
2. `.[curriculum] — stub dedicated route + Memory module semantic frames with Cask boundary quest`
3. `.[library] — Curriculum Study Routes discovery + Cask Liquidity Keeper card`
4. `.[home] — Study Routes / curriculum discovery in Town Library gateway`
5. `.[settings] — Learning Mode presets + local progress stub`
6. `.[js] — progressive boundary-test checklist + artifact capture (feeds local proof)`
7. `.[spw] — curriculum pedagogy / operator register notes for editor surfaces`
8. `&[review] — npm run check + visual + pedagogical walk-through of Phase 1 Memory surface`

## References
- Full user-provided 10-section integration plan + module-by-module playbook + risks (source of truth for content/pedagogy).
- AGENTS.md (CSS layers, data-spw-* families, page shell metadata, frame anatomy, operator palette, attention architecture, JSON hydration, validation rules).
- Existing: `play/rpg-wednesday/library/index.html` (Cask, guide/quest cards, boonhonk), math lab pages (interactive patterns), `public/js/kernel/site-settings.js` (climates + learningMode seeds), `public/js/kernel/shared.js` (operators), `/cards/`, `/town/`, developmental climate CSS/JS.
- Report: "Teaching Technical Fundamentals Through Economic Theory" (external; 6 modules + stabilizing institutions vs novel disruptions thread + equity buffers + authentic assessment).

**Next after this plan lands**: User confirmation on open questions (placement depth for v1, sim vs static for Memory Phase 1, docx/deck generation, Spw examples, wireframes). Then surgical implementation of Phase 1 files.

This makes spwashi.com a practical, high-impact, values-aligned living learning management surface — used for *doing* rather than only viewing.
