# spwashi.com Site Workflow

This repository is a hand-authored static site with four main edit surfaces:

- route HTML in directory `index.html` files
- shared CSS under `public/css/`
- shared JavaScript modules under `public/js/`
- editor-facing `.spw` bridges under `.spw/` and `.agents/plans/`

Default edit order:

1. Clarify the public goal first: copy, route flow, interaction, or editor inspectability.
2. Patch the smallest honest surface:
   - copy or semantics in route HTML
   - shared tokens/components/surfaces before page-local CSS
   - progressive-enhancement JS only when HTML/CSS cannot carry the behavior
   - `.spw` files when the concept should stay inspectable in the editor
3. Preserve hand-written structure and root-relative asset paths.
4. Keep the site framework-free unless the user explicitly asks for tooling.
5. Treat `.spw/_workbench` as optional reference/tooling, not the default edit target.

Default validation:

- `git diff --check`
- `node --check <file>` for edited JS modules
- targeted `rg` checks for anchors, asset paths, or data attributes
- file existence checks for new images or `.spw` routes

When a change needs editor support, wire it into `.spw/index.spw` or `.spw/site.spw` instead of leaving it as prose only.
