---
name: spw-semantics-rigor
description: Make the spwashi.com semantics model more rigorous across copy, HTML data attributes, CSS tokens, JS state, and `.spw` inspection files. Use for ontology cleanup, concept alignment, runtime/state naming, dimension vocabulary, and interactive-medium contracts.
---

# Spw Semantics Rigor for spwashi.com

Read first:

- `../_shared/site-workflow.md`
- `../_shared/site-vs-workbench.md`

## Default Workflow

1. Identify the semantic layer in question:
   - public copy
   - HTML/data attributes
   - CSS tokens or category families
   - JS datasets/events/state
   - `.spw` conceptual surfaces
2. Distinguish authored truth from inferred truth.
3. Classify the semantic operation when `.spw` is involved: cache, audit, align, prime, contract, or archive (see `.spw/conventions/semantic-capacity.spw`).
4. Classify fixity before changing shared meaning: fixed, stable, tending, experimental, or volatile (see `.spw/conventions/model-guided-refinement.spw`).
5. Trace cross-language stems — one concept should map consistently across:
   - HTML `data-spw-*`
   - CSS `--spw-*` tokens and `[data-spw-*]` selectors
   - JS `dataset.spw*` / bus events / `__SPW_*__` snapshots
   - `.spw` convention names and validation lines
6. Prefer one canonical name per concept unless the distinction is real and teachable.
7. When the model matters beyond one patch, write it down in `.spw` and wire through `.spw/conventions/index.spw` or `.spw/site.spw`.

The agent/planning/editor-inspectability layer is an active rigor surface — see `agent-optimization/PLAN.md` and the `@agents` block in `site.spw`.

For cross-discipline work, route through `.spw/conventions/daily-kernel.spw`.

## Dimension vocabulary rails

Use `.spw/conventions/dimension-vocabulary.spw` + `public/css/tokens/dimensions.css` when work touches:

- **spatial** — packing tier, occupancy, measure (`data-spw-pack-tier`, `--spw-pack-*`)
- **temporal** — ecology phase, lifecycle, hydration (`data-spw-hydration`, `--spw-lifecycle-phase`)
- **semantic** — variants, genres, page modes (`data-spw-semantic-variant`, `--spw-variant-selection-weight`)
- **attention** — pre-state visibility, salience, resonance
- **interactive_medium** — registers, postures, device context (`data-spw-medium-register`, `--spw-medium-*`)

Alias routing belongs in tokens/CSS — do not fork parallel attribute names for dense/roomy, touch/hover, or scene/play registers.

## Interactive-medium semantics

When entertainment or scene work introduces reusable state, align with:

- `interactive-medium.js` — register/posture/intensity (not duplicate viewport detection)
- `scene-interaction.js` — lane focus, image coupling, local memory
- `spw-key-events.js` — potentiation, scene stack, reveal phases
- `topical-payload.js` + `page-anatomy.js` — serialization for inspection/LM handoff

Use skill `spw-interactive-medium` for implementation; use this skill for naming audits and `.spw` contracts.

## Drift audit checklist

- [ ] Does an existing `data-spw-*` family already cover this?
- [ ] Is the CSS token owned by the right layer (tokens vs systems vs routes)?
- [ ] Does JS write through `dom-contracts.js` / `site-settings.js` rather than ad-hoc dataset mutation?
- [ ] Is the concept inspectable in Spw serialize output?
- [ ] Does copy match creator-first identity (Spwashi = person, site = surface)?

## Good Outputs

- invariants and role/cluster maps
- state-flow notes and semantic drift audits
- renamed data attributes or events with cross-layer trace table
- semantic insight-cache entries or daily-kernel notes
- convention updates in `.spw/conventions/` with validation lines