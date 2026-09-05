# Plan: Hook Region Anatomy (Entry Call to Wonder / Action)

## Public Goal

Add a distinct, top-of-page "hook" region to landing pages as a first-class part of the documented page anatomy. This region serves as a volatile, high-value, configurable call to wonder or action that:

- Immediately surfaces the Spw operations, concepts, or "why this page exists" invitation that the route represents.
- Rewards the vertical scrolling progression the homepage already demonstrates: the hook is the first interactive "stand" that orients attention, then hands off to deeper narrative, operators, and related routes.
- Supports gestures (tap/hold/prime/resonate patterns already in use) that let visitors relate directly to context and navigate concepts — both within the page and outward to motion toward other pages.
- Encourages a living relationship with pages: interacting with the hook primes semantic tokens that participate in the site's conceptual resonance system, making cross-page and intra-page navigation feel connective rather than purely link-driven.

The hook is **not** the stable hero frame, not a generic page-hook landmark, and not only a styled "playable-hook" line. It is a profiled, inspectable region (peak attractor) that editors can make relatively volatile (swap emphasis, operator foreground, or call copy) without disturbing the deeper hero or page body.

Outcome for visitors: the top of a landing page feels like a deliberate threshold you *do something with* (relate, gesture, move) rather than only read past.

Copy constraint: first-fold sentences must pass a no-context clicker test (identity, or a named control plus a visible receipt). Collectible hook ledes should carry a host `id` so the copy-unit is a place. See `.spw/caches/copy-hypermedia-key-2026-09.spw` and the person-magazine cluster in `copy-accessor.spw`. Do not invent whimsy here.

## Why This Now

- Homepage scrolling + rich kernel-entry hero with lenses, living terms, gesture contracts, and cauldron priming is already appreciated. Other landings (topics, about, services, play, design) have solid but more static site-hero frames.
- Existing systems (page-model regions, attention architecture resonance probe + section handle, conceptual :has() resonance in wonder.css, gesture-contract + living-term patterns, operator chips, data-spw-semantic-expression) are mature enough to host this without new primitives.
- Adding the hook + deliberate concept tagging across a few landings will make semantic resonance navigation tangible and give editors a repeatable pattern for "high-value entry voice."

## Files Likely to Change (Minimal Honest Set)

**New (required for tracking per AGENTS + spw-feature-planning):**
- `.agents/plans/hook-region-anatomy/PLAN.md` (this file)
- (Optional, only if editor inspection value is immediate) `.agents/plans/hook-region-anatomy/hook-region-anatomy.spw` or `wip.spw`

**Shared contracts / runtime (small, recognition + description only):**
- `public/js/kernel/dom-contracts.js` — add `'[data-spw-kind="hook"]'` to `REGION_SELECTORS` (and therefore `REGION_SELECTOR`, `SEMANTIC_CHROME_SELECTOR` etc.) so hooks are automatically treated as regions by `primeRegions`, inspection, and the runtime registry. No behavior change required.
- (Review only, likely no edit) `public/js/kernel/page-metadata.js` — `inferRegionRole`/`inferRegionKind` already handle authored `data-spw-*` gracefully; hook will inherit `spwSeed`, `spwWonder`, `spwConsequence`, etc.

**CSS (surgical visual + resonance treatment):**
- `public/css/components/frames.css` — add base `.spw-hook`, `[data-spw-kind="hook"]` anatomy (brace/block variants, volatile affordance treatment, integration with frame-topline when nested, vertical progression cues). Keep it thin; reuse existing card/frame tokens, active-op-color, wonder accents.
- `public/css/effects/wonder.css` (light) — ensure or add `:has()` resonance rules that treat hook operators/concepts as strong emitters on entry (e.g., initial field charge from the hook's declared operator/wonder). Do not duplicate existing operator resonance.
- Route surface CSS only where the hook needs landing-specific tuning (e.g. `public/css/routes/surfaces/home.css`, `topics-surface.css`, `about-surface.css`) — minimal, prefer shared first.

**No new CSS file.** Do not touch layer order in `style.css`. Prefer extending frames + wonder + one or two route surfaces.

**JS (progressive enhancement only if HTML/CSS cannot carry):**
- Likely none in first patch. Existing `data-spw-gesture-contract`, `data-spw-living-term`, operator chips, cauldron priming, and resonance probe already provide the interaction model. If a specific "advance vertical progression" gesture or hook-specific pulse is needed later, it would live in `attention-architecture.js` or a tiny focused module.
- `public/js/site.js` / region enhancer: covered by the dom-contracts selector addition.

**Route HTML (smallest set of landings for proof + resonance demo):**
- `index.html` — refine or insert a hook variant inside/leading the existing `#home-frame` (or as its first prominent interactive voice). Add/enrich concept tagging on early copy and operators.
- `topics/index.html` — add hook region (e.g. "Choose the surface..." elevated to interactive operator-forward call).
- `about/index.html` — add hook (creator identity + current practice as wonder/action invitation).
- `services/index.html` — add hook as representative "action-oriented" landing.
- Light, targeted concept tagging (spw-living-term + semantic-expression + operator where meaningful) on the hook itself and the first 1-2 content blocks of these pages to seed resonance navigation.
- Do **not** mass-edit every route in the initial patch.

**Editor / .spw surfaces (required because new reusable semantic family + region role):**
- `.spw/surfaces/page-model.spw` — extend `composition_hierarchy.region`, `attentional_topography.peaks`, `tunable_parameters`, and the ladder note to name "hook" as a profiled peak region (high initial charge, volatile by design, hands off to narrative valleys and attractors). Add example contract.
- `.spw/conventions/site-semantics.spw` — add "hook" to component_grammar or axes (role, liminality defaults, selection behavior). Document its place vs. frame/panel/card/surface and vs. existing page-hook landmarks / playable-hook copy style.
- (Light) `.spw/site.spw` or `.spw/surfaces.spw` or `.spw/conventions/attention-field.spw` — mention the hook as an entry field anchor when the concept stabilizes.
- `.spw/conventions/living-medium-copy.spw` — (optional) note that the hook region is a strong home for the "playable hook" line when it carries gesture affordance.

**Docs (if topography doc exists and is hand-maintained):**
- `docs/developer-topography.md` — one-line addition to the route → shell → region → ... ladder describing the hook as the optional high-signal entry peak on landing surfaces.

**Generated / build surfaces:** None directly (design catalog will pick up `data-spw-kind="hook"` and new attributes on next `npm run catalog`).

## Semantic and Runtime Seams

- **Anatomy position**: Hook is a *region* (profiled sub-surface) and often a *peak* in attentional topography. It sits at the head of the primary reading surface on landing pages (frequently the first child of `main` or the leading interactive cluster inside the site-hero). It is intentionally more volatile/configurable than the stable hero frame body.
- **Identity attributes** (authoring contract):
  - `data-spw-kind="hook"`
  - `data-spw-role="call|invocation|gate|prime|progression"` (or "wonder-call", "action-call")
  - `data-spw-hook-variant="wonder|action|operator|progression|resonance"` (for CSS + inference)
  - `data-spw-operator="..."` (the primary Spw op this page/route foregrounds)
  - `data-spw-wonder="..."` (echoes body, can be more specific)
  - `data-spw-gesture-contract` (reuses existing vocabulary: tap/hold/prime/resonate/...)
  - `data-spw-semantic-expression` on inner concepts
  - `data-spw-liminality="entry"` (starts high-charge, can escalate)
  - Optional: `data-spw-feature="entry-hook"` or `data-spw-inspect="page_hook_call"` for explicit clustering.
- **Field behavior**: On load or first interaction the hook emits its tokens (operator + wonder + concepts) strongly into the wonder field. This biases resonance on matching operators/concepts elsewhere on the page and (via memory) on related routes.
- **Vertical progression**: The hook can carry or cue "entry → motion → depth" using existing `data-spw-consequence`, `data-spw-attention`, or new light `data-spw-progression-step` if a pattern emerges. Section handle + scroll already provide locomotion; hook gives the semantic "why move" at the top.
- **Gestures & motion to other pages**: Hooks use the same living-term / operator-chip / gesture-contract patterns that already prime cauldron and trigger resonance. "Motion to other pages" is realized by operator links inside the hook that are also tagged for cross-surface resonance, plus explicit "related routes" surfaced via existing `data-spw-related-routes` mechanisms.
- **Distinctions (important for ontology rigor)**:
  - vs. existing `data-spw-page-hook` / page-hooks.js landmarks: those are jump/focus/pulse targets. A hook region *may* also carry a page-hook name for discoverability, but they are not the same layer.
  - vs. `.spw-playable-hook` CSS class: that is a memorable prose line style. The hook region may contain one, but the region itself is structural + interactive.
  - vs. site-hero / kernel-entry frame: the frame is the stable container; the hook is the volatile, high-value *voice* or *gate* at the top of it.
- **Configurability / volatility**: Editor changes the hook's inner operators, call copy, gesture contracts, or variant attr per page without touching deeper narrative or the site-hero chrome. Future: could read from a small per-route seed or settings deviation, but first patch stays static authored HTML.
- **Numericity mode (added in later pass)**: New site setting `numericityEmphasis` (`subtle | prominent | cauldron-first`) makes rhythm numbers and pricing/budget mentions discoverable via special rendering, auto cauldron priming, and quantifier surfaces. The specific "baker's dozen" (13-modulo) chunking and "13-step" naming are intentionally treated as an easter egg: kept powerful in the backend quantifier derivation, data-spw-numericity attributes, and cauldron behavior, but removed or softened from main readable prose and primary UI labels. They surface as a delightful discovery (tooltips, cauldron chips, mode-activated views, .spw inspection) for people who engage the system. This matches the intent that the 13-day personal cycles are useful for the creator's own tips/bundles but "too much for new people to think about" on first encounter. See the updated .spw note and composition.js.

- **Time budgeting in the Savings Regimen tool (this pass)**: The /tools/budgeting/ tool now supports first-class time capacity tracking (hours, days, rhythm cycles) alongside money. The baker's dozen (13-modulo) specifics are an easter egg — the unit appears as "rhythm cycles" in the UI, with the 13 connection revealed only through cauldron priming and the numericity mode. This keeps the deep functionality while treating the motif as delightful discovery rather than onboarding content. See tool-budgeting.js.
- **Inspection**: Appears automatically in region lists, component registry, runtime audit, and (after catalog regen) design catalog. Console `spwCompose` surfaces will describe it via existing `describeElementContext`.

## Validation Loop

- Author the plan first (this document).
- Make the dom-contracts selector addition + CSS + page-model + site-semantics updates + 3-4 route examples.
- Run after each meaningful edit:
  - `git diff --check`
  - `node --check public/js/kernel/dom-contracts.js` (and any other touched .js)
  - `npm run check` (includes audit, typecheck, CSS contracts, manifest, route runtime validation)
  - Targeted `rg` for the new `data-spw-kind="hook"` and related attrs to confirm no stray uses or selector drift.
  - Manual smoke in `npm run dev`: load home, topics, about, services at multiple widths; test resonance (hover/focus operators inside and outside hook), gesture priming, section handle behavior, no layout breakage.
- After landing: run `npm run catalog` and spot-check that hook appears correctly in design catalog with no orphan warnings for the new attributes.
- Preserve all existing copy, links, analytics, JSON-LD, and hero structures.

## Out of Scope for First Patch

- Mass update of every landing / route (home + 3 representative landings is the honest minimal).
- New custom element (`<spw-hook>`) or heavy JS behavior.
- New CSS file or layer.
- Time-/visit-volatile content (e.g. "today's hook" from localStorage or remote). That can be a later extension once the static anatomy contract is stable.
- Changes to page-hooks.js (landmark system) or playable-hook copy style.
- Full vertical progression scrolly-telling engine (use existing liminality + consequence + attention attrs first).
- New gesture primitives beyond documented reuse of `gesture-contract`.
- Updates to the installed workbench under `.spw/_workbench` (site-first only).
- Any npm install or new runtime dependency.

## Risks & Mitigations

- **Risk**: Conflating "hook" with existing page-hook landmarks or playable-hook copy. **Mitigation**: Explicit distinctions in page-model.spw, site-semantics.spw, and this plan. Use `data-spw-kind="hook"` (new) rather than overloading `data-spw-hook`.
- **Risk**: Over-styling the hook makes it compete with the hero or feel noisy. **Mitigation**: Surgical CSS in frames.css that reuses tokens; "volatile" expressed through higher affordance contrast and accent rather than new visual weight.
- **Risk**: Resonance rules become too specific. **Mitigation**: Light, additive changes to wonder.css; rely on existing operator/concept :has() machinery.
- **Risk**: Region selector change accidentally pulls in unintended elements. **Mitigation**: Only add the explicit `[data-spw-kind="hook"]` line; authors must opt-in with the attribute.

## Next Steps After Plan Acceptance

1. Implement the dom-contracts + CSS + .spw model updates (smallest surface).
2. Add the hook region + concept tagging to the four identified landings.
3. Validate with `npm run check` + manual dev server tour.
4. If the contract proves useful on first routes, consider a lightweight follow-up patch for one or two more landings + any gesture or progression refinements that emerged.
5. Run catalog + review design catalog entry for the hook.
6. (Later, via spw-plan-maintenance if needed) ensure the planning ecology and any public plans surface reference the new anatomy concept.

## Related Existing Plans / Surfaces (for context, not duplication)

- `attention-cue-gestures/`, `chrome-navigation-wonder/`, `gesture-inspectability-metaphysics/`, `gesture-state-refinement/`, `reader-builder-entrances/`, `promo-wonder-cycle/`, `wonder-memory/`
- `.spw/surfaces/page-model.spw`, `.spw/conventions/site-semantics.spw`, `.spw/conventions/attention-field.spw`, `.spw/conventions/living-medium-copy.spw`
- `public/js/runtime/attention-architecture.js`, `page-hooks.js`, `page-metadata.js`
- Existing homepage kernel-entry hero and spw-playable-hook patterns

This plan honors the "patch the smallest honest surface" rule while giving the requested hook a durable, inspectable home in the page anatomy and the Spw semantic field.