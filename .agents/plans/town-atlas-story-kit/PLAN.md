# Plan: town-atlas-story-kit

## Public Goal

Create a durable town atlas layer that separates practical visitor utility from story substrate, while keeping both indexable and cross-linkable.

The site already has strong story-generation affordances in routes like `/play/`, `/play/rpg-wednesday/`, `/cards/`, `/services/`, and `/topics/`, but those motifs currently share the same first-read space. The atlas layer should give the story material a stable container so practical visitors can move directly to work, support, research, or contact, while story-focused visitors can enter a structured world bible.

## Likely Files

- `town/index.html` or `lore/atlas/index.html`
- `index.html`
- `play/index.html`
- `play/rpg-wednesday/index.html`
- `topics/index.html` if the atlas needs a cross-link back to the existing topic atlas
- `public/css/style.css` only if a small shared surface treatment is needed

## Semantic / Runtime Seams

- Keep the town layer visibly separate from the practical routes.
- Use the existing page architecture metadata families where possible:
  - `data-spw-surface`
  - `data-spw-route-family`
  - `data-spw-context`
  - `data-spw-page-family`
  - `data-spw-page-role`
  - `data-spw-page-zone`
  - `data-spw-page-status`
  - `data-spw-page-responsibility`
  - `data-spw-page-primary-action`
- Cross-link the atlas back to practical surfaces instead of duplicating their content.
- If story hooks are added, keep them as reusable notes rather than rewriting practical pages into fiction.

## Planned Shape

### Route: `/town/`

- Town overview as a structured world bible
- Stable navigation into:
  - library
  - guides
  - districts
  - factions
  - objects
  - sessions
- Small page-job metadata block near the top
- Story hook notes that translate practical artifacts into in-world meaning
- Links back to `/play/`, `/cards/`, `/services/`, `/research/`, and `/topics/`

### Route: `/play/rpg-wednesday/`

- Add a clearer connection from the campaign surface to the town atlas
- Make the story/public-learning intent easier for models and collaborators to parse

### Route: `/index.html`

- Add a single stable entrance for the town atlas without crowding the practical funnel

## Validation

- `git diff --check`
- targeted sanity read for the new route and updated links
- `npm run check`

## Out Of Scope

- A full nested lore CMS
- Moving all story material out of `play/`
- A major CSS redesign unless the new route truly needs it
