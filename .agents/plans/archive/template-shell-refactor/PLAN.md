# Plan: template-shell-refactor

## Public Goal

Reduce repeated page chrome in route HTML by improving the HTML-native template renderer and moving repeated shell markup behind explicit directives.

## Likely File Set

- `scripts/template.mjs`
- `_partials/site-footer.html`
- route `index.html` files with repeated site footer or shell markup

## Scope

- Add a first-class footer directive so pages can use `<spw-site-footer>` instead of copying footer HTML or including the partial directly.
- Keep authored route HTML as the source of truth for page-specific content.
- Prefer mechanical replacements where repeated shell markup exactly matches the shared footer contract.

## Out Of Scope

- A framework migration.
- Template-driven generation of route body content.
- Large rewrites of per-route navigation choices unless the generated header can preserve the page's current state and metadata.

## Validation

- `npm run build:tools`
- `npm run typecheck`
- `node --check scripts/template.mjs`
- `npm run build:site -- --skip-image-check --quiet`
- targeted route checks for remaining footer/header duplication
