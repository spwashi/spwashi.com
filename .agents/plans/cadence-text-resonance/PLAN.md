# Plan: cadence-text-resonance

Extend visual theming to resonate with the site's editorial cadences (daily/weekly/cycle/streak) and make copy surfaces carry time-forward defaults for crawlers while exposing clean hooks for axiom variants. Wire text measurement helpers (starting with sizing-sensitive pretext physics) to runtime typography listeners so projections stay correct under settings changes.

## Public Goal
- Surfaces that already carry `data-spw-cadence` (promo cards, discovery notices) should feel rhythmically distinct in CSS (gradients, timing, weight, accent) without new JS.
- The home promo cycle (and similar) should ship the present-day copy in static HTML so crawlers and no-JS readers see accurate, non-dated text about releases and support rhythms.
- Text interpretation / measurement code must react when users change font scale or line spacing; this is the entry point for broader "copy resilience" helpers.

## Scope (minimal honest surfaces)
- JS: listener + refresh wiring in `public/js/semantic/pretext-physics.js` (the primary text-sizing-sensitive component). Frame-metrics left for later.
- CSS: additive `[data-spw-cadence]` rules in `promo-wonder-cycle.css` + `chrome.css`.
- HTML: richer static fallback copy inside the existing noscript block on home (with matching data attrs + comment documenting variant path).
- .spw: one light extension in `timing-data-localization.spw` for variant_text + reactive measurement invariant.
- Tracking: this plan dir + a tiny bridge note.

Out of scope: new JSON schema, full copy resolver, body-global cadence attr, media-publishing changes, any new packages or build steps.

## Files
[NEW] `.agents/plans/cadence-text-resonance/PLAN.md`
[NEW] `.agents/plans/cadence-text-resonance/cadence-text-interpretation.spw` (light bridge)
[MOD] `public/js/semantic/pretext-physics.js`
[MOD] `public/css/components/promo-wonder-cycle.css`
[MOD] `public/css/shell/chrome.css`
[MOD] `index.html`
[MOD] `.spw/philosophy/timing-data-localization.spw`

## Validation
- `git diff --check`
- `node --check` on edited JS
- `npm run check` (or the contract + CSS + route slices)
- Browser smoke: settings font scales + pretext surfaces update; home view-source shows the daily promo copy; discovery notices + promo cards show cadence-driven styles.

## Commit Hygiene
- Small, reviewable diffs.
- Preserve all existing copy strings and behavior for JS users.
- Rebase cadence before landing.

## Follow-ups (log here for next cycle)
- Shared `onTypographyChange` helper if duplication appears.
- Promote the static-default + data-spw-copy-alt pattern into a tiny kernel text interpreter.
- Pretext channel or preset keyed to cadence for deeper rhythm specialization.
- Attention/notification models can now key off cadence or live text metrics (see user's later note).

See the session plan at the Grok workspace for the full rationale and exact edit list.