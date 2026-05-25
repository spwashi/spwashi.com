# Culinary Excellence Enhancement

**Public goal:** Elevate the site's culinary surfaces so "culinary excellence" reads as rigorous craft, precise language, and living metaphor — not only vehicle for other domains. Strengthen copy precision/vividness and bidirectional topic linking so recipes/ becomes a stronger, more legible hub in the lattice.

**Why now:** .spw/surfaces/product-lines.spw and approach-topography.spw flag /recipes as naive markup needing hero/substrate/cards. Principle registers (mise, reduction, fermentation) contain "Agent: extend" markers. Math and nutrition pages use culinary metaphors heavily but links are one-way or generic. Spans routes + shared .spw.

**Scope (smallest honest patches):**
- Copy: surgical prose passes on recipes/index.html and the three principle pages for excellence (concrete technique notes, tighter phrasing, celebratory but grounded language).
- Topic linking: add/reinforce specific cross-links (e.g. numerical-methods/vector-calculus <-> fermentation/reduction; nutrition <-> specific subpages; play/design <-> recipes principles). Use existing operator-chip / spw-topic patterns.
- .spw: light state update in product-lines.spw and site-semantics.spw once patches land; no new surfaces.
- Plan maintenance: this file + any follow-up under the slug.

**Affected surfaces (predicted):**
- Route HTML: recipes/index.html, recipes/{fermentation,mise-en-place,reduction}/index.html, topics/nutrition/index.html, topics/math/{numerical-methods,vector-calculus,index}.html, play/rpg-wednesday/index.html, design/components/index.html
- .spw: surfaces/product-lines.spw, surfaces/approach-topography.spw, conventions/site-semantics.spw (culinary-component-physics frame)
- No new JS/CSS or build changes.

**Success signals:**
- Copy on culinary fundamentals feels more excellent (precise verbs, memorable images, practical handles).
- At least 4-6 new or strengthened specific topic links in both directions.
- `git diff --check` clean; no broken anchors per rg.
- .spw current_state for recipes notes measurable progress (e.g. "principle cards extended; cross-topic links tightened").

**Process notes:**
- Follow AGENTS.md: minimal surgical edits, preserve existing structure/copy unless change is the point, semantic HTML + data-spw-* where natural.
- After edits: validate with `git diff --check`, targeted content searches, `npm run check` if manifest touched (unlikely).
- If larger cards/hero/visual substrate needed later, that becomes follow-on plan (image-optimize + craft-quality skills).

**Date opened:** 2026-04 (initial patches)
**Status:** Patches landed (2026-04). 

**Changes made:**
- Copy excellence: demi-glace precision note in reduction; mise en place as "quiet excellence of arrangement" with concrete kitchen image; "sensory precision and repeatable excellence" framing + grounded value in main recipes vocab section.
- Topic linking: explicit *fermentation link + operator attr from numerical-methods lab; vector-calculus intro now directly links /recipes/ + reduction/mise registers with data-spw-operator; nutrition anchors now list the three principle registers with explanatory grammar note (valid HTML).
- .spw: product-lines.spw current_state updated to record the prose passes and cross-link tightening.
- Plan file created under .agents/plans/culinary-excellence/ per multi-route rule.

**Validation:** `git diff --check` clean. rg confirmed new links/anchors in source. Surrounding markup balanced on edits. No new deps or generated surfaces touched.

**Next:** If visual substrate/hero or full recipe cards desired, open follow-on with image-optimize + spw-craft-quality. Otherwise this fulfills the enhancement request with smallest honest surfaces.

See also: nutrition-crop-language/, fairytale-cookbook-theory/ for adjacent crop/recipe language work.

---

## Recipe Skills Most Relevant for Cooking for Friends & Family (2026-04 addition)

**Context for this analysis:** Direct response to the query asking which recipe skills matter most when the actual goal is cooking *for* friends or family — care, generosity, repeatability, and being present with people — rather than restaurant-level performance or solo efficiency.

The site already has excellent latent structure here (wisdom cards, semantic expressions like `service[scene]{company.rhythm}` and `etiquette[preference]{behavior.repair}(shared-table)`, the `batch[base]` and `byproduct[realm]` cards, and especially the `culinary-component-physics` frame in site-semantics.spw that explicitly closes with "service tests whether the component works in company").

**Key distinction:** In social/home cooking the highest-leverage skills are the ones that protect the cook's attention and energy so the meal can serve the *people*, not the other way around.

**The six most relevant skills (in rough order of daily impact for friends/family):**

1. **Mise for Presence**  
   Arrange the physical and cognitive field (ingredients, tools, timing, mental load) so the person cooking can actually be at the table in body and attention.  
   *Site language already strong here after the recent mise-en-place enhancement.*

2. **Batch Bases & Generous Provisions**  
   Cook high-leverage, durable bases once that let you feed people well across multiple days with minimal daily heroics. This is the practical backbone of repeatable hospitality.  
   *Already a first-class wisdom card and recurring theme.*

3. **Service as Real-Time Reading + Repair**  
   Notice who needs what (heat on the side, a quiet snack, an empty glass, a shift in energy). Make tiny adjustments without turning the meal into a performance. Etiquette as legible care signals.  
   *Directly modeled in existing `etiquette[preference]` and `service` expressions, plus the rpg-wednesday "service ritual" card.*

4. **Recovery & Byproduct Alchemy**  
   The practiced ability to turn trim, fond, brine, whey, mistakes, or "too much" into something better than the original plan. Models resourcefulness and grace.  
   *Very well represented already (`byproduct[realm]`, sauce recovery, stock mentor, etc.).*

5. **Flexible High-Leverage Technique Verbs + Substitution**  
   Deep, improvisational comfort with a small set of moves (bloom, deglaze, temper, reduce, build emulsion, manage conditions) so you can pivot gracefully when reality (or guest preferences) differs from the plan.  
   *The "technique verb" slot in the cuisine discovery handles taxonomy is already positioned perfectly for this.*

6. **Rhythm & Layered Attention**  
   Orchestrate sequences where different elements need different kinds of attention at different times, so the food progresses while conversation and presence are still possible.  
   *Modeled in the soup sequence writing and several material grammar cards (viscosity, emulsion timing, crystallization patience).*

**Mapping to existing site model (quick):**
- These map cleanly to the existing `culinary-component-physics` frame (mise, reduction, fermentation + service as the social validator).
- They cluster naturally under `data-spw-semantic-cluster="culinary hosting"` or `"culinary care"`.
- Strong fit for the "social kitchen" / "hosting grammar" as a lightweight extension of the current principle registers.

**Recommended next surface (if work is requested):**
- A short, rigorous addition to `.spw/conventions/site-semantics.spw` (parallel to the existing culinary-component-physics frame) or a small dedicated note in wonder-vocabulary.spw.
- Light copy pass in recipes/index.html to surface these six as a distinct "for company" lens alongside the existing technique and material grammar work.
- No large new HTML required for the initial consideration — the thinking itself is now captured in an inspectable plan artifact.

This analysis treats cooking for friends and family as its own legitimate domain of excellence, not a lesser version of professional cooking. That stance is already latent in the site's voice; this just makes it explicit.

---

## Holiday Concept Development as Recipe Skills Projection Lens (2026-04 addition)

**User prompt:** Consider the six social recipe skills (identified for cooking for friends/family) as a budgeting and planning projection lens for holiday concept development.

**Why this works as a lens:** Holidays are high-stakes social cooking + ritual + resource allocation under time pressure, with the same core constraints as hosting a big meal for people you care about: limited attention/energy (the cook/host can't burn out), desire for generosity, need for repeatability across years, and high chance of imperfect conditions. The kitchen grammar translates with very little friction.

**Mapping the 6 Skills to Holiday Budgeting & Concept Development:**

1. **Mise for Presence → Attention & Energy Budgeting**
   - Holiday version: Pre-arrange the "workspace" of the season (gift strategy, travel, food rhythm, emotional load, calendar blocks) so the primary organizers/hosts can actually *experience* the holiday with the people instead of managing it from behind the scenes the entire time.
   - Budgeting question: Where is our collective attention being spent before the event even begins? What can be named, placed, and sequenced in advance?
   - Natural artifact: An "annual mise" seed card or vessel (see newyear/ structure).

2. **Batch Bases & Provisions → Resource Pre-Loading & Carry-Over**
   - Holiday version: Identify 3–5 high-leverage "bases" (thematic containers, recurring rituals, bulk food prep, gift frameworks, communication templates) that can be prepared once and yield generosity and coherence across the entire holiday period without daily reinvention.
   - Budgeting question: What deserves to be made in batch this year so it becomes low-effort abundance later?
   - Strong existing site language in recipes (batch[base]) and newyear (vessels that survive transit, bundles for compression and carriage).

3. **Service as Reading the Room + Repair → Real-Time Social & Emotional Budgeting**
   - Holiday version: During the gathering(s), maintain the skill of noticing group energy, individual needs, emerging tensions, and making small graceful adjustments (change of activity, different seating, quiet offering, shift in tone) without derailing the larger plan.
   - Budgeting question: How much "service bandwidth" do we reserve for live repair and preference legibility?
   - Direct map to existing `service[ritual]{repair.timing}` wisdom card and `etiquette[preference]{behavior.repair}` expressions. Also aligns with newyear "vessel" as something that holds shape under real conditions.

4. **Recovery & Byproduct Alchemy → Contingency & Salvage Budgeting**
   - Holiday version: When something goes wrong (weather, illness, budget overrun, family friction, failed dish or plan), the practiced ability to extract value and meaning from the residue instead of declaring the whole thing a loss.
   - Budgeting question: What "trim" and "fond" are we culturally allowed to recover and celebrate?
   - Excellent existing coverage in byproduct language and sauce recovery cards. Extremely high value for real holidays.

5. **Flexible High-Leverage Technique Verbs + Substitution → Concept Pivoting Under Constraint**
   - Holiday version: A small, deeply internalized set of moves (reduce scope gracefully, bloom a small new element, temper expectations, deglaze a tense moment, build emulsion between conflicting traditions) that let the core intent survive when reality differs from the original concept.
   - Budgeting question: Which 4–6 "technique verbs" do we actually trust for this holiday cycle?
   - Maps to the "technique verb" taxonomy already present in recipes/index.html.

6. **Rhythm & Layered Attention → Timeline & Intensity Budgeting**
   - Holiday version: Structure the season with different registers of intensity and attention (slow background simmer periods, high-focus service moments, deliberate rest beats) so the overall arc feels musical rather than exhausting.
   - Budgeting question: Where do we place the "sweat aromatics / bloom spices / finish with acid" moments across the calendar?
   - Aligns with soup sequence thinking, material grammar cards (viscosity, crystallization patience), and the weekly affairs crop/recipe rhythm in rpg-wednesday.

**Strong Existing Site Connections**
- /newyear/ already models "annual seed" as minimum viable substrate, "vessels" (explicitly including recurring culinary rituals), "bundles" as considered compression and carriage, and threshold as the moment time feels writable.
- play/rpg-wednesday "Weekly Affairs: Crops, Recipes, Trade" treats recipes and ingredients as accumulating canon, memory, ritual, labor, and care — the exact same logic scales to annual holiday cycles.
- recipes/ already positions batch provisions, service scenes, and byproduct recovery as family/friends infrastructure.

**Potential Modeling Recommendations (for future .spw or surface work)**
- A lightweight `holiday-projection` or `annual-vessel` frame in site-semantics.spw or a new small convention note.
- Treating the 6 skills as a "holiday mise grammar" that can be projected onto seed cards, bundles, and vessels in the newyear surface.
- Possible semantic cluster: `data-spw-semantic-cluster="holiday kitchen"` or `"annual service grammar"`.
- This would let holiday concept development inherit the same inspectable, transferable rigor the site already gives to component physics and RPG weekly affairs.

**Status:** Added as direct follow-up to the friends/family recipe skills analysis. Kept as plan artifact per smallest-honest-surface rule. Ready for .spw formalization or light newyear/recipes cross-linking if the user wants to develop the lens further.

**Cooking as a Primary Developable Expertise Domain**

**Emphasis & inline style pass (on request):**
- Applied the page’s established semantic patterns (`data-spw-vocab="culinary"`, `data-spw-semantic-expression`, `<strong>` on domain terms, light spans) across the hero note, Material Grammar Cards intro + emulsion card, Cuisine Taxonomy header + Service scene and Byproduct sauce entries, and several wisdom cards (Mise en place, Batch base).
- This gives the expertise domain language, the six social kitchen skills, and their projection use consistent visual and semantic weight while staying inside the existing voice and markup conventions of the surface.

**Integration of math changes spirit (copy + CSS):**
- Math surfaces evolved toward "intuition-first field notes" with clear developmental arcs (intuition → grounded metaphors → practice/labs → transferable handles) and strong modular frame/card structure.
- Applied similar spirit to recipes:
  - Copy: Hero note now explicitly positions the surface as "the primary surface for cooking as a developable expertise domain — the social kitchen and hosting grammar", naming the six skills and their projection use.
  - Minor label on wisdom deck for "core expertise practices".
  - CSS (recipes-surface.css): Added targeted structural rules for `.spw-wisdom-deck` and `#material-grammar-cards` to give them stronger "practice module / lab-like" presence, consistent with the elevated domain status and echoing modular patterns from developed surfaces like the math topics. Kept within existing route CSS tokens and paper/panel aesthetic.

All changes minimal and surgical. `git diff --check` clean on the files touched.

User note: "considering cooking as a domain that can be developed into expertise across the site is valuable."

**Changes made to .spw modeling:**
- Added `recipes` surface entry in `.spw/site.spw` surfaces block with role `craft domain, social kitchen, hosting grammar, expertise development`.
- Added parallel entry in `.spw/surfaces.spw` public_routes with explicit bridge language: "social kitchen and hosting grammar as a developable expertise domain — skills, progression, practice, and projection into ritual/annual planning".
- Strengthened the `#social-kitchen-grammar` frame in site-semantics.spw (added `expertise` to concepts and explicit sentence: "Cooking is treated as a primary developable expertise domain with its own progression, not only a metaphor source for other surfaces.").
- Updated the recipes product line pitch, feature_shape, collectible_unit, audience_bridge, and current_state in product-lines.spw to reflect cooking as primary expertise domain rather than primarily a learning-science metaphor source.

This shifts the stance from "recipes as rich lens and product line" toward "cooking (especially the social/hosting version) as a first-class craft domain one can develop genuine expertise in, with transferable projection power."

All edits kept minimal and surgical. `git diff --check` clean.
