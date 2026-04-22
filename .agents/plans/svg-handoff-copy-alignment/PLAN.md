## SVG Handoff Copy Alignment

### Public goal
- Align the site's public voice around humane, legible engineering: stronger HTML/CSS practice, SVG as a vehicle for character and asset development, and clearer bridges from authored surfaces into model/illustrator handoff.

### Files likely to change
- `about/index.html`
- `about/website/index.html`
- `design/experiments/svg/index.html`

### Semantic seams
- About-page identity and direction copy
- Website field guide proof points, especially promptability and RPG asset references
- SVG host addressability through existing `data-spw-prompt-host`, `data-spw-svg-host`, and `data-spw-svg-companion="rail"` contracts

### Validation
- `git diff --check`
- targeted `rg` checks for new SVG handoff hooks and updated copy anchors
- `npm run check`

### Out of scope
- New SVG runtime behavior
- Shared CSS or JS refactors unless the existing SVG/promptability contracts prove insufficient
- Broad rewrite of unrelated routes
