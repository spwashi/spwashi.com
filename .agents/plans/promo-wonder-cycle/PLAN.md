# Promo / Wonder Cycle Plan

**Status 2026-11-06.** The rotating layer (603f18d8, typed in ccafd1ac) and the intent-picked toast (1a61dc53) stand. Since 2026-10-10 the feed and its typed module changed only to name closes (efcd875d, eff5abfd). Closes fall on the 13th and the 26th (`releaseCycleForDate`): October 13 has receipts (efcd875d), October 26 has none (3421dc34 says so on Home and `/now/`), and the next is November 13. One slice is open, P1, the shown / accepted / closed counter, and it waits on the creator's look at the 1a61dc53 demo (`wonder_promo_wonder_cycle_notice_demo`). [ecosystem-offer-2026-10](../archive/ecosystem-offer-2026-10/PLAN.md) archived 2026-11-06, and its two open questions (prices as shipped, the film backer) now live here (see "Absorbed 2026-11-06").

**Related:** [ecosystem-offer-2026-10](../archive/ecosystem-offer-2026-10/PLAN.md) (archived 2026-11-06) · [discovery-powerups](../archive/discovery-powerups/PLAN.md) (archived). **Absorbed 2026-10-06:** [cadence-text-resonance](../archive/cadence-text-resonance/PLAN.md) · [release-day-discovery-2026-09-26](../archive/release-day-discovery-2026-09-26/PLAN.md) · [release-day-resonance-2026-09-13](../archive/release-day-resonance-2026-09-13/PLAN.md) · [rpg-playable-copy](../archive/rpg-playable-copy/PLAN.md).

## Public Goal
Create site structures that can change by day and by week, with separate lanes for:
- **promo**: conversion-facing highlights, CTA cards, services, work samples, and contact nudges
- **wonder**: atmospheric, exploratory, lore-adjacent, or curiosity-building surfaces

The site should be able to serve those structures from local HTML first, then optionally hydrate them from a JSON feed.

## Intended Model
- **Promo structures** are concrete, low-friction, and action-oriented.
- **Wonder structures** are ambient, adjacent, and imagination-oriented.
- **Day structures** change fast and should be easy to override.
- **Week structures** change more slowly and can carry larger themes.
- JSON should be optional, not mandatory. Static markup remains the fallback.

## Settled in code (603f18d8, ccafd1ac)
- One feed file, `public/data/promo-wonder-cycle.json` (`daily`, `weekly`, `cycle`, with `sourceLocale` and `localization`).
- The reader's local date: `pickDaily` takes the weekday, `pickWeekly` the week index from `feed-utils.js`, so a date always picks the same entries.
- Closes on the 13th (A-cycle) and the 26th (B-cycle); `upcomingReleaseForecasts` names the next two.
- When the feed fails, `DEFAULT_FEED` fills in, and the host's authored HTML is what a reader without scripts sees.
- One host rotates today: `[data-promo-wonder-cycle]` on Home. Which other surfaces may rotate stays a per-page call.

## Constraints
- Keep the static site usable without JavaScript.
- Do not make the homepage dependent on the feed.
- Do not replace the existing logo or core navigation contract.
- Avoid a generic CMS model; this should stay legible as Spwashi site structure.

## Notice attention

The creator's 2026-09-18 critique of the daily wonder (no closure or way back, one CTA shape, little relevance to what a page can do, module-load prompts as noise) is answered in `.spw/caches/notice-attention-refinement-2026-09.spw`: a close control that returns focus to main, three CTA shapes by destination (`data-spw-cta-shape` here | there | out), and one "On this page" card. 1a61dc53 added relevance and the no-modal rule: each feed entry names the intents it serves, `kernel/visit-intent.js` holds the visit's intent, and `interface/discovery-notices.js` picks one entry and speaks only from a resting seat (`restingSeatDecision`: the page's end in view, 1.4 s after the last scroll, 12 s into the visit), as a toast.

**P1. The counter.** `discovery-notices.js` records dismissals (`dismissNotice`) and counts nothing. Count each notice shown, accepted or closed, per cadence (daily, weekly, cycle), on the device only, beside the dismissals it already keeps. Touches `public/js/interface/discovery-notices.js`. Gate: the creator approves the 1a61dc53 demo on a phone. Verify: `node --check`, `npm run test:modules`, and three visits in a browser that move each count once. A here-shaped promo preferred where the current route offers the capability follows the counter, so its effect can be read.

## Validation
- Day and week selection is deterministic for a given date.
- The static fallback renders without the feed.
- Route copy reads cleanly for human visitors. Promo and wonder sentences on landings belong to person-magazine and design-surface; do not invent whimsy. Shop-talk and unkeyed first-fold fails: `.spw/caches/copy-hypermedia-key-2026-09.spw`.
- `git diff --check`, and `node --check` for any edited JS module.

## Out of Scope
- Authentication
- Admin UI
- A full CMS
- Remote editing workflows
- Replacing the current site topology

## Release-day receipts

Each release close was its own one-day plan until 2026-10-06; the receipts live here.

- 2026-09-13, A-cycle close on Home and `/now/`: [release-day-resonance](../archive/release-day-resonance-2026-09-13/PLAN.md), landed in `98821df8` and `52508d6e`, follow-ups `a0ed3849` and `0a93f6ab`.
- 2026-09-26, the release as an invitation to explore: [release-day-discovery](../archive/release-day-discovery-2026-09-26/PLAN.md), landed in `c8b35417`; `/now/` holds the receipts.
- 2026-10-13, the A-cycle close with its receipts: `efcd875d`, which pointed Home at October 26.
- 2026-10-26, the B-cycle close: no receipts written. Home and `/now/` named it (eff5abfd) and then named the rule instead (3421dc34).
- Next: 2026-11-13.

Proposed, for the creator's copy: `/now/` keeps the closes as a ledger played straight, one row for every 13th and 26th, and a close that passed without receipts says "no receipts filed" in its row rather than leaving a gap. The rule then teaches itself: a reader sees the cadence in the dates, and the missing receipt is a fact on the record, not a hole in the page.

## Absorbed 2026-11-06 — ecosystem-offer-2026-10

The season's offer copy landed 2026-09-28 (9a465ef4) across `/about/`, `/services/`, `/now/` and the topic shelves, with the granular prices in the `/services/` bundle composer (b5bf993c). October closed and the plan archived by its own rule. Its two open questions now live in this plan's `index.spw` under their old names:

- `#>wonder_ecosystem_offer_prices`: whether the 28 composer figures stand as the creator's. Prices are the creator's call.
- `#>wonder_ecosystem_offer_film_backer`: what a film backer receives. The only words on record are the `/cards/#back-the-film` card (0a764fce), which promises nothing.

Rules worth keeping: every proof card points to evidence and a next action (from funding-proof-cards); financial and sponsorship wording waits on the creator's confirmation; copy leads with Spwashi, and the legal name appears only on `/about/sam-washington/` in copy the creator writes or approves; the high-school play title stays out of copy until the creator supplies it. Source: [ecosystem-offer-2026-10](../archive/ecosystem-offer-2026-10/PLAN.md).
