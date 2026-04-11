---
name: Spw cognitive texture and liminality
description: Design direction for how Spw intricacy rewards attention — charge thresholds, operator typography, grounded tokens as substrate, cognitive surface auto-rendering, and personas.
type: project
---

# Spw Cognitive Texture and Liminality

## Key Design Principles

### Liminality becoming tangible
Charge accumulation (0→0.25→0.65→0.90) is the model. At neutral, a token is pure potential. As attention accumulates (charge), the field manifests around it. That crossing is **liminality → tangible**.

### Operator typography as cognitive texture
Each operator type has a distinct typographic character that manifests progressively with charge. This is not decoration; it IS the meaning in motion.
- **frame (#>)**: territory declaration → weight condenses, tracking tightens.
- **probe (?)**: open inquiry → tracking widens, tilts toward italic.
- **action (@)**: commitment → weight surges, capitalizes.
- **ref (~)**: relational pointing → oblique angle grows.
- **... (all 14 types implemented in `public/css/spw-typography.css`)**

### Ground is context-relative
`data-spw-grounded-in` carries the operator substrate the token settled into. Ground IS the substrate layer, not an absolute state. Settled tokens are dimmed but retained, acknowledging presence while releasing attention.

### Cognitive Surface
Implemented in `public/js/spw-cognitive-surface.js`. Auto-renders grounded tokens as a live Spw block panel (`#>[cognitive_web]`), grouped by substrate, showing `?[next_encounters]` inferred from the Lattice and `@[actions]` for crystallization.

### Personas (Viewer, Doodler, Scribe)
Implemented in `public/js/spw-personas.js`. Modulates the aesthetic and functional depth:
- **viewer@**: clean, focused readability.
- **doodler@**: expressive, sparkles, particle delight.
- **scribe@**: technical precision, meta-text reveals.

### Component atom anatomy
All Spw components share a three-part grammar: `prefix · nucleus · suffix`, mirroring the operator syntax. Scales: pill, chip, card, breadcrumb.

## Implementation Files
- `public/css/spw-typography.css`
- `public/css/spw-wonder.css`
- `public/js/spw-cognitive-surface.js`
- `public/js/spw-personas.js`
- `public/js/spw-haptics.js` (substrate tracking)
- `public/js/spw-lattice.js` (LATTICE export)
- `public/js/spw-core.js` (wonder accents and delight)
- `public/js/spw-smart.js` (resonance cards)
- `public/js/spw-spells.js` (spell board)
