# Plan: interaction-grammar

**Status 2026-11-06.** The phase ladder and reward contract live in `.spw/conventions/interaction-microstates.spw`. Leaf controls stay out of brace gestures through `isLensModeControl` (`6ccab1bb`). The gesture-contract census ran (`.spw/audits/touch-gesture-contracts-2026-09.spw#verb_census_2026_11_05`): 36 authored elements in 21 files over 10 strings, each on an element some engine claims. Two findings wait on the creator (`index.spw#wonder_interaction_grammar_hold_on_hook`): haptics' `[data-spw-gesture-contract*="prime"]` also matches `tap:prime`, so a hold on a hook or an image-study figure inspects and gathers at once though its contract says inspect; and the two film mode panels (`topics/film/scene-composition/*/index.html:47`) have no inspect engine, so their hold only gathers and their tap answers nothing. The census also records the swipe fact chrome-navigation-wonder's drawer question waits on. Next slice: the settings "do this / expect this" passage below, one row per authored string, written from the census and saying what a hold does today. Cross-session familiarity stays unscoped. On 2026-11-05 the creator asked what would make the UI useful, informative and playful; the reading and its slices, each naming its gate, are under "Useful, informative, playful" below.

**Review sitting:** [ui-review-sitting-2026-10](../../../.spw/caches/ui-review-sitting-2026-10.spw) — ungated.gesture_census, seams.lens.

**Related:** [interaction-cache](../archive/interaction-cache/PLAN.md) (archived). **Absorbed 2026-10-06:** [interaction-loop-contract](../archive/interaction-loop-contract/PLAN.md) · [microinteraction-motion-lifecycle](../archive/microinteraction-motion-lifecycle/PLAN.md). **Absorbed 2026-10-10:** [gesture-state-refinement](../archive/gesture-state-refinement/PLAN.md).

Develop practical interactive circuits that become satisfying and familiar over time, and rethink brace physics toward vocabulary that is more cognitively accessible — while using Spw to exercise spatial relationship and let other languages and notations shine through it.

## Useful, informative, playful — 2026-11-05

The creator asked what would make the UI feel useful and informative, and for a visual ecology that can encourage play. The reading is in [chrome-ecology-2026-11](../../../.spw/caches/chrome-ecology-2026-11.spw) (`#informative`, `#play`) and this plan's gesture census.

- **Computed, never painted.** The grounding reason (`groundInteraction`, `kernel/dom-contracts.js:750`) reaches only a data attribute and the runtime audit; the settle confirmation `data-spw-page-settle-confirmation` (`runtime/page/page-state.js:142`) has no stylesheet reading it, so the reward contract's fourth form never paints; the effect ledger writes its count and last entry onto `html` and nothing lists them for a reader.
- **The model that works.** The settings credit names the change and what became more prominent (`interface/site-settings-ui.js:390-410`). Lens, spell and grounding feedback could take the same two clauses.
- **Loops that do not close.** `component-collection.js` emits `spw:achievement-unlocked`; the effect ledger listens for `spw:collection-achievement` and `spw:reward-unlocked` (its "optional flourish sources"), so a found thing never becomes a receipt. Math diagrams carry their listeners and emit nothing (`modules/math/diagrams.js:63`). One hold runs on two clocks: haptics 520ms with a mouse, 420ms on touch, a 340ms double tap; brace-gestures 420ms with 8px of slop; and haptics' `*="prime"` selector makes a hold on a hook inspect and gather at once.

Slices, smallest first:

1. **Do this, expect this.** The settings passage owed below, at the gesture helpers (`settings/index.html:2383`). One row per authored string from the census, quoting the string the page carries (`tap:prime hold:inspect`) beside what it does today, including "a hold also gathers" where haptics claims it. Reading the attribute is the lesson: one rule, taught once, varied by role. Ungated: it describes what runs. Verify: `npm run audit:copy:accessor`; the passage quotes contracts in `<code>` and authors none.
2. **A diagram that changes says so.** `modules/math/diagrams.js:63` holds the comment "Future: emit via bus"; emit there and let `runtime/memory/effect-ledger.js` keep the entry, in one commit, so no event goes unheard. Not quite invisible: each entry raises `--spw-effect-charge` on `html`, which `components/runtime-states.css:921-929` reads into rhythm and pulse, so a value dragged on a diagram would be felt. Gate: a demo on one math page for the creator's look. Verify: `npm run audit:root-writes` names the ledger as the writer; `npm run test:modules`; `node --check` on both files.
3. **Achievements reach the ledger.** `component-collection.js` emits `spw:achievement-unlocked`, while the ledger listens for `spw:collection-achievement` and `spw:reward-unlocked`. Listening for the emitted name lets its flourish show, so this is a look.
4. **One hold.** One measure for hold, double tap and slop, read by `interface/haptics.js` (`HOLD_PRIME_DELAY_MS` 520, `HOLD_PRIME_DELAY_COARSE_MS` 420, `DOUBLE_TAP_MS` 340) and `runtime/interaction/brace-gestures.js` (`HOLD_THRESHOLD_MS` 420, `DRAG_THRESHOLD_PX` 8). It changes the feel: a proposal and a browser demo on a coarse pointer.
5. **Receipts land in the satchel**, composed with [settings-ornament-resonance](../settings-ornament-resonance/PLAN.md)'s patch bay; whether bay and receipts share one satchel is that plan's `#>wonder_settings_ornament_resonance_satchel_holds`.
6. **What play commits to.** The sincere structure play is played straight in is the creator's call (`chrome-ecology-2026-11.spw#wonder_chrome_ecology_play_structure`).

## Settled, 2026-09-04

- **Brace physics vocabulary, settled elsewhere.** The objective → subjective gradient is the primary naming, and boon/bane survives only as optional valence coloring (`.spw/conventions/site-semantics.spw#brace_perspective_axis`; the caution in `operator-semantics.spw`). A bridge, not a replacement.
- **The circuit ladder landed as a phase ladder.** `idle → approach → prime → charge → inspect → discover → settle` on `data-spw-interaction-phase`, owned by `public/js/runtime/interaction/{progression,vocabulary,hops,story}.js`, plus the reward contract (`interaction-microstates.spw#reward_contract`). Landmark hops, cauldron gather/inspect/release and tap:travel / swipe:cycle are instances of it (`#cross_component_hops`, `724caa1b`). The 2026-04 commit sequence and files were removed 2026-10-10.
- **Entry-level access is held by audit.** The 2026-09-03 probe found 13 of 37 authored contracts, every hero hook, wired to a CSS rule with no matching selector in `brace-gestures.js`; adding the clause fixed it. Rule kept: audit whether the contract is held, not only whether it is stated.
- **Still open:** the cross-session ladder (practiced → fluent → habitual) is unbuilt and unscoped, and so is Spw framing other notations in the Pretext lab. Route new work through `interaction-microstates.spw` first, and land here only what it cannot own.

## Goal

The desired end state is a site interaction system that rewards familiarity: repeated use builds skill and fluency, interactions have a recognizable grammar, and the underlying physics metaphor is legible enough to discuss, teach, and play with. A secondary aim is to make Spw useful as a substrate for exercising cognition and spatial relationship — where the grammar can illuminate how other languages, notations, and structures work rather than replacing them. The immediate task is twofold: design a progression ladder for interactive circuits (how interactions become familiar, then fluent, then habitual); and rethink whether the boon/bane vocabulary that names brace physics is cognitively accessible or whether it needs a bridge, supplement, or replacement. The taste note is **practiced grammar + honest physics**: interactions should feel learnable the way a musical instrument is learnable — rewarding fluency without requiring it — and the physics should work at the level of ordinary physical intuition before it becomes Spw doctrine.

## Scope

- **In scope**: interactive circuit design (entry-level, practiced, fluent, habitual patterns); brace physics vocabulary audit (boon/bane legibility test, candidate alternatives, bridge terms, and the case for keeping them); progressive enhancement as a skill ladder; familiarity feedback design (repetition rewards, feedback quality, learning gradient); Spw as spatial cognitive exercise; multi-language surfaces where Spw frames other notations.
- **Out of scope**: gamification, points, badges, or explicit skill tracking; replacing the Spw vocabulary outright; making content or interactions gated by proficiency; implementing a browser-side Spw parser here (the site has carried one since Phase 4 of [spw-inquiry-loop](../spw-inquiry-loop/PLAN.md); this plan reads it and does not build another).

## Craft guard

- Interactive circuits must have an entry level requiring no prior knowledge; depth should be available but never mandatory.
- Brace physics vocabulary changes must be bridged — any new terms must coexist with existing operator atlas documentation and site-semantics.spw.
- Familiarity feedback should be subtle — the site should feel practiced-in, not gamified.
- No circuit may trap focus, require specific timing, or penalize error states.
- The vocabulary decision (boon/bane vs. alternatives) must be logged as an explicit taste choice in the stream before any commit changes terminology.
- Spw framing of other languages must make those languages more legible, not subordinate them to Spw.

## Dependencies

- [mobile-runtime-foundation](../archive/mobile-runtime-foundation/PLAN.md) (archived) — circuit design must be mobile-first; brace physics vocabulary lives in shared runtime semantics; spatial address requires shared registers.
- [css-progressive-ornaments](../archive/css-progressive-ornaments/PLAN.md) (archived) — circuit-level enhancements live in the enhancement layer.
- `screenshot-semantics` — practiced and fluent circuit states are exactly the kind of state worth capturing; the two plans share vocabulary for address legibility.
- [cinematic-handles](../archive/cinematic-handles/PLAN.md) (archived) — familiarity feedback timing (practice-settle, fluency-reveal) should use named timing tokens.
- [pretext-whimsy-lab](../archive/pretext-whimsy-lab/PLAN.md) (archived) — the whimsy lab is a prime venue for multi-language surfaces and wonder about physics; circuit grammar should extend there naturally.

## Failure Modes

- **Hard**: brace physics vocabulary is changed without bridge terms, so operator atlas pages and site-semantics.spw become inconsistent.
- **Hard**: interactive circuits create a two-tier experience where practiced users access more content, stranding casual visitors.
- **Soft**: familiarity feedback becomes gamification — progress indicators or reward tokens that feel extractive rather than reflective.
- **Soft**: circuit grammar is only legible to users who already know Spw vocabulary rather than being inductively learnable from spatial behavior.
- **Soft**: multi-language surfaces reduce other languages to syntax fragments framed by Spw, rather than letting those languages demonstrate their own expressive power.
- **Non-negotiable**: every interaction circuit must remain fully accessible and content-complete to first-time visitors with no prior knowledge of the site.

## Validation

- **Hypotheses**: circuit progression will make the site feel deeper over time without requiring upfront investment; a more accessible brace physics vocabulary will improve legibility of the operator atlas and Pretext surfaces; Spw framing of other languages will make spatial relationships between notations more visible.
- **Negative controls**: all content remains accessible to first-time visitors; operator atlas pages remain standalone-legible; the framed languages remain legible on their own terms.
- **Demo sequence**: visit as a first-time user — identify the entry circuit; return after repeated use — identify what new recognition is available; test brace physics vocabulary with a user unfamiliar with Spw; view a multi-language surface and confirm the framed language teaches something about itself.

## Spw Artifact

`.agents/plans/interaction-grammar/interaction-grammar.spw`

## Absorbed 2026-10-10 — gesture-state-refinement

Landed: calmer brace and region-menu gestures on coarse pointers, `window.__SPW_SITE__.gestures`, and texture-slice pointer crop that binds only to a fine pointer. Leaf controls stay themselves through `isLensModeControl` in `kernel/dom-contracts.js` (`6ccab1bb`), and the image prime readout names swipe and hold.

Still owed: one settings-page "do this / expect this" passage for gestures. `settings/index.html` names the gesture helpers (:2383, and the snippet at :2458-2461) but teaches no gesture. Write it from the census above, one row per authored contract, and keep it concrete rather than theoretical.

Rules worth keeping:
- Gesture hosts never claim leaf controls.
- A prime names the next verb, not just a glow.
- Do not teach swipe on the home Study/Build/Play strip.

Reference: [mobile-runtime-foundation](../archive/mobile-runtime-foundation/PLAN.md), UX Considerations (lines 103–115): inspect before invoke on touch, no dead-end clicks, pivots preserve orientation. Source: [gesture-state-refinement](../archive/gesture-state-refinement/PLAN.md).
