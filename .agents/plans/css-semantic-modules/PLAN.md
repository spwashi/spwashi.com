# CSS Semantic Modules

## Public Goal

Make CSS easier to debug, teach, and refactor by moving from large hand-edited CSS files toward semantic source modules while preserving the current static-site output contract.

## Direction

- Keep `public/css/style.css` as the public stylesheet manifest until a build step proves a cleaner equivalent.
- Prefer native CSS plus PostCSS for build-time organization and standards-aligned transforms.
- Keep SCSS available as a later authoring option, not the default migration requirement.
- Treat “CSS modules” as semantic owner files first: shell, chrome, grammar, components, surfaces, routes, handles, effects, ornament.
- Compile to predictable public CSS that keeps cascade layers explicit.
- Source entries under `src/styles/entries/` compile or copy to `public/css/`.
- Keep comments short: one-line guardrails at ownership boundaries and selector traps.

## Likely Files

- `public/css/style.css`
- `public/css/spw-debug.css`
- `public/css/spw-*.css`
- `public/css/*-surface.css`
- `scripts/ts/css-build.mts`
- `scripts/ts/css-contracts.mts`
- `package.json`
- `postcss.config.mjs`
- `src/styles/**`
- `.spw/conventions/css-instruction.spw`

## Semantic Seams

- `body[data-spw-surface]` owns route identity.
- `data-spw-features` gates reusable feature systems.
- `data-spw-feature` names route-local clusters.
- `data-spw-slot` names component anatomy.
- `data-spw-module` and runtime component ids name enhanced machinery.
- CSS source modules should map to these seams instead of arbitrary visual buckets.

## Migration Shape

1. Add validation for CSS headers, layer imports, and route-linked stylesheets.
2. Create source folders without changing output paths.
3. Move low-risk route/debug surfaces into native/PostCSS source and compile back to the same public CSS.
4. Move one shared layer after the route proof is stable.
5. Decide whether SCSS adds enough value after the native/PostCSS proof.

## Constraints

- Do not break root-relative asset links.
- Do not change cascade layer order casually.
- Do not introduce framework runtime dependencies.
- Do not require PostCSS plugins for the current hand-authored CSS inventory.
- Do not hide semantic selectors behind nesting deep enough to obscure the final CSS.
- Do not hash class names; this site depends on inspectable HTML/CSS vocabulary.

## Validation

- `git diff --check`
- `npm run build:tools`
- `npm run build:css`
- `npm run check:css`
- `npm run check`
- Targeted check that generated CSS still imports from `public/css/style.css`.
- Targeted check that route-linked extra stylesheets still resolve.

## First Proof

- `src/styles/entries/design-experiments.css` -> `public/css/design-experiments.css`
- `src/styles/entries/spw-debug.css` -> `public/css/spw-debug.css`
- `src/styles/entries/tools-budgeting-surface.css` -> `public/css/tools-budgeting-surface.css`

## Out Of Scope

- Full CSS rewrite.
- Converting every file into source modules in one pass.
- CSS-in-JS or framework CSS Modules.
- Minification or hashed production class names.
