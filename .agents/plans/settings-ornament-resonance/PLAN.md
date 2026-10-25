# Settings Ornament Resonance

**Status 2026-10-10.** The settings shelf landed (b2eda400) and replaced Quick Start: 53 boxes in eight aisles, each look's box worn in its own pack, and a "wearing now" window with the live readouts and the deviation register. This plan is now the settings umbrella; runtime-settings landed and was archived 2026-10-10. Next slice: a mock of guided or pivot-oriented ways to try a look, gated by the creator's pick in the browser (a random pick was ruled out as ambiguous). The shelf's words wait on the creator's copy-unit pass.

**Review sitting:** [ui-review-sitting-2026-10](../../../.spw/caches/ui-review-sitting-2026-10.spw) — settings.presets, seams.settings.

The pick is made live at `/settings/#presets`. Capture mode hides the state inspector and the section handle (`public/css/modes/capture.css:7-35`), so a still cannot show the satchel; the sitting's `settings-presets` recipe gives an after-still only. On `settings/index.html`, settings-theme-wiring row 4 lands first, then the presets.

**Related:** [runtime-settings](../archive/runtime-settings/PLAN.md) (absorbed 2026-10-10) · [settings-theme-wiring](../settings-theme-wiring/FIX.md) · [floating-chrome-stack](../floating-chrome-stack/FIX.md) · [chrome-navigation-wonder](../chrome-navigation-wonder/PLAN.md).

## Public Goal

Let a reader pick up a look, reading size, fix, kit, writing mode, motion level, view or instrument from the `/settings/` shelf, see the change on the box and in the "wearing now" window before scrolling away, and find the box they are wearing pressed.

## Non-Goals & Boundaries

- Reuse existing `data-site-setting-set` controls and ornament state attributes.
- Do not add a storage key, a new wonder type, or a new `data-spw-*` family.
- Do not alter field-memory decay, collection, or remove the detailed Settings form.

## Seams & Minimal Touch Files

- Route HTML: `settings/index.html` `#presets` holds the shelf: native `button` boxes with `data-site-setting-set`, aisle chips, and the "wearing now" window. The ids other pages link to (`#presets`, `#reader-builder-modes`, `#live-interaction-playground`) stay.
- Route CSS: `public/css/routes/surfaces/settings-shelf.css` (registered in `style.css` and the settings bundle); look specimens match `.spw-theme-specimen[data-spw-theme-pack]` in `public/css/themes/packs.css`.
- Runtime JS: `public/js/interface/site-settings-ui.js` calls `ensureThemePackStyles(undefined, { specimens: true })` when a `.spw-theme-specimen` is on the page, so every look's box wears its pack on the default look; boxes use the canonical trigger binding. The wonder-memory rail sync left with Quick Start.

## Absorbed 2026-10-10 — runtime-settings

[runtime-settings](../archive/runtime-settings/PLAN.md) landed: `/settings/`, the engine (`public/js/kernel/site-settings-engine.js`), `rewardDisplay`, and the `component-collection` persistence register. The rules still binding the umbrella:

- Settings stay local-only, with no account sync, and pages stay usable with JavaScript off.
- Unavailable storage must not crash the runtime; quiet and hidden modes must not remove a route's way back to `/settings/`.
- Clearing collections calls `window.spwComponentCollection.reset('settings-clear')` when present (`site-settings-engine.js:589-591`); only the registry fallback removes the storage key directly. `component-collection.js` owns the data model.

## Validation Steps

1. `node --check public/js/interface/site-settings-ui.js`
2. `npm run audit:module-selectors`
3. `git diff --check`
4. `npm run check:local -- --allow-dirty`

## The satchel as a site-nav synthesizer — proposal, 2026-09-19

**Owner 2026-10-10:** the satchel rebuild goes to [runtime-plane-consolidation](../runtime-plane-consolidation/PLAN.md), which absorbed `runtime-module-decomposition`; this section stays as the proposal and its sensation gate.

What landed: the satchel's seams and tags toggles are settings now (`debugMode`, `showSemanticMetadata`), owned by the engine and mirrored by the satchel. That removes the reason it read as decorative: a toggle that did not persist and that the next settings apply reset.

What is proposed, ending at a demo:

- **One register, three readers.** Settings (`/settings/`), ornaments (`ornament-contract.spw`: badge, collection, deviation), and the CSS token families the settings page already indexes (`#token-navigator`) are one register read at three altitudes. The satchel is the pocket altitude of that register, not a fourth surface.
- **Synthesizer, not inspector.** Replace the toggle list with a small patch bay: the four or five settings that change what a page *is* right now (lighting, type scale, semantic density, operator presentation, reward display), each a `data-site-setting-set` control the settings page already binds, each showing its current value and the deviation from default the engine already computes (`listDeviations`). Nav lives in the same bay: the frame navigator's current room and the two adjacent rooms, so the satchel is where you tune the page and where you move through it.
- **Tokens as the readout.** Each control shows the token it drives (`--site-root-font-size`, `--spw-operator-saturation`, …) the way the token navigator does, so the satchel is the live end of that index.
- **Snapshot and copy stay.** `copy page Spw` is the satchel's best feature; it stays as the bay's output jack.
- **Kill the drag.** Corner snapping and drag state are most of `state-inspector.js` (1,281 lines on 2026-10-10); a bay that lives in the bottom lane with the section handle needs neither.

Seams: `public/js/interface/state-inspector.js` (rename to `state-satchel.js` per `runtime-module-decomposition` Phase 1.4 when it is rebuilt), `public/js/kernel/site-settings-engine.js` (`listDeviations`, `saveSiteSettings`, `data-site-setting-set` binding), `public/js/runtime/navigation/frame-navigator.js` (rooms), `settings/index.html#token-navigator` (token families), `floating-chrome-coherence.spw`. No new `data-spw-*` family: the bay is `[data-spw-chrome-role="state-inspector"]` with settings controls inside it.

Gate: sensation. Build the bay on `/settings/` first as an authored specimen (no floating chrome), approve it there, then mount it as the satchel.

## Summoned satchel — demo, 2026-09-28
The open satchel on a phone was 1,235px wide (min-inline-size: max-content followed the launcher's one-line mirror); open, it now takes its insets and every control reads (d0244132). Behind `?spw-satchel=rail`: the satchel leaves the screen until summoned by the rail's `$` or a swipe up on the rail (`state-inspector:summon`). Gate: sensation, in the creator's hand. Open: resonance with the region the rail names (the bay above showing that region's settings and kin), saved placement of inspect and navigation elements, and whether the bay replaces the launcher outright; the rendering-model and component-abstraction refactor this implies routes through `runtime-module-decomposition` (satchel rebuild, Phase 1.4).
