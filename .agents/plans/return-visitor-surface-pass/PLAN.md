# Plan: return-visitor-surface-pass

## Goal

Refresh the main hub routes so they reward repeat visitors instead of re-explaining the site from zero every time. The public outcome should be more movement, more reasons to revisit, and more layout/component variety across the top-level surfaces.

## Scope

- In scope: home, topics, services, play, and about hub copy/layout updates; one shared reusable return-visitor component family in shared CSS; selective social-image diversification where a hub still points at a generic card.
- Out of scope: route-by-route copy rewrites for every leaf page, runtime behavior changes, and the later CSS bleed review from the screenshots.

## Files

- `index.html`
- `topics/index.html`
- `services/index.html`
- `play/index.html`
- `about/index.html`
- `public/css/spw-surfaces.css`

## Strategy

1. Add a shared section grammar for “returning visitor” prompts, drift notes, and reasons-to-wonder cards.
2. Use it differently on each hub so the pages stop repeating the same hero-plus-card-grid rhythm.
3. Tighten hero copy so it assumes prior exposure and invites a changed entry point instead of a fixed onboarding funnel.

## Validation

- `git diff --check`
- targeted `rg` checks for new ids/classes and updated image refs
- sanity-check surrounding markup for balanced tags and route flow
