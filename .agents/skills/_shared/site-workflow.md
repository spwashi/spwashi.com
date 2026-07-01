# spwashi.com Site Workflow

This repository is a hand-authored static site with four main edit surfaces:

- route HTML in directory `index.html` files
- shared CSS under `public/css/`
- shared JavaScript modules under `public/js/`
- editor-facing `.spw` bridges under `.spw/` and `.agents/plans/`
- agent operating surfaces (skills, planning ecology, validation contracts, public editor pages such as `/about/plans/`) — maintained via `spw-plan-maintenance` and tracked in `agent-optimization/PLAN.md`

## Creator identity

Spwashi is a creator identity first. Copy leads with the person ("I build software and make art."); the site is a surface for the work.

## Default edit order

1. Clarify the public goal: copy, route flow, interaction, entertainment utility, or editor inspectability.
2. Patch the smallest honest surface:
   - copy or semantics in route HTML
   - shared tokens/components/surfaces before page-local CSS
   - progressive-enhancement JS only when HTML/CSS cannot carry the behavior
   - `.spw` files when the concept should stay inspectable in the editor
3. Preserve hand-written structure and root-relative asset paths.
4. Keep the site framework-free unless the user explicitly asks for tooling.
5. Treat `.spw/_workbench` as optional reference/tooling, not the default edit target.

## Semantic rails (read before broad work)

| Rail | When |
|------|------|
| `model-guided-refinement/` + `.spw/conventions/model-guided-refinement.spw` | focus dimensions, fixity tiers, cross-language traces |
| `daily-kernel-development/` + `.spw/conventions/daily-kernel.spw` | cross-discipline one-session kernels |
| `modular-experience-slices/` + `.spw/slices/` | durable ownership across HTML/CSS/JS/`.spw`/validation |
| `spw-surface-normalization/` | navigable `.spw` surfaces, dimensional declarations |
| `.spw/conventions/semantic-capacity.spw` | cache, audit, align, prime, contract, archive |
| `.spw/conventions/dimension-vocabulary.spw` | spatial/temporal/color/semantic/attention/interactive_medium axes |
| `.spw/conventions/interaction-microstates.spw` | gestures, phases, scene/key-event contracts |

## Runtime architecture

- Staged bootstrap via `public/js/runtime/module-catalog.js` (`CORE` → `FEATURE` → `ENHANCEMENT`)
- Root settings canonical in `public/js/kernel/site-settings.js` — no direct localStorage for settings
- Device context from `shell-disclosure.js` → consumed by `interactive-medium.js`
- Inspection snapshots: `page-anatomy.js`, `topical-payload.js`, module `__SPW_*__` APIs

## CSS layer order (lowest → highest)

`reset → tokens → shell → typography → grammar → components → systems → routes → handles → effects → ornament`

Module-added interactive styles live in `systems`; device/register modulation imports **last** within systems (`interactive-medium.css` after `spw-key-events.css`).

## Default validation

- `git diff --check`
- `node --check <file>` for edited JS modules
- `npm run check:local` for ordinary non-dependency patches
- `npm run check:runtime` when adding/changing runtime modules or catalog entries
- targeted `rg` checks for anchors, asset paths, or data attributes
- file existence checks for new images or `.spw` routes

## Network posture

- Prefer local repo evidence first: `rg`, plans, `.spw` conventions, generated manifests, nearby source files.
- Use `npm run audit` / `npm run check` only for dependency-sensitive patches or when the user asks for external/current information.

When a change needs editor support, wire it into `.spw/conventions/index.spw` or `.spw/site.spw` instead of leaving it as prose only.