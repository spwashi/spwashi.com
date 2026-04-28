# Funding Proof Cards Conversion Pass

## Public Goal

Turn the site from a broad atlas into a clearer funding, coordination, membership, research, and record-making surface without changing the underlying design system.

## Likely Files

- `index.html` for the practical homepage conversion block and CTA route links.
- `services/index.html` for funding, cards, and membership links while preserving current pricing.
- `now/index.html` for current sprint funding targets and support ladder.
- `cards/index.html` for Local Proof Cards and card-type copy.
- `membership/index.html` for membership levels and participation roles.
- `research/index.html` for practical research categories and wisdom ladder.
- `coordination/index.html` for group roles, operating rhythm, and project output rules.

## Constraints

- Keep pages readable without JavaScript.
- Do not introduce wallets, authentication, blockchain logic, or payment plumbing.
- Preserve existing Services pricing and configurator/card infrastructure.
- Use existing `site-frame`, `frame-grid`, `frame-panel`, `operator-chip`, `spec-pill`, and semantic `data-spw-*` conventions.

## Validation

- Run `git diff --check`.
- Run `npm run check` if route edits are broad enough to affect site contracts.
- Use `rg` checks for new route links and canonical URLs.

## Out of Scope

- Real payment integration.
- Persistent card archive storage.
- Generated images or new visual asset work.
- Full navigation template refactor.
