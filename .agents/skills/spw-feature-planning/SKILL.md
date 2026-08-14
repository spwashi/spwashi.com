---
name: spw-feature-planning
description: Plan multi-route or shared-layer work before coding. Skip for single-route copy and one-file fixes.
---

# Spw Feature Planning for spwashi.com

Read first: `../_shared/site-workflow.md`, `../_shared/site-vs-workbench.md`.

---

## ⚡ 60-Second Quick Strike (Grok)

* **When to Plan:** ONLY when work touches multiple routes, introduces a shared CSS/JS layer, or establishes a durable sitewide contract.
* **When to Skip:** Single-route copy, isolated bug fixes, or routine styling tweaks. Just make the edit and validate.
* **Anti-Bloat Tripwire:** If a plan document exceeds 80 lines before writing a single line of code, prune it. A plan is an execution map, not an essay.

---

## 🛡️ Constitutional Guardrails (Claude)

* 🚫 **No Premature Taxonomy:** Do not invent new `data-spw-*` attribute families without checking existing families in `.spw/site.spw` and the design catalog.
* 🚫 **No Immediate Mount Inflation:** Do not classify new behavior modules as `immediate` in `module-catalog.js` unless boot criticality is explicitly proven. Default to `visible`, `idle`, or `interaction`.
* 🚫 **No Runtime Dependencies:** Do not add npm packages. Build upon vanilla web platform standards (HTML5 semantic tags, vanilla CSS custom properties, native ES modules).

---

## 📐 The 4-Phase Execution Ladder (Codex)

```text
Phase 1: Public Intent    → Name the exact outcome in one sentence (who benefits and how).
Phase 2: Negative Scope   → Explicitly list non-goals and boundaries (what NOT to build).
Phase 3: File Blueprint   → Enumerate minimal touch files across HTML / CSS / JS / .spw.
Phase 4: Contract Gate    → Verify catalog mount schedules, CSS layers, and check:local.
```

### Minimal `PLAN.md` Structure:
```markdown
# <Feature Slug>

## Public Goal
One concise sentence describing the user/reader outcome.

## Non-Goals & Boundaries
- What is explicitly out of scope.
- Metaphors or attributes NOT to invent.

## Seams & Minimal Touch Files
- Route HTML: `<route>/index.html`
- Shared CSS: `public/css/<layer>/<file>.css`
- Runtime JS: `public/js/runtime/<module>.js`

## Validation Steps
1. `node --check <file>`
2. `npm run check:local`
```

---

## 🌌 Tooling & Validation Ladder (Antigravity)

1. **Pre-flight Plan Status Probe:**
   ```bash
   npm --prefix .spw/_workbench run spw:plan:status --
   ```
2. **Local Contract Verification:**
   ```bash
   npm run check:local
   ```
3. **Route Runtime Manifest Refresh (if routes or catalogs changed):**
   ```bash
   npm run manifest
   ```
