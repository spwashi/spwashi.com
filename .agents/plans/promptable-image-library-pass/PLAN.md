## Promptable Image Library Pass

### Public goal
- Make promptable links easier to share as memeable URLs and image seeds.
- Broaden RPG Wednesday, Design, Home, About, and the image bench toward library-building, materials science, and reusable prompt handoff.
- Give players and curious designers clearer route hooks for images, prompts, and screen-readable capture surfaces.

### Files likely to change
- `public/js/spw-prompt-utils.js`
- `play/rpg-wednesday/index.html`
- `design/index.html`
- `design/components/index.html`
- `tools/midjourney/index.html`
- `index.html`
- `about/index.html`

### Semantic and runtime seams
- Query-string prompt interpretation should stay inside the existing prompt runtime instead of creating a parallel feature.
- Promptable routes should prefer existing `.site-frame`, `.frame-card`, `.image-study`, and wonder-block grammar.
- Image-generator language should stay generator-agnostic at the systems level while naming current public generators in dated copy where that context is useful.

### Validation
- `git diff --check`
- `node --check public/js/spw-prompt-utils.js`
- `npm run check`
- targeted `rg` checks for new prompt-query hooks and updated route links

### Out of scope
- New client-side dependencies
- A full asset-management rewrite for the local gameplay kit
- New generated images during this pass
