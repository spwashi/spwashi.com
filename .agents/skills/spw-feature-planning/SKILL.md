---
name: spw-feature-planning
description: Plan multi-route or shared-layer work before coding. Skip for single-route copy and one-file fixes.
---

# Spw Feature Planning for spwashi.com

Read first: `../_shared/site-workflow.md`, `../_shared/site-vs-workbench.md`.

---

## ⚡ Quick Strike

* **When to Plan:** When work touches multiple routes, introduces a shared CSS/JS layer, or establishes a durable sitewide contract.
* **When to Skip:** Single-route copy, isolated bug fixes, or routine styling tweaks. Just make the edit and validate.
* **Anti-Bloat Tripwire:** A plan past ~80 lines before any code exists has become an essay; prune it back to an execution map. Plans over ~200 lines are not read unless Open first names them.
* **Computer-use models:** Verify first (`npm run audit:module-selectors`, `npm run visual:checks`, one pocket route). One named patch. Stop. Do not “implement from plans.”

---

## 🛡️ Constitutional Guardrails

* 🚫 **No Premature Taxonomy:** Do not invent new `data-spw-*` attribute families without checking existing families in `.spw/site.spw` and the design catalog.
* 🚫 **No Immediate Mount Inflation:** Do not give a new module `MOUNT_WHEN.IMMEDIATE` in `public/js/runtime/catalog/` unless boot criticality is proven; every immediate module is paid on every page before first paint. Default to `VISIBLE`, `IDLE`, `SETTLED`, or `INTERACTION`.
* 🚫 **No Runtime Dependencies:** No new npm packages without human review. Build on the platform: semantic HTML, CSS custom properties, native ES modules.

---

## 📐 The 4-Phase Execution Ladder

```text
Phase 1: Public Intent    → Name the exact outcome in one sentence (who benefits and how).
Phase 2: Negative Scope   → Explicitly list non-goals and boundaries (what NOT to build).
Phase 3: File Blueprint   → Enumerate minimal touch files across HTML / CSS / JS / .spw.
Phase 4: Contract Gate    → Verify catalog selectors find public hosts (`audit:module-selectors`), CSS layers, and check:local.
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

## 🌌 Tooling & Validation Ladder

1. **Pre-flight Plan Status Probe:**
   ```bash
   npm run spw:plan:status --
   ```
2. **Local Contract Verification:**
   ```bash
   npm run check:local
   ```
3. **Route Runtime Manifest Refresh (if routes or catalogs changed):**
   ```bash
   npm run manifest
   ```
