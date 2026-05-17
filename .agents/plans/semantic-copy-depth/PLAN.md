# Semantic Copy Depth

## Public Goal

Let readers tune how much copy is visible without splitting the site into separate versions. The base page should remain readable and crawlable; optional layers should reveal theory, genre, culinary vocabulary, and route bridges when semantic density or runtime posture asks for more depth.

## Current Contract

- `data-spw-copy-depth="normal|rich|genre"` marks optional copy layers.
- `data-spw-copy-label` names the layer in the UI.
- `data-spw-semantic-expression` stores the compact Spw-shaped meaning label.
- `data-spw-semantic-cluster` names resonance families such as `culinary`, `programming`, `learning`, and `genre`.
- `data-spw-vocab` marks inline vocabulary that can resonate across routes.
- `semantic-crossrefs` reads those annotations and marks same-token peers on hover/focus without changing link clicks.
- `data-spw-emphasis="primary|secondary|tertiary"` marks importance tiers when CSS and copy need to agree about the current objective, supporting neighbor, or ambient context.
- `spw-learning-game` gives the site a configurable metacognitive loop: notice, name, fold, note, return.

## Display Rules

- Minimal semantic density keeps the page calm.
- Normal semantic density reveals `normal` copy.
- Rich semantic density reveals `normal` and `rich` copy.
- Resonant and theatrical runtime postures reveal `genre` copy.
- Palette and developmental climate may bias which vocabulary cluster receives stronger visual emphasis.

## Constraints

- Essential meaning stays in visible HTML.
- Optional copy layers should explain, connect, or deepen; they should not hide required navigation.
- Foodie vocabulary should motivate shared noticing, not gatekeep.
- Internal route bridges should include reasons for links, not only labels.
- Collection should represent useful awareness or return value; reset paths should make tuned runtime state comparable to authored defaults.
- Navigation anchors should not receive semantic topic markers that alter their default link behavior.

## Follow-Up

- Add a settings UI note or control that previews copy-depth behavior directly.
- Let route templates emit bridge sections with consistent `spw-route-bridge` markup.
- Consider a topic index for vocabulary clusters once enough culinary, programming, and genre terms have accumulated.
- Explore exporting annotated components as compact Spw recipe cards, e.g. `card[reason]{produce.artifact}`, for future model expansion and crawler-facing route briefs.
- Expand emphasis-tier audits across route hubs so primary, secondary, and tertiary meaning can be inspected consistently in screenshots and generated design catalogs.
