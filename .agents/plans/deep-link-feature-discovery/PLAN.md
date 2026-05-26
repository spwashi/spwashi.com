# Plan: deep-link feature discovery and mount visibility

## Public Goal
Make the site easier to navigate, inspect, and learn from by improving deep-link affordances, teaching feature discovery through lightweight toasts, and exposing why runtime features mount.

## Direction
- Deep links should be visible as stable route handles, not only hidden `id` attributes.
- Feature modules should expose both trigger and mounted states so a reader or future model can see which selectors, timing policy, and route posture caused a module to appear.
- Learning toasts should teach first discoveries without becoming promotional noise.
- Component tags should act as compact metadata labels. They must not collapse to unreadable slivers in debug/devtools-size layouts.
- Mode switches should stay useful as sitewide lens controls. Where they remain, layout should communicate consequence through active state, label, and readable grouping instead of a decorative strip.
- State inspection should be whimsical but practical: a small floating satchel can inspect, toggle, and serialize transient state with live feedback and without bypassing canonical persistence rules.
- Z-index and floating chrome should share named tiers so toasts, popovers, drawers, and state inspectors do not fight through hard-coded numbers.

## Minimal File Set
- `public/js/site.js`: add trigger/deep-link annotations and runtime discovery event detail.
- `public/js/interface/discovery-notices.js`: add feature-learning toast handling through the existing notice API.
- `public/css/components/runtime-states.css`: add deep-link target and module-trigger visibility.
- `public/css/components/floating-chrome.css` + `public/css/tokens/core.css`: align z-index aliases and floating tiers.
- `public/js/interface/state-inspector.js`: add accessible transient state inspection and modification.
- `public/css/handles/operators.css`: refine component tag and mode-switch containment.
- `public/css/routes/surfaces/home.css`: remove homepage-specific mode switch pressure that worsens narrow layouts.
- `.spw/conventions/site-semantics.spw`: document feature trigger and learning-toast contract.

## Constraints
- Do not create a new modal/toast system. Use the existing discovery notice API.
- Keep feature toasts bounded to session-level first discoveries.
- Do not require JS for deep links to work. JS only improves discoverability.
- Prefer shared CSS over route-specific overrides.
- Do not persist state-inspector toggles through localStorage; canonical persistence still belongs to `site-settings`.
- Any state inspector feedback should use an aria-live region and the existing discovery notice pathway.

## Validation
- `node --check public/js/site.js`
- `node --check public/js/interface/discovery-notices.js`
- `git diff --check`
- `npm run test:engagement`
