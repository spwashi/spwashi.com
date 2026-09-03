# Plan: microinteraction-motion-lifecycle

## Public goal

Make component interaction arcs visible across hops — landmark rooms, cauldron
gather / inspect / release — and spend the existing ornament cluster as a
partial reading of gathered conceptual payloads.

## Not this

- New `data-spw-*` families
- Merging expression-card modules
- Factorial harmony × region selectors
- Reordering the stored cauldron; clustering is a display reading

## Surfaces

| Layer | Change |
|---|---|
| `public/js/interface/cauldron/storage.js` | `clusterIngredients()` — operator / region / liminality / route; groups of one stay loose |
| `public/js/interface/composition.js` | Wrap clustered chips in `.spw-ornament-cluster` with the winning axis stamped on existing attrs |
| `public/js/interface/cauldron/resonance.js` | `--spw-cluster-index` is the cluster ordinal so kin twinkle together |
| `public/js/runtime/interaction-progression.js` | Landmark hash hops write `discover`; gather `charge`; inspect `inspect`; release `settle` |
| `public/js/runtime/interaction-hops.js` | Landmark loop-state, swipe-to-cycle rooms, section-handle travel synergy |
| `public/js/runtime/interaction-story.js` | Reads phase+pulse+liminality+loop+hash as one story |
| `public/js/runtime/interaction-vocabulary.js` | `tap:travel` / `swipe:cycle`; landmarks and cauldron chips in the gesture target set |
| `public/js/runtime/attention/section-handle.js` | Documents the live story on the handle form; writes `data-spw-approach` on the current room; pins resonance probe from the room's operator on a hop |
| `public/css/systems/electrostatic-affordances.css` | Interaction-phase arms the room electrode; current section and handle raise `--spw-e-edge`; induced field spends into `--spw-resonance` |
| `public/js/runtime/charge-field.js` | Hop/gather/inspect phases bump the existing charge-field intensity |
| CSS | Compact footer clusters; landmark `aria-current`; discover/inspect pulse spend; liminality ornament accents |
| Conventions | `interaction-microstates`, `cauldron-dynamics`, `ornament-contract`, `component-region-personality` |

## Validation

- `node --test --import ./scripts/tests/setup-dom-globals.mjs --import ./scripts/tests/register-public-imports.mjs scripts/tests/cauldron-clusters.test.mjs`
- `git diff --check`
- `node --check` on edited JS
- `npm run smoke:nav -- --routes /,/about/ --require-settled --fail-on-console-error --fail-on-overflow-x`
