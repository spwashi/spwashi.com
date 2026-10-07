# Interaction cache

Operation: `align`. Fixity: `tending`.

## Public goal
Keep gesture feedback predictable across rails, landmarks, and images, with a
valid, theme-aware vocabulary tint on the section handle.

## Scope
- Centralize existing gesture thresholds; preserve 28px rail, 48px landmark,
  420ms rail cooldown, and 90ms hop lock. No new velocity or decay behavior.
- Share spell lookup and phase/loop arc definitions; keep live landmark order.
- Batch progression writes and consolidate attribute observation, including
  newly inserted images and safe teardown/remount.
- Replace vocabulary hover `:has()` with delegated state; retain CSS palette
  ownership and fix the self-referencing tint variable.
- No route copy, dependencies, layout changes, or claimed timing improvement.

## Files
`public/js/runtime/interaction/`: vocabulary, progression, hops, loop, shared
hysteresis, arc taxonomy, phase queue. Section-context CSS; interaction tests.
Contract: `.spw/conventions/interaction-cache.spw`, conventions index, site map.
The semantic affordance reader delegates to the shared lookup too; the catalog
declares the vocabulary projection and generated expressions include this contract.

## Validation
Selector census; targeted interaction regressions; JS syntax; `check:local`;
`visual:checks -- --ids=home-living-term-note`; browser hover/focus, dynamic image
state, batching, and teardown/remount checks. Timings require a separate trace.

## Result — 2026-09-12
Implemented existing thresholds, shared spell lookup/arcs, one progression
observer, cancellable microtask batches, hop teardown, and cancelled-swipe guards.
Vocabulary projection preserves simultaneous hover/focus and clears detached terms.
CSS owns operator colors; the wonder tint blends from a separate base token.

- `check:local -- --allow-dirty`: passed, 317 tests. Plain `check:local` stops on
  uncommitted generated CSS; the shared tree already contained bundle edits.
- `node scripts/check-interaction-cache.mjs`: pocket and desktop passed, including
  dynamic image updates, one combined phase event, restarts, cancelled/short/full
  landmark swipes, remount, real hover/keyboard focus, and exact light/dark tint.
- Selector census, ecology, manifest refresh, JS syntax, and diff checks completed.
- Pocket baseline captured. Post-change recipe capture encountered Chrome timeouts;
  browser regression assertions passed independently. No timing claim is made.
