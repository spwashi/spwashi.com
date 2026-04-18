## Plan: settings-theme-packs

Make the existing palette chooser surfaces act on canonical runtime state, and expand the site with authored theme families that each have distinct light and dark variants.

### Goal

The site already has working browser-local settings controls and a dormant theme-pack vocabulary in tokens. This pass turns that latent concept into a first-class runtime setting so palette chooser surfaces stop behaving like display-only chrome. Visitors should be able to choose a global color family, keep light level separate from theme family, and see the chosen pack reflected consistently in readouts, tokens, cards, and routes.

### Scope

- **In scope**: add a canonical `themePack` setting to the shared settings manager; wire it onto the root dataset; author distinct theme-pack overrides in shared tokens for light and dark contexts; update shared chooser chrome; and convert relevant homepage, settings, and design chooser surfaces from inert swatches into live controls.
- **Out of scope**: new build tooling, route-specific palette rewrites beyond the chooser clusters, or changing unrelated local edits already in the worktree.

### Files

- [NEW] `.agents/plans/settings-theme-packs/PLAN.md`
- [MOD] `public/js/site-settings.js` - canonical `themePack` setting, labels, presets, and root dataset projection
- [MOD] `public/css/spw-tokens.css` - authored theme-pack token overrides and light/dark variants
- [MOD] `public/css/spw-surfaces.css` - shared theme-pack chooser and compact chip styling
- [MOD] `settings/index.html` - live theme-pack chooser, readouts, and full-form fieldset
- [MOD] `index.html` - homepage quick-tune readouts and palette chooser controls
- [MOD] `design/index.html` - design hub global context chooser and explanatory copy
- [MOD] `design/palettes/index.html` - palette lab theme family controls integrated with existing local edits
- [MOD] `.spw/reviews/runtime-audit/settings-state.spw` - runtime semantics for theme pack as a brand-expression surface

### Semantic seam

- `colorMode` should continue to answer the luminance question.
- `paletteResonance` should continue to answer the semantic bias question.
- `themePack` should answer the global color-family question.
- future image extraction should be able to bias or suggest those families without inventing a second, parallel image-only settings model.

Those three settings must remain orthogonal and legible in copy, datasets, and readouts.

### Risks

- Theme packs could flatten route identity if the token overrides are too strong.
- The chooser surfaces could become visually noisy if they compete with resonance controls instead of complementing them.
- `design/palettes/index.html` already carries local edits, so changes there must stay narrowly scoped to the existing chooser region.

### Validation

- `node --check public/js/site-settings.js`
- `git diff --check`
- `rg -n "themePack|data-spw-theme-pack|data-site-setting-set=\"themePack" public/js/site-settings.js public/css/spw-tokens.css public/css/spw-surfaces.css settings/index.html index.html design/index.html design/palettes/index.html .spw/reviews/runtime-audit/settings-state.spw`
