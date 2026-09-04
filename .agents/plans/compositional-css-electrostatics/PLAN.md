# Compositional CSS Electrostatics

## Public Goal

Make CSS read as a compositional projection of authored meaning, available space, interaction tendency, and attention state—while reducing first-paint spend and keeping every richer behavior progressively enhanced, inspectable, and useful to design collaborators.

## Current Signal

- Core CSS is 1,595 KiB against a 1,638 KiB soft budget; scoped routes still carry roughly 1,622–1,819 KiB.
- The authored tree is about 170 sheets, 2.85 MB, 9.8k rule clusters, 7.5k custom-property declarations, and 11.8k `data-spw-*` selector references.
- Large owners include tokens, grammar, home, navigation, design, wonder, adaptive chrome, topics, and runtime states.
- Existing contracts already provide the ingredients: container-relative packing, independent token channels, interaction phases, attention electrostatics, expression ASTs, and scoped bundles.

## Boundaries

- Preserve cascade layer order; delivery and cascade remain separate systems.
- Do not rename `shell-disclosure`, add operator meanings, or author new `data-spw-*` families without owner-plan review.
- Do not hide essential content behind AST hydration, gesture timing, images, or late CSS.
- No visitor-side telemetry, CSS-in-JS, framework, or npm dependency.

## Compositional Token Model

Compose local output tokens from five independent channels: authored semantics, container/space, interaction phase, attention/charge, and material/climate. A channel reports state; a component owner spends it. No self-referential custom properties, root geometry from narrated state, or viewport-only variants where a container can decide.

## Current Standards Alignment

- Use the DTCG 2025.10 model as an interchange boundary: tokens stay typed; aliases connect semantic roles to primitives; groups organize but never imply purpose.
- Reserve composite tokens for values whose named parts are genuinely consumed together. Keep independently varying Spw channels separate until a component resolves them into a local output.
- Treat theme, accessibility, space, and interaction posture as explicit resolver contexts. Prefer orthogonal modifiers and sparse overrides over enumerating every permutation.
- Use container size/style queries and container-relative units as progressive component inputs, with a semantic-selector and non-container fallback outside the query.
- The `<{` drop-cap study remains attached to its originating element: pseudo-elements render a parsed role but do not become query containers or independent semantic nodes.

## Workstreams

1. **CSS reclustering:** inventory heavy files by owner, sensed state, arrival tier, and probe; split only where each resulting sheet remains a standalone document.
2. **Runtime parity:** generate an audit joining catalog `updates`/`effectScope`, CSS selectors/custom properties, authored attributes, and ARIA states.
3. **Interaction electrostatics:** map tap, hold, swipe, focus, cancel, and release onto impulse, accumulation, vector transfer, and discharge with one inspectable payload shape.
4. **Component variants:** let size, lens priority, region topology, available space, and session tendency alter information hierarchy—not merely decoration.
5. **Expression AST:** test linear versus polar projection, compound operands, hybrid conceptual/definitional opening, and punctuation discharge before changing canon or markup.
6. **Bundle theater:** pair static budgets with headless route/posture CSS-coverage traces; show used, conditionally used, deferred, and unobserved rules without calling one crawl universal truth.
7. **Image integration:** curate `_raw` and `_raw-2x2` Midjourney studies by semantic seat, then route approved assets through naming, optimization, sidecars, and image interaction.

## First Slices

- Add a source-only CSS usage census and route/posture capture schema.
- Pilot the five-channel token model on one card family and one attention handle.
- Normalize gesture payload documentation before changing listeners.
- Add AST fixtures for `linear`, `polar`, hybrid `<{`, and terminal `.` hypotheses.
- Produce Grok visual and Claude copy/a11y handoff briefs from the same specimen matrix.

## Owner Handoffs

- CSS ownership: `css-architecture-readability`, `core-css-spend-cut`, `stylesheet-ecology`.
- Gesture/runtime: `interaction-loop-contract`, `interaction-grammar`, `attention-field`.
- Language canon: `spw-metaphysical-language`, `compound-expressions`, `semantic-expression-consequence`.
- Naming: `shell-model-vocabulary-consolidation`; no rename lands here.
- Images: `style-image-cohesion` and `unsorted-image-rollout` own promotion.

## Validation

- `npm run css:payload`
- `npm run check:css && npm run check:runtime`
- `npm run ecology:language && npm run manifest:expressions` when fixtures change
- Narrow/wide, keyboard/touch, reduced-motion, no-JS, and screenshot-posture specimens
- `npm run plans:index:check && npm run spw:integrity && git diff --check`

Primary references, checked 2026-09-04: [Design Tokens Format Module 2025.10](https://www.designtokens.org/tr/2025.10/format/), [Design Tokens Resolver Module 2025.10](https://www.designtokens.org/tr/2025.10/resolver/), and [CSS Containment Module Level 3](https://www.w3.org/TR/css-contain-3/).
