# Plan: spw-operator-pages

Create a public Spw operator atlas with one route per operator, plus enough discoverability and site registry wiring for the pages to become a durable authoring surface.

## Goal

The desired end state is a mobile-first operator reference that treats each Spw operator as an interaction primitive, a metaphysical model, and a future UI authoring contract. The pages should teach what an operator does, how it behaves when clicked or inspected, how prefix/postfix symmetry changes attention, and how brace physics can pivot a reader toward deeper structure. The taste note is **compact ritual clarity**: these pages should feel like a small cognitive machine, not a glossary dump.

## Scope

- **In scope**: add a `/topics/software/spw/` atlas, add one static route for each operator currently defined in `public/js/spw-shared.js`, link the atlas from the software and home surfaces, update public route registries, add compact CSS for operator cards/details, and include PWA cache/shortcut hooks.
- **Out of scope**: building a parser-backed page generator, changing existing keybindings, creating a full Spw LSP demo, or adding runtime spellcasting behavior in this pass.

## Files

[NEW] `.agents/plans/spw-operator-pages/PLAN.md`
[NEW] `.agents/plans/spw-operator-pages/wip.spw`
[NEW] `.agents/plans/spw-operator-pages/spw-operator-pages.spw`
[NEW] `topics/software/spw/index.html`
[NEW] `topics/software/spw/operators/*/index.html`
[MOD] `index.html` - expose the operator atlas from the artifact register
[MOD] `topics/software/index.html` - route software visitors to the operator atlas
[MOD] `.spw/site.spw` - record the operator atlas as a public surface
[MOD] `.spw/surfaces.spw` - register the route
[MOD] `.spw/conventions/site-semantics.spw` - formalize public operator page expectations
[MOD] `public/css/style.css` - add mobile-first operator atlas/detail styles
[MOD] `manifest.webmanifest` - add PWA shortcut
[MOD] `sw.js` - cache the atlas and operator pages

Craft guard:
- Keep pages hand-authored static HTML with shared CSS and no build tooling.
- Every operator page must expose the same sections: interaction, metaphysics, brace physics, and prefix/postfix symmetry.
- Every no-op or unavailable interaction should still provide inspectable meaning through copy, title, link, or route.
- Operator pages must remain readable and navigable on narrow screens without hover.

## Commits

1. `#[spw] - add public operator atlas and route plan`
2. `&[spw] - publish operator pages and discoverability hooks`
3. `.[semantics] - formalize operator page metaphysics and alchemistry`

Fuzz strategy:
- Explore loop: `fuzz:explore --target=spw-operator-pages`
- Stabilize loop: `fuzz:stabilize --target=spw-operator-pages`
- Ship gate: `fuzz:ship --target=spw-operator-pages`

## Agentic Hygiene

- Rebase target: `main@464341b049563857c0393d63d4531ddc04775053`
- Rebase cadence: before commit, before merge
- Hygiene split: none

## Dependencies

- `mobile-runtime-foundation` for mobile-first regions, portable inspect/invoke semantics, registers, and brace pivots.
- `pretext-whimsy-lab` for disciplined physics/wonder language.
- `spw-shared.js` for the current operator set.

## Failure Modes

- **Hard**: the atlas becomes a visual glossary and does not teach interaction semantics.
- **Hard**: operator pages imply clickable magic but do not explain unavailable behavior, causing exploration to feel inert.
- **Hard**: metaphysical language drifts away from inspectable UI behavior.
- **Soft**: repeated pages feel verbose or ceremonial without making the operator model easier to learn.
- **Soft**: new routes are not discoverable from existing software, home, navigator, or PWA paths.

## Validation

- **Hypotheses**: a stable page per operator will make the grammar more learnable; repeated page structure will let visitors compare operators; compact route hooks will make the atlas discoverable without bloating the software page.
- **Negative controls**: existing page routes, software content, header nav, analytics snippets, and framework-free structure remain intact.
- **Demo sequence**: open `/topics/software/`, find the Spw operator atlas, open `* stream`, traverse the operator ring on mobile width, then go offline after first load and confirm cached operator pages still resolve.

## Spw Artifact

`.agents/plans/spw-operator-pages/spw-operator-pages.spw`
