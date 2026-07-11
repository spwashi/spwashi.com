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

## 2026-06-17 Lens Mode Interaction Contract

Mode switches now graduate from local visual controls into shared lens-mode surfaces for marketing proofs, feature QA, and deep-linkable route states.

Implemented contract:
- Runtime writes `data-spw-lens-group`, `data-spw-lens-mode`, `data-spw-lens-state`, `data-spw-lens-panel-state`, `data-spw-lens-deep-link`, and `data-spw-deep-link-state` across the switch, panels, and nearest inspectable host.
- Root HTML receives `data-spw-active-lens-group` and `data-spw-active-lens-mode`.
- Normal mode clicks emit canonical `frame:mode` through the bus, preserving the legacy `spw:mode-change` event for existing listeners.
- Query links can use `?lens=<group>:<mode>#<host-id>` to open a route into a specific lens state.
- Shared CSS in `public/css/handles/operators.css` owns pressed-state design, lens cascade color, host/panel microinteractions, and reduced-motion safety.

Marketing/QA use:
- Marketing cards can point to a proof posture without new route copy: e.g. a system-oriented pitch can deep-link to `?lens=home-lens:website#home-frame`.
- QA can verify a lens by checking root state, host state, visible panel state, and the emitted `frame:mode` detail instead of relying on screenshots alone.

Guardrail:
- Do not create route-only `.mode-active` class families. Add route-specific visual depth by consuming the shared lens datasets and variables.

## 2026-07-10 Feature Field Guide Progression

The reusable discovery layer now distinguishes a named feature from a generic
runtime mount. Opted-in `data-spw-feature` clusters can declare traits,
progression, and memory; the runtime classifies first meetings as `novel` or
`convergent`, and later meetings as `return`.

Performance and lifecycle guardrails:

- `feature-discovery` mounts at idle only when the route declares the matching
  `data-spw-features` behavior scope.
- Its CSS lives in the feature-discovery behavior bundle, outside the core CSS
  payload.
- Feature owners register through the ready API instead of statically importing
  the guide into sitewide modules.
- Canonical bus emission is already DOM-visible; do not dispatch the same event
  a second time.
- Direct pre-init discoveries must hydrate persistent memory before mutation so
  idle initialization cannot overwrite them.

Current proof species are palette probes (`depth`, persistent memory) and the
spatial-gravity bench (custom traversal, session memory). Keep enrollment
deliberate; the generic `data-spw-feature` inventory is not itself permission to
collect visitor history.
