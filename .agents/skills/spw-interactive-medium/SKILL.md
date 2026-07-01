---
name: spw-interactive-medium
description: Build and tune spwashi.com as an entertainment and interactive medium — scene beds, keyboard scenes, device-aware display variants, topical payloads, and module-added style impact. Use for play/film/practice-bed routes, scene-interaction, spw-key-events, interactive-medium tokens, viewport/pointer specificity, and LM-handoff serialization.
---

# Spw Interactive Medium for spwashi.com

Read first:

- `../_shared/site-workflow.md`
- `../_shared/site-vs-workbench.md`
- `references/interactive-medium-rails.md` when implementing or auditing

## When to Use

- the route should feel like play, practice, scene composition, or campaign — not only reading
- work touches scene beds, lane focus, image coupling, keyboard potentiation/actualization, or staged reveals
- display must respect viewport tier, pointer mode, hover capability, packing tier, or layout posture
- module-added CSS must modulate earlier systems without fighting layout (systems-layer tail import)
- serialization must land in `pageAnatomy`, `topicalPayload`, or Spw for LM/editor handoff

## Default Workflow

1. **Classify the medium register** before adding behavior:
   - `scene` — practice beds, film modes, `data-spw-scene-interactive`, scene-interpret hosts
   - `play` — RPG/campaign surfaces, `data-spw-context="play"`
   - `workshop` / `lab` — compose/build/practice routes with interactive hosts
   - `reading` — default; keep module modulation light
2. **Respect device specificity** — read existing root state from shell-disclosure:
   - `data-spw-viewport-tier`, `data-spw-pointer-mode`, `data-spw-hover-mode`, `data-spw-device-context`
   - let `interactive-medium.js` write `data-spw-medium-register`, `data-spw-interaction-posture`, `--spw-medium-intensity`
3. **Patch in layer order** (smallest honest surface):
   - route HTML — scene bed anatomy, `data-spw-scene-interpret`, images, memory strips
   - shared tokens — `public/css/tokens/dimensions.css` for canonical medium axes
   - systems CSS — base module styles (`scene-interaction.css`, `spw-key-events.css`) consume `--spw-medium-*`
   - systems tail — `interactive-medium.css` imported **after** module systems to modulate tokens
   - runtime — register in `public/js/runtime/module-catalog.js`; expose `window.__SPW_*__` snapshot APIs
4. **Wire inspection** when the contract is reusable:
   - `.spw/conventions/dimension-vocabulary.spw` (`interactive_medium` axis)
   - `.spw/conventions/interaction-microstates.spw`
   - `.spw/slices/` or `.agents/plans/modular-experience-slices/` when ownership spans routes
5. **Validate interaction topography** — confirm snapshots include medium + device context:
   - `window.__SPW_INTERACTIVE_MEDIUM__.snapshot()`
   - `window.__SPW_PAGE_ANATOMY__.serialize()` → `interaction_topography`
   - `window.__SPW_TOPICAL_PAYLOAD__.serialize()` → `interactive_medium`

## Implementation Rails

| Concern | Canonical owner | Do not duplicate |
|--------|-----------------|------------------|
| Lane radiogroup + local memory | `scene-interaction.js` | keyboard roving in page scripts |
| Potentiation / scene enter-exit | `spw-key-events.js` | one-off keydown handlers on routes |
| Device + register tokens | `interactive-medium.js` + tail CSS | per-route media-query touch hacks |
| Topics/lore/handles/scene state | `topical-payload.js` | ad-hoc JSON builders |
| Interaction + key catalog | `page-anatomy.js` | parallel binding tables |

## Edge Cases

- **Coarse + narrow** → `touch-field` posture; suppress hover lift (`data-spw-hover-mode="touch"`)
- **Dynamic scene beds** → listen for `spw:scene-bed-ready`; use MutationObserver sparingly with rAF debounce
- **Mode-switch panels** → scene-interaction must re-sync lane focus on `spw:variant-selected`
- **Reduced motion** → prefer token dampening; disable transforms/animations in module CSS `@media (prefers-reduced-motion: reduce)`
- **Boot order** — `shell-disclosure` before `interactive-medium`; signature-cache to avoid redundant root writes
- **Host counting** — dedupe beds, scene-interpret, prompt-host, and wonder blocks when scoring intensity

## Good Outputs

- scene beds with keyboard + pointer parity and inspectable local state
- device-aware touch targets without breaking reading routes
- topical/scene payloads serializable to Spw
- module CSS that spends shared tokens instead of route-local `!important`
- plan note under `modular-experience-slices/` when the slice outlives one patch

## Validation

- `node --check` on touched runtime modules
- `npm run check:local` for ordinary patches
- `rg` for selector alignment: `BED_SELECTOR` / `SCENE_HOST_SELECTOR` / `data-spw-medium-register`
- browser smoke on one practice-bed route + one play route at narrow and wide widths