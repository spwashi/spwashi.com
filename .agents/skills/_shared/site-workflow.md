# spwashi.com Site Workflow

This repository is a hand-authored static site with four main edit surfaces:

- route HTML in directory `index.html` files
- shared CSS under `public/css/`
- shared JavaScript modules under `public/js/`
- editor-facing `.spw` bridges under `.spw/` and `.agents/plans/`
- agent operating surfaces (skills, planning ecology, validation contracts, public editor pages such as `/about/plans/`) — maintained via `spw-plan-maintenance` and tracked in `agent-optimization/PLAN.md`

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
- `npm run check:local` for ordinary non-dependency patches; it avoids the network-backed npm audit while still running local build, CSS/runtime/site, generated-output, and diff checks
- targeted `rg` checks for anchors, asset paths, or data attributes
- file existence checks for new images or `.spw` routes

Network posture:

- Prefer local repo evidence first: `rg`, plans, `.spw` conventions/reviews, generated manifests, and nearby source files.
- Use `npm run audit`, `npm run check`, dependency installs, or external web searches only when the patch touches dependency resolution, the user asks for external/current information, or local context is insufficient.

When a change needs editor support, wire it into `.spw/index.spw` or `.spw/site.spw` instead of leaving it as prose only.
