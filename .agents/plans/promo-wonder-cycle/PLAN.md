# Promo / Wonder Cycle Plan

**Status 2026-11-06.** The rotating layer (603f18d8, typed in ccafd1ac) and the intent-picked toast (1a61dc53) stand. Since 2026-10-10 the feed and its typed module changed only to name closes (efcd875d, eff5abfd). Closes fall on the 13th and the 26th (`releaseCycleForDate` in `public/ts/promo-wonder-cycle.ts`): October 13 has receipts (efcd875d). On 2026-11-08 the next close named on Home and `/now/` is November 13, and October 26 is a receipt there. `upcomingReleaseForecasts` lists the next two future closes, so on that date it names November 13 and November 26, while the static timeline on Home still shows October 26 beside the selected November 13. That split is the grain ([lore-land-plans.spw](../ecosystem-architecture/lore-land-plans.spw)). One slice is open, P1, the shown / accepted / closed counter, and it waits on the creator's look at the 1a61dc53 demo (`wonder_promo_wonder_cycle_notice_demo`). [ecosystem-offer-2026-10](../archive/ecosystem-offer-2026-10/PLAN.md) archived 2026-11-06, and its two questions came here; the creator answered both on 2026-11-06 with layers (anchors, media, conversation), and two paths, one for a reader watching and unsure and one ready to decide, are slices L1 to L5 under "Pricing in layers".

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

## Pricing in layers — 2026-11-06

The creator, answering the open price questions: pricing is answered with layers. TikTok gifts can be a medium for exchange; more specific business development happens through conversation; transparency is valuable, and pricing anchors need to be tangible enough. The specifics matter less: the value and the flow of creation depend on how we work together, what has already been made, and where the show's momentum is. Then: exercise discernment, motivate both an apprehensive audience on TikTok and a more decisive small-business owner, with paths that leave room to wonder about dimension. The Enigma concept on TikTok was first offered as a pricing anchor; a note the creator pasted the same day settled that it is not one (`#>wonder_promo_wonder_cycle_enigma_anchor`). Enigma is a TikTok LIVE anonymity mode: for a stretch of time a viewer's name, profile, gift bubble and entrance are masked, and their comments show only to the host, moderators and other Enigmas. The note reports the unlock at about 13,000 coins for seven days, paid to TikTok for the mask; gifts sent while masked are a separate payment and reach the creator as ordinary gifts. It anchors no sandwich, proof card or live gift, and it stays off the support ladder. If it ever appears in copy, one sentence is enough: an Enigma is someone who paid TikTok to send gifts without the room seeing their name.

**The three layers, and what already stands for each.**

- **Anchors**, transparent and picturable. A figure anchors when it names a thing: `$10` a sandwich on a long build day, `$20` lunch or a quick question answered, `$50` a full day, `$75` one fix shipped, `$250` a screenshot-ready proof card, `$500` a scope note, `$750` a session and memo, `$225/hr`. A range that names no thing does not anchor: Creator Work `$600–$12,000+` spans twenty times, Systems Sprint `$5,000–$12,000+`, Ecosystem Routing `free–$500+`, Render Season `$5,000+` (read 2026-11-06 from `services/index.html` Pricing and Render Queue; the composer's 28 `data-min` figures run from 20 to 12,000, median 600).
- **Media**, the forms an exchange can take: a Heart Me or a gift during a TikTok live (already said on `/services/#support` and `/now/`'s support ladder), tips, a gifted SuperGrok or Midjourney year, Patreon as the steady version. Dregg stays a medium the creator makes work in, not a way to pay.
- **Conversation**, for everything specific: Custom & Hybrid Quotes already promises an honest scope and a number or range, and `/cards/#back-the-film` already says "we agree on what fits". A wide range should read as where a conversation starts, not as a quote.

**Two paths, written to intent rather than identity** (copy-audience principle). Each shows where a step lands before it is taken, names the dimension it opens, and keeps a way back.

1. **Watching and unsure** (the creator's example: an apprehensive viewer on TikTok). The first step is what they already hold, a gift during a live, with one anchor they can picture beside it (a sandwich on a long build day). Where it lands: the close on the 13th or the 26th says what the period's support became (a day of build, a scanned folio, a scene for the film), in aggregate and never by giver, which also keeps faith with anyone who paid for an Enigma's mask. That close ledger is P2's proposal and the October 26 close had no receipts, so this path waits on the ledger; do not promise a receipt the site does not keep. No countdowns and no scarcity: an apprehensive reader is motivated by seeing that small things land, not by pressure.
2. **Ready to decide** (the creator's example: a small-business owner). The first step is one number and one door: the Scope Card (`$250` proof card, `$500` scope note, `$750` session and memo), then a custom quote. Where it lands: the proof artifacts (architecture memo, QA checklist, series home, a running product) show the dimensions a scope can grow into, and the composer lets a reader combine them as a sketch, not a quote. Discernment: `/services/` has seventeen sections and three priced surfaces before the conversation door; a decisive reader needs one first number near the top, not the whole ladder.

**Slices.**

- **L1 — Anchor read.** Done above; the census is the next check whenever a figure changes.
- **L2 — scenes, 2026-11-06.** The one-line version (ee07e7c4) named the layers. The creator then asked for paths a person can imagine, so each surface now says what you leave holding. `/services/#conversion-paths` is "What You Leave With": a gift shows on the live and the public work comes back on Now; a Scope Card is a card, a note, or a call and memo; a card is something you screenshot and send; membership is a role you can name; an introduction is the ecosystem door. The same scenes are on `/now/`'s ladder and How To Help, and on `/services/#pricing` and `#support`. `$250` stays off the Now ladder. Enigma stays off both.
- **L3 — The decisive path.** One first number and one door near the top of `/services/`, with the proof artifacts as the dimensions it opens. Placement is [landing-visual-hierarchy](../landing-visual-hierarchy/PLAN.md)'s Services parcel; gate: the creator's look. The Scope Card sentence now sits in the pricing lede and in What You Leave With; the top of the page is still the seventeen-section walk.
- **L4 — The watcher's scene, without the ledger.** The gift, the sandwich, and the day are on the Now ladder. What comes back is named as the public work on that page. The close ledger is still unwritten, so the copy does not promise a receipt on the 13th or the 26th. Gate for the ledger line: the ledger.
- **L5 — retired 2026-11-06.** The wide ranges stay as they are. The pricing lede says anything larger is set in conversation.

## Absorbed 2026-11-06 — ecosystem-offer-2026-10

The season's offer copy landed 2026-09-28 (9a465ef4) across `/about/`, `/services/`, `/now/` and the topic shelves, with the granular prices in the `/services/` bundle composer (b5bf993c). October closed and the plan archived by its own rule. Its two open questions now live in this plan's `index.spw` under their old names:

- `#>wonder_ecosystem_offer_prices`: answered 2026-11-06 with layers (see "Pricing in layers").
- `#>wonder_ecosystem_offer_film_backer`: answered 2026-11-06: what a backer receives is set in conversation, as the `/cards/#back-the-film` card (0a764fce) already says.

Rules worth keeping: every proof card points to evidence and a next action (from funding-proof-cards); financial and sponsorship wording waits on the creator's confirmation; copy leads with Spwashi, and the legal name appears only on `/about/sam-washington/` in copy the creator writes or approves; the high-school play title stays out of copy until the creator supplies it. Source: [ecosystem-offer-2026-10](../archive/ecosystem-offer-2026-10/PLAN.md).
