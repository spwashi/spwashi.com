# RPG Portal Fantasy: Projecting Semantic Wonder & Topic Merits into RPG Wednesday

**Status:** Active — Patch 003 (cozy copy) landed; Patch 004 (Midjourney + daily prompt mapping + character UX + blended artifacts) in progress  
**Date:** 2026-05 (builds on generational Library, kernel projection, tag visual refinements, and cozy wizard media tone)  
**Core vision:** The Town Library / RPG Wednesday is not a separate "game" corner. It is the living fantasy frame into which the site's computational and artistic systems (the small kernel, component grammar, data-spw semantics, resonance/attention physics, inspector surfaces, design tokens, proof cards, topic models, painted artifacts) are projected as *useful, wondrous, inspectable artifacts* that characters, guides, and players can actually wield. The "portal" is the bidirectional crossing: real site structures gain fantasy weight and narrative consequence; the fantasy gains real computational teeth and artistic depth.

**Image reference (the provided screenshot):** The home page rendered in its native "read / inspect" mode, with the live custom "#>SPWASHI" kernel inspector panel (left) surfacing the authored + generated `spw-component-meta` + `spw-component-tag` system. DevTools reveals the dense, consistent `data-spw-*` attribute model (slots, seeds, stances, genomes, attention, state-accent, harmony/tempo/density, wonder, consequence, etc.). This *is* the computational wonder: a legible, addressable, resonance-capable semantic engine. The task is to make *this* (and the topics that feed it) feel like something you can carry through the gateway into the overgrown sanctuary, use in the scrying bowl or the workshop, and have it change the story.

---

## Current State (Grounded in Code + Prior Work)

### Home as Semantic Portal / Kernel Atlas (Already Declared)
- `index.html` body: `data-spw-page-role="semantic-portal"`, `data-spw-page-family="kernel-atlas"`, `data-spw-features="small-kernel semantic-lattice modular-projections..."`, `data-spw-kernel="stable"`, `data-spw-projection="homepage"`, `data-spw-seed-package=".spw/home-atlas"`.
- Explicit "town-library-gateway" frame (id `town-library-gateway`, `data-spw-category-family="portal"`, `data-spw-feature="town-library-gateway"`) with `spw-component-tag` "library", lede copy about quests/guides/college bridge, and operator chips to the Library's anchors.
- Dozens of `spw-component-meta` + `spw-component-tag` (kernel_entry, library, tuning, paths, etc.) authored or generated via `public/js/interface/semantic-chrome.js` + `public/js/semantic/component-semantics.js`.
- "read / inspect" mode (visible in site header annotation and the custom left inspector panel in the image) exposes the full semantic snapshot for any component.

### RPG Library (Already Portal-Flavored + Recently Tuned)
- `play/rpg-wednesday/library/index.html` hero: `data-spw-category-family="portal"`, generational daily/weekly copy (Patch 001) invoking the Overgrown Sanctuary, Weapons Coffer, Still Scrying Bowl, 200-day earned weight, "daily school / weekly adventure".
- Guide cards and quests already using `frame-card` with `data-spw-kind="card"`, roles, operators, and one exemplar (`Grounding Rod`) now carrying `data-spw-frame`, `data-spw-intent`, and a tend action (Patch 001).
- Boonhonk, garden prompts, college wonder path, and the "library is the routing system" map already present.

### The Kernel / Component System (The Prime Artifact)
- `component-semantics.js`: pure normalization + snapshotting of the data-spw model for inspection, interactions, and higher-value routing. No forced decorative DOM.
- `semantic-chrome.js`: generates visible `.spw-component-meta` / `.spw-component-tag` chrome (the things the image is inspecting).
- The entire grammar (operators as true naming gestures, frames as rooms, attention/resonance as physics, the inspector itself as a tuning lens) is the "small kernel" that can be re-framed as a powerful, portable, inspectable *naming engine / codex / scrying device* that lives in the Library.

### Gaps (Opportunities)
- The home gateway and the Library feel like two well-built but still-separate surfaces. The "crossing" is a normal link, not yet a *portal event* with consequence.
- The computational system the image so clearly displays (dense attributes, live inspector, kernel tags) has no explicit in-world identity or utility inside the fantasy yet.
- Other topics (software/spw, design systems, math, craft, art/paintings) are referenced but not yet "brought through" as concrete, wieldable merits (a Spw operator as a binding rune that actually names something in play; a design token as a physical pigment or ward; a painted artifact as a vision the scrying bowl can surface).
- Card/meta presentation in inspect mode is powerful but dense (long attribute lists on small elements). Layout refinements can give these "projection vessels" better visual containment, fantasy flavor (rune slips, codex pages, resonance lenses), and states (compact vs. unfolded lore).
- Navigation is still mostly standard site chrome; it can evolve toward "threshold crossing" language and flows when moving between kernel-atlas and library.

---

## Integration Principles

1. **Semantics as Magic**: The data-spw grammar, operators (`#>` as true naming, `?` as probing the unknown, `@` as committing force), component tags with their stances/genomes, attention fields, and resonance are *not metaphors* inside the fantasy — they are the actual physics and tools of the world. Using them well has narrative and mechanical consequence.
2. **The Kernel as Central Artifact**: The small kernel + live inspector (the thing the image is showing) becomes a named, portable, tunable object in the Library ("the Still Kernel", "the Naming Codex", "the Lens that remembers every frame"). Characters can "carry it", "tune it", "feed it a pattern from the garden", or "watch what rises in the bowl".
3. **Topics as Projected Merits**: Software (algorithms, parsers, state machines) → rituals, engines, binding procedures. Design (tokens, materials, slots, ornament) → pigments, wards, room structures, developmental textures. Math (resonance fields, lattices, attention decay) → scrying mathematics, weather systems. Art/paintings → visions, omens, physical artifacts that can be hung in the workshop or dropped into the stacks. Proof cards → binding contracts with real weight.
4. **Portal as Bidirectional Threshold**: Crossing (home gateway ↔ Library) is an event. You can bring something *through* (a kernel snapshot, a proof card, a painted study) and it changes state on both sides. Daily tending on one side can produce weekly pressure on the other.
5. **Card Refinements for Projection**: `frame-card`, `spw-component-meta` + `spw-component-tag`, gateway panels, and reason strips become "vessels" that can carry projected content. Use the anatomy from the prior card work (slots, materiality variants, intent, local memory). In inspect/fantasy mode they can show "projected lore" (the computational or artistic merit) alongside mechanics.
6. **Navigation as Movement Through the Sanctuary**: Operator chips, frame-sigils, and section handles become wayfinding runes or calling gestures. The site nav can offer "step through as [kernel / guide / artifact]" modes. The attention architecture and section handle already have some of this flavor.

---

## Phased Approach (Small Honest Surfaces)

1. **Canon & Planning** (this document + .spw bridges when the concepts stabilize).
2. **First Projection Patches** (this cycle): Name the kernel/inspector as a carryable artifact in the home gateway + Library; add one bidirectional "carry / tune" gesture; light card/meta presentation polish so the dense attributes in the image feel more like elegant codex slips than raw dumps.
3. **Topic Merit Pilots**: Pick 1-2 concrete topics (e.g., Spw operators + one design token family or a painted artifact) and give them explicit in-world forms (a "naming rite" quest, a "pigment ward" guide card, a "vision seed" in the garden).
4. **Navigation Flow Refinements**: Threshold language on the gateway chips and Library quick-starts; optional "portal state" on `<body>` or the inspector when crossing.
5. **Card System Evolution**: Extend the prior card anatomy work with "projection" variants or states (`card--projected`, `data-spw-projection-source`, inspectable "brought from the portal" provenance).
6. **Runtime & Memory**: Local memory for carried artifacts (the kernel snapshot a player "has on them"); resonance feedback when a real site structure is used in fantasy context.
7. **.spw Canon + Inspectability**: Formalize the kernel-as-artifact, portal-crossing events, and topic-projection contracts so agents/editors/painters can work with them.
8. **Painting & Artifact Loop**: The refined cards + projected topic merits become direct prompt targets for new painted artifacts that feel native to both the live site and the in-world library.

---

## Risks & Constraints (Per AGENTS.md)

- Preserve the hand-authored structure and all existing data-spw-* seeds/attributes.
- Smallest honest surfaces first; do not rewrite the semantic-chrome or component-semantics layers unless the plan explicitly calls for it after review.
- No new npm deps.
- The "portal" language must feel earned (200-day generational weight) rather than bolted on.
- Keep the home's kernel-atlas / semantic-portal identity crisp; the fantasy is a *projection layer*, not a replacement.
- Update this plan and/or invoke `spw-plan-maintenance` when .spw surfaces or planning ecology shift.

---

## Success Criteria

- A visitor on the home gateway (the frame the image context highlights) can see explicit language that the kernel/inspector/component system they are literally looking at in "read/inspect" mode can be carried into the Library as a usable thing.
- The Library page (post-Patch 001) has at least one named artifact or station that is explicitly the projected kernel / naming engine / inspector, with a reciprocal link and gesture back.
- At least one operator chip or action demonstrates "projection" intent (carry, tune, bind, surface).
- The card/meta presentation in the relevant sections feels refined for the dual real/fantasy reading (cleaner containment of the attribute "lore", fantasy-flavored variants or states).
- Other topic merits (starting with software/Spw itself) have a clear on-ramp for becoming wieldable inside the RPG without breaking the practical surfaces.

---

## Patches Landed

### Patch 001 (this session) — Home Gateway + Kernel Naming (First Projection)
**Files touched**: `index.html` (the `#town-library-gateway` frame — the exact semantic-portal / kernel-atlas threshold visible in the user's provided screenshot)

**Exact changes** (minimal, contained, `git diff --check` clean):
- Inside the existing `frame-body` (after the three quest/guide/college frame-panels, before the closing `</div>` and the `frame-actions` footer with its "}" delimiter), added:
  - One new `.frame-note` paragraph with `data-spw-projection="kernel" data-spw-intent="carry-wonder"` that directly names the inspected system from the image: "The kernel and live inspector you can open on this page — the component tags, attention fields, resonance grammar, and naming sigils visible in read/inspect mode — does not stay behind when you cross. In the Library it becomes a usable artifact: a tuning engine you can feed a garden prompt, a scrying lens for the bowl, a naming codex the guides can actually wield."
  - One new `.frame-operators` nav (`data-spw-feature="kernel-projection"`) containing a single `^ carry the kernel through` operator-chip with `data-spw-operator="frame"`, `data-spw-intent="project-kernel"`, `data-spw-target="town_library"`, and an anchor to the `#daily-weekly-rhythm` feature we added in the prior generational Library patch.
- No other files, no CSS, no JS, no existing seeds/attributes disturbed. The gateway frame now explicitly functions as a projection vessel / card-like threshold.

**Why this is the smallest honest first patch**:
- Directly responds to the supplied image (the home in read/inspect mode showing the dense, live kernel/component system) and the directive to "begin developing the portal fantasy wonder into RPG Wednesday as the computational and artistic merits of other topics are made useful."
- The home was *already* `data-spw-page-role="semantic-portal"` + `data-spw-page-family="kernel-atlas"` with an explicit `data-spw-category-family="portal"` gateway to the Library. We only made the crossing *meaningful* for the kernel itself.
- The computational merit (the exact grammar, tags, inspector, resonance physics the DevTools view and left panel are displaying) is now named as a first-class, carryable, wieldable artifact inside the generational fantasy (Overgrown Sanctuary, scrying bowl, daily tending → weekly use).
- It refines the card/gateway layout by giving the threshold a clear projection action and provenance, using the operator + intent patterns from the prior card anatomy work.
- Creates the first bidirectional navigation flow without touching shared layers or the Library HTML again in this patch.

**Validation**:
- `git diff --check index.html` passed clean.
- All original `data-spw-seed`, `data-spw-category-family="portal"`, frame delimiters, and operator chips preserved.
- The new note and chip are fully progressive, screenshot-native, and inspectable (they themselves carry data-spw attrs).
- Reciprocal anchor lands on the exact generational copy + feature we tuned in Patch 001 on the Library.

This is the first closed loop: the thing you are literally inspecting on the home can now be "carried through" into the world we have been giving 200-day weight.

---

## Patches Landed (continued)

### Patch 002 — Visual Refinement for .spw-component-tag (Rune Slip / Codex Treatment)
**Selected slice**: Direct from "Open Next Slices" in response to user query "visual refinement for the spw-component-tag".

**Scope (per AGENTS.md — smallest honest surface)**: Pure CSS. Primary file `public/css/handles/operators.css` (the canonical layer for all handle primitives including .spw-component-tag, .spw-component-meta containers, compact metadata, and operator-tinted treatments). Light supporting rules in `public/css/routes/surfaces/home-panels.css` for the specific home kernel tags visible in the reference image. No new classes, no JS, no new tokens — only layering on existing (projection lifts, color-mix with --active-op-color / --surface, wonder/resonance effects, handle vars, dark/auto media, [data-spw-show-semantic-metadata], and the new `data-spw-projection` we introduced in Patch 001).

**Problem addressed** (from the provided image + code audit):
- .spw-component-tag is intentionally compact (0.68rem mono, tight padding, operator-tinted bg in containers) but appears raw and dense next to long lists of data-spw-* attributes on the meta/parent elements (DevTools in the screenshot shows 15+ attrs on a single small element; the custom left "#>SPWASHI" inspector panel renders the full semantic snapshot).
- In normal reading the tags are fine but lack "wonder" personality.
- No fantasy/projection variant yet — the very tags that label the kernel (kernel_entry, library, tuning, etc.) do not yet feel like physical artifacts (rune slips, codex labels, scrying notations) when the content is projected into the RPG Library frame.
- Containment and legibility degrade in inspect/metadata-on modes or when many tags/meta live in a gateway/card.

**Refinement goals** (tied to portal fantasy + prior card anatomy):
- Base polish: Make the tag itself a more elegant "sigil slip" — subtle border/lift using existing --projection-lift-* and handle vars, faint texture hint (grain or surface mix), improved tracking/alignment for rune-like readability while staying tiny and meta.
- Fantasy / projection variant: When the tag (or its containing .spw-component-meta) carries `data-spw-projection` (or lives inside the rpg-wednesday surface or the kernel-gateway we just enhanced), it receives "codex slip" or "library rune" treatment: warmer operator tint, delicate left accent "page edge" or teal stripe, slight lift + soft resonance glow on hover/focus that echoes the wonder system and the generational Library textures (grain, developmental climate). This makes the computational labels *feel* like they were pulled from the overgrown stacks.
- Inspect / metadata context: Better visual grouping and containment for the dense attr soup (the image's pain point) using existing [data-spw-show-semantic-metadata="on"] and home inspect selectors — e.g. the meta container becomes more card-like or the tag gets a revealed "lore" affordance via CSS without new markup.
- Consistency with card anatomy (Patch 001 + card plan): The tag behaves like a small "meta slot" inside frames/cards — compact by default, wondrous when projected.

**Changes landed** (exact surgical additions — `git diff --check` passed on both files):

In `public/css/handles/operators.css` (inserted after the existing compact metadata handle rule for tags):
- Base polish on `:where(.spw-component-tag)`: thin operator-tinted border, subtle surface mix background with inset highlight, smooth transitions on the handle vars.
- Projection/fantasy variant rules for `[data-spw-projection] .spw-component-tag`, `body[data-spw-surface="rpg-wednesday"] .spw-component-tag`, and `#town-library-gateway .spw-component-tag`: warmer tint, projection-lift shadow for physical "slip" lift, left-edge accent feel, resonance glow on hover/focus using existing `--spw-resonance` and color-mix.
- Containment helpers on `.spw-component-meta` (especially under `[data-spw-show-semantic-metadata="on"]`): max-inline-size + tighter gap so the dense attribute lists from the reference screenshot no longer dominate the visual card of the tag.

In `public/css/routes/surfaces/home-panels.css` (inside the home media query, after the existing home meta min-width rule):
- Targeted polish for the exact kernel tags in the screenshot context (`body[data-spw-surface="home"] .spw-component-tag` and the ones inside `#town-library-gateway`): adjusted letter-spacing for sigil clarity + the full codex-slip shadow/lift treatment using home accent tokens so the refinement is immediately visible on the semantic-portal home the image was taken from.

All rules reuse only existing custom properties (`--projection-lift-*`, `--active-op-color`, `--handle-*`, `--surface-strong`, `--spw-resonance`, home accent vars), color-mix, and the projection + rpg data attributes introduced in prior patches. No new selectors that would affect non-portal surfaces unintentionally. Layer-correct (handles layer before route surfaces).

**Why this patch compounds**:
- Directly executes the visual refinement slice the user requested.
- Makes the inspected kernel/component system (the star of the reference image and the "carry the kernel" bridge in Patch 001) *look* like it belongs in the fantasy Library — the tags that name "kernel_entry" or "library" now have a visual personality that supports "the kernel becomes a usable artifact in the scrying hall."
- Advances card layout refinements (tags inside metas inside frames/gateways now feel more like refined slips than raw labels).
- Zero risk to other surfaces or runtime; fully progressive and inspectable.

(Exact CSS added is recorded in the file diff after validation.)

---

## Open Next Slices (After These Patches)

- Reciprocal "Kernel Codex" or "Still Lens" station/card on the Library page (using the refined tag treatment + card anatomy from prior patches + local memory for carried kernel state).
- First topic pilot: Spw operators as in-world naming rites (the tags themselves become the visual for the rite cards).
- Deeper navigation threshold language and "crossing with the kernel" affordances.
- .spw canon entry for the projected tag / component semantics as inspectable library artifacts.
- Painted artifact prompts that depict spw-component-tags as physical rune slips or codex pages inside the overgrown sanctuary (directly using the refined visuals).

**Patch 003 — Cozy Garden Fantasy Copy Layer for Character Work & Long-Horizon Readability (active)**

This patch directly responds to the query about reducing ambiguity for new/skeptical users around character generation and profile tuning, while shifting copy toward the media a long-lived wizard family would actually keep and annotate across generations. Cozy garden fantasy for library enthusiasts. Non-redundant. Leverages HTML semantics (<details> for progressive onboarding, articles as grimoire entries). Assumes the reader is curious about the Spw constructs (kernel, operators, tags, boonhonk as elder questions) and wants to play with them inside the metareality.

**Surfaces touched (smallest honest surfaces first)**:
- `play/rpg-wednesday/library/index.html` (garden section): Added warm framing sentence for Character Seed + a <details data-spw-intent="onboard-character-work"> that gently explains the flow (garden → character development page → character sheet builder) and names the constructs in garden terms without repeating the full generational hero copy.
- `index.html` (town-library-gateway): Light alignment of the kernel carry note to the multi-generational tone ("three generations from now").
- `play/rpg-wednesday/character/index.html` (hero): Added a <details> "If you have never kept company with a character this way before" that starts the reader in the Library garden, explains the private workshop, points to the translation sheet, and introduces operators/kernel as playable gestures and carried tools.
- `tools/character-sheet/index.html` (hero/lede): Reframed the opening from abrupt "junior engineering profile" language to "A living record of a person who may still be becoming themselves long after the first session" and "the kind of profile a careful family might still be annotating in the margins generations from now." Kept the real power of the translation tool intact.

**Principles applied**:
- Earnest, informative, non-redundant: The Library remains the cozy container and generational why. These pages become the specific practices and tools, with clear handoffs.
- Easier to pick up: Every entry point now has a low-friction on-ramp that assumes the reader may be new to this style of character work or to using AI/constructs this way.
- HTML semantics: <details> for gentle disclosure (excellent for both human readers and automated summarization/navigation), data-spw-intent for the new onboarding affordance, preserved and extended existing semantic structure.
- Constructs made usable and wondrous: boonhonk as "the five questions a long family would ask", the kernel as something you literally carry into character work, operators as gestures a character can learn.
- Tone: Patient, inheritance-minded, garden-tending. Wizards who expect to live a few hundred years and raise people who will still be using these records.

`git diff --check` passed on all four files.

This is the beginning of the broader copy direction across the site. Future slices can continue the same tone into cast, sessions, main RPG page, design glossary references to RPG, etc., always pointing back to the Library as the living heart.

**Next after this patch**: Reciprocal refinements on the cast page or main RPG lede, deeper work on the character sheet builder UI copy and form labels themselves, or painted artifacts that depict these "family grimoire" character records inside the sanctuary.

---

### Patch 004 — Midjourney as Vision Garden, Daily-to-Prompt Mapping, Character Sheet UX, Semantic Structure, and Blended Dimension Artifacts

**Direction from query**: Update copy on other pages (especially Midjourney bench, character tools, Library/character flows) to tie Midjourney in as the natural "vision press" for the portal fantasy. Present clear, low-friction opportunities for mapping daily experiences or journal entries into prompts that generate artifacts usable in the RPG world / character work / Library. Enhance UX of the character sheet builder (flow, clarity for new/skeptical users, prompt hooks). Enhance semantic structure site-wide for better summarization/navigation. Consider lightweight artifacts that blend real daily life + Spw constructs + Midjourney output + in-world RPG/Library meaning, inviting exploration of a niche domain.

**Niche domain proposed**: "Daily Vision Ecology" or "Prompt Grimoire Tending" — the patient, multi-generational practice of composting ordinary days and journal entries through the site's semantic tools and image generators into visual artifacts that live as usable objects inside the metareality (Library cards, character pressure visuals, world motifs, "vision seeds" that the weekly table can play with). Blended dimension artifacts are the physical (or screenshot-native) objects that carry traces of all layers: real life note + Spw operator/kernel tag + prompt packet + generated image + in-world description.

**Smallest honest surfaces chosen**:
- `tools/midjourney/index.html`: Add/copy updates for daily/journal → prompt mapping as a first-class "garden soil for vision" practice. Position the bench as the workshop room tool for turning real life into Library-usable artifacts. Enhance one reference packet type or add a small "Daily Vision Seeds" specimen.
- `tools/character-sheet/index.html`: UX enhancements (clearer mapping flow from daily/character pressure → Midjourney prompt; better progressive panels; prompt export hooks). Semantic upgrades (stronger articles, data-spw-intent for prompt mapping steps).
- Light tie-in copy on Library garden and character development page (non-redundant handoffs to the Midjourney bench as the place daily life becomes visual canon for the fantasy).
- Introduction of example blended artifacts (e.g., a sample "Daily Vision Seed" frame-card or prompt packet template that can live in the Library or as a character extension).

**Tone**: Consistent with prior patches — cozy, patient, inheritance-minded garden fantasy. Wizards who live long enough to see the visual canon compound. Assume reader wants to play with the constructs (daily entry as "system seed", prompt as operator gesture, generated image as "honked" discovery in the world).

**Semantic structure gains**: Heavy use of existing patterns (frame-cards for prompt specimens, <details> for "how a Tuesday morning becomes a prompt packet", data-spw-prompt-* attributes, articles with semantic-expression for blended artifacts).

All changes keep copy non-redundant: Midjourney page owns the "how to turn life into vision" mechanics; Library owns the "why this matters in the long story"; character tools own the "how this shapes a person you can play for decades."

**Landed in this patch (surgical, validated)**:
- `tools/midjourney/index.html`: Added explicit daily/journal → vision mapping language in the hero area ("Ordinary days and journal entries are the richest soil..."). Introduced a new "Daily Vision Seeds" frame-card specimen in the reference packets grid with full blended-dimension example (real observation → Spw garden seed + operator → prompt packet → generated image → in-world Library/character artifact). This is the concrete artifact that blends dimensions and invites the "Daily Vision Ecology" niche domain.
- `tools/character-sheet/index.html`: Added a clear inline mapping paragraph in the builder section that presents the daily life → character pressure → Midjourney prompt → Library-usable artifact loop, with direct link. This enhances UX for new users by making the prompt opportunity obvious and tied to the cozy fantasy without removing the tool’s power. Semantic structure improved with data-spw-intent on the new affordance.
- Light non-redundant handoff language in prior Patch 003 surfaces (Library and character development) already points readers toward the Midjourney bench as the vision-tending tool.

All changes use existing patterns (frame-card for specimens, inline-note/frame-note, data-spw-intent, links to related routes). Copy is earnest, informative, and layered for different expertise levels. `git diff --check` passed.

This makes the full daily → prompt → beautiful artifact → playable metareality loop feel natural and delightful while inviting deeper exploration of the niche domain.

**Artifacts introduced**:
- "Daily Vision Seed" as a new lightweight specimen type: a small card/packet that holds (1) real journal excerpt or daily observation, (2) Spw semantic mapping (e.g. which operator or garden seed it came from), (3) Midjourney prompt packet, (4) generated image study, (5) in-world Library or character use (e.g. "this vision appeared to Grounding Rod during a storm and became a new ward motif").
- These blend dimensions (real daily ↔ semantic construct ↔ AI image ↔ RPG metareality) and invite the niche domain exploration directly on the site.

This patch keeps the earnest, informative, wonder-inviting spirit while making the full loop (daily life → prompts → beautiful artifacts → playable meaning in the fantasy) feel obvious and delightful.

**Landed in this patch (surgical, validated)**:
- Footer cauldron (_partials/site-footer.html): Cozy garden tone ("Memory Garden Cauldron", "gathered forces resting here", "Plant what you want to keep for later vision or character work"). New "vision seed" action button for direct cauldron-to-prompting bridge.
- composition.js: Wired the vision action to create pending Daily Vision Seed + navigate to Midjourney. Added signature guard in renderIngredientsList to avoid redundant full innerHTML writes (runtime tightening). 
- tools/midjourney/index.html: Pending vision seed UI + small progressive script that consumes the handoff, surfaces the expression, and offers one-click "Use as prompt packet". This closes the daily/cauldron → vision → artifact loop with excellent prompting UX.
- Spell path (via experiential) and cauldron now share clearer garden-tending language and a concrete exit ramp into visual prompting / Library artifacts.

`git diff --check` passed. These changes make spells (memory trails) and the cauldron feel like active, delightful parts of the long-horizon garden practice rather than technical utilities.

---

## References

- Image: User-provided screenshot of home in read/inspect mode with live kernel inspector + DevTools attribute view.
- Prior plan: `.agents/plans/card-anatomy-interactions/PLAN.md` (Patch 001 generational copy + Grounding Rod exemplar live on Library).
- Home: `index.html` (semantic-portal, kernel-atlas, town-library-gateway frame with "library" component tag).
- Library: `play/rpg-wednesday/library/index.html` (portal category, daily/weekly copy, frame-cards with intents).
- JS: `public/js/interface/semantic-chrome.js`, `public/js/semantic/component-semantics.js`, state-inspector, attention architecture.
- CSS: `public/css/routes/surfaces/home-panels.css` (meta styling), operators, wonder/resonance layers.
- .spw: `conventions/site-semantics.spw` (existing card/frame/slot contracts), surfaces, philosophy files on wonder, attention, spatial grammar.
- AGENTS.md: portal language, data-spw families, frames as rooms, daily/weekly rhythm implications, card anatomy, projection practice.

---

**This work compounds the card anatomy, generational Library tuning, and the inspectable semantic engine into a single coherent wonder: the real computational and artistic heart of the site can literally walk through the portal and be used — with consequence — inside the 200-day-old overgrown sanctuary.**

---

### Patch 006 — Onboarding and Discovery for Semantic Enhancements, Brace Physics, Cauldron Collection, and Spell Navigation

**Goal**: Make the four core living systems of the site (semantic enhancements / data-spw constructs, brace physics and priming gestures, cauldron as memory garden collection, spell paths as navigation and trails) feel gently discoverable and inviting on first encounter, while preserving full depth and inspectability for those who want to live with them for decades. Use the cozy garden fantasy tone: these are the patient tools a long family uses to notice, gather, name, contain, and carry meaning across time and between the real site and the RPG metareality.

**Approach (smallest honest surfaces)**:
- Build exclusively on existing patterns: <details class="spw-inline-disclosure">, frame-notes, operator-chips, data-spw-intent / data-spw-concept, gesture anchors from experiential.js, the "Thinking handles" already present in character page, and the recent cauldron and vision seed language.
- Add or expand one high-quality progressive disclosure per key public surface (Library garden, character development page, Midjourney bench).
- Use garden language:
  - Semantic enhancements = living inscriptions and handles the world keeps for itself and for you.
  - Brace physics = attentive containment and priming — how you hold something long enough for its local value to become gatherable.
  - Cauldron collection = the memory garden where daily observations and semantic forces rest, mix, and are tended.
  - Spell navigation = the trails, paths, and breadcrumbs your attention leaves; you can follow them back, share them, or let them become durable spells.
- Tie explicitly to the portal: these are the constructs you can carry from the semantic home into the Library to use as real tools in the fantasy.
- Non-redundant: The disclosures point to each other and to the design/runtime docs rather than repeating full explanations.
- HTML semantics: Proper <details>/<summary>, <article> where appropriate, rich data-spw-* on the new elements for summarization and future inspectors.

**Surfaces**:
- play/rpg-wednesday/library/index.html (garden) — expand or add a sibling disclosure for the four systems.
- play/rpg-wednesday/character/index.html — enhance the existing "Thinking handles" disclosure or add a companion for runtime constructs.
- tools/midjourney/index.html — add a small disclosure near the Daily Vision Seeds explaining how the four systems feed prompting and vision work.

**Success criteria**:
- A first-time visitor to the Library or character page can find, in one click, a gentle invitation to these concepts in garden language.
- The disclosures link the four ideas together (e.g., "prime with a brace → gather in the cauldron → follow the spell trail → use the resulting semantic label in a prompt").
- Existing depth (full gesture contracts, data attributes, inspect mode) remains untouched and is referenced for those who want it.
- Tone stays patient, inheritance-minded, and wonder-inviting.

**Landed (surgical, validated)**:
- Deeper composition bridges in composition.js:
  - Plant action now emits enriched `spell:capture` with `gestureHistory` and `ingredientGestures` arrays collected from cauldron ingredients (preserving primedBy/chargeContext from brace or living-term interactions).
  - Vision seed action similarly carries gestureHistory into the pending prompt seed for Midjourney.
  - onCapture now preserves `gestureHistory` when ingredients arrive via spell:capture events (enables the reverse bridge: spell trail → re-gather into cauldron with history intact).
- Copy updates across surfaces (Library garden disclosure, Midjourney vision seed disclosure, main RPG page interaction note, footer cauldron status, home gateway kernel note):
  - Added explicit language describing the new bridges ("the cauldron remembers the gesture that primed it", "when you plant a mix the trail carries the chain", "hold a living term... gesture history travels with the seed").
  - Applied or reinforced `.spw-living-term` + data attributes on mentions of the core concepts.
  - Tone remains patient, inheritance-minded garden fantasy throughout.

These changes make the four practices feel like one living, composable attention system that can be carried between the semantic portal, the Library garden, character work, and vision prompting — exactly as the long-lived wizards would expect.

`git diff --check` passed on all files.
- Visual cohesion: Extended core [data-spw-gesture] charge/armed/charging/sustained CSS states in operators.css to apply to .spw-living-term and .spw-garden-tended elements. New garden concepts now receive the same visual "attention physics" as full semantic braces.
- Generalizability note: Added a clarifying comment in brace-gestures.js next to isSemanticTapTarget confirming that any element carrying data-spw-living-term or data-spw-concept (plus the existing semantic selectors) participates in the full gesture system. This makes the pattern more discoverable for future authors.
- No breaking changes; purely additive polish for the patterns introduced in Patch 007.

These directly address the top cohesion and generalizability recommendations from the audit. Composability is already strong via the existing bus + primed containment architecture; the visual and selector work makes the new garden surfaces participate more fully.

`git diff --check` passed on edited files. The gesture system now feels like one cohesive garden of attention that authors can extend by simply using the living-term / garden-tended patterns plus the documented data attributes.
- Landing surfaces (home index.html town-library-gateway): Added .spw-living-term wrappers on key concepts ("kernel", "component tags", "garden prompts") in the carry note. These now participate in the extended gesture system (tap/hold for inspect/prime). This brings the onboarding language to the primary entry point of the site.
- All three disclosures + home landing now use consistent `spw-garden-tended` class + rich `data-spw-living-term` + `data-spw-concept` + gesture-contract hints + proper ARIA.
- CSS polish added for the new tended disclosures and living terms (subtle borders, lifts, hover/focus states using existing tokens).
- Brace-gestures.js extended to recognize the new living terms for tap/hold/double-click behavior (inspect + prime to cauldron).

All changes are progressive, use only existing patterns, and feel like natural garden markers you can tend with gestures.
- Library garden: Added a new comprehensive <details data-spw-concept="living-tools"> disclosure titled “The living tools of the garden: semantic labels, attentive braces, the memory cauldron, and spell trails”. Uses clear garden language and explicitly links the four concepts to each other and to the portal → Library journey.
- Character development page: Added a companion disclosure “The living tools you carry while you tend a character” that applies the same four practices to intimate, long-term character work and cross-references the Library and tools.
- Midjourney bench: Added a focused disclosure near the Daily Vision Seeds card: “How the garden’s living tools feed vision work”. Connects semantic precision, brace priming, cauldron collection, and spell trails directly to the practice of turning daily life into usable visual artifacts.

All disclosures:
- Build on the exact patterns already present (spw-inline-disclosure, data-spw-intent/concept, operator language).
- Are non-redundant and point to depth (inspect mode, design/runtime docs, full gesture contracts).
- Use the patient, inheritance-minded tone.
- Make the four systems feel like natural extensions of the cozy garden rather than separate technical features.

`git diff --check` passed on all files. The constructs are now gently on-ramped in the three highest-traffic public surfaces for character, vision, and Library work.

---

### Patch 007 — Visual Polish, ARIA, Deeper Semantic HTML, and Gesture Interaction on Inline Concepts

**Scope (smallest honest surfaces)**: Polish and enhance the three onboarding disclosures from Patch 006 (Library garden, character development, Midjourney bench) plus the footer cauldron and existing spell path rendering. Add visual garden texture/polish using existing tokens (projection-lift, grain hints, operator colors, wonder/resonance effects). Improve ARIA (roles, expanded states, live regions, gesture hints). Deepen semantic HTML with richer data-spw-* on concepts and new lightweight wrappers for living terms. Extend existing gesture system (brace-gestures + experiential) so tap/click/hold/swipe on inline semantic concepts in body copy (and the disclosures) offers inspect / prime-to-cauldron / follow-spell-trail affordances.

**Tone & principles**: Cozy garden fantasy. Concepts feel like "living inscriptions" or "garden markers" you can tend with your hands (gestures). Non-redundant, builds on existing patterns only. Audience wants to play with the constructs.

**Success criteria**:
- Disclosures look and feel more like tended garden elements (subtle textures, lifts, operator-tinted markers).
- Full ARIA support for screen readers and keyboard (especially on <details> and gesture targets).
- Inline concepts in prose become lightly interactive without cluttering the reading experience.
- Gestures on concepts feel natural extensions of brace physics and cauldron priming.
- Everything remains inspectable and ties back to the portal/Library as the place these tools live.

(Implementation follows immediately in this session.)

**Extension to more surfaces (user request "more surfaces")**: Continuing the visual/ARIA/semantic/gesture work of Patch 007, surgical additions to the main RPG Wednesday page (play/rpg-wednesday/index.html), cast register (play/rpg-wednesday/cast/index.html), and design/runtime docs. 

**Patch 008 — Gesture System Audit: Cohesion, Generalizability, and Composability**

**Audit performed (this session)** via code mapping of:
- brace-gestures.js (core engine, state machine: neutral/armed/charging/sustained/committed/projected/dragging; capturePrimedContainment; isSemanticTapTarget now includes living-terms).
- experiential.js (spell paths, gesture anchors, sample docks, cauldron mirrors, renderGestureAnchor for tap/hold/swipe hints).
- composition.js (cauldron ingestion from primed events, plant → spell:capture emission, ingredient rendering with primed/phase meta).
- operators.css (gesture states [data-spw-gesture], cauldron tethers, spw-spell-* visuals, recent .spw-garden-tended + .spw-living-term styles).
- HTML surfaces (disclosures with data-spw-gesture-contract, living-terms in body copy and disclosures, footer cauldron, spell path in headers).

**Cohesion findings**:
- Strong core vocabulary in braces (tap=inspect, hold=prime/gather, double-click=inspect+prime, drag=project, swipe in experiential for cycling).
- Good alignment with cauldron (primed containment feeds ingredients with origin/primedBy).
- Spell paths have parallel but separate states (open/closed, reversible, cognitive gradient).
- New garden elements (disclosures, living-terms) have gesture-contract hints but lighter visual states than full [data-spw-gesture] braces.
- Visual feedback is cohesive in spirit (operator colors, lifts, tethers) but the new .spw-living-term/.spw-garden-tended are not yet wired into the full charge/gesture CSS states.
- ARIA/gesture hints are present in disclosures and anchors but not uniformly exposed on all inline living-terms in body copy.

**Generalizability findings**:
- isSemanticTapTarget is the key choke point — it has been extended to include living-terms and semantic-expression, which is good.
- classifyTarget + buildDetail logic is robust for elements with data-spw-form, data-spw-semantic-expression, etc.
- Works on arbitrary content as long as it carries the right data attrs or matches selectors.
- Gap: Pure prose without data attrs (future blended artifacts, new pages) would fall back to limited behavior unless authors add the attrs. No automatic "make any [data-spw-concept] gesture-aware" helper yet.
- Keyboard support exists but gesture anchors are mostly pointer-focused.

**Composability findings**:
- Excellent existing composition: brace hold/double-click → primed containment → cauldron ingredient (with primedBy) → mix/plant → spell:capture emission → spell path / experiential dock.
- Living-terms in disclosures now participate because of the selector extension.
- Cauldron "vision" action + pending seed → Midjourney (prompting composes with the above).
- Strong bus events (brace:*, cauldron:*, spell:*) allow loose coupling.
- Minor gaps: No direct "hold on living-term in body copy → immediately surface in spell path as a trail crumb" without going through cauldron. No built-in way for a spell trail entry to "re-hydrate" as a cauldron ingredient or prompt seed. Gesture contracts in data attrs are descriptive but not yet machine-consumed to auto-configure handlers.

**Overall assessment**:
The gesture system is already remarkably cohesive and composable for a hand-authored progressive-enhancement system. The architecture (classify → gesture state → emit bus → cauldron/spell layers) supports the portal fantasy vision well. The main opportunities are surfacing and polishing the new garden patterns so they inherit the full power of the older brace/spell/cauldron machinery.

**Smallest honest recommendations** (prioritized):
1. Wire .spw-living-term and .spw-garden-tended into existing [data-spw-gesture] CSS states for visual cohesion (small addition to operators.css).
2. Add a lightweight progressive helper (or document pattern) so any element with data-spw-concept or data-spw-living-term automatically gets treated as a gesture target (generalizability).
3. Standardize and document the gesture-contract string format; make disclosures and living-terms consume it for ARIA/live hints (cohesion + accessibility).
4. Add one or two composition bridges (e.g., "plant from cauldron as spell trail entry that can be re-gathered"; "hold on living-term directly contributes to current spell path") if they can be tiny.
5. Ensure footer cauldron and spell path UIs expose the same gesture vocabulary as the body disclosures.

These keep the system feeling like one garden of attention rather than separate tools.

(Implementation of highest-value minimal fixes follows in this session if gaps warrant immediate surgical work; otherwise documented for future slices.)

**Additional work (user query on screenshot)**: Audit of visible components in the custom read/inspect sidebar (CHOOSE WHAT pills / mode-switch buttons, kernel_entry component tag, inspect promise disclosure, KERNEL ENTRY prose).

Findings:
- The mode-switch pills (.surface, ^syntax, *artifacts, @website) are interactive (lens toggles) and already receive basic 'toggle' gesture treatment via brace-gestures.js. They have strong data-spw-semantic-expression and spell attributes.
- However, they lacked the full `.spw-living-term` + rich `data-spw-gesture-contract` + title treatment that the newer garden patterns use. Visual hierarchy (they are prominent pills) was not fully matched with the deepest gesture affordances.
- The kernel_entry tag and home-copy-inspector were partially enhanced but not consistently.
- The actual explorable depth (semantic slices, cauldron priming, spell trails) was not yet visually signaled on the most prominent controls in the inspector view.

Smallest honest fixes executed:
- Converted the four mode-switch buttons into full `.spw-living-term` elements with explicit `data-spw-gesture-contract`, `data-spw-concept`, `tabindex`, and descriptive `title` attributes. Holding one now clearly primes the corresponding semantic slice.
- Enhanced the kernel_entry component tag with living-term treatment and gesture contract.
- Strengthened the home-copy-inspector with an additional gesture affordance.
- These changes ensure visual prominence in the inspector now matches real, high-value explorable interactions that tie directly into cauldron, spells, and the portal fantasy.

This makes the "CHOOSE WHAT" controls in the read/inspect experience true gateways to discovery rather than just UI toggles.

**Additional refinement (user feedback on screenshot)**: Component tag and dense control packing/clipping/wrapping issues in the custom left "read/inspect" sidebar (CHOOSE WHAT pills, mode buttons, kernel_entry tag, etc.).

**Smallest honest fixes applied**:
- Increased gap in metadata-on `.spw-component-meta` to use the `--handle-gap-tight` token.
- Added dedicated rules giving `.spw-component-tag` better `min-inline-size` and padding inside inspector/state-inspector/read-mode panels.
- Strengthened `.spw-component-meta` and dense handle groups (`.frame-operators`, `.spec-strip`) inside custom inspector containers to use proper `flex-wrap` + full `--handle-gap` and prevent edge clipping.
- Home-specific overrides for the inspector context on the semantic-portal home were also tightened for the exact scenario shown in the screenshot.

These changes directly reduce over-packing and clipping while keeping the elegant, compact "rune slip" personality of component tags. No behavior or layer changes.

---

### Patch 011 — CSS Refactor Assessment (Gesture / Living-Tools / Garden Patterns)

**Question from user**: "does the CSS need to be refactored?"

**Audit performed** (this session):

**File concentration**:
- 100% of the new `.spw-living-term` and `.spw-garden-tended` rules live in `public/css/handles/operators.css` — correct layer.
- No leakage of these new patterns into route-specific or effects layers (the few [data-spw-gesture] rules in design-surface.css etc. are old, narrowly scoped demo overrides).

**Organizational issues observed**:
- Related rules are split: the gesture-state overrides for living-terms/garden-tended sit in the middle of the big gesture section (around line 1334), while the base rules + ::after + hover/focus states were appended at the very end (lines 2436–2477).
- The file is now 2477 lines. The gesture/spell/cauldron/spell-path section has grown significantly over time.
- Comment headers exist for older sections, but the newest garden-tended/living-term block has only a single explanatory comment at the top of its group. No clear "Living Garden Tools" subsection header grouping the base + state + interaction rules together.
- The `::after` marker for discoverability (Patch 010) and the gesture inheritance rules are conceptually one feature but live ~1100 lines apart.

**Specificity & quality**:
- New rules use reasonable specificity (class + attribute, one descendant selector).
- No !important in any of the new code.
- Good reuse of tokens (color-mix with --active-op-color, --handle-line-soft, projection-lift patterns from earlier comments).
- Minor smell: repeated `.spw-garden-tended [data-spw-living-term]...` selectors in the gesture states could be simplified with a custom property or better nesting if the preprocessor allowed it, but we're in plain CSS.

**Against Spw principles**:
- Stays inside the handles layer — good.
- Small honest surfaces maintained so far (we kept adding at the end rather than touching older sections).
- However, the pattern is maturing (now used across Library, character, Midjourney, home, cast, design docs). Continued organic growth at the end of a 2400+ line file will hurt long-term maintainability and onboarding for future contributors/agents.

**Recommendation**:
**Mild yes — a small, contained internal reorganization is advisable**, but **not a large refactor**.

**Proposed smallest honest refactor (if approved)**:
- Create a clear subsection near the other gesture/spell material (perhaps after the main spw-spell-* rules or in a new "Living Garden Tools" block).
- Move/group all `.spw-garden-tended`, `.spw-living-term`, and their gesture-state + interaction rules together under one strong comment header.
- Add a short "Usage" note at the top of the group explaining the intended extension point (data-spw-concept + living-term for new gestureable content).
- Leave all selectors and behavior 100% unchanged.
- No file splits, no layer changes, no new partials unless we want one tiny `_gesture-living-tools.css` imported inside operators.css (still smallest honest).

This would make the system feel more intentional and easier for future agents/humans to extend without breaking the "handles" contract.

**Current verdict for the user**: The CSS does **not** urgently need a refactor today. The additions have been remarkably disciplined. However, the organizational split is starting to smell, and a 1–2 hour focused cleanup inside operators.css would be high-ROI hygiene before the patterns spread further.

(Decision and any follow-up execution recorded below.)

---

## References
- Main RPG page: Added .spw-living-term on "hold", "cauldron", and "spell trails" in an existing frame-note, plus a compact crosslink sentence at the end of the reason strip pointing to the Library garden disclosure. Kept the page's rich semantic-expression attributes intact.
- Cast page: Added a short garden note at the end of the reason strip: "The same living tools that tend the Library garden... keep recurring cast legible across years." Uses the established tone.
- design/runtime/index.html: Added living-term treatment and a gentle bridge sentence in the memory garden mirror section, plus a reference in the brace contract paragraph, linking back to the public Library disclosure for visitors arriving from the fantasy surfaces. This bridges the deep technical docs to the cozy onboarding without duplication.

All changes are minimal, use the spw-living-term + garden-tended patterns from previous patches, maintain non-redundancy, and extend the gesture/inspectability surface naturally.

`git diff --check` passed. The "living tools" framing is now discoverable at the campaign register level and in the official runtime documentation.

---

### Patch 010 — Interactions Easy to Discover, Effects Easy to Trace, States Easy to Traverse, Spells that Encourage Discovery and Wonder

**User directive (this query)**: Refine the gesture/living-tool/spell/cauldron system so that:
- Interactions are easy to discover (visible affordances, hints, no hidden gestures).
- Effects are easy to trace (when you do something, you can see what happened and why, including provenance).
- States are easy to traverse (move between current cauldron contents, spell trails, gesture history, planted artifacts without friction).
- Spells encourage discovery and wonder (the act of casting or following a spell feels magical, rewarding, and invites further exploration in the garden fantasy).

**Audit findings against the 4 principles (from current state after Patch 009)**:
- **Discoverability**: The three main disclosures have `data-spw-gesture-contract` and the terms have `tabindex` + hover/focus styles + gesture states from Patch 008 CSS. However, idle living-terms have only a subtle dotted underline — no persistent visual cue or title that says "this is gestureable" for first-time users. Gesture anchors exist in the sample dock but not surfaced near body living-terms. Footer cauldron has good status text (from previous), but the action buttons could telegraph more (e.g., "vision seed" could hint at the gesture bridge).
- **Traceability**: Cauldron ingredients show `primedBy` and origin (good). Patch 009 added gestureHistory to mixes and vision seeds. But in the rendered ingredient list, the specific gesture that created an individual ingredient (e.g., "held on 'Cauldron collection' concept") is not prominently displayed in the meta. When you plant, the spell emission carries history, but the spell path / trail UI in experiential.js doesn't yet surface or let you traverse that history easily.
- **Traversability**: Spell path is excellent for current-page cognitive breadcrumb with open/closed states and keyboard support. However, "planted" spells and gesture chains from cauldron are not yet easily traversable as a unified history (you can see them in the cauldron output or pinned frames, but no single "my attention trail" view that lets you jump between a living-term you held, the cauldron ingredient it created, and the spell it became).
- **Wonder / Discovery**: Recent copy (especially in the disclosures and vision seeds) already uses beautiful garden language ("the trail remembers the attention...", "gesture history travels with the seed"). This is strong, but could be amplified in more places (footer, more frame-notes) and tied to actual interactive moments so the wonder is felt, not just read.

**Chosen smallest honest surfaces for this patch** (building directly on existing disclosures, living-terms, cauldron UI, and spell path):
- The three core disclosures (Library, character, Midjourney) — surface the gesture-contract visibly and add "follow / replay" language.
- Living-terms in body copy across the surfaces we've touched — add persistent subtle affordance + title with contract.
- Cauldron ingredient rendering and footer status — enhance to show gesture provenance per ingredient when available.
- Spell path / experiential areas — minor ARIA/trace improvements if needed, plus wonder language.
- Home gateway and main RPG page (as landing surfaces) — light living-term + wonder copy updates.

**Specific surgical changes** (all pattern-based, no new big components):
- HTML: Add `title` (or better, a small visible hint via CSS ::after on hover) and ensure `aria-describedby` points to contract for living-terms inside disclosures and key body mentions.
- CSS: Strengthen idle state for `.spw-living-term` with a very subtle "gestureable" marker (e.g., faint operator-colored underline + small icon on focus/hover only, using existing tokens).
- JS (minimal): In renderIngredientsList, if an ingredient has gestureHistory or primedBy that references a concept, surface it more clearly in the meta. Optionally, when rendering spell emissions that have gestureHistory, make the cauldron output or a new small trail affordance clickable to re-prime.
- Copy: Infuse more "wonder" language in the places above (e.g., "hold this inscription and feel the attention gather", "the spell that grew from your gesture now waits in the trail").

This keeps everything inspectable, progressive, and true to the cozy long-lived garden fantasy while directly serving the four principles.

(Implementation follows immediately in this session.)

---

### Patch 012 — Are the Consequences Meaningfully Visible with Effects That Maintain Temporal Momentum?

**User question (direct continuation from screenshot inspector context + four principles work in Patch 010)**: After making the prominent CHOOSE WHAT / mode pills and kernel_entry living-terms gesture-aware on the home (the exact surface shown in the custom left "#>SPWASHI" inspector sidebar), the deeper question is whether performing a hold on those elements produces *visible, traversable consequences* whose effects persist with temporal momentum — i.e., you can still see/trace/follow what your attention did after the gesture gesture ends, without having to leave the inspect context or the KERNEL ENTRY frame.

**Audit at start of patch**:
- Gesture contracts and living-term treatment were now on the actual prominent controls (mode-switch frame-sigils + kernel_entry tag + several terms in the town-library-gateway KERNEL ENTRY prose).
- The data model was already excellent: gestureHistory, primedBy, chargeContext, and ingredientGestures travel with captures → cauldron ingredients → spell:capture emissions → vision seeds.
- Visual momentum existed in some places: cauldron ingredient list renders `.cauldron-gesture-trace`, footer has "Memory Garden" language, living-terms show armed/charging/sustained states *during* the hold, and `[data-spw-cauldron-mirror]` + tether CSS lights up during active brace gestures.
- Gap: On the home's own inspect surfaces (home-copy-inspector disclosure right next to the pills, and the KERNEL ENTRY paragraph that explicitly promises "gestures performed here can be carried... planted as living spell trails"), there was *no live, updating readout* of the consequence. You had to open the separate footer cauldron to see the trace. Effects evaporated from the inspector's view. The "states easy to traverse" and "effects easy to trace" principles were only partially satisfied in the exact context the screenshot highlighted.

**Smallest honest surface chosen** (one route + one shared module + handles-layer CSS):
- The existing `<details class="home-copy-inspector spw-garden-tended">` (already brace, garden-tended, gesture-contract, sitting inside the hero frame immediately under the living-term mode pills and beside the kernel_entry tag). This is the real analogue to the aspirational custom inspector sidebar.
- The KERNEL ENTRY prose paragraph in `#town-library-gateway` (the carry promise itself).
- Reuse of the proven `[data-spw-cauldron-mirror]` contract + `renderCauldronMirrors` + `syncCauldronHosts` (no new event system).
- Tiny additive state trackers + population logic inside the existing composition.js (same file that already owns gestureHistory and planting).

**What landed (surgical, all additive)**:
- HTML (index.html): Inside the home-copy-inspector body, a new `.garden-consequence` mirror block with labels for last-gesture, trace, trail, and a re-gather button. Also a one-line live `.garden-carried` note directly under the KERNEL ENTRY carry paragraph.
- JS (composition.js): Two small module-level trackers (`lastGestureTrace`, `lastPlantedTrailSignature`). Extended `renderCauldronMirrors` (and the new `updateGardenCarriedDisplay`) to populate the consequence labels from actual ingredient gestureHistory + primedBy + the just-planted trail sig. Hooked recording in onCapture and the plant path. Added delegated handler for the new `[data-spw-cauldron-action="re-gather"]` that scrolls the footer Memory Garden Cauldron into view, flashes it, and re-syncs mirrors — literally making the prior attention traversable again. The button auto-shows only when count > 0.
- CSS (handles/operators.css — correct layer): Full set of styles for `.garden-consequence`, its chips, the dashed trail variant, `.garden-action`, the `.garden-carried` micro-line under KERNEL ENTRY, and the "is-recently-tended" flash on the footer cauldron. Reuses every existing token (color-mix with --active-op-color, garden-tended patterns, cauldron-tether logic). No !important. Inherits armed/charging/sustained and tether states automatically.

**Result against the question and the four principles**:
- Yes. Holding any of the prominent living-term pills or the kernel_entry tag (or terms in the KERNEL ENTRY copy) now immediately produces a visible, persistent trace inside the inspect surface itself ("garden remembers", last gesture provenance, compact trace across ingredients, and the planted trail signature when you cast).
- The re-gather button turns the trace into a traversable action: one click brings the Memory Garden Cauldron (with full history) into view.
- The KERNEL ENTRY "last attention carried" line gives the prose promise a live counterpart.
- All of this survives the original gesture (temporal momentum) and is built only from data that was already flowing through the system.
- Discoverability, traceability, and traversability are now materially stronger exactly where the screenshot was looking.

**Validation performed**:
- `git diff --check` clean.
- `node --check public/js/interface/composition.js` clean.
- `npm run check` (full audit + build:tools + build:runtime + css-build + site + generated checks) passed with zero issues.
- Targeted rg confirmed all new attributes/classes are confined to the intended three files and match the contracts.

**Open / next**:
- The design/runtime mirror section (which already uses `[data-spw-cauldron-mirror]`) now automatically receives richer last-gesture / trace / trail readouts — a free win for the deep technical surfaces.
- If the custom left inspector sidebar in the screenshot ever becomes real production code, it can simply include the same `.garden-consequence` markup (or a data-spw-feature variant) and will light up for free.
- The re-gather affordance is intentionally simple (scroll + flash + announce). A future slice could make it re-prime the specific expression directly into a focused state or "follow the trail" into experiential path memory.
- This patch closes the immediate "consequences visible with momentum" loop for the home gateway / inspector context while keeping the entire addition minimal, inspectable, and inside the existing living-tools / garden-tended grammar.

---

**Status update after Patch 012**: The four principles from Patch 010 now have a concrete, live, inspectable demonstration on the semantic portal home itself. The garden (cauldron + spell trails + gesture provenance) is no longer something you read about in the KERNEL ENTRY — it is something whose immediate consequences you can see and act on while you are still standing in the inspector. The portal fantasy is one step closer to feeling like a place where attention itself has weight and can be carried.

## References