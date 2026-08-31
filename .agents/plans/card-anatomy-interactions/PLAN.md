# Card Anatomy & Interaction Semantics Enhancement

**Status:** Planning / Audit complete  
**Created:** 2026-05 (context of 200+ day RPG Wednesday streak)  
**Scope:** Site-wide refinement of card/frame presentation + interaction gestures, with focused generational copy + metaphor tuning on Town Library and related RPG surfaces.  
**Related routes:** `/cards/`, `/play/rpg-wednesday/library/`, `/play/rpg-wednesday/`, `/town/`, `/design/components/`, shared layers (public/css/, public/js/, .spw/)  
**Owner rhythm:** Daily school (tending, small marks) + Weekly adventure (high-pressure use under social/narrative load)

---

## Public Goal (Clarified from Query)

Make every card-like surface (proof cards, guide cards, quest cards, garden prompts, reason strips, wisdom cards, etc.) feel like a **named, addressable Spw room** with consistent anatomy, deliberate gestures (`@` action, `?` probe, `~` reference, `^` object, `#>` frame), resonance feedback, and local memory so returning visitors experience continuity and "earned familiarity."

Two reinforcing loops:
- **Daily school**: lightweight tending (garden seeds, boonhonk reflections, one small thread mark, state persistence).
- **Weekly adventure**: the Wednesday session where cultivated library material is used under pressure; the library itself (stones half-swallowed by deliberate growth) becomes ally or dramatic constraint.

The metaphors should feel inherited (Overgrown Sanctuary, Still Scrying Bowl, Weapons Coffer, Clay That Remembers Pressure, Seasonal Garden Prompts, Boonhonk as Folk Grammar) rather than freshly invented.

---

## Audit Findings (May 2026)

### Current Strengths (Do Not Reinvent)
- **Dominant primitive**: `site-frame` + `frame-topline` / `frame-heading` / `frame-sigil` (with `data-spw-operator` sigils: #>, ~, ?, @, ^, *) + `frame-grid` / `frame-operators` / `frame-panel` / `frame-card`.
- **Library page** (`play/rpg-wednesday/library/index.html`) already demonstrates live "card" usage:
  - `article.frame-card[data-spw-kind="card"][data-spw-role="guide|quest"]` containing `span.frame-card-sigil` + structured content (bold labels + descriptions).
  - `<details class="spw-card-reason">` for "Why this exists" (progressive disclosure, excellent).
  - Explicit `data-spw-feature`, `data-spw-affordance`, `data-spw-liminality`, `data-spw-category-family`, `data-spw-locality`, `data-spw-consequence`, `data-spw-promptability`, `data-spw-collectability`, `data-spw-seed`.
  - Sections for guide cards, starter quests, boonhonk-fit, garden seeds, college wonder path — perfect hooks for the tuning.
- **Proof cards** (`/cards/`) use `article.frame-panel` grids for ask/offer/pledge/consensus/reference/membership types and consensus states. Strong semantic anchors but not yet unified "card" presentation.
- **Design glossary** (`/design/components/`) already teaches slots (header/meta/body/figure/actions/footer) via culinary metaphors (mise, soup, reduction, emulsion, ferment) and Spw serialization examples like `card[reason]{produce.artifact}`. Uses `spw-wisdom-card`.
- **.spw canon** (`conventions/site-semantics.spw`):
  - Formalizes `card` as component type (`default_form: "block"`, `liminality: "nested"`).
  - Explicit slot contract: header, body, figure, actions, footer.
  - Distinguishes card anatomy from floating chrome / overlays.
  - Examples reference "frame-card with grain substrate".
  - Strong "addressable" selection base.
- **Interaction & memory foundations**:
  - `operator-chip` + `data-spw-operator` everywhere.
  - Resonance system (attention-architecture, brace-gestures, wonder-memory, `data-spw-resonance-probe`).
  - LocalStorage in pockets (composition.js cauldron for collection/resonance, discovery-notices, site-settings for wonder/memory state).
  - Progressive enhancement patterns (`<details>`, section-handle, skip links).
- **Boonhonk & garden** already present on library page as explanatory grids.

### Gaps / Opportunities (Small Honest Surfaces)
- Inconsistent concrete anatomy: `frame-panel` (proof cards, many grids) vs `frame-card` (library guides/quests) vs `spw-wisdom-card` (design). No canonical BEM or `data-spw-slot` enforcement yet.
- Interaction semantics are present but light: few `data-spw-intent`, `data-spw-role="action|probe|..."` on buttons/chips, no centralized gesture logging or spell-like checkpoint casting.
- Resonance feedback mostly hover/focus color; limited texture/spacing/grain/glow travel or nearby copy shifts on gesture.
- Local memory for *card states* (expanded, read, tuned, collected, resonance level, user notes) is not yet Spw-keyed (`spw:card:${slug}:state` pattern) on most surfaces.
- Library / RPG copy is practical and studio-oriented; does not yet carry the "200 days of earned generational weight" (no Overgrown Sanctuary, scrying bowl as accumulated pattern viewer, weapons coffer as dramatic boundary, clay-that-remembers as visible pressure on characters/artifacts).
- No "inspect" affordance surfacing the Spw operators/slots/provenance for a card (high value for workbench philosophy + painting prompt targets).
- Design catalog and components page document the vision well; public route cards have not fully caught up.

**Conclusion**: This is refinement + canonization + incremental rollout, not a new system. The .spw model + frame primitives + existing data-spw-* family are the right foundation.

---

## Core Principles (From Workbench Spw + Live Site)

1. **Semantics first**: Every gesture and card is named/addressable (`#>` frame, `?` probe, `@` action, `^` integration/object, `~` reference). Use `data-spw-operator`, `data-spw-intent`, `data-spw-role`.
2. **Progressive & inspectable**: Native HTML first (`<article>`, `<details>`, buttons, links). JS enhances. Expose structure for dev tools / local panels / `?inspect`.
3. **Resonance & developmental climate**: Hover/focus/gesture changes spacing, texture (grain, teal stripes, glow travel), nearby copy. Cards feel alive/tunable.
4. **Local memory + return value**: `spw:card:${slug}:state` (or surface equivalents) in localStorage/IndexedDB. Restore expanded/read/tuned/notes on load. Daily practice leaves traces.
5. **Boonhonk charm**: Hospitable, recombining, wondrous. Five folk-grammar questions elders have always asked.
6. **Card as surface/room**: Consistent slots + variants (paper/glass/matte/field) + motion seeds (breathing borders, traveling glows, orbital elements) — directly useful as targets for animated painting artifacts.
7. **Daily / Weekly rhythm**: Library surfaces support lightweight daily tending (garden prompt, one boonhonk line, one affinity mark) that becomes high-stakes material on Wednesday.

---

## Proposed Canonical Card Anatomy (Evolution, Not Replacement)

Keep using `site-frame` / `frame-*` for page sections. Inside them, promote a more consistent card presentation:

```html
<article class="frame-card card--glass | card--paper | card--matte | card--field
               card--dense | card--roomy
               card--read | card--tune | card--inspect | card--orient
               [boonhonk-variant]"
         data-spw-frame="card-slug-or-name"
         data-spw-kind="card"
         data-spw-role="proof | guide | quest | specimen | register | reason"
         data-spw-surface="cards | rpg-wednesday | design"
         data-spw-intent="probe-card|cast-spell|mark-read|add-to-canon"
         data-spw-target="#related-or-self">

  <header class="card__header" data-spw-slot="header">
    <div class="card__meta" data-spw-slot="meta">
      <!-- provenance, date, Spw sigil ^grounding_rod, tags, spec-pills -->
    </div>
    <h3 class="card__title">...</h3>
  </header>

  <figure class="card__figure" data-spw-slot="figure">...</figure>

  <div class="card__body" data-spw-slot="body">...</div>

  <footer class="card__actions" data-spw-slot="actions">
    <!-- operator-chips or buttons with data-spw-operator + data-spw-intent -->
  </footer>

  <!-- Optional, toggleable via <details> or button + JS -->
  <div class="card__inspection" data-spw-slot="inspection" hidden>
    <!-- operators used, slots, local state, resonance notes, export prompt bundle -->
  </div>
</article>
```

**Variants** via classes or `data-spw-materiality` / existing `data-spw-*`:
- Rendering: glass (backdrop blur, semi-transparent), paper (calm, textured), matte (opaque warm), field (volatile, signal).
- Climate/density: dense/roomy + grain, stripes, glow.
- State: read/tune/inspect/orient + boonhonk (v_boon etc. shifts).

**Interaction gestures** (centralized progressive enhancement):
- Click/tap/hover/focus on `[data-spw-operator]` or action chips logs `Spw gesture: ${op} → ${intent}` (for now console + resonance trigger; later spell system).
- "Cast" small persistent change (mark read, add to local canon, trigger subtle animation) via native + JS.
- Inspect affordance surfaces the Spw structure or generates a prompt packet (ties to painting workflow).

**Local memory keys** (extend existing patterns in site-settings / composition):
- `spw:card:${slug}:state` → `{expanded, read, resonanceLevel, notes, lastTouched}`
- `spw:surface:${name}:tended` for garden/boonhonk daily marks.
- Restore on load; respect reduced-motion.

**Accessibility**: Strong `aria-*`, live regions for state changes, keyboard resonance.

---

## .spw Canon Updates (High Leverage)

Extend `conventions/site-semantics.spw` or create `conventions/card-anatomy.spw` (or `surfaces/card-anatomy.spw`):
- Formalize the slot contract with examples from library guide cards + proof card types.
- Define interaction gesture vocabulary (`data-spw-intent`, `data-spw-role` on actions).
- Document card variants (materiality, climate, state) and their CSS projection.
- Add "daily tending" and "weekly pressure" as context modes for RPG surfaces.
- Wire into `site.spw` and `.spw/surfaces/page-model.spw` if new reusable families.
- Add to design catalog generation (it already picks up `data-spw-*`).

Also consider a small `conventions/daily-weekly-rhythm.spw` if the generational metaphors earn persistence beyond one patch.

---

## CSS / Design System

- Prefer extending existing `.frame-card`, `.frame-panel`, operators, material (glass/matte), wonder/resonance, and grain/stripe tokens in `public/css/`.
- Add card slot utilities or `--card-*` tokens only where the split system needs them (tokens/core.css or components/controls.css).
- Motion seeds: lightweight CSS (transitions, `@keyframes` for traveling glow along stripes, breathing border) gated by `prefers-reduced-motion`.
- Update `/design/components/` specimens and glossary to show the unified anatomy + gesture examples.
- Keep layer order (no `!important` outside ornament).

---

## JS / Runtime (Progressive Only)

- Small enhancement in existing modules (or new `public/js/card-gestures.js` if it proves reusable) for:
  - Attaching gesture listeners to `[data-spw-operator]`, `[data-spw-intent]`.
  - Resonance feedback (class or CSS var toggles for texture emphasis).
  - Local memory restore/ persist for cards (Spw-keyed, using existing site-settings patterns where possible).
- Spell-like checkpoints: "cast" a boonhonk reflection or garden seed into local canon.
- Inspect mode: toggle that reveals operators/slots/provenance (useful for editors + prompt export).
- No new frameworks. Degrades gracefully.

Tie to existing: wonder-memory, attention-architecture, spells, guide-badge, haptics.

---

## RPG Daily/Weekly Tuning (Specific to Library + Related)

**Target surfaces** (start here for high emotional payoff):
- `/play/rpg-wednesday/library/index.html` (Town Library) — primary.
- `/play/rpg-wednesday/` main page.
- Possibly `/town/` framing copy (keeps atlas distinct).
- Guide cards, quest cards, garden section, boonhonk-fit section.

**Copy direction** (from query, adapted to existing voice):
> The Town Library has stood longer than any of us have been tending it. Its stones are half-swallowed by deliberate growth — not neglected, but protected by the same patience that lets real learning take root.
>
> Inside, conflict is set down at the door. Wands and sharp intentions go into the old coffer before anyone may pass into the stacks. At the center of the reading hall, the scrying bowl waits, its water kept still so that patterns across many weeks of work can rise into view.
>
> This is daily school and weekly adventure in one place. Tend the garden prompts and small threads in the quiet days. Bring what you’ve grown into the Wednesday session, where the pressure of other minds turns cultivation into story, canon, and shared memory.
>
> After two hundred days, the library no longer needs to explain itself. It only needs to be used with the care it has already taught us.

Map metaphors to existing elements:
- **Overgrown Sanctuary** → garden + stacks sections, deliberate growth as protection.
- **Still Scrying Bowl** → new or enhanced "pattern viewer" affordance (perhaps a details/summary or small interactive that surfaces accumulated boonhonk/garden threads across weeks; initially static or local-memory driven).
- **Weapons Coffer** → dramatic rule for entry (already hinted in "conflict is set down"); can become a visible ritual in copy or a future interactive.
- **Clay That Remembers Pressure** → visible accumulation on characters (cast page), artifacts, quests (long-term pressure marks).
- **Seasonal Garden Prompts** + **Boonhonk as Folk Grammar** → already present; deepen with "daily practice" rituals that feed the Wednesday session (small output that can be "brought to the table").

Add small "Daily Practice" affordances (progressive): buttons or forms that record a one-line reflection into localStorage under a Spw key, surfaced later as "what the bowl remembers."

---

## Phased Rollout (Smallest Honest Surfaces First)

1. **Canon & Planning** (this doc + .spw extension draft).
2. **Design glossary refresh** (`/design/components/`): add live specimens of the proposed anatomy + gesture examples; update serialization cards.
3. **Library page tuning** (highest leverage for RPG community):
   - Infuse generational copy into hero + key sections (garden, boonhonk, guide cards intro).
   - Unify a few guide/quest cards to more explicit slot structure + `data-spw-intent`.
   - Add one inspect affordance + local memory demo on 1-2 cards (e.g., "mark as tended today").
4. **Cards/ proof surfaces**: evolve the card-types and consensus grids toward consistent `frame-card` + slots where it improves readability.
5. **Shared CSS/JS increments**: slot utilities, gesture resonance helper, Spw-keyed card storage (behind feature or progressive).
6. **Town Atlas** light pass for rhythm language if it doesn't blur the atlas vs library distinction.
7. **Catalog & documentation**: ensure design catalog picks up new `data-spw-intent` etc.; update Website Field Guide if relevant.
8. **Painting artifact tie-in**: once anatomy is stable on at least one page, generate 2-3 example `card--glass` / `card--paper` paintings with exact slots, sigils, textures, motion seeds as prompt targets.

**Validation after each phase**:
- `git diff --check`
- `node --check` on any touched JS
- `npm run check` (or at minimum audit + typecheck) before landing shared layer changes
- Manual progressive enhancement test (JS off)
- Accessibility spot-check (aria, keyboard, reduced motion)
- Screenshot sanity for painting readiness

---

## Risks & Constraints (Per AGENTS.md)

- Do not introduce client-side frameworks or npm deps without plan + human review.
- Preserve existing copy, links, analytics, metadata unless the task explicitly requires change.
- Prefer minimal surgical edits to hand-authored `index.html` in routes.
- Add/update `.spw` when a reusable semantic family or runtime state becomes inspectable beyond one patch (this qualifies).
- If the work improves the agent/editor environment itself, cross-reference `agent-optimization/PLAN.md` and invoke `spw-plan-maintenance`.
- No `!important` outside ornament layer.
- Root-relative assets, semantic HTML, accessibility basics.

---

## Success Criteria

- A reader can point at any guide card / proof card / quest and name its Spw operators, slots, and intent without opening dev tools.
- Returning visitor to Library sees at least one persisted state (e.g., "you tended the garden here last visit" or restored expansion) that feels like continuity.
- Hover/focus on an operator inside a card produces visible resonance (texture/glow/spacing shift) that teaches relationships.
- The Library page copy rewards pattern recognition from 200 days of practice while still welcoming newcomers.
- Design catalog and components glossary reflect the unified anatomy.
- At least one painted artifact prompt can target the live card anatomy directly (glass/paper variant with slots + sigil + developmental texture).
- All changes remain progressive and inspectable.

---

## Open Questions / Decision Points for Next Step

1. **Draft the .spw canon entry first** (extend site-semantics.spw or new card-anatomy.spw + daily-weekly-rhythm note) — highest leverage for long-term inspectability.
2. **Propose concrete starter markup + CSS** (e.g., a `_partials/card.html` fragment or Vite-friendly include + minimal supporting rules in a route surface or shared components layer) for one exemplar (library guide card).
3. **Implement the interaction runtime layer** (small progressive module or additions to existing for gestures, resonance feedback, Spw-keyed local memory).
4. **Update the Library page + RPG Wednesday surfaces** with the generational metaphors and daily-practice affordances (copy + 2-3 cards wired for state).
5. **Generate example painted cards** (using refined Grok Imagine prompts) that match the anatomy (card--glass with exact slots, operator sigils, grain, teal stripes, motion seeds) as both validation and sellable artifact targets.
6. **Other**: Focus first on "Start a Thread" / character creation flow evolution now that the group has deep familiarity; or create a small set of Daily Practice rituals that feed the weekly session.

**Recommended first concrete move (my bias after audit)**: Draft the .spw canon entry (1) + light Library copy infusion (4) in parallel — they reinforce each other and stay within "small honest surface" while delivering the emotional/ generational payoff for the RPG community. Then use the stabilized language to inform a starter partial.

---

## References & Artifacts

- Current library: `play/rpg-wednesday/library/index.html`
- Cards route: `cards/index.html`
- Component glossary: `design/components/index.html`
- Canon: `.spw/conventions/site-semantics.spw`
- Existing patterns: `public/css/handles/operators.css`, route surface CSS, `public/js/site.js` + runtime modules
- Related plans: `agent-optimization/`, `brace-cauldron-primed-collection/`, `spell-cauldron-lifecycle-memory-gardening/`
- AGENTS.md sections on card/frame anatomy, data-spw-* families, attention architecture, daily/weekly implications

---

## Patches Landed

### Patch 001 — 2026-05 (Library generational copy + first card exemplar)
**Files touched**: `play/rpg-wednesday/library/index.html` (route HTML only; no CSS/JS yet)

**What landed** (smallest honest surface per AGENTS + user priority 4 + high-value 2):
- Infused the "Daily school, weekly adventure" narration block (Overgrown Sanctuary / deliberate growth, Weapons Coffer / old coffer at the door, Still Scrying Bowl as pattern viewer, 200-day earned familiarity language) immediately after the existing "Field detail" narration. Reuses the page's native `spw-narration` component + one new `data-spw-feature="daily-weekly-rhythm"` for future targeting. Voice-matched to the rest of the library surface.
- Unified the first guide card ("Grounding Rod") as live exemplar of the proposed anatomy:
  - Added `data-spw-frame`, `data-spw-intent="orient-guide"` (and preserved all prior data-spw-*).
  - Restructured for readability while keeping original content; introduced `data-spw-slot="actions"` on a new `.frame-card-actions` wrapper containing a `^ tend this guide` operator-chip with `data-spw-intent="tend-daily"`. This demonstrates header/meta/body/actions slots + gesture semantics without touching the other three guide cards (comparison remains possible).
- `git diff --check` passed clean.

**Why this patch**:
- Directly delivers the generational weight the 200-day cohort has earned (priority per user response).
- Serves as the first public specimen of the card anatomy + interaction intent attributes (high-value starter markup).
- Prepares the ground for runtime (the tend chip + feature attr are already wired for a future progressive listener + `spw:card:grounding-rod-guide:state` local memory key) and .spw canon (the data attrs + slot are now live and inspectable).
- Zero risk to layout or existing styles; other cards and all prior data-seeds/attributes untouched.

**Validation**:
- Semantic HTML preserved (article with clear roles, operator chips, progressive details for reasons).
- All original `data-spw-seed`, `data-spw-collectability`, etc. retained.
- The new block and card remain fully crawlable and screenshot-native (painting artifact friendly).

**Next slice options** (from user input: 1/2/3/4 combination, runtime "necessary"):
- Seed a tiny progressive runtime hook for the "tend this guide" chip (localStorage under spw: key, resonance pulse, simple "tended today" visual state) — fulfills the "3 necessary" without new files.
- Draft the .spw extension (card-anatomy + daily-weekly-rhythm note) now that we have a live specimen.
- Unify 1-2 more cards (Cask or a quest card) or add a minimal CSS rule for `.frame-card-actions` if the current spacing feels off on review.
- Expand the copy infusion to the garden section or boonhonk-fit grid.
- Proceed to painted card prompts targeting this exact Grounding Rod specimen.

---

### Patch 002 — 2026-08-31 (figure slot + visit attrs on morning stills)

Image-study stills on about, creator, craft, recipes, and the Midjourney bench now carry `data-spw-slot="figure"` where it was missing, plus image-visit keys so a card figure can be held and remembered. Texture overlay is a `data-spw-overlay` child (overlay-layer-ownership), not a new card slot. RPG boonhonk uses harlequin as substrate on the existing frame, not a new card type.

**Next action**: User to choose the immediate follow-up from the slice options above (or another). This patch is ready for review in context of the full plan. Run `spw-plan-maintenance` only after .spw or planning ecology shifts.

This compounds: better semantics + anatomy makes the whole site more readable and charming while giving the painting artifacts a clear, consistent home in the Spwashi visual language — and gives the 200-day cohort the "quiet, time-tested wisdom" their streak has earned.
