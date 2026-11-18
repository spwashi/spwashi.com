# Curricular Topics, Tooling 1:1 Bridges, and Wonder Career Arcs

**Operation:** `prime` · **Status:** Plan authored after route/copy/tool census across `214` pages, `6` active `/tools/` routes, `/tiktok/`, and `public/data/promo-wonder-cycle.json`.

**Contract:** Honors [wonder-architecture.spw](../../../.spw/conventions/wonder-architecture.spw) (no new `data-spw-wonder-type`, no new `data-spw-*` attribute families) and [product-lines.spw](../../../.spw/surfaces/product-lines.spw) / [model-guided-refinement.spw](../../../.spw/conventions/model-guided-refinement.spw#creative_marketing_engine).

## 1. Curricular & Hub Audit Findings

1. **Topic breadth vs. career outcomes:** The site already holds `90+` deep `/topics/*` pages (Software `26`, Math `18`, Spw operators `19`, Craft `4`, Fields/Film/Pedagogy), **zero** dedicated hubs for **developing an art business** (`/topics/art-business/`) or **building a software engineering network** (`/topics/software/engineering-network/`), and an audited `curriculum-numericity` gap on `/topics/software/` (`npm run audit:copy:accessor`).
2. **Tools lack 1:1 curriculum/worldbuilding loops:**
   - `/tools/spw-parser/` reads primarily as AST/token inspection (`proof[parser]`) without guided starter expressions that show *why* each data type (`frame`, `mode`, `concept`, `scene`) builds a creative scene or domain structure alongside `spw.quest`.
   - `/tools/character-sheet/` (`624` lines) sits isolated from `/topics/`, `/curriculum/`, `/play/` heroes, and `/services/`.
3. **Website upsells belong inside delight/wonder, not obligation:** Visitors asking for a website arrive imagining bureaucratic forms; onboarding via `/tiktok/` (folio wonder + domain pick + screenshot/PowerPoint/Canva reference intake with sensible starting assumptions) reframes a website as a positive daily brand moment.

## 2. Missing Topic Hubs & 1:1 Topic ↔ Tool Map

| Topic / Route | Role | 1:1 Linked Tool Bench | Concrete World / Career Artifact |
|---|---|---|---|
| **New:** `/topics/art-business/` | Editions, provenance, commissions, domain identity | `/tools/midjourney/` + `/tiktok/#website-intake` | Folio/sticker drop brief or joyful website scope card |
| **New:** `/topics/software/engineering-network/` | Public commits, portable PRs, CI trust receipts | `/tools/profile/` + `/tools/spw-parser/` | Small scoped module PR verified by `audit:portable` & `check:local` |
| **Update:** `/topics/software/` & `/topics/software/parsers/` | Grammar + economic curriculum (`curriculum-numericity` fix) | `/tools/spw-parser/` (+ `spw.quest`) | Editable scene/state expression proving AST → runtime behavior |
| **Update:** `/topics/film/` & `/play/` | Narrative characters, scenes, table pressure | `/tools/character-sheet/` | Promoted character card linking into `/tools/budgeting/#year-mix` |
| **Update:** `/topics/` | Reorganize lens board into 3 clear tracks + `Prev → Tool → Next` rails | Maps every track to `/tools/*` | Faster orientation for Art Business vs. Software Network learners |

## 3. Planned Execution Slices

1. **Slice A (`/tiktok/` + Wonder-Upsell Expansion):** Add a compact folio strip preview and interactive **Website & Domain Brief** intake (`interface/intake.js` + `seed-exits.js`, pure portable primitives) asking domain readiness, screenshot/Canva/PowerPoint refs, and tone — pre-filling smart scope assumptions onto `/services/#pricing`.
2. **Slice B (Missing Career Topic Hubs + `/topics/` IA Pass):** Author `/topics/art-business/index.html` and `/topics/software/engineering-network/index.html`, close `/topics/software/`'s `curriculum-numericity` link to `/curriculum/`, and surface `/tools/character-sheet/` cleanly from `/topics/film/`, `/play/`, and `/topics/`.
3. **Slice C (`/tools/spw-parser/` Ergonomics & World-Type Bridges):** Add guided scenario presets (e.g., *Character Beat*, *Site Card*, *System Transition*) showing how each parsed token/type produces a real artistic or structural consequence across the ecosystem (`spwashi.com` ↔ `spw.quest`).
4. **Slice D (Metacognitive `promo-wonder-cycle.json` Career Upgrade):** Pair `discovery-notices.js`'s context matcher (`60ec8391`) with authored `daily`/`weekly` prompts targeting art-business and software-network progression + non-obligatory website wonder cards.

## Verification Gates Per Slice

- `npm run audit:copy:accessor` + `npm run manifest:staged` after any HTML/copy-unit route edits.
- `npm run audit:portable`, `node scripts/js-tree-value.mjs --check`, `npm run check:css`, `npm run check:pwa`, `npm run check:agents`, and targeted module tests before committing.
