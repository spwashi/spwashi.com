# Plan: spell-cauldron-lifecycle-memory-gardening + runtime mirrors + CSS state refinement

## Public Goal (user-facing outcome)
Make the site's "cauldron" (collection/resonance vessel for semantic ingredients) and "spells" (grounded, serializable, replayable interaction units / checkpoints) feel like living, gardenable memory rather than static lists. 

- **Lifecycle awareness**: Spells and cauldron ingredients expose clear phases (captured/gathering, resonant/active, cast/emerged, decayed/archived) via data attributes so CSS, inspectors, and future surfaces can react without ad-hoc timers.
- **Memory gardening**: Add lightweight tending actions (prune old/weak, nurture/strengthen by recency or wonder, "plant" as durable checkpoint/spell) with visual feedback. This turns passive collection into active, reflective practice aligned with the site's cognitive and wonder-memory model.
- **Design + blog pages**: Enhance `/design/runtime/`, `/design/composition/`, related experiment surfaces, and `/blog/` (and post shells) to host live "runtime mirrors" (observable cauldron contents, active spell dock, grounded state) and inline tuning/instrumentation controls so editors and readers can inspect and lightly steer behavior in context.
- **CSS data-attr + state handling refinement**: Clean up and centralize the growing web of `[data-spw-grounded]`, `[data-spw-collected]`, `[data-spw-cauldron-*]`, `[data-spw-spell]` selectors and :has() rules across chrome, operators, ornament, typography, and route surfaces. Prefer attribute-driven, layer-respecting patterns that also support new lifecycle phases. Remove inline style hacks where pure CSS can carry the state (e.g. the cauldron inspect glow).

The result: the browser runtime feels more like a tended garden of meaning — inspectable, prunable, resonant — while staying hand-authored, progressive, and editor-visible through `.spw`.

## Layers Affected (predicted minimal set)
- **Runtime JS (shared)**: composition.js (cauldron core + UI), spells.js + related (haptics couplings, navigation-spells), site-settings (cauldron storage bridge), possibly small touches in experiential / cognitive-state / attention-architecture for lifecycle hooks.
- **Route HTML**: design/runtime/index.html (primary mirror + tuning lab), design/composition/index.html and nearby experiments, blog/index.html (and any post templates that already use spell boards or collection UI).
- **Shared CSS**: shell/chrome.css (cauldron footer + spell dock), handles/operators.css, ornament/ornament.css, typography/base.css, plus any route-specific (design/*, blog). Focus on data-attr and :has() state logic.
- **Editor surfaces**: `.spw/conventions/site-semantics.spw` (expand component-lifecycle-tropes and spellcasting notes), possibly operator-semantics or ornament-contract for memory gardening metaphors; new or updated plan .spw.
- **Tracking**: `.agents/plans/spell-cauldron-lifecycle-memory-gardening/` (this PLAN.md + lightweight wip.spw bridge).

No changes to core tokens, build pipeline, or unrelated routes. No new dependencies.

## Semantic / Runtime Seams
- Existing bus events (`cauldron:updated`, `spell:capture`, `spell:checkpoint`, `cauldron:ingredient-inspected`) + data attrs (`data-spw-cauldron*`, `data-spw-spell`, `data-spw-grounded`, `data-spw-collected`, `data-spw-checkpoint`).
- New lightweight phase attrs (e.g. `data-spw-cauldron-phase`, `data-spw-spell-phase` or per-ingredient `data-spw-ingredient-phase`) emitted from the same modules.
- Gardening actions exposed as `[data-spw-cauldron-action="prune|nourish|plant"]` and equivalent spell-dock affordances — progressive (work without JS as simple buttons that degrade gracefully).
- Runtime mirrors on design/blog pages: small live regions or cards that subscribe to the same bus/data and render current cauldron/spell state (already partially present in runtime lab).
- CSS state: centralize common patterns (e.g. a small "state-ornament" or "interaction-state" layer if needed, but prefer targeted attribute selectors + :has() on body/main for cauldron/spell presence).

## Files Likely to Change (smallest honest surfaces first)
**High confidence (core behavior):**
- `public/js/interface/composition.js` — add capturedAt usage for pruning, phase computation on sync/render, new gardening action handlers, emit richer lifecycle detail on bus.
- `public/js/runtime/spells.js` — parallel lifecycle metadata on entries/checkpoints, gardening helpers (prune by age or strength), expose for mirrors.
- `public/css/shell/chrome.css` + `public/css/handles/operators.css` + `public/css/ornament/ornament.css` — new or refined `[data-spw-cauldron-phase="..."]`, `[data-spw-spell-phase]`, strengthened :has() for cauldron/spell "active garden" states; clean up any duplicated grounded/collected rules.
- `design/runtime/index.html` — add or expand a "Memory Garden Mirror" panel + inline cauldron/spell tuner (re-uses existing puppetry/console patterns).

**Medium confidence (supporting polish):**
- `design/composition/index.html`, `design/experiments/*` (light hooks or example cards).
- `blog/index.html` (and any shared blog partials) — inline spell/cauldron affordances or a compact mirror for readers who engage with posts as "ingredients".
- `public/js/site.js` (module registration descriptions only if new attrs need documenting).
- `.spw/conventions/site-semantics.spw` — extend the existing "component-lifecycle-tropes" and "composition-spellcasting" frames with cauldron/spell phases + memory gardening as a practitioner rhythm.
- `.agents/plans/spell-cauldron-lifecycle-memory-gardening/PLAN.md` + `wip.spw` (the latter only if the ontology needs staged editor visibility).

**Out of scope for this patch**:
- Full visual redesign of cauldron or spell dock UI.
- New persistence beyond localStorage (e.g. no cross-device).
- Changes to wonder-memory.js or attention-architecture core (only consumption of new phases).
- Blog post content rewrites.
- Any workbench/_spw changes (site-first).
- New CSS custom properties or layer additions (refine inside existing layers).

## Craft Guard (per AGENTS.md + site workflow)
- Clarify public goal (memory as gardenable, inspectable practice) before any edit.
- Always smallest surface: start in composition.js + spells.js for behavior, then the CSS files that already own the data-attr styles, then the design runtime page as the showcase mirror. HTML on blog only if it already has spell-board hooks.
- Preserve hand-written structure, existing copy, all current bus events and data attr contracts (additive only).
- Progressive enhancement: new gardening actions and phases must degrade gracefully (old captures still work; no-JS cauldron/spell surfaces remain useful lists).
- Root-relative assets, semantic HTML, accessibility basics (aria on new actions).
- When the concept (lifecycle phases for spells/cauldrons, memory gardening as first-class rhythm) needs to survive beyond one patch, wire it into the .spw note and this plan.
- Validation after every meaningful batch: `git diff --check`, `node --check` on touched .js, targeted `rg` for the new attrs/actions, full `npm run check` before any commit that touches contracts or shared layers.
- If agent-optimization or planning ecology itself improves as a side effect, note it and invoke `spw-plan-maintenance` later.

## Risks + Mitigations
- Over-complicating the cauldron/spell mental model: mitigate by keeping gardening actions few and metaphor-light (prune/nourish/plant as simple verbs with clear tooltips).
- CSS selector explosion: mitigate by refactoring duplicated grounded/collected rules into a small shared pattern first, then adding phase variants.
- Runtime mirrors on design/blog becoming noisy: keep them collapsed by default or opt-in via existing "inspect" affordances; use the runtime lab page as the primary rich surface.
- LocalStorage "garden" growing unbounded: the existing MAX_INGREDIENTS + new prune-by-age (e.g. >30 days or low wonder) keeps it bounded.
- Breaking existing captures/checkpoints: all changes are additive (new optional fields + actions); normalize functions already handle legacy shapes.

## Validation Loop
1. After JS changes: `node --check` + manual smoke (capture ingredients, mix, inspect, new prune/nourish actions, observe new phase data attrs on html + ingredients).
2. After CSS: visual check of state-driven styles for cauldron/spell presence + lifecycle phases (reduced motion safe); `git diff --check`.
3. Page enhancements: load design/runtime and blog, verify live mirrors update, inline tuning controls work.
4. Full gate: `npm run check` (includes CSS contracts, generated manifest, route validation, audit).
5. Editor inspectability: the new phases and gardening concepts appear in the design catalog once data attrs are used, and in the .spw note.
6. Regression: existing spell checkpoints, cauldron mix/clear, grounded navigation, and wonder memory flows continue to work unchanged.

## Commit / Patch Shape (example)
- `.[spell-cauldron] — add lifecycle phases + memory gardening actions to cauldron (composition.js) and spells`
- `&[spell-cauldron] — refine data-attr state selectors and add phase-driven styles in chrome/operators/ornament CSS`
- `&[design-mirrors] — surface live cauldron/spell mirrors + inline tuning in design/runtime (and light hooks on composition + blog)`
- `.[semantics] — extend site-semantics.spw lifecycle tropes and spellcasting notes with gardening + phase model`
- `#[plan] — track spell/cauldron memory gardening + runtime mirror work under dedicated plan`

## Dependencies / Related Plans
- Builds directly on existing cauldron (composition.js), spells (runtime/spells + haptics), grounded/ collected state, and the component-lifecycle language already in `.spw`.
- Complements recent cadence-text-resonance and attention work (memory as another temporal/gardenable dimension).
- If this improves the agent planning surface itself, cross-link to `agent-optimization/PLAN.md`.

## When to Revisit
After this patch lands and has a few weeks of use: evaluate whether "memory gardening" needs its own small dedicated surface (e.g. a /memory/ or /garden/ route) or deeper integration with wonder-memory and the spellbook dock. Log decisions here.

---

**Status**: Planning complete per spw-feature-planning skill + AGENTS.md. Minimal file prediction done. Ready for implementation in strict smallest-surface order (JS behavior → CSS state refinement → showcase pages → contracts/plan artifacts). All work stays site-first. 

Next action after plan approval: mark planning todo complete and begin with the core JS surfaces (composition.js + spells.js) for lifecycle + gardening primitives.
## Ownership Note - 2026-07-03

Merged into `spellcraft-authoring/PLAN.md` as the consolidated owner of spell/cauldron authorship, selection, and styling. This file stays as reference; route new work to the owner plan.
