# Chrome, Navigation, and Metaphysical Wonder (2026 review)

## Public Goal
Improve the primary navigation (header via `<spw-site-header>`), section handles, breadcrumbs, and footer so they are genuinely pleasant on mobile, encourage curiosity/discovery/wonder, and feel like part of the Spw attentional field rather than administrative chrome.

Simultaneously honor the philosophical shift: operators as "elements or forces" for metaphysical play (grammar of thought, interactions that produce resonance and emergence), with surface theming carried by the semantic accent family rather than direct operator hues. This keeps the operator palette as a stable, inspectable "periodic table" of forces while surfaces and ornament project lived accent.

Support the longer-term vision of a scientifically-social component taxonomy: a model with enough depth and rhythmic discovery that it naturally invites wonder about the underlying sciences of attention, systemic resonance, and emergence — and makes art a natural extension rather than a separate domain.

## Review Findings (executed via directory, grep, and file reads)

### Template / Common HTML Patterns
- The effective "template" layer is a hybrid:
  - Declarative custom elements: `<spw-site-header current="..." nav_items="..." related_routes="..." context_relevance="..." indicator="...">` and `<spw-site-footer>`.
  - Static fallback/seed content in `_partials/site-footer.html` (rich identity block containing page architecture data attrs, Composition Cauldron, settings quick actions + local note form, plus footer nav).
  - Hand-authored per-route `index.html` with extremely consistent, high-signal `<body data-spw-surface="..." data-spw-route-family="..." data-spw-features="..." data-spw-wonder="..." data-spw-page-role="..." data-spw-layout="...">` plus `<main id="main-content">`, multiple `<nav aria-label="...">` (frame-operators, page-index), `<header class="frame-heading" or frame-topline>`, skip links, and `spw-section-handle`.
- JSON-LD BreadcrumbList appears on home and blog.
- Markup quality on sampled crawlable pages (home, design hub + spokes, blog, recipes subs, settings, about) is strong: semantic landmarks, ARIA, data-spw-* as first-class modeling surface, operator chips, brace-form expressions, and explicit wonder/interaction hints (e.g. design hero explicitly teaches "tap to test, hold to inspect anatomy + Spw state, swipe for runtime").

Crawlable priority (from dist/sitemap.xml + route structure): home, about + domains/*, blog, design (hub + many spokes: palettes, runtime, components, slots, interaction-design, accessibility, etc.), cards, topics/* (software, math, craft, etc.), recipes/*, services, play/rpg-wednesday, tools, settings.

### Navigation + Breadcrumbs + Mobile Pain
- Primary nav lives in the spw-site-header CE (rendered via JS in runtime modules) + chrome.css owning `.site-header / body > header`.
- Header uses CSS grid (sigil | nav | toggle) + sticky + scroll-state data attrs + pointer tracking.
- Mobile nav is sophisticated but complex: horizontal overflow auto scroller + data-spw-menu-mode / menu-phase / menu-pressure / menu-topology ("drawer-field", "screen-field") + clarity/project animations. This state machine is powerful for "field-like" disclosure but can feel opaque or non-discoverable on small viewports — exactly the reported pain point (not pleasant, weak encouragement of discovery/clarity/wonder).
- Secondary locomotion: `.spw-section-handle` (attention-architecture.js) — mobile-first sticky chip driven by IntersectionObserver on sections with id or data-spw-kind. Shows current operator + label. Progressive (falls back to static top anchor). Good, but currently more "utility" than "wonder invitation".
- Breadcrumbs: JSON-LD + "dimensional breadcrumbs" UI in settings. Not yet a first-class delightful surface across the site.
- Frame-operators and page-index navs inside routes are repeated patterns that work well on desktop but contribute to mobile friction when combined with the global header.

### Footer Layout / Alignment
- `_partials/site-footer.html` + `.site-footer` in chrome.css.
- `.site-footer__inner`: grid `minmax(0, 1.2fr) auto` (identity heavy column + nav) on wide; stacks to 1fr on narrower viewports.
- Identity column is extremely dense: brand, summary, page-architecture block, Composition Cauldron (with actions + output), settings cluster (quick preset buttons + full local-note form + meta links + status).
- Nav is flex-wrapped links.
- Legal at bottom spanning.
- Reported alignment issues likely stem from: dense stacking of cauldron + settings form + note input on mobile, inconsistent internal rhythm vs component tokens, nav justify behavior after stack, and possible gap/measure conflicts when the identity grid children have their own internal grids/flex.

### Color Tokens + Operator Metaphor
- Recent evolution (core.css + foundation.css + ornament + route propagation) is exactly the appreciated direction:
  - Operator palette remains the stable primitive "forces" (frame teal, probe violet, object amber, ref blue, action teal-dark, topic sea-green, etc.). These are now cleanly the grammar / elemental layer.
  - `--semantic-accent` (and the three aliases: secondary, subtle, emphasis) + `--component-accent*` mirrors lead surface and component theming. They fall back through `--active-op-color` → teal but are intended to be tuned by route, runtime state, or ornament field.
- This cleanly separates "operators as elements/forces" (metaphysical play, brace interactions, attention grammar) from "lived surface accent / projection" (what the user experiences as resonance, warmth, or mood on a given route or card).
- Aligns perfectly with the desire to keep the metaphor open. The attentional field model + ornament as "visual projection layer" already provides the systemic resonance mechanism.

### Surface CSS Redundancy
- The repeated pattern `body[data-spw-surface="xxx"] { --xxx-accent: var(--semantic-accent, local-hue); ... }` (light + dark scopes) across ~15 route files is the main duplication.
- It is largely *intentional and correct* propagation (gives theme influence while preserving route identity).
- Some dark-mode blocks and local component overrides repeat similar color-mix fallbacks. Opportunity for further consolidation into systems or a stronger default in foundation + fewer per-route exceptions, but not urgent breakage.
- No major "copy-paste" of large rule blocks observed; most surface files are focused.

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

## Recommended Next Actions (prioritized)

### 2026-06-28 menu field execution note
- Kept the existing shell disclosure state machine as the owner of menu mode, topology, pressure, phase, and dismissal.
- Added a small arc lifecycle as haptics composition rather than a parallel interaction bus.
- Documented the projected route-menu field in `.spw/surfaces/menu-field.spw` and the opt-in electrical vocabulary in `.spw/conventions/circuit-components.spw`.
- New implementation owner plan: `.agents/plans/space-menu-arcs-electrical/PLAN.md`.

### 2026-05-31 shared polish patch
- Preserve route label integrity in the primary header by preventing inline nav links from shrinking into each other; let the shell disclosure state choose inline vs toggle based on real overflow.
- Make viewport tier, pointer mode, hover mode, and device context reliable from the always-mounted shell disclosure layer so intermediate breakpoint CSS can participate on every route.
- Use shared content-grid fallbacks for `frame-grid--2up` / `frame-grid--3up` below desktop widths so tablet routes get honest columns instead of squeezed fixed tracks.
- Add subtle touch/active feedback to shared card-like surfaces and richer section-handle direction glow without adding new route markup.

0. **Confidence as a dimension of existing radar**:
   - Do not add a standalone "learner confidence" widget unless a route needs it locally.
   - Project confidence through the existing sample dock, section handle, settings reset paths, and semantic inventory.
   - Treat confidence as three inspectable questions:
     - `scope`: what can this action affect?
     - `recover`: how does the reader return to a safe state?
     - `apply`: what useful next move can the reader try?
   - Expose the current cognitive inventory (`page / feature / route`) in the sample dock so discovery feels bounded instead of open-ended.
   - Prefer dataset state such as `data-spw-learner-confidence`, `data-spw-learner-scope`, `data-spw-learner-recovery`, and `data-spw-cognitive-inventory` over a new parallel confidence model.

1. **Immediate surgical polish (chrome + footer)**:
   - Small CSS tweaks in public/css/shell/chrome.css for footer mobile: tighter rhythm inside identity (use more --component-pad/gap), better alignment when stacked, ensure cauldron + settings form don't fight for space.
   - Gentle enhancement to nav toggle / section-handle copy and affordances so they read as "wonder invitations" rather than pure utility (leverage existing data-spw-wonder-entry patterns).
   - Consider exposing more of the menu "field" metaphor in data attributes or labels for inspectability.

2. **Navigation as wonder surface**:
   - Evolve the section-handle and header nav states to participate more visibly in the attentional field (e.g., resonance, field-balance influence on their chrome).
   - Make breadcrumbs (dimensional or otherwise) a first-class, collectible, Spw-expressible surface.
   - Audit the spw-site-header CE rendering + its mobile disclosure for clarity and "easy path back to hub" patterns (design hub already models this well).

3. **Color / Operator Metaphor Formalization**:
   - Minor doc updates in core.css, ornament-contract.spw, and AGENTS.md to explicitly name operators as "elements/forces" whose interactions produce the field.
   - Keep operator palette as the canonical primitive layer; semantic-accent family as the surface/metaphysical projection layer.
   - Update design catalog and any operator reference pages to reflect the two-layer model.

4. **Component Taxonomy + Scientifically-Social Model**:
   - Create `.spw/conventions/component-taxonomy.spw` (or extend site-semantics.spw and attention-field.spw) that models:
     - Components as stable interaction patterns between forces (operators) and fields.
     - Taxonomic dimensions: locality, consequence, promptability, collectability, liminality, materiality, rhythmic signature.
     - Social/scientific extensions: how repeated patterns across recipes, math, play, design, etc. demonstrate emergence and resonance that can be studied, tuned, and turned into art.
   - Wire a short dispatch from agent-optimization/PLAN.md and the public plans register.
   - Use the design hub + experiential gestures as the primary on-ramp for humans to discover the rhythms.

5. **CSS Redundancy**:
   - Incremental consolidation pass on the accent declaration pattern (stronger foundation defaults + route "personality" tokens only where they add real expressive value).
   - Consider a small systems/ or tokens/ layer for "surface personality" if the per-route blocks grow.

6. **Tracking**:
   - This PLAN.md under `.agents/plans/chrome-navigation-wonder/`.
   - Run `spw-plan-maintenance` after any landing patches to wire references.
   - Add relevant data-spw-* or inspectable attributes only when they increase legibility of the model.

## Success Signals
- Mobile header/footer and section navigation feel like delightful, curiosity-inviting parts of the surface rather than obstacles.
- A new visitor to /design/ can tap/hold/swipe their way into understanding both concrete UI and the deeper "forces + resonance" model without reading docs.
- Operators feel like playable elements/forces in both the UI grammar and the metaphysical story.
- The component taxonomy becomes a living, cross-route artifact that makes the sciences of attention and emergence feel approachable and artistic.

## Related Artifacts (as of this review)
- AGENTS.md (layer order, token balance principles, semantic accent guidance)
- public/css/tokens/core.css (semantic-accent family + documentation)
- public/css/shell/chrome.css + components/foundation.css (current chrome + component token contracts)
- public/js/runtime/attention-architecture.js + experiential.js (locomotion + gesture semantics)
- _partials/site-footer.html + spw-site-header/footer usage across routes
- .spw/conventions/ (attention-field, ornament-contract, site-semantics — primary places for the taxonomy extension)
- design/ hub and spokes (the living demonstration surface)

Next concrete patch or deeper modeling session should reference this plan.

## Implementation Status (2026-07)

### Landed — Phase 0 + Phase 1 (partial)

- `public/js/runtime/attention/section-handle.js` — learner-confidence radar datasets (`data-spw-learner-*`, `data-spw-cognitive-inventory`) and `data-spw-wonder-entry="section-locomotion"` on the section handle when the trail is active.
- `public/css/shell/chrome/section-context.css` — wonder-entry styling tied to `--field-balance`.
- `public/css/shell/chrome/navigation.css` — stable `spw-nav-toggle-copy` inline size (FIX.md hover jitter).
- `public/css/shell/chrome/footer.css` — mobile stack rhythm for identity, cauldron, settings, and nav.
- `.spw/conventions/component-taxonomy.spw` — scientifically-social taxonomy + confidence radar contract.
- `.agents/plans/chrome-navigation-wonder/index.spw` — plan dispatch and owner_claim.

### Next

- Phase 2: dimensional breadcrumbs as a first-class collectible surface.
- Phase 3: operator-forces / semantic-accent two-layer doc pass in `tokens/core.css` and operator atlas.
- Re-run `npm run check:local` after landing; validate mobile on home, design hub, and one long topic route.
