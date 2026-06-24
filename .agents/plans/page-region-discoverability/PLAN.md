# Page Region Discoverability

## Public Goal

Make page regions across the site easier to discover, compare, and move through. A visitor should be able to understand both the local region they are in and the nearby page routes that carry the same concept forward.

## Fixity Tier

Stable interaction contract, incremental visual treatment. Reuse existing page-region rail, route discovery menu, section handle, region menu, and component semantics before adding new runtime surfaces.

## Files

- `public/js/runtime/page-region-rail.js` enriches generated region links with role/feature/component summaries.
- `public/css/handles/page-region-rail.css` supports the richer rail label anatomy.
- Key route `index.html` files opt into `route-discovery`.
- `index.html` gets the first visual component-discovery atlas using tracked Midjourney renders.
- `.spw/slices/page-region-discoverability/index.spw` records the durable slice contract.

## Current Patch

- Enable `route-discovery` on major public route families.
- Improve desktop region rail labels so page regions expose their role and component family, not only their heading.
- Add a homepage component-discovery image strip that routes by component need: algorithm labs, search threads, care protocols, and playful registers.
- Integrate underdescribed enhancement modules by adding explicit scheduler selectors, lifecycle descriptions, and teardown notes in the module catalog.
- Refresh DOM-sync order/filtering so page-region, tuning, gesture, and learnability projections stay coordinated when page-specific feature, image, accent, or role attributes change.
- Carry active theme pack, palette resonance, and semantic density into the generated region rail so behavior output participates in theming.
- Expand homepage card copy with concrete visual cues for creative interpretation: color, material, motion, figure-ground, and component pressure.
- Add a shared interaction-color reward model: curiosity, relationship, and architecture each get a distinct accent channel that responds to charge-field state, operator hover/focus, route relations, visual cue cards, and component/frame semantics.
- Add a live-day semantic topography pass for June 24, 2026 RPG Wednesday: homepage, Now, Play, RPG Wednesday, and Midjourney Bench now link the current update story through mindful development, creative play, image resources, and public artifacts.
- Add `scripts/image-resource-manifest.mjs` plus `npm run images:manifest` to make tracked image resources easier to find, classify, reference, and swap without pointing public pages at raw or ignored image folders.
- Refine mobile floating chrome alignment: section handles, parallel navigation, console, state satchel, and cauldron chip now share named bottom slots instead of independent offsets. Runtime chrome annotations include `data-spw-chrome-slot`, and floating sync now measures open chrome overlap for future occlusion and parallax reasoning.
- Tighten mobile scroll progression by separating closed satchel launch placement from open satchel panels, ignoring hidden chrome in occlusion math, and applying shared top/bottom scroll clearances to section targets.
- Add a reusable visual link board component so route links can carry images, alt text, color accents, route rationale, and visual cue copy together on the homepage and topics atlas.

## Out Of Scope

- No new framework, dependency, or client-side data store.
- No mass restructuring of all route HTML.
- No direct edits to ignored `00.unsorted` images; public pages only reference tracked `public/images/` assets.

## Validation

- `node --check public/js/runtime/page-region-rail.js`
- `node --check public/js/runtime/charge-field.js`
- `node --check public/js/runtime/attention/section-handle.js`
- `node --check public/js/kernel/dom-contracts.js`
- `node --check scripts/image-resource-manifest.mjs`
- `npm run images:manifest`
- `git diff --check`
- `npm run check:local`
- Targeted checks for `route-discovery`, image paths, and generated rail selectors.
- Targeted checks for `.spw-visual-link-card`, tracked image paths, and mobile floating chrome state attributes.
- `rg "ungated by selector"` should remain quiet in `node scripts/check-site.mjs` output unless a new document-wide module is intentionally added.
