# spwashi.com

`spwashi.com` is my personal studio site and a working demo of the kind of public-facing site I can build for a client. It combines hand-authored HTML, a shared CSS system, progressive JavaScript, and editor-facing inspection surfaces so the site stays readable as it grows.

I’m Spwashi. I build software and make art.

## What This Shows

- Route-specific pages with a shared runtime and design system.
- A content model that supports returning visitors instead of treating every visit like a first impression.
- Image curation, route-specific imagery, and light editorial variety across the site.
- Spell-like navigation, checkpoints, local memory, and other small replayable interactions.
- A codebase that is meant to be inspected, extended, and adapted rather than hidden behind a framework.

## Services

The site also serves as a live sample of the services I can provide:

- site and surface design
- content and information architecture
- JavaScript and CSS runtime work
- image selection, promotion, and curation
- small-site maintenance and iterative improvement

If you are evaluating me for client work, this repository is a practical map of the range I can cover and the pace I work at.

## Pace

This project develops in steady, public increments. The goal is not to ship a flashy one-off and stop. The goal is to keep improving the surface, keep the structure legible, and keep the site useful as the work evolves.

## Support

Contribution via sponsorship is appreciated if the site or the approach is useful to you.

## Local Development

```bash
npm install
npm run dev
```

Other useful commands:

- `npm run build`
- `npm run build:local`
- `npm run build -- --help`
- `npm run check`
- `npm run test:engagement`

## Cloning This As A Starter

The codebase is built to be re-derived, not just read. Two models carry most of
the transferable value:

**The material model.** Surfaces behave like materials: glass cards, matte
panels, grain, brace-form containers, and an operator color grammar, all driven
by tokens in `public/css/tokens/core.css` and composed through CSS layers
(`reset → tokens → … → ornament`). `public/css/compose.css` and
`public/js/compose.js` are standalone entrypoints that carry the material
system without the site shell — `npm run starter:inventory` prints the exact
boundary between what is portable and what is this site's own identity.

**The metacognitive model.** Pages describe themselves: `data-spw-*` attribute
families name each component's role, slots, gestures, and learnable dimensions;
`.spw/` files keep the concepts inspectable beyond any one patch; and the
runtime narrates its own mounting, attention, and memory so a reader (or an
agent) can see how the page became meaningful. `npm run catalog` generates a
cross-reference of every attribute, token, stylesheet, and philosophy doc —
including orphans — so drift is visible.

Practical starting points:

- `design/composition/` — standalone bundles that teach composition and theming
- `design/components/` — the component glossary, with copyable recipes and a
  capture workflow for verifying your adaptation at phone and desktop widths
- `AGENTS.md` — the working contract for humans and agents editing the system
- `npm run icons:pwa` — derive the full launcher icon set from one artwork
- `.agents/plans/` — how work stays traceable across sessions

The same structure that runs this studio site runs lore: RPG Wednesday
(`/play/rpg-wednesday/`) uses the identical card grammar, session traces, and
inspection surfaces — a worked example of the starter carrying a world instead
of a portfolio.
