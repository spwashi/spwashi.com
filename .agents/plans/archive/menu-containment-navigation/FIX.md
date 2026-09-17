# Menu Containment And Navigation Fix

## Maintenance Status - 2026-06-30

Completed reference retained in place. The primary menu containment work landed on 2026-06-28; the remaining deferred items now belong to shell disclosure, contextual route discovery, floating chrome, or route-specific browser review rather than this tactical queue.

## Visible Failures

- Research route bridge cards can overflow the frame on narrow screens.
- Discovery notices can visually collide with bottom chrome or appear too wide near the footer.
- Mobile shell navigation can collapse before a tapped link completes default navigation.
- The projected mobile menu often uses a narrow single-column rhythm even when the viewport has room for two or more route cards.
- The compressed header exposes primary `Menu`, contextual route discovery, utility/tune state, and diagnostic return hints in one chrome lane.
- Opening the primary menu can change the header grid and shove content instead of projecting a stable route surface.
- The contextual route discovery panel is mounted inside a scroll/paint-contained nav, so it can feel clipped or cramped.
- Shell topology can flap near fit thresholds because `shell-disclosure.js` measures the nav, writes layout-driving menu attributes, then re-measures after CSS changes or while the toggle nav is hidden.

## Diagnosis

- `.spw-route-bridge__links` has a responsive grid, but the bridge and child cards do not fully opt into `min-width: 0` and internal overflow wrapping.
- Discovery notices are fixed, but their stack does not reserve clearance for the bottom section navigator on small screens.
- `shell-disclosure.js` closes the menu through `requestAnimationFrame` immediately after route clicks. On touch browsers this can hide the active anchor before default navigation commits.
- Later responsive menu rules override the screen-field grid topology with smaller global header grid defaults.
- The shell runtime already owns mode, topology, pressure, phase, dismissal, return paths, and scroll lock state; adding a second route-menu state machine would duplicate working behavior.
- The visible shell toggle copy was exposing runtime diagnostics (`project`, topology, return hints) that belong in data attributes, not in primary chrome.
- `contextual-ui.js` correctly owns nearby/additional routes, but its `<details>` panel needs either a floating mount or an explicit popover-style containment patch.
- A hidden toggle nav can report a zero content width, making the next shell sync think the route field is roomy enough for inline mode. Small font, resize, and route-discovery changes can also move the ratio around the compressed/tight thresholds.

## Planned Fix

- Add shared containment rules for route bridges and their card links.
- Add mobile clearance and inline containment for discovery notices.
- Change route-click menu closing from `requestAnimationFrame` to `setTimeout(..., 0)` so default anchor navigation wins.
- Add a late mobile topology rule that treats the open menu as a route field, using available width for multiple columns.
- Keep `shell-disclosure.js` as the primary route state owner and simplify visible toggle copy to `Routes`, `open`, `tap to open`, and route count.
- Move toggle-mode nav out of header grid flow with a fixed overlay; keep the header grid stable while the route surface opens.
- Keep `contextual-ui.js` as the nearby-route owner, but label it `Nearby` and keep gesture copy truthful.
- Patch nearby route panel CSS as an out-of-flow popover on desktop; let it remain contained inside the sheet/mobile route field until a durable portal is warranted.
- Cache the last real nav content measurement in `shell-disclosure.js` and use hysteresis for menu mode and pressure so a single measurement jitter does not rewrite the whole shell topology.

## Landed Status - 2026-06-28

- Route clicks now let default anchor navigation commit before menu cleanup.
- Hidden toggle nav measurements reuse the last real content width and ignore small jitter.
- Mobile discovery notices reserve bottom chrome clearance and only show one notice at a time.
- Floating chrome measurement preserves declared bottom insets and ignores empty/hidden shells.
- Route bridge cards now opt into tighter shared containment and wrapping below tablet widths.
- Menu glyph state and toggle copy now carry the primary hierarchy: `Routes` closed, `Map` open.
- Header fallback now keeps nav in an explicit grid track before disclosure hydration, while non-shell-trace diagnostic rows collapse out of the primary header.
- Inline route discovery suppresses the secondary action lane and keeps the nearby route trigger as a compact dropdown instead of a vertical sliver.
- Mobile open route navigation projects below the stable header as a bounded overlay for drawer-field topology instead of adding a tall reflow row.
- The topics register brace now reads as a material-edge overlay with short corner cues, and the register chips have a dark-surface contrast override.

## Deferred Follow-Ups

- Test the shell menu in the in-app browser across Home, Settings, Research, and Recipes after the `/topics/` model settles.
- Consider a visible menu topology label or settings toggle only after the stable default behavior is confirmed.
- Portal the nearby-route panel through the existing floating chrome annotation contract if the CSS popover still collides with nav overflow on real pages.
- Defer pinning/lock behavior until `Routes`, `Nearby`, `Tune`, and `Inspect` are visually and structurally distinct.
- Consolidate viewport and fit thresholds across `shell-disclosure.js`, `contextual-ui.js`, region profiling, and composition inspection after the shell field is stable in browser review.
