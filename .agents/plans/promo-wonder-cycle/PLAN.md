# Promo / Wonder Cycle Plan

## Public Goal
Create site structures that can change by day and by week, with separate lanes for:
- **promo**: conversion-facing highlights, CTA cards, services, work samples, and contact nudges
- **wonder**: atmospheric, exploratory, lore-adjacent, or curiosity-building surfaces

The site should be able to serve those structures from local HTML first, then optionally hydrate them from a JSON feed.

## Why This Exists
The current site already has rich route surfaces, but the rotating layer is not yet formalized. This plan separates the concerns so future updates can:
- swap promo content on a schedule without rewriting the whole page
- vary wonder content more slowly or more experimentally
- let an external or local JSON feed populate the same shell
- keep the vocabulary understandable to other developers

## Intended Model
- **Promo structures** are concrete, low-friction, and action-oriented.
- **Wonder structures** are ambient, adjacent, and imagination-oriented.
- **Day structures** change fast and should be easy to override.
- **Week structures** change more slowly and can carry larger themes.
- JSON should be optional, not mandatory. Static markup remains the fallback.

## Likely Surfaces
- `index.html` and other high-traffic route HTML
- shared JS that selects the active structure by date
- shared CSS for promo/wonder region treatment
- `.spw` surfaces describing the structure taxonomy and feed contract
- planning notes for any route that becomes a template for rotating content

## Questions to Resolve in Implementation
- Should the feed be one file or two, e.g. `promo.json` and `wonder.json`?
- Should the selector use local time, UTC, or a site-configured timezone?
- Should day/week selection be deterministic by date, by route, or both?
- Which surfaces are allowed to rotate, and which must stay stable?
- What is the fallback when JSON fails to load?

## Constraints
- Keep the static site usable without JavaScript.
- Do not make the homepage dependent on the feed.
- Do not replace the existing logo or core navigation contract.
- Avoid a generic CMS model; this should stay legible as Spwashi site structure.

## Validation
- Confirm day/week selection is deterministic for a given date.
- Confirm static fallback renders without the feed.
- Confirm route copy still reads cleanly for human visitors.
- Run `git diff --check` after edits.
- Run `node --check` for any edited JS modules.

## Out of Scope
- Authentication
- Admin UI
- A full CMS
- Remote editing workflows
- Replacing the current site topology

