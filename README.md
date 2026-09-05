# spwashi.com

I'm Spwashi. I build software and make art.

This repository is my studio site and a working sample of the public surfaces I can build: hand-authored HTML, layered CSS, progressive ES modules, and editor-facing `.spw` inspection. No React, Vue, Svelte, or Tailwind. The site is meant to be read as it grows — by a visitor, a collaborator, or an agent.

The site is a surface for the work. Spwashi is the person.

## What this shows

- Directory-routed pages (`<route>/index.html`) with a shared runtime and design system.
- A magazine rhythm rather than a first-impression funnel: A-cycle closes the 13th, B-cycle the 26th. Return visits are the point.
- Image curation, route-specific imagery, and editorial variety.
- Small replayable interactions: spells, checkpoints, local memory, living terms.
- A codebase that stays inspectable — tokens, `data-spw-*` attributes, and `.spw` contracts — instead of hiding behind a framework.

Live: [spwashi.com](https://spwashi.com/). Current issue: [`/now/`](https://spwashi.com/now/).

## Services

The site is also a live sample of work I can do:

- site and surface design
- content and information architecture
- JavaScript and CSS runtime work
- image selection, promotion, and curation
- small-site maintenance and iterative improvement

If you are evaluating me for client work, this repository is a practical map of range and pace.

## Pace

Steady public increments. The goal is not a flashy one-off. Keep the surface useful, the structure legible, and the next issue possible.

## Support

Sponsorship is appreciated if the site or the approach is useful to you.

## Local development

```bash
npm ci --ignore-scripts
npm run hooks:install   # optional: versioned git hooks
npm run dev
```

Default offline gate (no registry call):

```bash
npm run check:local
```

`npm run check` is the full pre-landing sweep. It includes `npm audit` and needs the network. Use it when dependencies change.

Other commands worth knowing:

| Command | Use |
|---|---|
| `npm run build` | Typecheck, CSS bundles, static deploy into `dist/` |
| `npm run build:local` | Same builder with local flags (`npm run build -- --local`) |
| `npm run catalog` | Regenerates the in-tree design catalog (`design/catalog/`, gitignored) |
| `npm run visual:checks` | Pocket stills that fail when ink/light ignore attention |
| `npm run audit:copy:accessor` | Copy-unit census (dotted keys vs Spw handles) |
| `npm run audit:module-selectors` | Catalog selectors vs public HTML hosts |
| `npm run ecology` / `npm run ecology:language` | Runtime packs vs Spw language (do not conflate) |
| `npm run test:engagement` | Engagement/runtime tests after compile |

PWA: `npm run check:pwa` when touching `sw.js`, `manifest.webmanifest`, or offline routes.

## For agents and editors

`AGENTS.md` is the always-on gate. Model adapters (`GROK.md`, `CLAUDE.md`, `GPT.md`, `GEMINI.md`) emphasize relative strengths; they do not replace it. Prove adapters with `npm run check:agents` (files must be git-tracked).

Open first:

- copy / voice / localization keys → `.spw/conventions/copy-accessor.spw`
- CSS layers / first-paint → `.spw/conventions/css-instruction.spw`
- agent environment → `.agents/plans/agent-optimization/PLAN.md`
- commit wording → `.agents/plans/history-reflow/PLAN.md` plus `git log -1 --format=%B`

Creator-first copy: _"I'm Spwashi. I build software and make art."_

## Cloning this as a starter

The codebase is built to be re-derived, not just read. Two models carry most of the transferable value:

**The material model.** Surfaces behave like materials: glass cards, matte panels, grain, brace-form containers, and an operator color grammar, all driven by tokens in `public/css/tokens/core.css` and composed through CSS layers (`reset → tokens → … → ornament`). `public/css/compose.css` and `public/js/compose.js` are standalone entrypoints that carry the material system without the site shell. `npm run starter:inventory` prints the boundary between what is portable and what is this site's identity.

**The metacognitive model.** Pages describe themselves: `data-spw-*` families name role, slots, gestures, and learnable dimensions; `.spw/` files keep concepts inspectable beyond one patch; the runtime narrates mounting, attention, and memory. `npm run catalog` cross-references attributes, tokens, stylesheets, and philosophy docs — including orphans — so drift is visible.

Practical starting points:

- `design/composition/` — standalone bundles that teach composition and theming
- `design/components/` — component glossary, copyable recipes, capture workflow
- `AGENTS.md` — working contract for humans and agents
- `npm run icons:pwa` — derive the launcher icon set from one artwork
- `.agents/plans/` — how work stays traceable across sessions
- `/tools/spw-parser/` — public proof that authored Spw parses

The same structure that runs this studio site runs lore: RPG Wednesday (`/play/rpg-wednesday/`) uses the identical card grammar, session traces, and inspection surfaces — a worked example of the starter carrying a world instead of a portfolio.
