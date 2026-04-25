# Developer Topography

This site is a static business/studio site with progressive enhancement. It should be possible to adapt it for another developer, illustrator, author, or small team without adopting a framework.

## Mental Model

Use this map before editing:

| Layer | Meaning | Main files |
| --- | --- | --- |
| Route | A public page and its business purpose | `*/index.html` |
| Shell | Header, nav, footer, settings chrome | `public/css/spw-chrome.css`, `public/js/spw-shell-disclosure.js` |
| Region | A named section of a page | route HTML, `public/js/site.js`, `public/js/spw-page-metadata.js` |
| Component | A reusable card, panel, frame, image surface, or control | `public/css/spw-components.css`, `public/js/spw-component-semantics.js` |
| Module | A progressive JS behavior mounted only when the route/DOM needs it | `public/js/site.js` module definitions |
| Slot | A stable internal part of a component | `data-spw-slot="header|body|figure|actions|footer"` |

## Shared JS Contracts

`public/js/spw-dom-contracts.js` is the naming registry for the DOM. Add selector families there before duplicating long selector lists in multiple modules.

Key exports:

| Export | Use |
| --- | --- |
| `SITE_TOPOGRAPHY` | Human-readable map of route, shell, main, region, component, module, and slot selectors |
| `REGION_SELECTOR` | What counts as a profiled page region |
| `COMPONENT_SELECTOR` | What receives semantic component snapshots |
| `MODULE_SELECTOR` | What can receive contextual/module state |
| `SEMANTIC_CHROME_SELECTOR` | What can receive semantic helper chips/metadata |
| `inferTopographyKind()` | Shared structural kind inference |
| `buildAxisGenome()` | Builds inspectable axis tokens such as `kind-card role-routing density-compact` |

## Runtime Sequence

`public/js/site.js` is the bootstrap and lifecycle owner.

1. Normalize route metadata and landmarks.
2. Prime page regions.
3. Mount immediate core modules.
4. Mount immediate feature/enhancement modules.
5. Refresh region profiles after semantic enrichment.
6. Start page-arrival timing.
7. Mount visible, interaction, region, and idle modules as needed.

If a feature needs JavaScript, add it as a module definition in `site.js`. Avoid top-level imports for optional behavior; use `load: () => import(...)` so pages only pay for what they use.

## CSS Ownership

Prefer this ownership order:

| File | Owns |
| --- | --- |
| `spw-tokens.css` | colors, spacing, timing, depth, semantic aliases |
| `spw-shell.css` / `spw-chrome.css` | page shell, nav, footer, global chrome |
| `spw-components.css` | reusable cards, panels, slots, route markers, component timing |
| `spw-grammar.css` | Spw operator/brace grammar |
| `spw-surfaces.css` | shared page-surface layouts that are not one route only |
| route CSS files | route-specific atmosphere and layout exceptions |

Avoid broad selectors like `.card, .panel, .thing, [data-*]` unless they are inside `:where()` and backed by a shared contract. If a selector list appears in more than one JS or CSS file, it probably belongs in a contract or a component class.

## Component Profiles

The runtime writes two inspectable profiles:

| Attribute | Meaning |
| --- | --- |
| `data-spw-component-kind` | Structural kind such as `frame`, `panel`, `card`, `surface`, or `lens` |
| `data-spw-component-address` | Compact address like `card/routing/analysis/path` |
| `data-spw-component-genome` | Axis tokens for styling and inspection, for example `kind-card role-routing interactivity-navigable` |
| `data-spw-region-genome` | Region-level axis tokens such as `harmony-indexed tempo-snap density-compact` |

For client work, translate these terms into plainer labels if needed:

| Spw term | Plain business term |
| --- | --- |
| region | page section |
| component | reusable page block |
| genome | profile axes |
| operator | visible intent marker |
| shell | persistent site chrome |
| module | optional JS behavior |

## Starter-Site Rule

When adapting this for someone starting a business:

1. Keep the route/region/component/module map.
2. Replace copy, imagery, payment links, and page metadata.
3. Keep `spw-dom-contracts.js` as the selector registry.
4. Keep route-specific styling out of shared CSS unless a second page needs it.
5. Add behavior by mounting a module from `site.js`, not by scattering one-off script tags.
