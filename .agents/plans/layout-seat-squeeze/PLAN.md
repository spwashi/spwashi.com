# Layout Seat Squeeze

## Public Goal

Flagship pages sit in named seats (hook, hub, cluster, path, read, wide). Cards squeeze from their own box and leftover room, not from a guessed breakpoint.

## Non-Goals

- No new `data-spw-*` family.
- No sitewide gravity opt-in on every card.
- No copy rewrite. No newspaper leftover-track rewrite.

## Seams

- Top-down: `body[data-spw-layout]` + `data-spw-page-family` + `data-spw-region` tropes in `region-seats.css`. `hero` aliases hook.
- Bottom-up: `data-spw-box-measure`, `data-spw-pack-occupancy`, `data-spw-pack-layout`, `data-spw-space-variant` in `layout-squeeze.css`.
- Variant: existing `variant-selection.js` + `layout-postures.css`. Space-variant is the opportunistic handle.

## Touch

- Shared CSS: `region-seats.css`, `layout-squeeze.css` (new), `style-core.css`, `layout-postures.css`
- HTML: flagship routes graduate one-off regions; living-concept cards pack-local; section-handle gravity on those pages
- `.spw/conventions/region-component-ecology.spw` adoption note

## Validation

1. `git diff --check`
2. `node --check` on any edited JS
3. `rg 'data-spw-region="hero"'` on touched flagship routes should be quiet
4. Compact/wide smoke on `/`, `/topics/software/`, `/about/`
