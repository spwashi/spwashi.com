---
name: Spw cognitive texture and liminality
description: Design direction for how Spw intricacy rewards attention — charge thresholds, operator typography, grounded tokens as substrate, cognitive surface auto-rendering, and personas.
type: project
---

# Spw Cognitive Texture and Liminality

> **Superseded in part, 2026-08-31.** The operator-typography thesis below has moved
> into the corpus at `.spw/language/operator-typography.spw`, where
> `npm run spw:integrity` can check its citations. The "Implementation Files" list
> at the foot of this memo named five files that no longer exist; a flat-layout
> reorganisation moved every one of them and nothing failed, because a memo in
> `.agents/` is outside the integrity graph. See
> `.spw/audits/aesthetic-alignment-2026-08.spw#f5_operator_typography_unwired`.
> Read the principles here as design intent. Read the corpus surface for what is
> wired, what is disposition, and where each idea now lives.

## Key Design Principles

### Liminality becoming tangible
Charge accumulation (0→0.25→0.65→0.90) is the model. At neutral, a token is pure potential. As attention accumulates (charge), the field manifests around it. That crossing is **liminality → tangible**.

### Operator typography as cognitive texture
Each operator type has a distinct typographic character that manifests progressively with charge. This is not decoration; it IS the meaning in motion.
- **frame (#>)**: territory declaration → weight condenses, tracking tightens.
- **probe (?)**: open inquiry → tracking widens, tilts toward italic.
- **action (@)**: commitment → weight surges, capitalizes.
- **ref (~)**: relational pointing → oblique angle grows.
- **... (nineteen operator types carry a derived geometry in `public/js/kernel/operator-detection.js`; `public/css/handles/operators/geometry-projection.css` renders seven of them, and almost entirely as colour rather than type)**

### Ground is context-relative
`data-spw-grounded-in` carries the operator substrate the token settled into. Ground IS the substrate layer, not an absolute state. Settled tokens are dimmed but retained, acknowledging presence while releasing attention.

### Cognitive Surface
Was implemented in a file that no longer exists. The idea — auto-render grounded tokens as a live Spw block panel (`#>[cognitive_web]`), grouped by substrate, showing `?[next_encounters]` inferred from the Lattice and `@[actions]` for crystallization.

### Personas (Viewer, Doodler, Scribe)
Was implemented in a file that no longer exists. Persona intent — modulate the aesthetic and functional depth:
- **viewer@**: clean, focused readability.
- **doodler@**: expressive, sparkles, particle delight.
- **scribe@**: technical precision, meta-text reveals.

### Component atom anatomy
All Spw components share a three-part grammar: `prefix · nucleus · suffix`, mirroring the operator syntax. Scales: pill, chip, card, breadcrumb.

## Where this lives now

- **Operator typography, charge-to-type, the `@` layering, the crop rule** — `.spw/language/operator-typography.spw`
- **Liminality as potential crossed** — `.spw/philosophy/one-physics.spw`
- **Charge accumulation and discharge** — `.spw/conventions/electrostatic-affordances.spw`, `.spw/conventions/arrival-electrostatics.spw`
- **Operator geometry source of truth** — `public/js/kernel/operator-detection.js` (`OPERATOR_GEOMETRY`)
- **What renders today** — `public/css/handles/operators/` (10 files), `public/css/grammar/syntax.css`

The five files this memo used to name — `public/css/spw-typography.css`,
`spw-wonder.css`, `public/js/spw-cognitive-surface.js`, `spw-personas.js`,
`spw-lattice.js` — are all gone. Do not cite them.

**Lesson worth keeping:** a load-bearing claim filed outside `.spw/` is a claim
nothing checks. If it matters enough to build from, it belongs where
`npm run spw:integrity` can reach it.
