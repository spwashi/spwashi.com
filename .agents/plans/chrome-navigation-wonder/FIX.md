# Chrome Navigation And Hover Stability Fix

## Visible Failures

- Primary header navigation shifts subtly when hover/focus state changes because some chrome affordances are visually rich but not geometry-stable.
- The shell toggle copy changes length across menu states, which can move the nav column and make the header feel jittery.
- The active / grounded header link treatment is slightly stronger than it needs to be for a stable navigation rail.

## Diagnosis

- The shared header uses live disclosure state, so hover/focus can change the header datasets even when the user is only trying to inspect links.
- The nav toggle’s copy is stateful and variable-length, so its width changes as the shell describes itself.
- The primary nav’s current-route treatment relies on a stronger inline emphasis than the rest of the rail, which makes the menu feel more animated than anchored.

## Planned Fix

- Reserve stable inline space for the header toggle copy so the nav rail does not reflow when the disclosure state changes.
- Keep the primary nav’s hover and current-link states within the same box model footprint.
- Make the active route marker explicit but width-stable, so navigation reads better without adding layout jitter.

## Deferred Follow-Ups

- If the header still feels noisy in practice, revisit the disclosure copy itself rather than adding more visual motion.
- Validate the shell on one narrow, one mid, and one wide route to confirm the new stable geometry still feels responsive.
