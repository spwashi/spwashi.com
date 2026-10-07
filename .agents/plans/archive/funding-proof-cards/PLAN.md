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

## 2026 Funding/Services + Self-Imagination Tools Tranche (Cross-Ref)
This tranche (see central expressive-layout-tropes-fidget-manuscript/PLAN.md "Funding, Services, Budgeting & Character Card UX" section) extends the funding surface vision into **playful self-preparation instruments**:

- Budgeting ("Savings Regimen") and Character Sheet tools are positioned as low-friction, optional-process on-ramps that help visitors develop the personality, theme, and character context of the work *before* they reach a services ask or proof card.
- Copy and component improvements emphasize "funding your own becoming" and "self-imagination as the most durable commissioning prep".
- Cauldron becomes the explicit optional-process/memory hub: budget insights and character pressures prime as richer, traceable ingredients (with origin, wonder, gesture trace) so later spells carry personal developmental narrative.
- Grounding/trace channels (trope marks, bus emissions, vocabulary resonance, richer cauldron meta) let powerusers inspect "what changed in my capacity or character posture" and wonder about variants — exactly the inspectable, learnable structures that make the funding surface more than a price list.
- No new payment plumbing or rules; everything remains local-first, progressive, context-sensitive, and aligned with the original constraints (preserve configurator/card infrastructure, use existing Spw semantics).

Cross-references:
- profile-character-card-development/PLAN.md (shared card substrate now explicitly serves funding/self-imagination loops)
- expressive-layout-tropes-fidget-manuscript/PLAN.md (full current directive + execution notes)
- services/index.html, tools/budgeting/*, tools/character-sheet/* for concrete surfaces

This keeps the funding-proof-cards intent alive while evolving the surface from "register of offerings" into "catalytic environment for the creator who will use the offering."
