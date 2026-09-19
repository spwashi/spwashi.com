# Settings Ornament Resonance

## Public Goal

Let a reader make immediate lighting, theme, type-scale, flourish, and memory choices from the Settings quick start, with visible comparisons and accessible pressed states.

## Non-Goals & Boundaries

- Reuse existing `data-site-setting-set` controls and ornament state attributes.
- Do not add a storage key, a new wonder type, or a new `data-spw-*` family.
- Do not alter field-memory decay, collection, or remove the detailed Settings form.

## Seams & Minimal Touch Files

- Route HTML: `settings/index.html` adds direct native-button controls with full labels.
- Route CSS: `public/css/routes/surfaces/settings-forms.css` makes compact scales compare safely in horizontal and vertical space.
- Runtime JS: `public/js/interface/site-settings-ui.js` projects saved wonder-memory state into the existing ornament vocabulary; all other controls use the canonical trigger binding.

## Validation Steps

1. `node --check public/js/interface/site-settings-ui.js`
2. `npm run audit:module-selectors`
3. `git diff --check`
4. `npm run check:local -- --allow-dirty`

## The satchel as a site-nav synthesizer — proposal, 2026-09-19

What landed: the satchel's seams and tags toggles are settings now (`debugMode`, `showSemanticMetadata`), owned by the engine and mirrored by the satchel. That removes the reason it read as decorative: a toggle that did not persist and that the next settings apply reset.

What is proposed, ending at a demo:

- **One register, three readers.** Settings (`/settings/`), ornaments (`ornament-contract.spw`: badge, collection, deviation), and the CSS token families the settings page already indexes (`#token-navigator`) are one register read at three altitudes. The satchel is the pocket altitude of that register, not a fourth surface.
- **Synthesizer, not inspector.** Replace the toggle list with a small patch bay: the four or five settings that change what a page *is* right now (lighting, type scale, semantic density, operator presentation, reward display), each a `data-site-setting-set` control the settings page already binds, each showing its current value and the deviation from default the engine already computes (`listDeviations`). Nav lives in the same bay: the frame navigator's current room and the two adjacent rooms, so the satchel is where you tune the page and where you move through it.
- **Tokens as the readout.** Each control shows the token it drives (`--site-root-font-size`, `--spw-operator-saturation`, …) the way the token navigator does, so the satchel is the live end of that index.
- **Snapshot and copy stay.** `copy page Spw` is the satchel's best feature; it stays as the bay's output jack.
- **Kill the drag.** Corner snapping and drag state are most of `state-inspector.js` (1,251 lines); a bay that lives in the bottom lane with the section handle needs neither.

Seams: `public/js/interface/state-inspector.js` (rename to `state-satchel.js` per `runtime-module-decomposition` Phase 1.4 when it is rebuilt), `public/js/kernel/site-settings-engine.js` (`listDeviations`, `saveSiteSettings`, `data-site-setting-set` binding), `public/js/runtime/frame-navigator.js` (rooms), `settings/index.html#token-navigator` (token families), `floating-chrome-coherence.spw`. No new `data-spw-*` family: the bay is `[data-spw-chrome-role="state-inspector"]` with settings controls inside it.

Gate: sensation. Build the bay on `/settings/` first as an authored specimen (no floating chrome), approve it there, then mount it as the satchel.
