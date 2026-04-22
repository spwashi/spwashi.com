# RPG Character Hub

- Turn the existing `/play/rpg-wednesday/cast/` route into the practical character-development hub for RPG Wednesday.
- Add a browser-local character deck optimized for first entry: name first, optional art upload, then gradual enrichment.
- Tighten route links and shared RPG guidance so shy illustrators and curious developers both get a clear next move.
- Keep shared changes narrow: reuse existing local image storage, reuse existing RPG runtime patterns, and avoid introducing a second competing state model.

## Files likely to change

- `play/rpg-wednesday/cast/index.html`
- `play/rpg-wednesday/index.html`
- `public/js/rpg-wednesday.js`
- `public/js/rpg-wednesday-state.js`
- `public/js/rpg-wednesday-dom.js`
- `public/js/rpg-wednesday-shortcuts.js`
- `public/js/spw-image-store.js` (reuse only if needed, avoid new storage infra)
- `public/css/spw-surfaces.css`
- `public/css/rpg-wednesday-surface.css`

## Validation

- `node --check` on touched JS files
- `git diff --check`
- `npm run check`
