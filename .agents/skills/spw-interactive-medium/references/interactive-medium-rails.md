# Interactive Medium Rails

Quick reference for agents working on entertainment / interactive surfaces.

## Root state (html)

| Attribute | Writer | Purpose |
|-----------|--------|---------|
| `data-spw-viewport-tier` | shell-disclosure | compact / narrow / mid / regular / wide |
| `data-spw-pointer-mode` | shell-disclosure | fine / coarse |
| `data-spw-hover-mode` | shell-disclosure | hover / touch |
| `data-spw-medium-register` | interactive-medium | reading / lab / workshop / play / scene |
| `data-spw-interaction-posture` | interactive-medium | touch-field / touch-tablet / pointer-balanced / pointer-rich |
| `data-spw-medium-intensity` | interactive-medium | 0–1 entertainment weight |
| `data-spw-key-selection` | spw-key-events | idle / potentiated / actualized |
| `data-spw-reveal-phase` | spw-key-events | framing → revealing → revealed → settling |

## Shared tokens (dimensions → systems tail)

- `--spw-medium-touch-min`, `--spw-medium-lane-pad`, `--spw-medium-layout-gap-scale`
- `--spw-medium-reveal-stagger-step`, `--spw-medium-accent-weight`, `--spw-medium-intensity`
- `--spw-module-style-modulator` — scales module-added emphasis without reordering CSS layers

## CSS import order (systems tail)

In `public/css/style-core.css`, place `interactive-medium.css` **after** `spw-key-events.css` and other module systems it modulates.

## Runtime APIs

```js
window.__SPW_INTERACTIVE_MEDIUM__.snapshot()
window.__SPW_SCENE_INTERACTION__.snapshot()
window.__SPW_KEY_EVENTS__.snapshot()
window.__SPW_TOPICAL_PAYLOAD__.serialize()
window.__SPW_PAGE_ANATOMY__.serialize()
```

## Route body metadata (entertainment targeting)

Prefer existing families before inventing attrs:

- `data-spw-page-family="practice-bed"` + `data-spw-page-modes*="film scene"`
- `data-spw-surface="play"` / `rpg-wednesday` + `data-spw-context="play"`
- `data-spw-scene-interactive` on `.spw-scene-bed`

## Practice-bed smoke routes

- `/topics/film/scene-composition/mise-en-scene/`
- `/play/rpg-wednesday/` (library build section)
- `/recipes/mise-en-place/` (culinary scene metaphor beds)

## Slice ownership

Cross-route interactive work → `.agents/plans/modular-experience-slices/PLAN.md` and optional tending note template.