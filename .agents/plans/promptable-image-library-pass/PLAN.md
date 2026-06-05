## Promptable Image Library Pass

### Public goal
- Make promptable links easier to share as memeable URLs and image seeds.
- Broaden RPG Wednesday, Design, Home, About, and the image bench toward library-building, materials science, and reusable prompt handoff.
- Give players and curious designers clearer route hooks for images, prompts, and screen-readable capture surfaces.
- Make prompt mining a public reason to read through the site: route copy, component anatomy, screenshots, RPG memory, and substrate metaphors should expose reusable dimensions of conception.
- Treat favorite Midjourney images as publishable session artifacts when they gain a role in RPG Wednesday: prop, vision, ward, cast reference, world rule, shotboard beat, or proof card.
- Use visible headings, captions, operator handles, and route links so screenshots can be interpreted by image models and language models without losing the authored intent.

### Current Midjourney proof point
- Lifetime Midjourney usage: 9,623 images.
- Fast usage: 8,169 images.
- Turbo usage: 625 images.
- Relaxed usage: 829 images.
- Public framing: volume is evidence of repeated visual judgment only when images are selected, named, captioned, routed, and promoted into durable site memory.

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
- Use `$` as substrate, not only money: canvas, memory address, browser storage, table session, recipe base, material surface, infrastructure, attention, and support layer can all receive and mutate charge.
- CTAs should be distinct by transformation: `~ mine prompt handles`, `^ publish RPG images`, `^ keep proof`, `@ choose a session`, `$ inspect substrate`.
- Align prompt-mining handles with `.spw/conventions/operator-alignment.spw` so extracted prompt dimensions preserve operator meaning: `~` for latent variants, `$` for substrate, `!` for transformation, `^` for proof or publishable artifact.

### First visible patch
- Home hero now names prompt mining and substrate charge as a reason to read.
- Home CTAs distinguish prompt mining, RPG image publishing, proof cards, commissions, system understanding, and current substrate.
- Midjourney Bench now exposes usage volume, prompt mining, and session publishing as public proof/workflow.
- RPG Wednesday now has an image publishing loop for promoting kept renders into session memory.

### Validation
- `git diff --check`
- `node --check public/js/spw-prompt-utils.js`
- `npm run check`
- targeted `rg` checks for new prompt-query hooks and updated route links

### Out of scope
- New client-side dependencies
- A full asset-management rewrite for the local gameplay kit
- New generated images during this pass
