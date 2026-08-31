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

## Region kin (0–4D)

`public/js/runtime/region-kin.js` classifies similar / contrast / resonate from seat, operator, wonder, and expression subject. Moves are `~` potential, `&` subject, `#` vibration — not `?`. Tap travels, hold previews, swipe cycles. Labels expand by width. `npm run manifest:expressions` remains the workbench parse step.

## Validation

1. `git diff --check`
2. `node --check` on any edited JS
3. `rg 'data-spw-region="hero"'` on touched flagship routes should be quiet
4. Compact/wide smoke on `/`, `/topics/software/`, `/about/`

## 2026-08-29 Packing Alignment

- Evidence: the home hook collapsed its reading region beside a mostly empty action field, while ultra-wide newspaper layout replaced the shell cap with `100%` and left a capped frame pinned to the start edge.
- Shell invariant: newspaper, atlas, and wide desks may wrap their children, but `main` keeps `--spw-main-width`; full-span seats center inside it.
- Packing invariant: width is capacity, while owned region names determine spend. `media + body` may split at 26rem; `media + body + actions` may feature at 44rem; `context + body + actions` stays stacked until 52rem and then opens a secondary action rail.
- Runtime refinement: one owned-region scan now feeds layout, fill, and inspection metadata. Direct semantic regions count as one item; wrapper regions count direct children.
- Route adoption: the home hook opts into the existing `data-spw-pack-local` contract with context, body, and actions—no new attribute family.
- Intrinsic-size boundary: runtime annotation may name anatomy slots and metadata tags, but those compact descendants do not become inline-size containers; layout containment would erase their max-content contribution.
- Grassroots ecology: the entrance uses its existing hub container to pair support + systems and group the three creator disciplines, rather than flattening every audience into one five-column directory row.
- Verification: boundary tests at 416/704/832px; `/` browser smoke at 780, 1920, and 3840px with 0px page overflow; local site, component, JS, CSS, generated-output, and diff checks.

## 2026-08-31 Route Hierarchy Refinement

### Public Goal

Readers can distinguish card titles, supporting copy, metadata, and actions at pocket width without spending extra scroll on inflated internal spacing.

### Non-Goals

- No copy, DOM, interaction, or `data-spw-*` changes.
- Do not shrink Settings navigation below its 44px touch-target contract.
- Do not add a new type scale or route-specific duplicate when an existing component owns the pattern.

### Minimal Touch

- Shared reason cards: `public/css/components/cards.css`
- Shared wisdom cards: `public/css/components/semantic-resonance.css`
- Topic directory cards: `public/css/routes/surfaces/topics.css`
- Keep About timeline-specific sizing in `public/css/routes/surfaces/about.css`

### Validation

1. Pocket walks for Home, About, Topics, Play, and Settings
2. `node scripts/check-site.mjs && npm run check:runtime`
3. `git diff --check && npm run check:local`
