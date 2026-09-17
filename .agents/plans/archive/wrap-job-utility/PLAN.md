# Wrap Job Utility

## Public Goal
A visitor can scan wrap jobs as handles: sit a lens to change the room, travel a frame to move, enter a scene or follow a probe to learn more.

## Fixity Tier
Stable wrap contract. Extend existing `[ ]` / `{ }` / `( )` / `?` physics. Do not invent a new attribute family.

## Non-Goals
- New keyboard chords or a help overlay
- Gamified progress
- Mass-rewriting every hook-invitation on the site
- New `data-spw-wrap-*` attributes

## Seams
- Route HTML: public-spine hook invitations become `data-spw-feature="wrap-jobs"`
- Shared JS: `spw-compose.js`, `spw-key-events.js`, `attention/section-handle.js`
- Shared CSS: `systems/spw-key-events.css` plus home density override
- Contract: `.spw/conventions/operator-site-projection.spw`

## Jobs
| Wrap | Job | Value |
| `[seat]` | sit | change display |
| `{rooms}` | travel | navigate / scan |
| `(look)` | enter | learn more |
| `?probe` | inspect | learn more (route link) |

No-JS fallbacks stay ordinary hash or route links.

## Follow-up (copy + search)
- Wrap-job chips carry exclusive copy variants: entry / normal / technical.
- Inspect jobs search a partial expression (`?[reading]` → `/topics/search/?q=[reading]`).
- Site search scores harvested `data-spw-semantic-expression` values by slot (`subject`, `[mode]`, `{parts}`, `<projection>`), including unclosed fragments (`home[`, `{kin`).
- Keyboard-only hook invitations with a nearby mode seat upgrade to wrap-jobs at runtime.
- Wrap bodies stay one ground: `{open.sit}` is a seat queue; `{travel}`, `{stage}`, `{kin}`, `{rail}` are single members. Do not join sibling verbs (`ask.see`, `prev.next`) or sibling rooms (`patron.software.art`).
- Search results deep-link to an expression host id when one is harvested, and the matched expression refines the query.

## Validation
1. `node --check` edited JS
2. wrap-physics + expression-query tests
3. `npm run search:index` after harvest changes
4. `npm run check:local`
