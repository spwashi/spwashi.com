# Plan: design studio

**Status 2026-10-06.** Landed 594076ab (2026-09-28): `/design/logos/`, `/design/cards/render/`, `/design/theme/colors/`, `studio-preview.js`, `design-studio.css`. Open: the creator chooses a logo direction.

## Goal

Give collaborators three small, linked review surfaces for a logo, image card and frame composition, and theme colors. The output is a concrete preference or specimen to discuss, not an automatic change to the site's shared design system.

## Scope

- `/design/logos/`: three SVG directions, shareable anchors, email preference links, a linked SVG specimen, and the old install icons.
- `/design/cards/`: orientation for card and frame work; `/design/cards/render/` previews a local image, crop, caption, and frame.
- `/design/theme/`: orientation for theme work; `/design/theme/colors/` previews four color roles, presets, a reading card, contrast ratios, and copyable values.
- `/design/` and `/design/website/` link into the studio.

## Boundaries

- The controls make local previews only. They do not write global settings, upload images, or declare a new semantic family.
- The currently installed PWA icon remains the frame and direction mark while the two other directions collect feedback.
- Keep public routes framework-free; one small module owns both interactive previews.

## Validation

- Build the site and check that all three routes and linked assets exist in `dist/`.
- Verify the card controls, color presets, and contrast output in a browser.
- Run `npm run check:pwa`, `npm run check:local`, and `git diff --check`.
