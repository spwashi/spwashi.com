# Plan: brace-literacy-guides

Tighten brace semantics, conceptual/realized differentiation, and literacy guidance so the site's Spw surfaces feel like one system instead of a stack of adjacent effects.

## Goal

The site should explain more of itself through its own interaction grammar. Brace forms need clearer differentiation between conceptual and realized surfaces, substrate needs to read as a first-class distinction, and phrasing cues should help people parse what is idea, what is artifact, and what is guidance. The quality bar here is clarity and expressiveness: richer semantics, better salience, and settings that actually help people read the system rather than just decorate it.

This branch also needs to avoid the shallow-accumulation problem from recent fast edits. New smart/localStorage behavior should be heuristic but legible, grounded in page metadata and existing component semantics, not a parallel lore layer.

## Scope

- **In scope**: brace-role semantics for conceptual vs realized content, substrate and phrasing heuristics, CSS salience updates in split CSS files, settings wiring for literacy handles/conceptual guides, smarter localStorage-driven cognitive surfaces, and a small semantics note tying those pieces together.
- **Out of scope**: route-wide copy rewrites, a full `style.css` architecture rewrite, replacing current localStorage systems, or any network/LLM-backed intelligence.

## Files

[NEW] .agents/plans/brace-literacy-guides/PLAN.md  
[NEW] .agents/plans/brace-literacy-guides/wip.spw  
[NEW] .agents/plans/brace-literacy-guides/brace-literacy-guides.spw  
[MOD] public/js/spw-component-semantics.js — derive conceptual/realized, substrate, and phrasing metadata from existing DOM semantics  
[MOD] public/css/spw-grammar.css — sharpen brace differentiation and substrate/readability cues  
[MOD] public/css/spw-handles.css — improve salience, guided emphasis, and smart-console coexistence  
[MOD] public/css/spw-components.css — align the cognitive surface atoms with the shared grammar without replacing user work already in progress  
[MOD] public/js/spw-guide.js — turn popped-registry scaffolding into clearer literacy/conceptual guidance  
[MOD] public/js/spw-smart.js — upgrade clustering heuristics using page metadata + localStorage traces  
[MOD] public/js/spw-cognitive-surface.js — expose substrate, conceptual/realized grouping, and phrase-aware summaries  
[MOD] public/js/site-settings.js — wire literacy handles / conceptual guides toggles into the global settings model  
[MOD] settings/index.html — expose the new settings with copy that explains what they do  
[MOD?] public/js/site.js — only if init order or surface mounting needs a small adjustment around the cognitive surface

### Craft guard

- `public/css/spw-components.css` is already over the preferred size and has multiple responsibilities due active cognitive-surface work. Keep changes there narrow and prefer `spw-grammar.css` / `spw-handles.css` for new semantics.
- `settings/index.html` is already large; only edit the existing settings bands and notes instead of adding a new independent section.
- `public/js/site-settings.js` and `public/js/spw-component-semantics.js` already centralize several concerns. Avoid growing them with route-specific logic.

## Commits

1. .[brace-literacy-guides] — formalize conceptual/realized braces, substrate, and phrasing invariants
2. &[brace-literacy-guides] — derive metadata heuristics for components and cognitive surfaces
3. &[brace-literacy-guides] — improve brace salience, substrate distinction, and guided emphasis in split CSS
4. &[brace-literacy-guides] — wire literacy handles and conceptual guides into settings and runtime surfaces
5. ![brace-literacy-guides] — verify localStorage heuristics, settings toggles, and cognitive surface behavior

## Agentic Hygiene

- Rebase target: `main@a0eec70`
- Rebase cadence: before commit 1, before merge
- Hygiene split: none at branch level; current working tree already contains in-scope user edits in `public/css/spw-components.css` and `public/js/site.js` that this work must preserve and extend carefully

## Dependencies

none

## Failure Modes

- **Hard**: conceptual/realized heuristics misclassify major surfaces and make the brace system feel arbitrary
- **Soft**: literacy handles become too noisy, or smart/localStorage panels overfit sparse traces
- **Non-negotiable**: no localStorage data loss, no broken settings form behavior, and no edits to `public/css/style.css` while that file is under separate repair

## Validation

- **Hypotheses**: brace-role metadata can drive clearer CSS without rewriting page HTML; local page metadata + persisted traces can improve smart grouping without bespoke route code
- **Negative controls**: existing navigation, console, and phase/disposition controls remain functional; routes without grounded traces stay quiet
- **Demo sequence**: visit `/settings/`, toggle literacy/conceptual guide settings, interact with operator chips / cards on a content route, confirm cognitive surface + smart console reflect substrate and phrasing changes
- **Fuzz strategy**:
  - Explore: query DOM metadata and localStorage traces while exercising brace gestures
  - Stabilize: `git diff --check`, `node --check` on touched JS modules, targeted selector/consumer searches
  - Ship: manual smoke on `/settings/` plus at least one content route using the smart/cognitive surfaces

## Spw Artifact

`.agents/plans/brace-literacy-guides/brace-literacy-guides.spw` — a distilled note defining conceptual vs realized, substrate, phrasing, and the falsification boundary for heuristic guidance.
