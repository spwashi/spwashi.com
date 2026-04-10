# Plan: lore-land-marketing

Strengthen the site's internal marketing for lore.land without turning the homepage into a promo wall, and make the route/home previews shareable enough to send directly to other people.

## Goal

The site should make `lore.land` feel like a current, important destination rather than a stray external link buried in a register. The end state is a tighter internal path: the homepage signal surfaces should point toward lore.land, the about surface should name it more vividly, the lore.land explainer route should sell the destination with enough specificity that a reader has a reason to click through, and the homepage/lore-land links should resolve to beautiful social cards when shared. Taste note: improve clarity and expressiveness while preserving the site's calm, hand-authored editorial rhythm.

## Scope

- In scope: homepage signal/register copy, `public/data/media-focus.json`, about surface narrative framing, the `about/domains/lore.land/` explainer page, minimal supporting CSS needed for lore-land visual staging, selected papergami/raw Midjourney studies that clearly earn lore-land or social-card roles, and route-specific social-share metadata/cards for `/` and `/about/domains/lore.land/`.
- Out of scope: redesigning the full site palette, analytics changes, or a broad campaign across every domain page.

## Files

[NEW] `.agents/plans/lore-land-marketing/PLAN.md`
[NEW] `.agents/plans/lore-land-marketing/wip.spw`
[MOD] `index.html` - raise lore.land inside the homepage artifact and/or signal surfaces
[MOD] `about/index.html` - sharpen the narrative-surfaces framing for lore.land
[MOD] `about/domains/lore.land/index.html` - make the lore.land explainer route feel like a destination
[MOD] `public/data/media-focus.json` - set editorial focus and featured-page treatment for lore.land
[MOD] `public/css/style.css` - keep lore-land visual staging contained and responsive
[MOD] `public/images/assets/illustrations/` - place share cards and lore-land visual derivatives

Craft guard:
- `public/css/style.css` is already large; only add tightly scoped classes for lore-land staging or supporting layout.
- Keep the marketing pass route-true: every surfaced card must offer a useful next step, not empty promotion.
- Fold the papergami render intake into this pass only where it earns a clear role: lore-land staging, homepage social card, or route preview card.

## Commits

1. `#[lore] - raise lore.land across home and about signals`

The canonical running version lives in `wip.spw`.

## Agentic Hygiene

- Rebase target: `main@3296ac01bb2dccb94b42938ef2517038fd2c4482`
- Rebase cadence: before commit 1, before merge
- Hygiene split: the worktree already carried unrelated blog/craft/PWA/image-intake drift; the final authored snapshot may commit the broader session, but lore-land work still needs to remain route-true and well-contained

## Dependencies

none

## Failure Modes

- Hard: the homepage starts reading like campaign copy instead of useful orientation.
- Soft: lore.land is surfaced more often but still sounds vague, so the added marketing does not increase curiosity.
- Soft: social cards look generically decorative instead of signaling books, texture, or readable structure.
- Non-negotiable: the site must remain readable static HTML with truthful links and no new runtime dependency.

## Validation

- Hypotheses: a first-time reader can spot lore.land as a live narrative destination from the homepage or about surface without hunting through external links.
- Negative controls: existing software/play/craft routes remain legible and are not displaced by lore-land promotion.
- Demo sequence: `/`, `/about`, `/about/domains/lore.land/`, `/about/website/`.

## Spw Artifact

None beyond `wip.spw`; this is a route-and-register editorial pass rather than a new protocol.
