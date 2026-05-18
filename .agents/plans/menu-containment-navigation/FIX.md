# Menu Containment And Navigation Fix

## Visible Failures

- Research route bridge cards can overflow the frame on narrow screens.
- Discovery notices can visually collide with bottom chrome or appear too wide near the footer.
- Mobile shell navigation can collapse before a tapped link completes default navigation.
- The projected mobile menu often uses a narrow single-column rhythm even when the viewport has room for two or more route cards.

## Diagnosis

- `.spw-route-bridge__links` has a responsive grid, but the bridge and child cards do not fully opt into `min-width: 0` and internal overflow wrapping.
- Discovery notices are fixed, but their stack does not reserve clearance for the bottom section navigator on small screens.
- `shell-disclosure.js` closes the menu through `requestAnimationFrame` immediately after route clicks. On touch browsers this can hide the active anchor before default navigation commits.
- Later responsive menu rules override the screen-field grid topology with smaller global header grid defaults.

## Planned Fix

- Add shared containment rules for route bridges and their card links.
- Add mobile clearance and inline containment for discovery notices.
- Change route-click menu closing from `requestAnimationFrame` to `setTimeout(..., 0)` so default anchor navigation wins.
- Add a late mobile topology rule that treats the open menu as a route field, using available width for multiple columns.

## Deferred Follow-Ups

- Test the shell menu in the in-app browser across Home, Settings, Research, and Recipes.
- Consider a visible menu topology label or settings toggle only after the stable default behavior is confirmed.
