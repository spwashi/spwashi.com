# Editable Page Shell

## Goal

Make high-traffic pages easier for naive models to edit in place by moving repeated head and navigation chrome into HTML-native template directives while preserving hand-authored route content.

## Public Outcome

- Route files should expose page metadata, body semantics, and content near the top.
- Shared head and primary header markup should be generated from compact declarations.
- Shell microinteractions should feel polished across pages without route-local styling.

## Initial Slice

- `scripts/template.mjs` - add site head and site header directives.
- `_partials/` - keep existing footer/social partials compatible.
- `settings/index.html` - pilot route because it has a large head, visible investor-facing settings polish, and a clear runtime-observatory role.
- `public/css/spw-chrome.css` and `public/js/spw-shell-disclosure.js` - centralize subtle shell microinteraction behavior.
- `.spw/surfaces/page-model.spw` - record the page-shell directive contract if it becomes inspectable beyond this patch.

## Constraints

- Keep directives HTML-native custom elements.
- Do not introduce client-side frameworks or new dependencies.
- Generated output must remain static HTML at build/dev time.
- Route bodies stay hand-authored; do not template the actual editorial content yet.
- Microinteractions must respect reduced motion and touch assumptions.

## Validation

- `node --check scripts/template.mjs`
- `node --check public/js/spw-shell-disclosure.js`
- `npm run check`
- `npm run build -- --skip-image-check --skip-catalog` for a fast render smoke test
- targeted `rg` checks for unrendered `spw-site-head` / `spw-site-header` in `dist/`
