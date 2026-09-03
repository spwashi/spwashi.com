# Living Medium Copy Pass

## Goal
Update the public copy across spwashi.com so major routes read more clearly as lore, documentation, and a developing medium that can support RPG Wednesday, generative practice, and reusable media seeds.

## Contract
- Keep the site static-first and crawlable.
- Add reason copy to cards, banners, and landing surfaces.
- Use lightweight disclosure only when the full explanation is still present in HTML.
- Preserve semantic HTML, route structure, and keyboard/reduced-motion safety.

## Surfaces
- Home
- Play
- RPG Wednesday and nested campaign routes
- Software
- Tools
- Recipes
- Settings
- Component and operator documentation

## Follow-up
- Revisit any route whose cards still read like labels instead of entry points.
- Keep the editorial microformats reusable so future pages can borrow the same structure.

## Active refinement — living concept circulation

### Public goal
Help readers recognize each major route's distinct job, then follow a concept through noticing, naming, connection, practice, and return.

### Boundaries
- Treat vascular language as a navigation and learning model, not a biological claim.
- Prefer headings, links, ordered lists, and existing component slots over new attributes or runtime behavior.
- Keep creator identity, canonical routes, and the current operator grammar fixed.

### Minimal surfaces
- `index.html`: explain the living-concept circulation loop beside the existing interaction gestures.
- `contact/index.html`: turn inquiry guidance into a genuinely ordered sequence and remove stale date-bound copy.
- `.spw/conventions/site-semantics.spw`: retain the public model and its falsification rule.

### Validation
1. Run `npm run audit:copy`.
2. Run targeted link, heading, and duplicate-id checks on edited routes.
3. Run `npm run check:local` and `git diff --check`.
