# Site vs Workbench Boundary

I kept conflating “the language” with “the website.” They share ideas; they are
not one codebase.

## Use spwashi.com skills for

- Public copy and route HTML
- CSS tokens, surfaces, menus, images
- Browser runtime in `public/js/`
- `.spw` that explains or inspects **this site**

## Use `.spw/_workbench` only when

- A mounted script or parser is the actual source of truth
- The user explicitly wants tooling/canon upstream
- A site concept truly depends on changing workbench ontology

## Do not assume workbench rules on the site

- The site is mostly HTML/CSS/JS, not a TypeScript application
- Many improvements are copy, layout, or progressive enhancement—not packages
- Validation is route- and contract-focused, not full-app test coverage
- Site skills can be lighter than workbench process theater

If work spans both, say so and patch them as two related systems—not one merged
workflow that smuggles workbench complexity into public routes.
