# Site vs Workbench Boundary

Use `spwashi.com` skills for:

- public copy and route structure
- CSS tokens, surfaces, menus, and image treatment
- browser runtime behavior in `public/js/`
- `.spw` files that explain or inspect the site

Use `.spw/_workbench` only when:

- a mounted script or reference is the actual source of truth
- the user explicitly wants to change parser/tooling canon
- a site concept depends on a workbench ontology that should change upstream

Do not assume the workbench constraints apply to the site:

- the site is mostly HTML/CSS/JS, not a TypeScript app
- many improvements are copy, semantics, or layout changes, not package-level refactors
- validation is usually route-focused, not full-app build/test coverage

If a change truly spans both surfaces, say so explicitly and patch them as two related systems, not as one merged workflow.
