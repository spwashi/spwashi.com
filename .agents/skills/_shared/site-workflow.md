# spwashi.com Site Workflow

Core operational guide for agents and editors working across the repository.

---

## 1. Grounded Architecture

* **Primary Edit Surfaces:**
  * Route HTML in directory entrypoints (`<route>/index.html`)
  * Layered CSS under `public/css/`
  * Progressive vanilla JavaScript under `public/js/`
  * Optional durable contracts under `.spw/` and `.agents/plans/`
* **Creator Identity First:**
  * *"I'm Spwashi. I build software and make art."*
  * Copy must lead with the human creator. The site is a surface/vessel for the work.

---

## 2. The Spw Invocation Protocol

Every skill invocation follows an ordered 4-part lifecycle:

1. **Sense (Pre-flight Measurement):** Run the read-only measurement tool before touching files (`npm run css:payload`, `npm run spw:integrity`, `node scripts/normalize-breakpoints.mjs`). If the measurement shows the premise is false, stop.
2. **Operation & Fixity:** Declare your operation (`cache | audit | align | prime | contract | archive`) and fixity tier (`fixed | stable | tending | experimental | volatile`).
3. **Spell / Action (Surgical Patch):** Patch the smallest honest surface (HTML → shared CSS → progressive JS).
4. **Probe & Precipitate:** Run the verification probe, and crystallize findings into an adjacent `.spw/skills/*.spw` surface, a cache, or a plan note so future sessions inherit the insight.

---

## 3. Focuses (adapters emphasize; any model may use any)

These are relative strengths, not exclusive owners. `AGENTS.md` is the gate. Declare a Spw operation (`cache | audit | align | prime | contract | archive`) before editing.

* ⚡ **Anti-bloat** (GROK.md emphasizes): minimum ceremony, hard stop-conditions, one named slice.
* 🛡️ **Constitutional** (CLAUDE.md emphasizes): negative bounds, semantic HTML, WCAG AA, no new `data-spw-*` families. Verify live before shipping a hypothesis.
* 📐 **Contract exactness** (GPT.md emphasizes): ESM `.js` imports, CSS layer order, typed/runtime contracts.
* 🌌 **Tool mastery** (GEMINI.md emphasizes): mounted CLI, `visual:checks`, wonder/lattice, no background-task polling.
* 🖥 **Computer-use** (GPT.md states the posture): verify-first (`audit:module-selectors`, `visual:checks`, one pocket route). One named patch. Stop. Do not “implement from plans.” An audit P1 list is not a patch list. User “skip visuals” is a finding, not a waiver of packing altitude.

Prove adapters with `npm run check:agents` (files must be git-tracked; always-on word budgets are the block). Written rules are suggestions.

---

## 4. Tunability & Runtime Postures

Settings enter through `public/js/kernel/site-settings.js`. Defaults are `DEFAULT_SITE_SETTINGS` and allowed values are `SETTING_OPTIONS`, both in `site-settings-profiles.js`; read them there before naming a value. Four that skills lean on:

* **`enhancementLevel`** (`minimal` default | `balanced` | `rich`): Modulates motion amplitude, notice verbosity, and decorative field weight.
* **`authorMode`** (`draft` default | `revise` | `polish` | `publish`, from `AUTHOR_WORKFLOW_MODES` in `shared.js`): Changes disclosure depth and inspectable handles.
* **`baseMetamaterial`** (`glass` default | `paper` | `matte` | `field`): Global physical rendering substrate (matte provides clear contrast safeguards).
* **`physicsReason`** (empty by default, or a named reason such as `calm`, `precise`, `playful`): Written as `data-spw-physics-reason`; tunes spring damping, attentional echoes, and gesture dynamics.

---

## 5. CSS Layer Hierarchy

```text
reset
  ↓ tokens (core.css, dimensions.css)
  ↓ shell (layout.css, chrome/*.css, modes/*.css)
  ↓ typography (base.css, context.css, typesetting.css)
  ↓ grammar (syntax.css)
  ↓ components (foundation.css, cards.css, frames.css, …)
  ↓ systems (surfaces/*.css)
  ↓ routes (surfaces/*.css; route bundles only, not core)
  ↓ handles (cognitive-handles.css, operators/*.css)
  ↓ effects (material.css)
  ↓ ornament (whimsy.css, canvas-accents.css) [new !important goes here only]
```

Line 1 of `public/css/style-core.css` declares this order, and a layer's files sit in the folder of that name under `public/css/` (`modes/` loads into shell). Built bundles omit that statement, so on the deployed site a layer ranks where it first appears: `routes` arrives last, in the route bundle, and beats handles, effects and ornament. Do not reorder layers without a browser review.

*Never edit files in `public/css/bundles/*` directly; bundles are generated build artifacts.*

---

## 6. Exact Validation Recipes

| Change Surface | Command | Expected Output |
| :--- | :--- | :--- |
| **Sense: CSS Weight** | `npm run css:payload` | Per-route bundle breakdown |
| **Sense: AST & Citations** | `npm run spw:integrity` | Verified citations & authored expressions |
| **Sense: Breakpoints** | `node scripts/normalize-breakpoints.mjs` | Threshold drift report |
| **Vanilla JS Syntax** | `node --check <file.js>` | Clean return (0 errors) |
| **CSS Syntax & Hygiene** | `git diff --check` | Clean return (no whitespace/syntax issues) |
| **Typed Tools (`scripts/ts/`)** | `npm run build:tools` | Successful compile to `scripts/typed/` |
| **Typed Runtime (`public/ts/`)** | `npm run build:runtime` | Successful compile to `public/js/typed/` |
| **Runtime Contracts** | `npm run check:runtime` | Catalog and import boundaries verified |
| **Full Local Verification** | `npm run check:local` | Manifest, syntax, CSS, runtime, PWA, components, agent adapters green |
| **Agent adapters** | `npm run check:agents` | Tracked adapters + always-on word budgets; `--spend` prints the table |
| **Copy-unit census** | `npm run audit:copy:accessor` | Dotted keys vs Spw handles, topic clusters, voice seams |
| **Catalog hosts** | `npm run audit:module-selectors` | MODULE_DEFS.selector vs public HTML |
| **Attention stills** | `npm run visual:checks` | Ink/light spend receipts, not JPEG goldens |
| **Route Manifest Refresh** | `npm run manifest` | Updated `.agents/state/runtime/route-runtime-manifest.json` |
