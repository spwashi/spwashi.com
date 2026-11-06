# Cauldron lens composition

**Status 2026-11-06.** Landed: the lens-aware mix with pocket slots (`604d4a1d`) and the native dialog (`326eb119`). The pocket receipt for the `home-cauldron-open` still was taken on 2026-11-05 as the before: the dialog opens above the dimmed page with its next step readable, Close reachable at the top right, and the attention receipt ok. Since then the cauldron's resonance moved into its state bundle (`e4905bf1`) and the floating chip writes the live expression (`c672468e`), so the after receipt is owed (slice 1). The plan still receives state-block-projections' second-use lens seat offer when that lands. Corner sharing moved to floating-chrome-stack.

**Review sitting:** [ui-review-sitting-2026-10](../../../.spw/caches/ui-review-sitting-2026-10.spw) — ungated.cauldron_receipt, seams.cauldron, seams.lens.

**Related:** [floating-chrome-stack](../floating-chrome-stack/FIX.md) · [mobile-chrome-alignment](../archive/mobile-chrome-alignment/PLAN.md) (archived).

Operation: align. Fixity: tending. Focus: composition consequence. Element: water.
Readers choose a page lens and connect/compare/apply intent in the cauldron.
Existing page modes provide semantic context to prompts and functional mixes.
Owners: lens-modes.js, composition.js, site-footer partial.
No new storage, ingredient filtering, or attribute families.
Evidence and probe: .spw/caches/cauldron-lens-composition-2026-09.spw.
Validate: lens tests, syntax, check:local, pocket home-opening visual receipt.

## Next slices — 2026-11-06

1. **The after receipt.** Ungated sensor: `npm run sense -- doctor`, then `npm run visual:checks -- --ids=home-cauldron-open` (`scripts/lib/viewport-still-recipes.mjs:507`), compared with the 2026-11-05 still in `wip.spw`. Verify: the dialog's next step and Close still read at pocket, with 0 errors.
2. **Proposal: the lens is the expression's `[mode]` slot.** The live expression (`composeLiveExpression`, `public/js/interface/cauldron/live-expression.js`) writes only a prefix and braces: `*cauldron{a.b.c}`. The dialog's lens select (`#cauldron-page-lens`, read in `public/js/interface/composition.js`) shapes the mix but never shows in that line. Writing the chosen lens as the mode slot, `*cauldron[reading]{a.b.c}`, makes picking a lens rewrite one visible token, which is the `[lens]` of spellcraft-authoring's proposed `^cauldron[lens]{parts}<projection>` and the place the second-use seat offer would land. Gate: a demo for the creator's look, sequenced with spellcraft's step 1 (`index.spw#wonder_cauldron_lens_composition_lens_slot`).

## Landed, 2026-09 to 2026-10

- **Lens-aware mix and pocket slots (`604d4a1d`).** `kernel/dom-contracts.js` allocates the collection and cauldron slots, `floating-chrome.css` reduces the pocket collection to a 44px trigger, and `cauldron.css` takes its slot at both widths; discovery-modal padding reads `--spw-bottom-chrome-clearance`. Measured at 320px on `/about/`: promo 440–622, cauldron 651–695, satchel 697–741, overflow 0. The footer keeps intrinsic controls on a 2:1 desktop grid with a full-width legal row. Page buttons may author the existing `data-spw-lens-impact`, which `lens-modes.js` reads, to specialize a mode.
- **Native dialog (`326eb119`), focus composition palette, element air.** Owners: `interface/cauldron/chrome.js`, `composition.js`, `cauldron.css` and the site-footer partial. The vessel moves into a native dialog and returns to its footer seat on close; Escape, Close and the backdrop dismiss; source jumps release the modal first. Fragments lead, lens and intent follow, and the vessel vocabulary is a secondary disclosure. The rule that primary actions pair Spw sigils with readable verbs is superseded by spellcraft-authoring's "Operators, not verbs; magic, not cooking" (2026-11-06).
Moved 2026-10-10: the packing is lane arithmetic, not a designed field. The corner-sharing
pass (what yields, what stays, spacing and hierarchy) now lives in
[floating-chrome-stack](../floating-chrome-stack/FIX.md) under "Corner sharing".

Lens seat, 2026-10-25: [state-block-projections](../state-block-projections/PLAN.md) offers the
lens seat to the cauldron on its second use, not its first; this plan receives that offer
(the sitting's `seams.lens`). It waits on that plan's A/B/C seat review.
