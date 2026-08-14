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

## 3. The Four Agent Disciplines

* ⚡ **Grok:** Anti-bloat, minimum ceremony, ruthless signal-to-noise ratio. Stop when the public outcome is reached.
* 🛡️ **Claude:** Strict negative bounds, accessible semantic HTML, WCAG AA contrast, and zero-JS reading calm.
* 📐 **Codex:** Exact file maps, strict CSS layer order, TypeScript boundaries, and deterministic validation outputs.
* 🌌 **Antigravity:** Proactive tool mastery, mounted CLI inspections, subagent collaboration, and progressive enhancement.

---

## 4. Tunability & Runtime Postures

The site's runtime is fully tunable across multiple semantic registers via `public/js/kernel/site-settings.js`:

* **`enhancementLevel`** (`subtle` | `balanced` | `rich` | `theatrical`): Modulates motion amplitude, notice verbosity, and decorative field weight.
* **`authorMode`** (`reader` | `tender` | `cartographer` | `architect`): Changes disclosure depth and inspectable handles.
* **`baseMetamaterial`** (`glass` | `matte` | `paper` | `canvas`): Global physical rendering substrate (matte provides clear contrast safeguards).
* **`physicsReason`** (`string`): Modulates spring damping, attentional echoes, and gesture dynamics across interactive cards.

---

## 5. CSS Layer Hierarchy

```text
reset
  ↓ tokens (core.css, dimensions.css)
  ↓ shell (layout.css, chrome.css)
  ↓ typography (type.css)
  ↓ grammar (syntax.css)
  ↓ components (cards.css, controls.css, frames.css)
  ↓ systems (surfaces/*.css)
  ↓ routes (surfaces/*.css, tools-*.css)
  ↓ handles (section-handles.css)
  ↓ effects (material.css, wonder.css)
  ↓ ornament (ornament.css) [ONLY place where !important is permitted]
```

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
| **Full Local Verification** | `npm run check:local` | Manifest, syntax, CSS, runtime, PWA, components green |
| **Route Manifest Refresh** | `npm run manifest` | Updated `.agents/state/runtime/route-runtime-manifest.json` |
