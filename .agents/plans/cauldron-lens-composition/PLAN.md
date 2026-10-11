# Cauldron lens composition
**Status 2026-10-10.** Landed: the lens-aware mix with pocket slots (`604d4a1d`) and the native dialog (`326eb119`). Next slice: the pocket receipt for the `home-cauldron-open` still (`scripts/lib/viewport-still-recipes.mjs:507`), via `npm run visual:checks -- --ids=home-cauldron-open`. The 326eb119 session could not take it because the browser timed out. The receipt needs a local server and a browser the sandbox allows. Corner sharing moved to floating-chrome-stack.

**Related:** [floating-chrome-stack](../floating-chrome-stack/FIX.md) · [mobile-chrome-alignment](../archive/mobile-chrome-alignment/PLAN.md) (archived).

Operation: align. Fixity: tending. Focus: composition consequence. Element: water.
Readers choose a page lens and connect/compare/apply intent in the cauldron.
Existing page modes provide semantic context to prompts and functional mixes.
Owners: lens-modes.js, composition.js, site-footer partial.
No new storage, ingredient filtering, or attribute families.
Evidence and probe: .spw/caches/cauldron-lens-composition-2026-09.spw.
Validate: lens tests, syntax, check:local, pocket home-opening visual receipt.

Follow-up scope from user: footer responsiveness and chrome positioning.
Footer owns intrinsic controls and a 2:1 desktop grid with a full-width legal row.
Chrome owner: kernel/dom-contracts.js allocates collection and cauldron slots;
floating-chrome.css reduces pocket collection to a 44px trigger; cauldron.css
consumes its allocated slot in both desktop and pocket rules. Discovery modal
padding uses --spw-bottom-chrome-clearance so the daily promo sits above that lane.
Measured at 320px about: overflow 0; promo 440–622; cauldron 651–695; satchel 697–741.
1280px: satchel at the header; cauldron bottom-right; promo 585–806 vs cauldron 835–879.
Page buttons may author existing data-spw-lens-impact to specialize a mode.
Validation: 394 module tests; check:local -- --allow-dirty (generated CSS included).

Moved 2026-10-10: the packing is lane arithmetic, not a designed field. The corner-sharing
pass (what yields, what stays, spacing and hierarchy) now lives in
[floating-chrome-stack](../floating-chrome-stack/FIX.md) under "Corner sharing".

Cauldron modal UX — align / tending; focus: composition palette, element: air.
The existing vessel moves into a native dialog and returns to its footer seat on
close. Escape, Close, and backdrop dismiss; source jumps release the modal first.
Fragments lead; lens/intent follows; vessel vocabulary is a secondary disclosure.
Primary actions pair Spw sigils with readable verbs. No second ingredient store.
Owners: cauldron/chrome.js, composition.js, cauldron.css, site-footer partial.
Probe: home-cauldron-open pocket/fold/broadsheet fixture, syntax, check:local.
Validation: 70 focused tests pass (cauldron lifecycle/composition and capture plans).
Local site/CSS/runtime/agent checks pass; full suite 492/493, with an unrelated
in-progress topic leaf's hub-wiring failure in the shared tree.
Visual verification remains incomplete: browser attachment/evaluation timed out;
the modal fixture now prepares the idle-loaded cauldron before clicking.
