# Chrome, Navigation, and Metaphysical Wonder (2026 review)

**Status 2026-11-06.** Landed: the closed-header swipe (`02c7757a`), the coarse-pointer hamburger (`b893cec3`), the pocket rail that shows the reader's position in Spw at a layer they choose (`7018898c`, fixed under the flourish pack in `c348c0f7`), and the rail's reach into the six hubs that wrap their clusters in one bare `main > article` (`320fc4b9`). Since 2026-10-30 only the rail's `$` key changed, now titled `$satchel` (`902738b4`). Next slice: the `&` layer names a component instead of its kind; home's four lens panels still read `lens`. It now has two routes, authored headings or the expression each panel already carries, and the rail label waits on the creator's look either way. Motion between layers waits on a designed pass, the open-drawer swipe waits on the creator's answer in `index.spw`, and Phase 3 is dormant.

**Review sitting:** [ui-review-sitting-2026-10](../../../.spw/caches/ui-review-sitting-2026-10.spw) — ungated.home_rail_ids, home.menu_toggle, calls.drawer_swipe, seams.home, seams.breadcrumbs, seams.menu_toggle.

**Home renovation (the creator, 2026-11-08):** [home-renovation-2026-11](../../../.spw/caches/home-renovation-2026-11.spw#rail) proposes the rail as a breadcrumb of nested braces, symmetric about the reader's place, with the moves as operators. Its first live demo goes behind `?spw-rail=crumb`, which would answer this plan's breadcrumb-owner wonder if the creator agrees.

**Related:** [floating-chrome-stack](../floating-chrome-stack/FIX.md) · [spellcraft-authoring](../spellcraft-authoring/PLAN.md) (breadcrumb spell) · [mobile-chrome-alignment](../archive/mobile-chrome-alignment/PLAN.md) (archived). **Absorbed 2026-10-10:** [navigation-header-disclosure](../archive/navigation-header-disclosure/PLAN.md) · [page-region-discoverability](../archive/page-region-discoverability/PLAN.md).

## Next slices — 2026-11-06

1. **The `&` layer names the component.** `componentOf` in `public/js/runtime/attention/section-handle.js` reads `h2, h3, h4, figcaption, .frame-card-title` and falls back to `data-spw-kind`. Home's four lens panels (`index.html#home-lens-reading` and its siblings) have no heading, so the rail reads `lens`, though each lede already carries an expression: `home[reading]{craft}<entry>`, `home[systems]{parser}<inspect>`, `home[play]{table}<session>`, `home[studio]{commission}<offer>`. There are two routes. One is short authored headings, which is the creator's copy. The other lets `componentOf` read the nearest expression's `subject[mode]` before the kind, so the rail shows Spw the page already wrote and teaches the slot it is reading. Gate: a pocket demo for the creator's look (`index.spw#wonder_chrome_navigation_wonder_component_name`). Verify: a headless pocket probe of `/` with a 12s settle and the rail on `&` reads the chosen name on `#home-lens-reading`.
2. **Recheck the menu toggle.** Row 2 from [state-block-projections](../state-block-projections/PLAN.md#absorbed-2026-10-10--attention-shell-contrast): the toggle read as ambient chrome before it became a glyph. Ungated sensor: `npm run visual:checks -- --ids=home-nav-open` (`scripts/lib/viewport-still-recipes.mjs:84`); fix only if the still still says so.
3. **The header Cauldron action on `/play/`.** It links to `/play/#media-cauldron` from `/play/` itself (`scripts/template.mjs:846`). A page-aware de-emphasis, so the action reads as here rather than a trip, is still owed from navigation-header-disclosure. Gate: the creator's look at the header.

## Landed

- **Swipe on three of four edges.** The closed header cycles rooms (`resolveHeaderRoomHop`, `public/js/runtime/interaction/hops.js`, `02c7757a`); the collapsed rail sends swipes through prev/next (`resolveSectionHandleSwipe`, `section-handle.js`, `c7da1438`); the landmark rail cycles through `LANDMARK_CONTRACT` (`hops.js:23`, `724caa1b`). The open drawer has none (`grep -c swipe public/js/runtime/shell/shell-disclosure.js` prints 0), and whether it should is a wonder.
- **Hamburger.** A glyph on a coarse pointer or at pocket width, with labeled `Routes` only inline (`b893cec3`); CSS and JS share `DRAWER_MENU_QUERY`.
- **Phase 0 and 1, 2026-07.** `syncChromeLocomotionExpression` in `section-handle.js` writes `data-spw-wonder-entry="section-locomotion"` and `data-spw-approach` on the handle while the trail is active; `shell/chrome/section-context.css` ties wonder-entry styling to `--field-balance`; `shell/chrome/navigation.css` holds the toggle copy's width (FIX.md); `shell/chrome/footer.css` sets the mobile stack rhythm; `.spw/conventions/component-taxonomy.spw#locomotion_expression` and `.spw/conventions/cognitive-navigation.spw` carry the contract. Rule kept: reach, return and invitation stay on `page_locomotion_handle`'s existing datasets, with no confidence widget and no duplicate attributes on `<html>` or `<body>`.
- **Shared polish, 2026-05-31.** Inline nav links no longer shrink into each other; viewport tier, pointer and hover mode come from the always-mounted shell disclosure; `frame-grid--2up`/`--3up` fall back to honest columns below desktop.
- **Menu field, 2026-06-28.** The shell disclosure state machine stays the owner of menu mode, topology, pressure, phase and dismissal; arcs compose through haptics; the field is described in `.spw/surfaces/menu-field.spw` and `.spw/conventions/circuit-components.spw` (from the archived space-menu-arcs-electrical plan).

## Public Goal
Improve the primary navigation (header via `<spw-site-header>`), section handles, breadcrumbs, and footer so they are genuinely pleasant on mobile, encourage curiosity/discovery/wonder, and feel like part of the Spw attentional field rather than administrative chrome.

Simultaneously honor the philosophical shift: operators as "elements or forces" for metaphysical play (grammar of thought, interactions that produce resonance and emergence), with surface theming carried by the semantic accent family rather than direct operator hues. This keeps the operator palette as a stable, inspectable "periodic table" of forces while surfaces and ornament project lived accent.

Support the longer-term vision of a scientifically-social component taxonomy: a model with enough depth and rhythmic discovery that it naturally invites wonder about the underlying sciences of attention, systemic resonance, and emergence — and makes art a natural extension rather than a separate domain.

## Review findings, 2026-05 (compressed)

- **Templates.** The header and footer are custom elements (`<spw-site-header>`, `<spw-site-footer>`) over a static seed in `_partials/site-footer.html`; each route's `index.html` is hand-authored with a consistent `<body data-spw-*>` profile, `<main id="main-content">`, labeled navs and skip links. Markup quality on the sampled routes was strong.
- **Navigation pain.** The mobile menu's state machine (menu mode, phase, pressure, topology) was powerful but opaque on small screens; the section handle was more utility than invitation; breadcrumbs lived in JSON-LD and settings, not on the page. The hamburger, the rail's Spw layers and the `.` path layer have since answered most of this.
- **Footer.** The identity column stacked brand, page architecture, the cauldron and the settings form densely on phones; `shell/chrome/footer.css` now owns that rhythm.
- **Color.** Operators stay the stable palette of forces; `--semantic-accent` and `--component-accent*` carry lived surface accent by route and state. Phase 3 would name that two-layer model in `public/css/tokens/core.css`; nothing there names operators as forces yet.
- **Surface redundancy.** The `body[data-spw-surface="…"] { --…-accent: var(--semantic-accent, …) }` pattern repeats across about fifteen route files. It is intentional propagation, and consolidating it is not urgent.

### Long-term Vision Alignment
The request for a "scientifically-social model of component taxonomy" with depth, discovered rhythms, art as natural extension, and encouragement of wonder about the sciences of attention / "systemically enforced resonance and emergence" maps *directly* onto the existing Spw ontology:
- Operators as forces/elements.
- Brace forms and semantic expressions as interaction grammar between forces.
- Attention field (field-intensity, resonance, collection-strength, valence, wonder-memory, deviation-*) as the measurable systemic resonance.
- Ornament as the visual projection layer.
- Experiential gestures (tap/hold/swipe) + data-spw-interaction-hint / learning-note / visual-anchor as extensions of human attention.
- Cards, frames, wisdom decks, cauldrons, social kitchen practices (the 6 skills) as living laboratories.
- Design hub as the playable instrument panel for exactly this kind of discovery.
- Math pages, recipes, play/rpg, newyear as cross-domain demonstrations of the same patterns.

This is not a new feature request — it is naming and deepening the existing contract so it becomes more legible, extensible, and inviting to both humans and models.

## Success Signals
- Mobile header/footer and section navigation feel like delightful, curiosity-inviting parts of the surface rather than obstacles.
- A new visitor to /design/ can tap/hold/swipe their way into understanding both concrete UI and the deeper "forces + resonance" model without reading docs.
- Operators feel like playable elements/forces in both the UI grammar and the metaphysical story.
- The component taxonomy becomes a living, cross-route artifact that makes the sciences of attention and emergence feel approachable and artistic.

## Open beyond the slices

- **Breadcrumbs.** The rail's `.` path layer (`7018898c`) is the on-page breadcrumb, and `runtime/experiential/breadcrumb-spell.js` assembles the trail and the live spell path. The sitting's `seams.breadcrumbs` proposes that the route path stays here and the spell trail stays in spellcraft-authoring, both reading the one anatomy reader that `.spw/caches/craft-shelves-2026-10.spw` primes. Owner: `index.spw#wonder_chrome_navigation_wonder_breadcrumbs`.
- **Phase 3, dormant 2026-10-10.** The operator-forces and semantic-accent doc pass in `tokens/core.css` and the operator atlas. No live plan picks it up.

## Shell offset receipt — 2026-09-17

`--spw-shell-menu-offset` (menu panel top, search overlay top, route-menu max-height) is now written from a measured lane in `shell-disclosure.js`: the header rect is read after the frame's style pass, once per band change or trace change, instead of synchronously after the class toggle that moves it. The shell also reads scroll and viewport before its mount writes and no longer re-reads `innerWidth` on every pointer, focus, and nav-structure sync. Any new chrome that positions itself off the header edge should consume that token, not measure the header again.

## The rail as a Spw summary — 2026-09-28
Tapping the pocket rail's toggle made it vanish: the tap charged the shell and `effects/wonder.css` (flourish pack) turned every charged host `position: relative`, beating `position: fixed`; floating chrome is now excluded (c348c0f7). The rail's title is no longer the heading sentence: it shows a Spw position at a layer the reader cycles from an operator button, `#>` region (frame address), `.` path (dot-joined breadcrumb), `&` component (title around the reading groove's lead), `!` recent activation; the choice persists locally, the heading stays the link's name, and an expanded pocket rail wraps the summary onto its own row (7018898c). Open: motion between Spw positions (creator: later, designed); pages authoring short section ids and component headings so each layer says something; whether the header's spell path should follow the rail's layer.

## Absorbed 2026-10-10 — navigation-header-disclosure

Landed: the glyph hamburger on a coarse pointer or pocket width, with labeled `Routes` only in inline mode. Also landed: the Cauldron and Attention posture header actions (`scripts/template.mjs`), the posture preview button with its explicit `Open settings` link (`runtime/shell/attention-posture-panel.js`), and the `Display` disclosure. Rules worth keeping:
- CSS and JS share `DRAWER_MENU_QUERY` (`shell-disclosure.js`), so the strip and the toggle cannot both paint.
- `data-spw-menu="open"` is the disclosure source, and `data-spw-menu-overlay="active"` is the visual drawer state.
- A control that JS intercepts is a button, not a link; navigation sits in an explicit link beside it.

Still owed: a page-aware de-emphasis of the header Cauldron action on `/play/`, where it links to its own page (`template.mjs:846`). Revisit header hierarchy only if route actions, cauldron, posture and display still compete. Source: [navigation-header-disclosure](../archive/navigation-header-disclosure/PLAN.md).

## Absorbed 2026-10-10 — page-region-discoverability

This plan is now the owner of record for regions, rails and anatomy. The page-region rail (`runtime/regions/page-region-rail.js`, `handles/page-region-rail.css`), `route-discovery` and region profiling all landed by 2026-06-28. The durable contract is `.spw/slices/page-region-discoverability/index.spw`. Rules worth keeping:
- No page-region-owned client-side store. Region diversity is an input signal; persistence belongs to `runtime/memory/component-collection.js`.
- No mass restructuring of route HTML.

Nothing is owed except a check: validation was skipped for its 2026-06-28 stabilization patch at the creator's request. Source: [page-region-discoverability](../archive/page-region-discoverability/PLAN.md).
