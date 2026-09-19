# Mindful Collection Controls

## Goal

Make guide-badge collections easier to undo and easier to clear in bulk without turning collection into a sticky reward trap.

## Scope

- Keep collected state backward-compatible for ornament CSS.
- Store intention separately from boolean collected state.
- Make re-click release a collected badge quickly.
- Add local bulk controls in Settings for `clear_today` and `clear_all`.
- Keep spell working sets readable and restoreable without inline-style prototype code.
- Keep component-kind collection resettable through the same Settings persistence register rather than a parallel browser-memory path.

## Affected Files

- `public/js/interface/guide-badge.js`
- `public/js/runtime/spells.js`
- `public/css/spw-handles.css`
- `public/css/ornament/ornament.css`
- `settings/index.html`
- `.spw/conventions/ornament-contract.spw`
- `public/js/runtime/component-collection.js`
- `public/js/runtime/reward-ui.js`
- `public/js/kernel/site-settings-*.js`
- `public/css/components/floating-chrome.css`

## Active Extension - 2026-06-30 Component Collection Rewards

Component collection now persists distinct region component kinds under `spw-component-collection` and treats achievements as a browser-local memory register. The collection owner is `public/js/runtime/component-collection.js`; reward presentation is `public/js/runtime/reward-ui.js`; reset and visibility belong to the shared settings system.

- `rewardDisplay` is a canonical setting with `docked`, `toasts`, and `hidden` modes.
- Settings persistence includes a `component-collection` registry row that clears the collection through the collection API when mounted, or falls back to removing `spw-component-collection` and emitting `collection-updated`.
- The dock/settings collection panel exposes a clear action that calls `window.spwComponentCollection.reset(...)`.
- Page-region diversity remains an input signal only; persistent collection and achievements are owned by this mindful collection/runtime-settings seam.

## Validation

- `git diff --check`
- `node --check public/js/spw-guide-badge.js`
- `node --check public/js/spw-spells.js`
- `node --check public/js/runtime/component-collection.js`
- `node --check public/js/runtime/reward-ui.js`
- `node --check public/js/kernel/site-settings-engine.js`
- `node --check public/js/kernel/site-settings-profiles.js`
- `node --check public/js/interface/site-settings-ui.js`

## Lens changes should count — proposal, 2026-09-19

The collection ingests only `spw:regions-profiled` and `spw:regions-primed`; a lens change reveals a `data-spw-kind="lens"` panel but emits `frame:mode` and `spw:variant-selected`, which nothing in the reward path hears. So the interaction the user most often makes on a frame is one the site never rewards, and `lens-keen` is earned by scrolling past a lens panel rather than by using one.

Proposal (ends at a demo, since it changes what is felt):

- `component-collection.js` listens for `spw:variant-selected` with a `group` and ingests `{ kinds: ['lens'], route, reason: 'lens' }` once per group per session — a lens used, not a lens seen. `newKinds` stays honest: the first lens use on a route is the discovery.
- One new achievement, `seat-changer` ("Seat Changer"): `s.lensSeats >= 3` distinct `group:mode` seats sat in, tracked in the collection record beside `routes`. No new storage key; the record already persists under `spw-component-collection`.
- The reward toast for a lens use reads the seat expression the switch now carries (`about[kernel]{open.sit}`) rather than a label, so the reward is the notation.
- The cauldron already accepts fragments with an operator and a route; a sat seat is a fragment (`@lens`, the expression, the route). Offer it to the cauldron on the second use, not the first, so the first is a reward and the second is an ingredient.

Seams: `public/js/runtime/component-collection.js` (`ingest`, `ACHIEVEMENTS`), `public/js/runtime/reward-ui.js` (`onUnlock`, `popToast`), `public/js/semantic/cauldron/registers.js`, `interaction-microstates.spw#awareness` (never silent absorption). Gate: approve the toast and the cauldron offer in a browser first.
