# Plan: Improve Palette Semantics, Discoverability, Playful/Functional Depth

**Slug:** palette-semantics-improvements  
**Date:** 2026-05-28 (plan authored in session)  
**Status:** Implemented (2026-05-29). All phases complete. Checks green. Catalog regenerated (new .spw docs + workshop usage now visible, accent-palette + palette-resonance now have philosophy links).

**Changes made (actual):**
- `.spw/conventions/site-semantics.spw`: +2 frames (`#palette-resonance-contract`, `#accent-projection-family`) naming the key attrs, contracts, and distinction between resonance bias vs theme-pack surface. Directly fixes catalog "0 docs" warnings.
- `design/palettes/index.html`: Major enrichment — new "Spectral Workshop" section (id `#spectral-workshop`, rich `data-spw-*` cluster including `data-spw-feature`, `data-spw-concept`, `data-spw-semantic-expression`, interaction contract). Live resonance tuner + visible probe readout + operator demo cluster + functional seed composer + upgraded semantic spectral grid (now using real tokens + figures with `data-spw-pigment-token`). Added cross links and improved existing sections.
- `public/css/tokens/core.css`: Introduced the 12 `--pigment-*` tokens (exact values from the previous magic strings on the palettes page, plus 2 tiny documented judgment-based balancing tweaks for distinction). Updated claim on palettes page is now true.
- `settings/index.html`, `index.html`, `topics/software/index.html`: Added minimal "semantics" / "workshop" operator-chip links next to every paletteResonance control for discoverability.
- `design/catalog/*` (regenerated): Now reflects new usage + .spw philosophy (data-spw-accent-palette: 2 docs; data-spw-palette-resonance: 1 doc).

**Token deltas (tiny, documented in core.css comments):**
- `--pigment-violet-ink`: hsl(268 42% 38%) → hsl(268 48% 36%) — sat + slight depth for math resonance pop and swatch clarity.
- `--pigment-brass-warm`: hsl(42 54% 46%) → hsl(40 58% 45%) — warm/craft lean for better craft-led distinction.
All other pigment tokens and the full operator color system left structurally unchanged (fallbacks, theme-pack blocks, etc. untouched). Visual character improved for the workshop without side effects.

**Files touched:** 6 (all surgical or additive per plan). No package changes.  
**Owner:** Agent (following spw-feature-planning + AGENTS.md)  
**Related skills invoked:** spw-feature-planning (this doc), exploration subagent

---

## Public Goal (User-Facing Outcome)

Make the Spwashi palette system (theme packs + paletteResonance biases + spectral families + accent projection) feel like a first-class, inspectable, playable part of the site rather than scattered controls and a reference page.

- **Semantics & depth:** Clear "why these four resonance modes?", "how themePack differs from paletteResonance", "what a palette seed actually does", with examples that transfer to real work.
- **Discoverability:** Anyone touching a palette control on home/settings/software can reach the deep reference in one click. The design catalog and `.spw` surfaces name the contracts.
- **Playful + functional capacities:** On the palettes page, visitors can *do* something (toggle, probe, compose seeds, see live echo) that teaches the model faster than reading alone. Progressive enhancement; existing runtime carries the weight.
- **Markup & linking:** Consistent operator-chips, rich `data-spw-*` clusters (especially `data-spw-concept`, `data-spw-semantic-expression`, `data-spw-assignment`), bidirectional links between controls ↔ reference ↔ catalog ↔ `.spw`.

Creator identity preserved: "I'm Spwashi. I build software and make art." — palettes are tools for that making, not the identity itself.

---

## Scope & Constraints (AGENTS.md Alignment)

**Primary edit surface:** `design/palettes/index.html` (the "prompt cabinet" reference).  
**Minimal supporting surfaces:** `settings/index.html`, `index.html`, `topics/software/index.html` (only for discoverability links + one richer control cluster if it fits existing pattern).  
**Shared layers touched:** Minimal and intentional. 
- HTML + existing runtime patterns on the palettes page and 3 control surfaces (primary).
- One controlled pass in `public/css/tokens/core.css` for palette semantics / balancing (see "Token balancing" below). No new files, no layer order changes. All changes preserve the var() fallback chains and @property contracts.  
**JS:** Zero new modules. At most tiny inline progressive listeners if a demo needs local-only behavior (prefer pure CSS + global settings runtime).  
**No new npm packages.** Run `npm run check` (includes audit) before landing anything touching package surfaces.  
**.spw:** Add philosophy references for `data-spw-palette-resonance`, `data-spw-accent-palette`, `data-spw-accent-*` family, and the resonance-bias contract. No new heavy ontology unless it emerges naturally.  
**Design catalog:** Note that `npm run catalog` must be run post-edit so new attrs and usage on palettes page appear (and lose their "0 docs" warnings once `.spw` links exist).  
**Generated artifacts:** `dist/` and `design/catalog/` are outputs; edit sources only.

**What stays in / out of scope (deliberate restraint):**
- **Allowed (targeted):** Small number of hsl adjustments in `public/css/tokens/core.css` (the 8-12 core `--teal`, `--amber`, `--violet`, `--op-*-color` definitions + a few pigment aliases) when they improve distinction/play/resonance across the four paletteResonance modes or light/dark contrast. User has low attachment to the exact original values; the goal is balancing, not a new identity.
- **Out of scope:** Wholesale recoloring, new hue families, changes to non-color tokens, any token work that isn't justified by palette semantics or the 4-mode swatch sets in palette-resonance.js.
- New `data-spw-*` attribute names (use existing families: accent-*, assignment, concept, semantic-expression, behavior, attention, etc.).
- New JS-driven palette mixer or canvas experiments (those belong in `/design/experiments/` or SVG lab).
- Heavy refactors of theme-pack CSS blocks or accent-palette.js inference.
- Moving the "Spell and Cauldron Hooks" section (it can be lightly linked/tuned in place).
- Any change to `public/css/style.css` import order or `public/js/site-settings.js` public API.

**Semantic seams to respect:**
- `data-spw-palette-resonance` (root dataset, 4 values) vs `data-spw-theme-pack` (surface material family).
- `data-spw-accent-palette="cool|warm"` (local tint hint for canvas ornaments) vs global resonance.
- Vibration/resonance as `#` operator physics (`.spw/conventions/operator-semantics.spw`) vs runtime palette bias (settings + probes).
- Assignment seeds (`data-spw-assignment`, `data-spw-reference-seed`) as the "before promoting to shared token" pattern.

**Token balancing notes (new per user feedback):**
- The 12 "Granular Spectral Families" swatches on the palettes page are currently magic `hsl(...)` strings in the HTML. One possible small win is promoting the most reusable 4-6 into real `--pigment-*` tokens (or `--spectral-*`) in core.css so future routes and the catalog can reference them.
- The 4 resonance swatch sets in `palette-resonance.js` (and the `--spw-palette-probe-*` they drive) should feel more distinct and "right" after any tweaks. Example direction: craft mode a bit warmer/more material, software a touch more diagnostic teal-violet, math more relational contrast without muddying the operators.
- Dark mode behavior and paper/cream surfaces must stay excellent; any shift must be checked against `--surface`, `--ink`, and the theme-pack blocks (core.css ~1260+).
- Changes will be documented with before/after values + rationale in the final plan under `.agents/plans/`. Visual QA required on palettes + home + settings + one content-heavy route in both modes.

---

## Files Likely to Change (Minimal Set)

### Route HTML (surgical)
1. `design/palettes/index.html`
   - Enrich `<body>` / hero with tighter `data-spw-*` (already strong; add `data-spw-wonder="resonance projection locality"` tuning if useful).
   - New or expanded section: "Spectral Workshop" (or "Resonance Forge" / "Live Probe Arena" — "Spectral Workshop" has a nice ring per early review) (contained, reuses vibe-widget + operator chips + a small `data-spw-feature="palette-demo"` cluster of chips + cards + spectral readout). Instructions call out that global settings + clicks here affect the whole page (teachable transparency). The name can playfully nod toward future sensory modalities (sound, touch, motion) without committing surface area now.
   - Expand "Spectral Resonance Mapping" (id already good) with use-case pairs and "reach for this when..." bullets.
   - Turn static `.spectral-grid` swatches into semantic `<figure>`/`<button>` elements with `title`, `aria-label`, `data-spw-pigment-token`, example usage text (links to tokens catalog or core.css if anchors exist).
   - Strengthen "Theme Pack Role Map" and "Reference Color Seeds" cards:
     - More `data-spw-concept`, `data-spw-semantic-expression="palette[resonance]{bias.mode}"` etc.
     - Outbound operator-chip links: "See on software topics", "Try in components lab", "SVG palette demo", etc.
   - "Palette Projection Registry": add 1-2 more lightweight examples or "how to extract" steps using existing `data-spw-accent-colors` + `data-spw-accent-resonance` patterns (already on several images).
   - Add a tiny "Compose a palette seed" (plain HTML `<form>`-like with 4 inputs + output `<code>` block that is copyable; JS-free or tiny enhancement via existing runtime if it fits).
   - Cross links: "Full contract in the design catalog", "Philosophy notes in .spw".
   - Update related-routes / page-seed if the new demo introduces a stable concept cluster.

2. `settings/index.html` (discoverability only)
   - Next to each paletteResonance radio or in the legend, add one `<a class="operator-chip" href="/design/palettes/#spectral-resonance-mapping" data-spw-operator="frame">semantics</a>` (or similar). Keep the fieldset clean.

3. `index.html` and `topics/software/index.html`
   - Same minimal link treatment next to the existing vibe-widget resonance buttons (one or two chips max per surface).
   - Optionally enrich one existing `spw-resonance-lab` probe with a `data-spw-practice="/design/palettes/"` pointer.

### .spw Surfaces (depth + catalog hygiene)
- `spw/conventions/site-semantics.spw` (primary): Add 1-2 frames under existing "query-disposition" / "tuning-postures" clusters that explicitly name:
  - `data-spw-palette-resonance` (values + intent as bias vs surface).
  - `data-spw-accent-palette` (cool/warm tint contract for ornaments).
  - The accent-* family as a whole (anchor, colors, operator, resonance, strength).
  - Theme pack vs resonance distinction.
- Optional lightweight: `spw/conventions/palette-resonance.spw` only if the addition would be >~30 lines of new prose; prefer extending existing file to keep surface count low.
- Touch `spw/surfaces/page-model.spw` or `spw/site.spw` only if a new reusable "palette seed" or "resonance probe" pattern needs top-level registration (probably not for v1).
- Goal: after edit + `npm run catalog`, the catalog entries for those attrs lose the "no .spw doc" warning and gain philosophy links.

### Tracking / Agent Surface (required for spanning work)
- `.agents/plans/palette-semantics-improvements/PLAN.md` — this document (or a cleaned copy of it) lives here as the public plan. Update with implementation notes, decisions, and links to changed files after landing.

### Shared CSS Tokens (controlled, small surface)
- `public/css/tokens/core.css`
  - Targeted hsl tweaks to the small set of foundational operator colors (`--teal`, `--amber`, `--violet`, the 8 `--op-*-color` definitions that feed the resonance swatches) and/or introduction of 4-6 `--pigment-*` (or `--spectral-*`) tokens drawn from the current demo values on the palettes page.
  - Goal: make the 4 `PALETTE_RESONANCE_SWATCHES` sets (route/craft/software/math) read as more distinct "personalities" while preserving excellent contrast on all theme packs and both color modes.
  - Every edit must be the smallest possible delta. Before/after values + rationale will be recorded in the final `.agents/plans/` copy of this plan.
  - The palettes page spectral swatches will be updated to reference the new tokens (removing magic numbers).
  - No other CSS files edited. Theme-pack blocks and all var() fallbacks remain untouched in structure.
- If the work meaningfully improves the agent operating environment (better catalog coverage, clearer .spw dispatch for palette concepts), later invoke `spw-plan-maintenance`.

**No changes anticipated to:**
- `public/css/...` (beyond possible one-line ornament tweak inside existing file if a demo truly needs it — avoid).
- `public/js/interface/palette-resonance.js` or `accent-palette.js`.
- `public/js/kernel/site-settings.js`.
- Any route `index.html` outside the three listed.
- `package.json`, build scripts, or `vite.config.ts`.

---

## Multiple Approaches Considered & Trade-offs

1. **Heavy interactive lab (new JS component in palettes page)**
   - Pros: Maximum playful capacity, self-contained "forge".
   - Cons: Violates "progressive-enhancement JS only when HTML/CSS cannot carry", adds maintenance surface, risks framework-like feel. **Rejected.**

2. **Pure-CSS demos + global settings reuse only**
   - Pros: Zero new code, instant consistency, teaches the real runtime.
   - Cons: Limited "local only" experimentation; user can't play without affecting whole tab.
   - Trade-off taken: Accept global side-effect as a feature ("the whole site is the instrument") and document it clearly in the demo instructions. Add one small local-only CSS var override demo if it stays under 5 lines of inline style.

3. **Create dedicated new .spw file + many new data-spw-* names**
   - Pros: Clean ontology.
   - Cons: "Do not introduce one-off data-spw-* names when an existing family already fits." Catalog already tracks accent-* and paletteResonance. **Rejected for v1; extend existing .spw instead.**

4. **Minimal + catalog-first (chosen)**
   - Enrich the reference page that already exists, add the missing philosophy links so the generated catalog becomes a better discovery surface, add 2-3 operator-chip links from control surfaces, one contained "arena" section that is 90% markup + existing runtime.
   - This is the "smallest honest surface" that still delivers semantics + playful + discoverability.

5. **Also update design/runtime or experiments/svg**
   - Nice-to-have for SVG palette reasons, but out of scope for this pass (would expand surface count).

---

## Implementation Phases (Suggested Order)

1. **.spw first (or parallel)** — Add the philosophy frames naming the attrs. This makes the catalog improvement "real" once catalog is regenerated.
2. **Token audit + balancing pass (if any)** — Read the current op-*/pigment values and the 4 swatch sets in palette-resonance.js. Propose the smallest set of hsl tweaks (or new --pigment-* tokens) that increase distinction/play across modes without breaking contrast or theme packs. Record exact before/after + rationale. Update the palettes page spectral grid to use any new tokens. Re-run visual checks on 4+ routes in light/dark.
3. **Palettes page content pass** — Copy polish, new arena section (copy existing patterns exactly), richer data-spw-* on every seed/theatre/pack card, better links, semantic swatches (now possibly backed by real tokens).
4. **Link injection** — 3-5 small operator-chip additions in settings + home + software topics.
5. **Manual + generated validation**:
   - `git diff --check`
   - `node --check` (on any touched .js — expect none)
   - `npm run check` (full, including audit)
   - Local `npm run dev` spot-check of live resonance + new token rendering on the arena + affected routes.
   - `npm run catalog` (or `npm run build` which includes it) and spot-check that new usage appears and "0 docs" warnings drop for the named attrs.
6. **Plan maintenance** — Move/copy this PLAN.md into `.agents/plans/palette-semantics-improvements/PLAN.md`, add implementation notes + file list + token delta table. Optionally run `spw-plan-maintenance` skill if the dispatch surfaces need refresh.
7. **Commit shape** — One coherent patch or small stack. Title something like "palettes: deepen semantics + live probe arena + cross links + .spw contracts + token balance". Use patch-consolidator skill if mixed changes drift.

---

## Validation & Success Criteria

- **Before landing:** `npm run check` green (full suite). No new package-lock diffs. `git diff --check` clean.
- **Semantics visible:** A new visitor to `/design/palettes/#spectral-resonance-mapping` can answer "when would I choose math-led vs craft-led?" in <30s. The four resonance modes feel like distinct, named "personalities."
- **Discoverability:** From any palette control (home, settings, software), there is an obvious "semantics / learn more" operator-chip or frame-sigil pointing to the palettes page.
- **Playful/functional:** The new arena on palettes page responds to clicks (global resonance changes + any local demo state). A user can compose a seed and see a copyable Spw expression without leaving the page. If token work happened, the spectral swatches and probe chips on the page visibly benefit.
- **Depth:** After `npm run catalog`, `data-spw-palette-resonance` and `data-spw-accent-palette` entries in design/catalog show at least one `.spw` philosophy link and richer value/usage notes. Any new `--pigment-*` tokens appear in the tokens section of the catalog with cross-refs.
- **Token quality (if any changes):** Light/dark contrast, operator legibility, and theme-pack character are equal or improved on palettes + home + settings + software topics + one dense content route. The 4 resonance swatch sets feel more differentiated.
- **Markup quality:** All new elements use existing component anatomy (header/meta/body/actions/footer slots), consistent `data-spw-*` families, balanced tags, root-relative links, meaningful alt/aria where appropriate.
- **No regressions:** Existing theme-pack swatches, resonance buttons, canvas accents, and catalog generation continue to work identically.

**Rollback safety:** Markup/.spw/link changes are purely additive. Token changes are small, documented deltas with clear before/after; easy to revert a single commit if needed.

---

## Open Questions for Human Review (if needed)

- Preferred name for the new interactive demo section on the palettes page: "Spectral Workshop", "Resonance Forge", "Live Probe Arena", "Palette Cauldron", or something else? (Early note: "Spectral Workshop" opens nice doors to future sensory modalities — sound, touch, motion — without expanding scope now.)
- How much copy expansion on the four resonance modes is too much? (Current plan keeps it to 1-2 sentences + bullet use-cases per mode.)
- Should the seed composer output actual `data-spw-assignment="..."` tokens that could be dropped into future cards, or keep it educational only?
- After this lands, do we want a follow-up to promote one of the reference seeds (e.g. woven-signal-stack) into a real shared token surface, or expand the workshop toward other modalities? (Both explicitly out of scope for this pass.)
- Any specific operator or spectral colors that currently feel weakest (in light or dark) that should be prioritized in the small balancing pass?

---

## References & Prior Art (from exploration)

- Existing strong patterns: `data-spw-accent="resonance" data-spw-accent-palette="..." data-spw-accent-resonance="..." data-spw-accent-colors="..."` clusters on figures (topics/software:315, about:269, play/rpg-wednesday, tools/midjourney).
- `spw-resonance-lab` probes with `data-spw-resonance-axis` + `data-spw-semantic-expression` (index.html:457, software topics).
- Theme pack + palette controls already wired via `data-site-setting-set` + `data-settings-state`.
- Catalog generator + "0 docs" warnings as the forcing function for .spw hygiene.
- AGENTS.md: "paletteResonance" listed under root runtime state; "Add a canvas accent..." guidance; component anatomy; "Update .spw when new reusable semantic family".

This plan keeps the site hand-authored, framework-free, and editor-inspectable while measurably improving the exact axes requested.

---

**Decisions recorded (user + agent, 2026-05-29):**
- Demo section name: **Spectral Workshop** (playful, future-proofs toward other sensory modalities).
- Token balancing: Full judgment delegated to agent for "best distinction across the 4 modes + excellent light/dark". Keep deltas tiny (a few hsl numbers), document before/after + rationale in the "Token changes" section of this plan after implementation.
- Go: Ship the plan and begin implementation immediately.

**Next step after approval:** 
1. (Done) This PLAN.md is now live in the canonical location.
2. Open a fresh todo list (already seeded) and implement in the numbered phases (start with .spw philosophy notes + Spectral Workshop section on the palettes page; interleave small token audit if it informs the demo).
3. Use the check skill / `npm run check`, manual preview, and catalog regeneration.
4. Update the plan doc with actual deltas, token before/after table (if any), and links to changed files.
5. Consider `spw-plan-maintenance` if the new workshop or .spw frames warrant dispatch updates.

The plan explicitly allows (and encourages) small, documented token balancing work because the original values have low attachment and better distinction across resonance modes directly serves the "playful and functional capacities + depth" goal.