# Plan: production-demonstration-pass

**Selected focus (from analysis):** Recommendations 2 (media & performance pipeline completeness), 3 (deeper deliberate platform primitives showcase), and 4 (accessibility as flagship production concern) to increase the site's value as a credible, self-documenting demonstration of modern production web capabilities.

User context (2026-04+): "better use of images would be appreciated" + "I have a Midjourney subscription and can generate assets." This makes systematic image pipeline adoption (promotion, variants, responsive HTML wiring, semantic sidecars) a high-signal, immediately actionable part of the work.

## Public Goal
Make the spwashi.com site a stronger, more legible demonstration of thoughtful modern production practices in three visible areas:
- **Media**: Full use of the existing asset contracts (image-optimize, image-naming-magic, .spw sidecars, assets.spw discovery, size tiers, AVIF/WebP/PNG, proper `<picture>`/srcset/sizes with semantic alt and data attributes) so heroes, motifs, illustrations, and figures load faster, adapt better, and carry linguistic meaning.
- **Platform primitives**: Deliberate, progressive, and documented use of current web platform capabilities (View Transitions API, Popover API, CSS Anchor Positioning, scroll/view timelines, advanced container queries, PerformanceObserver surfaces, etc.) presented as "grounded in the Spw grammar and semantic model" rather than decorative add-ons.
- **Accessibility**: Expand the existing design/accessibility/ register into a living flagship pattern library and audit surface that demonstrates inclusive production hygiene (keyboard, focus, semantics, announcements, reduced-motion respect for all wonder/ornament/effects, contrast/density interplay) while staying inside the hand-authored, operator-driven aesthetic.

Taste note: **structural demonstration, not spectacle**. Every addition must remain inspectable via existing data-spw-* surfaces, .spw conventions, and the design catalog. The site should teach by example what disciplined, framework-free, linguistically coherent modern web production looks like.

Creator identity preserved: "I'm Spwashi. I build software and make art." All work must keep the person-first voice and recursive editorial loop (make → inspect → reroute → repeat) visible.

## Why This Matters Now
- The architectural foundations (CSS layers, Spw operators + braces, pervasive data-spw-* metadata, narrative instrumentation, wonder/attention systems, PWA with thoughtful caching, asset-management convention in .spw, image skills with size-tiers.spw) are already production-grade.
- Gaps are primarily in *adoption, visibility, and connective tissue* rather than invention of new primitives.
- User can supply fresh high-quality Midjourney sources → perfect intake into the documented workflow (naming-magic → optimize → sidecar → public HTML + assets.spw).
- Making these three areas exemplary turns meta-strengths into primary visitor value (especially on /design/, /about/website/, topic routes, and home).

## Scope
**In scope (minimal honest surfaces first)**:
- Media pipeline rollout (pilot on 3–5 high-visibility assets: 1–2 home heroes or motifs, 1 design/illustration, 1 from play/rpg or topics; full promotion + variants + responsive markup + alt + sidecar updates + assets.spw index refresh).
- Platform primitives: deepen View Transitions (beyond current `--spw-route-transition-name` vars on cards), introduce Popover API for at least one existing popover family (e.g. topic or semantic popovers), evaluate lightweight Anchor Positioning for handles/sigils or floating chrome where it reduces JS, surface PerformanceObserver data in settings/runtime observatory (building on existing runtime-load-instrumentation and layout-shift-audit), add 1–2 more advanced container or scroll-driven examples with clear documentation.
- Accessibility: expand [design/accessibility/index.html](/design/accessibility/index.html) with pattern examples drawn from the actual site (frame anatomy, operator chips, brace forms, mode switches, section handles, floating chrome), add explicit reduced-motion guards or tokens for all ornament/wonder/effects if missing, audit & patch key routes for missing aria/roles/focus/landmarks (smallest changes), document interplay with semantic-density and wonder states.
- Shared seams: any new data-spw-* (e.g. `data-spw-primitive="view-transition|popover|anchor"`, `data-spw-a11y-role` or similar) must follow existing naming families; update relevant .spw conventions (asset-management, perhaps new platform-primitives or a11y-contract notes).
- Plan artifacts, wip.spw (for editor inspectability of the three contracts), and light updates to design catalog or route runtime manifest if new attributes appear.
- Coordination notes for spw-plan-maintenance after landing.

**Out of scope (this plan)**:
- Full-site image migration (hundreds of assets) — pilot + repeatable pattern only.
- New visual design language or major component refactors.
- Heavy polyfills or build-time image pipelines beyond the existing bash skill.
- Comprehensive automated a11y test suite (manual + existing check scripts suffice).
- Changes to CSS layer order or core grammar.
- Workbench/.spw/_workbench internals unless a site concept genuinely depends on upstream ontology.

## Predicted File Surfaces (minimal set)
**Route HTML (smallest honest patches)**:
- Home and 1–2 portal pages for improved hero/figure images with `<picture>` + proper srcset/sizes.
- [design/accessibility/index.html](/design/accessibility/index.html) expansion.
- Key frames or chrome elements where primitives or a11y attributes are added.

**Shared CSS**:
- `public/css/effects/` or `handles/` for any new primitive support or a11y tokens (e.g. focus, reduced-motion variants).
- `public/css/components/cards.css`, `frames.css`, `floating-chrome.css` for View Transition and popover refinements.
- Possible new tokens in `public/css/tokens/core.css` (very sparingly).

**Shared JS (progressive only)**:
- `public/js/runtime/` (attention-architecture, frame-navigator, or new small module for view-transition orchestration, popover wiring, perf observer).
- `public/js/kernel/site-settings.js` or runtime-environment for surfacing new state (e.g. transition support, a11y prefs).
- Minimal changes to existing popover/tooltip code to use native Popover API where beneficial.

**.spw surfaces**:
- Updates to `.spw/conventions/asset-management.spw` (if workflow tweaks needed) and `assets.spw` (new promoted assets).
- Light additions under `.spw/conventions/` or `philosophy/` for "platform-primitives contract" and/or "a11y-as-production" notes (only if the concepts need to remain editor-inspectable beyond the plan).
- `wip.spw` inside the plan directory for staged ontology during implementation.

**.agents/plans/**:
- This PLAN.md and supporting notes.
- Later handoff to `spw-plan-maintenance` for cataloging.

**Other**:
- `public/images/` — new promoted directories under `assets/{surface}/` + `renders/` archives + paired `*.spw` sidecars (use image-naming-magic + image-optimize skills).
- Possible light updates to design/ routes or the generated catalog if new semantic attributes or image patterns are introduced.

## Existing Foundations to Leverage (not reinvent)
- Asset contracts and skills: [.spw/conventions/asset-management.spw](/spw/conventions/asset-management.spw), [.spw/assets.spw](/spw/assets.spw), image-optimize (with size-tiers.spw and generate-variants.sh), image-naming-magic.
- Platform scaffolding: view-transition-name usage in cards/frames, floating-chrome taxonomy (including "popover" as layer), container queries, contain properties, PerformanceObserver work in runtime-load-instrumentation and layout-shift-audit.
- A11y: current [design/accessibility/](/design/accessibility/index.html) content (keyboard-first, native semantics, visible focus, announce-only-what-matters), scattered reduced-motion notes in other plans, strong existing ARIA/landmark usage on frames and chrome.
- Linguistic ties: operators, braces, wonder doctrine (structural revelation), narrative-instrumentation, data-spw-* families, semantic density controls in settings.

## Risks & Constraints
- **Image bloat / cache invalidation**: Strict adherence to tiered variants + content-hash or disciplined naming; always run through documented workflow; never commit raw high-res to public routes.
- **Over-engineering primitives**: Every new API use must have a clear progressive fallback and a "why this fits the Spw model" justification. Prefer HTML/CSS solutions first.
- **A11y regressions**: All changes must be manually keyboard + basic screen-reader tested on at least one route before landing. Reduced-motion must be respected for wonder/ornament/cinematic effects (existing plans already call this out).
- **Semantic drift**: New data attributes or contracts must map cleanly to existing families (no one-off `data-spw-demo-*`).
- **Author load**: User can generate sources, but the agent team owns the promotion/optimization/wiring/inspection steps.
- Hand-authored constraint: no new build steps or npm packages without plan review + human sign-off.

## Validation Loop
- `git diff --check`
- `node --check <edited-js>`
- `npm run check` (includes audit, typecheck, css-contracts, generated manifest, route runtime validation)
- Targeted `rg` for new asset paths, data-spw-* attributes, aria/role additions.
- Manual: keyboard navigation on affected frames/chrome, reduced-motion toggle in settings + visual check of effects, responsive image loading (devtools network + sizes), view transition or popover behavior.
- Visual sanity on home, design/*, 1–2 topic routes, accessibility page itself (desktop + narrow).
- After image pilots: confirm sidecars exist, assets.spw indexes them, HTML references stable optimized variants with good alt text tied to spirit/valence where appropriate.
- Design catalog re-generation (`npm run catalog`) and spot-check that new patterns appear.
- Optional: simple Lighthouse or Web Vitals check on key pages (LCP improvement from responsive images is a measurable win).

## Phased Commit Sketch (smallest honest surfaces)
1. `#[demo] — capture plan + user image context; create production-demonstration-pass/`
2. `&[media] — pilot one high-visibility asset through full naming-magic + optimize + sidecar + responsive <picture> wiring on home or design route + assets.spw update`
3. `#[primitives] — deepen one View Transition usage + wire one existing popover family to native Popover API + document in design/ and light .spw note`
4. `^[a11y] — expand design/accessibility/ with 2–3 concrete patterns from the live site + add reduced-motion hardening where gaps exist + minimal aria patches on 1–2 frames`
5. `![demo] — cross-checks, catalog refresh, manual a11y + responsive verification, plan handoff notes for spw-plan-maintenance`

## Agentic Hygiene & Handoff
- This plan lives under `.agents/plans/production-demonstration-pass/`.
- When ready for broader discoverability or after significant patches land, invoke `spw-plan-maintenance` to wire references into `.spw/site.spw`, `.agents/plans/README.md`, public /about/plans/ surfaces, and the planning ecology.
- If the work surfaces new reusable semantic families (e.g. a "platform-primitive" or "media-semantics" contract), promote them into the relevant `.spw/conventions/` and update site.spw.
- Prefer image-optimize and image-naming-magic skills for all media work (never ad-hoc compression or placement in 00.unsorted for public routes).
- Preserve all existing copy, links, analytics, and hand-written HTML structure.

## Unresolved / Future Variables
- Exact pilot assets (user to nominate 1–2 Midjourney or existing renders for first pass).
- Depth of Anchor Positioning or scroll-timeline adoption (depends on fit during implementation; may stay "evaluated" rather than shipped in v1).
- Whether a small "production observatory" surface (perf + a11y + media contract status) emerges as a natural home for diagnostics currently scattered in settings/console.
- Integration level with wonder-memory or collection features (e.g. "collect this motif as a dimensional seed").

---

**Status (2026-05)**: Media generation batch executed.
- 5 stills + 1 animation generated for culinary + gardening mathematical rhythms
- Full tracked pipeline run: copied to `public/images/renders/2026-05-B-rhythms/`, optimized (all 9 variants each), 5 sidecars authored, registered in `assets.spw`
- Image set finalized with clean, flexible assets designed for broad worldbuilding and prompt use (including RPG Wednesday contexts).
- Detailed copy + semantic proposals + integration suggestions written in `culinary-gardening-rhythms-2026-04.md`

Smallest HTML integration executed on /recipes/fermentation/ (new "Rhythm Made Visible" section with bubble choir image + prompt pack link). Additional integrations added to recipes/mise-en-place/ and topics/math/symmetry/.

Full move to `public/images/renders/2026-05-B-rhythms/` completed (2nd 13-day cycle). All sidecars updated with xAI Imagine attribution + date 2026-05-25. Prompt pack refreshed. Image-naming-magic already applied.

See culinary-gardening-rhythms-2026-04.md for the current state and prompt seeds.

**Status (2026-05-26): Image discovery rewards wired.**
- Release context: May 26 is the B-cycle release close. The site now names the A/B rhythm explicitly (A closes on the 13th, B closes on the 26th), and the mental-health streak surface records the TikTok group chat reaching 200 days on May 26, 2026.
- Added an opt-in image reward contract using `data-spw-image-reward` / `data-spw-image-discovery` and `data-spw-discovery-*` copy attributes.
- Added `public/js/interface/image-discovery-rewards.js` to mark discoverable figures, persist per-session seen state, and dispatch `spw:discovery-reward`.
- Extended `public/js/interface/discovery-notices.js` with `showSpwDiscoveryNotice(...)` and the `spw:discovery-reward` listener so image discoveries can render through the existing notice chrome as `toast`, `popup`, or `modal`.
- Added lightweight CSS cues for discoverable images and a popup notice variant.
- Wired the rhythm batch across routes: fermentation bubble choir (`modal`), knife rhythm lattice (`toast`), pollination golden spiral (`popup`), dough tide (`toast`), and brassica veil (`popup`).

This plan follows the spw-feature-planning skill and site workflow (public goal first, smallest honest surfaces, shared layers before route-local, .spw for inspectable contracts).

**Status (2026-05-26): Cadence gameplay and streak-production semantics rounded out.**
- Added public RPG Wednesday copy for May 27, 2026 as the day after the May 26 B-cycle release close and the day after the TikTok group chat reached a 200-day streak.
- Added a `Cadence as Gameplay` section that maps probe, frame, cycle close, and streak spark motions onto Spw operators and session mechanics.
- Extended the image reward/discovery API with optional cadence metadata: `cadenceDay`, `cadenceMotion`, `rewardKind`, and `productionSeed`.
- Added matching `data-spw-discovery-*` attributes to the rhythm-image integrations so rewards can route into table prep, prompt packs, scene cards, and production sparks.
- Updated `.spw/philosophy/timing-data-localization.spw` so the 13th/26th release rhythm, Wednesday play rhythm, and streak milestone motion are inspectable beyond route prose.

**Status (2026-05-26): Runtime-aware readiness and context-minded rendering added.**
- Extended the site runtime with a resource-readiness layer that infers dynamic-import URLs from existing module definitions, checks same-origin cache presence, and selectively prefetches only route/selector-eligible visible or idle modules.
- Added connection and prefetch posture tokens on `<html>`: `data-spw-connection-posture`, `data-spw-prefetch-mode`, `data-spw-prefetch-count`, `data-spw-cached-module-count`, and `data-spw-service-worker-prefetch`.
- Added service-worker message handlers for cache summaries and bounded same-origin URL prefetching so offline/cache state can be queried and reflected as document tokens without exposing cross-origin behavior.
- Tuned shared runtime-state CSS so offline/deferred postures calm enhancement intensity and selective prefetch can show subtle readiness rings on module/discovery surfaces.
- Documented the resource-readiness contract in `.spw/conventions/site-semantics.spw` and added a `Resource readiness` section to `/design/runtime/`.
