---
name: spw-ui-containment-audit
description: Find and fix overflow, measure, tap-target, and packing issues when a layout breaks at widths nobody authored it at. Structural CSS first—not new dimensions.
---

# Spw UI Containment Audit for spwashi.com

* Read first: `../_shared/site-workflow.md`, `../_shared/site-vs-workbench.md`.
* Adjacent measurement surface: [`.spw/skills/ui-containment.spw`](../../../.spw/skills/ui-containment.spw)

---

## 1. Spw Invocation Contract

* **Default Operation:** `audit` (or `align` when snapping breakpoint drift).
* **Sense (Pre-flight):** `node scripts/normalize-breakpoints.mjs` (dry run; reports threshold drift without writing).
* **Copy wrap (titles / hooks / expressions):** `npm run audit:copy:align` and `npm run audit:copy:expr`. Shared helpers: `scripts/lib/page-copy-audit.mjs`.
* **Probe (Falsification):** Overflow is partly checkable: `npm run smoke:nav -- --routes <route> --require-browser --fail-on-overflow-x`. Measure and packing are not, so look at the route narrow and wide. A green check alone is not containment evidence.
* **Precipitate:** Record breakpoint changes in `.spw/conventions/stylesheet-ecology.spw#breakpoints`; record device measurements in `.spw/skills/ui-containment.spw`.

---

## 2. ⚡ Quick Strike & Stop Conditions

* **Root Principle:** Containment bugs are almost always **box model, hierarchy, or measure** problems—not missing metadata.
* **Breakpoint Ladder:** Use a rem rung already on the ladder (`45rem` is the most-used divide). rem lets a reader's text-size preference move the layout with them; px queries ignore it. Do not author off-ladder or px width queries.
* **Mobile-First Rule:** New queries state `min-width` for expansive layouts. Most existing ones are `max-width`; leave them unless the slice is theirs.
* **Stop Condition:** Do not invent a new packing/density metaphor to fix a 10px margin blowout. Fix the container box model. Collapsing ladder rungs moves layout and is its own reviewed pass, not a side effect.

---

## 3. 🛡️ Constitutional Guardrails

* 🚫 **No `overflow: hidden` as a Blanket Hack:** Do not put `overflow: hidden` on layout roots (`main`, `body`) to mask horizontal overflow; it also clips focus rings and sticky chrome. Fix the child's min-width.
* 🚫 **No Horizontal Page Scroll:** No horizontal body scroll from 320px up. The smoke samples pocket (390), fold (768), and broadsheet (1440); check 320 and very wide by eye.
* 🚫 **Never Disable Viewport Scaling:** No `user-scalable=no`. Viewport meta is injected at build, so check `dist/`, not the source HTML.

---

## 4. 📐 Containment & Device Matrix

| Failure Mode | Root Cause | Structural CSS Fix |
| :--- | :--- | :--- |
| **Grid Column Overflow** | `min-width: auto` on grid items | Apply `min-width: 0;` to grid children |
| **Unconstrained Flex Text** | `flex-shrink: 0` / no wrap | Apply `overflow-wrap: anywhere;` or `min-width: 0;` |
| **Card Measure Blowout** | Viewport media query collision | Container queries on a ladder rung: `@container (min-width: …)` |
| **Coarse Pointer Clipping** | Fixed heights on buttons/chips | Replace the fixed height with `min-block-size` and fluid padding; the target-size floor is stated once, in `spw-craft-quality` |
| **Scrollbar Layout Shift** | Dynamic content appearance | Set `scrollbar-gutter: stable;` where appropriate |
| **Fixed chrome off-screen** | `contain:layout` / `position:relative` on `html` or ancestors of `[data-spw-floating-chrome]` | Exclude document roots and floating chrome from region-state contain and hatch translates |

---

## 5. 🌌 Execution & Validation Ladder

1. **Sense:** `node scripts/normalize-breakpoints.mjs`
2. **Overflow smoke:** `npm run smoke:nav -- --routes <route> --require-browser --fail-on-overflow-x`
3. **CSS build & contracts:** `npm run check:css`
4. **Local verification:** `npm run check:local` (already runs component contracts)
5. **Eyes:** the changed route at pocket and at a wide window. Layout moves need eyes on real pages.
