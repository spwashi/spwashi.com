---
name: spw-ui-containment-audit
description: Find and fix overflow, measure, and packing issues. Structural CSS first—not new dimensions.
---

# Spw UI Containment Audit for spwashi.com

* Read first: `../_shared/site-workflow.md`, `../_shared/site-vs-workbench.md`.
* Adjacent measurement surface: [`.spw/skills/ui-containment.spw`](file:///Users/spwashi/air/spwashi.com/.spw/skills/ui-containment.spw)

---

## 1. Spw Invocation Contract

* **Default Operation:** `audit` (or `align` when snapping breakpoint drift).
* **Sense (Pre-flight):** `node scripts/normalize-breakpoints.mjs` (reports query threshold drift without writing).
* **Copy wrap (titles / hooks / expressions):** `npm run audit:copy:align` and `npm run audit:copy:expr`. Shared helpers: `scripts/lib/page-copy-audit.mjs`.
* **Probe (Falsification):** `node scripts/normalize-breakpoints.mjs && node scripts/check-site.mjs`
* **Precipitate:** Record breakpoint changes in `.spw/conventions/stylesheet-ecology.spw#breakpoints`; record device measurements in `.spw/skills/ui-containment.spw`.

---

## 2. ⚡ 60-Second Quick Strike & Stop Conditions

* **Root Principle:** Containment bugs are almost always **box model, hierarchy, or measure** problems—not missing metadata.
* **Breakpoint Ladder:** Adhere to the normalized rem ladder (primary divide at `45rem` / `720px`). Do not author one-off pixel media queries.
* **Mobile-First Rule:** Author `min-width` queries for expansive layouts rather than subtractive `max-width` desktop overrides.
* **Stop Condition:** Do not invent a new packing/density metaphor to fix a 10px margin blowout. Fix the container box model.

---

## 3. 🛡️ Constitutional Guardrails

* 🚫 **No `overflow: hidden` as a Blanket Hack:** Never apply `overflow: hidden` on high-level layout roots (`main`, `body`) to mask unmanaged horizontal overflow; fix the child item's min-width.
* 🚫 **No Horizontal Page Scroll:** The site must never produce horizontal body scrollbars at any viewport width (320px to 4K).
* 🚫 **Never Disable Viewport Scaling:** `user-scalable=no` is strictly forbidden.

---

## 4. 📐 Containment & Device Matrix

| Failure Mode | Root Cause | Structural CSS Fix |
| :--- | :--- | :--- |
| **Grid Column Overflow** | `min-width: auto` on grid items | Apply `min-width: 0;` to grid children |
| **Unconstrained Flex Text** | `flex-shrink: 0` / no wrap | Apply `overflow-wrap: anywhere;` or `min-width: 0;` |
| **Card Measure Blowout** | Viewport media query collision | Use container queries: `@container (max-width: ...)` |
| **Coarse Pointer Clipping** | Fixed heights on buttons/chips | Use `min-height: 44px;` with fluid padding |
| **Scrollbar Layout Shift** | Dynamic content appearance | Set `scrollbar-gutter: stable;` where appropriate |

---

## 5. 🌌 Execution & Validation Ladder

1. **Sense:** `node scripts/normalize-breakpoints.mjs`
2. **Headless Navigation & Overflow Smoke Test:**
   ```bash
   npm run smoke:nav
   ```
3. **CSS Contract & Layer Verification:**
   ```bash
   npm run check:css
   ```
4. **Local Verification Pass:**
   ```bash
   npm run component:check
   npm run check:local
   ```
