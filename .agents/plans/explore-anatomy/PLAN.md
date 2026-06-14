# Plan: Explore Anatomy (B → C → D → A)

## Public Goal

Make page and component anatomy explorable sitewide: embedded route workshops for tinkering, an auto-built region rail for navigation, clearer lens vs form controls, and an explicit explore posture decoupled from semantic density.

## Scope

- **B** — `spw-embedded-workshop` contract on topics, about, services (home pattern export).
- **C** — `page-region-rail.js` + `page-region-rail.css` (desktop region index from `main` semantics).
- **D** — `frame-controls.css` (lens vs form axes); slot markup on key landing frames.
- **A** — `explorePosture` setting (`reading` | `field` | `workshop`) drives `data-spw-tuning-discoverability`; shell cycle in Weather.

## Files

- `public/css/components/embedded-workshop.css`
- `public/css/components/frame-controls.css`
- `public/css/handles/page-region-rail.css`
- `public/js/runtime/page-region-rail.js`
- `public/js/kernel/site-settings-profiles.js`
- `public/js/kernel/site-settings-engine.js`
- `public/js/runtime/shell-disclosure.js`
- `public/js/runtime/module-catalog.js`
- `public/js/runtime/tuning-discovery.js`
- `topics/index.html`, `about/index.html`, `services/index.html`
- `public/css/style-core.css`

## Validation

- `npm run check:local`
- `node --check` on new/edited JS
- `git diff --check`