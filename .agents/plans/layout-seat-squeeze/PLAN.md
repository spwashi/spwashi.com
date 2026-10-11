# Layout Seat Squeeze

**Status 2026-10-10.** The seat and squeeze invariants are settled, including the CLS fixes 53717ed7 and a740b10d. This is now the single layout owner, with three queues: held CLS items (below), edges, and seat coverage (both under Absorbed 2026-10-10). Next: the edges queue's shared inset for `#home-entry-panels`. It is gated by an `npm run qa:alignment` reading before and after, plus a phone still for the creator's look. The lens hook nav wrap stays held because it is intermittent and was not reproduced on 2026-10-06.

**Related:** [landing-visual-hierarchy](../landing-visual-hierarchy/PLAN.md). **Absorbed 2026-10-10:** [alignment-content-fit](../archive/alignment-content-fit/PLAN.md) · [region-attenuation-coverage](../archive/region-attenuation-coverage/PLAN.md). **Absorbed 2026-10-06:** [card-grid-density-audit](../archive/card-grid-density-audit/PLAN.md) · [content-responsive-layout](../archive/content-responsive-layout/PLAN.md) · [context-sensitive-variants-and-agent-qa](../archive/context-sensitive-variants-and-agent-qa/PLAN.md) · [page-frame-sizing](../archive/page-frame-sizing/PLAN.md).

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

`public/js/runtime/regions/region-kin.js` classifies similar / contrast / resonate from seat, operator, wonder, and expression subject. Moves are `~` potential, `&` subject, `#` vibration — not `?`. Tap travels, hold previews, swipe cycles. Labels expand by width. `npm run manifest:expressions` remains the workbench parse step.

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

## 2026-09-12 Device Fit Defaults

- Evidence: headless sweep of 12 routes at pocket/fold/broadsheet (layout-shift entries with sources, lone-last-row grids, overflow). Pocket CLS was 0.32 home, 0.57 settings, 0.25 design — all from the header booting two rows tall. Fold grids stranded one member across eight routes.
- Boot seat: pre-init pocket header reserves `"sigil toggle"`; the route indicator waits wherever the toggle shows before init. `section-context.css`.
- Set count: three/four/six-member sets cap columns by count and switch on the grid's own inline size. `layout-squeeze.css`, before the narrow-host drop.
- Topline descriptors: `whimsy.css` no longer re-seats `.spec-pill` as inline-block; non-focusable topline pills take the compact handle floor. `sigils-and-chips.css`.
- Spw: `.spw/caches/component-fit-lens-journey-2026-09.spw#flj-007`, `#flj-008`.
- Held: 5/7/8-member sets; `.header-surface` 6px settle shift at broadsheet (~0.008); JS-off pocket nav is `display:none` under the coarse query (pre-existing, not touched).

## 2026-10-06 Container fold and late chrome

- Evidence: home (broadsheet, dev, foreground tab) shifted 22px about 15s after every load (CLS 0.307). The cause was component semantics classing header actions as components, which gave them `container-type: inline-size` and route-state padding. Fixed by `isInsideShellChrome` (`kernel/dom-contracts.js`) at the four writers, plus the header exclusion in `foundation.css`. 53717ed7.
- Same class, other seat: a start-aligned container in a card column folded to its border (folios: six cards about 2px wide). The card-column stretch rule in `foundation.css` fixes it. a740b10d. A sweep found no collapsed or overflowing element on /, /about/, /topics/, /services/, /now/, /projects/, /recipes/, /play/rpg-wednesday/ or /topics/software/spw/.
- Now: home totals about 0.005. The header settles 4px at about 1.1s, and the badge and search action grow 6px at about 3s as the chrome floor arrives.
- Held: the lens hook nav sometimes wraps (about 0.05, variable timing, chips gain about 3px); not seen on the 2026-10-06 load. Font swap is about 0.010; every face is `display: swap` with no metric overrides. A fallback `size-adjust` tuned for Georgia would be wrong where the fallback is Noto Serif, and preloading the 129 KiB Newsreader on every page competes with core CSS, so neither shipped.

## Absorbed 2026-10-10 — alignment-content-fit

The edges queue. Plan: [alignment-content-fit](../archive/alignment-content-fit/PLAN.md). Brochure fit landed in 6b93a85a, and its sensor is `npm run qa:alignment` (`scripts/alignment-audit.mjs`).

- Rules kept: the main shell padding is the one public left/right datum, so route CSS adds no second gutter. Route CSS may change `align-items` and `gap` on `.frame-topline` and `.frame-heading`, never `flex-direction`. Inline highlights bleeding into frame padding are accepted and excluded from clipped-overflow triage.
- Next: one shared inset token for `#home-entry-panels` (`index.html:768`). At pocket width on 2026-09-17, its six panels had content edges at 44/44/44/44/47/44.
- Then, from the same 2026-09-17 reading: the promo-wonder-cycle cards (4.5px spread), the returner grid (2px), and `#choose-your-entrance` (`index.html:460`) role hooks against the depth disclosure (6px). After that, settings at pocket width (153 near-flush edges in 36 sites).
- Validation: `qa:alignment` before and after, and a phone still.

## Absorbed 2026-10-10 — region-attenuation-coverage

The seat-coverage queue. Plan: [region-attenuation-coverage](../archive/region-attenuation-coverage/PLAN.md). On 2026-10-10 a regex count found 618 of 1,025 `.spw-frame` elements in 212 HTML files with no seat and no `entry-spine`/`reading` role alias. That is 60%, the same share as the 2026-09-06 count of 487 of 816. Most unseated, per route: `about/website/`, `play/rpg-wednesday/` and `topics/software/spw/` (15 each), `design/` (14), then `town/` and `topics/knowledge-bases/` (10 each). Wave 1 (`design/folios/`) is the reference.

- Wave 0: `scripts/spw-region-coverage-audit.mjs` and `audit:region-coverage` do not exist yet. They are report-only and sit beside `audit:region-seats`, never as a `check:local` gate.
- Each wave covers one route. Read every unseated frame, then either seat it, record it as deliberately regionless, or give it a `data-spw-region-role` companion. No bulk fill, no seventh seat, no retuning of `--spw-wonder-hold`.
- Validation per wave: a seat repaints the frame (wash, seam and the dashed cluster border; `systems/region-seats.css:48-66`), so each wave carries a phone still of the route before and after, alongside `node scripts/spw-region-seat-audit.mjs`, `npm run component:check` and `npm run check:local`.
- Question for the creator: `#>wonder_layout_seat_squeeze_unseated_default` in `wip.spw`.
