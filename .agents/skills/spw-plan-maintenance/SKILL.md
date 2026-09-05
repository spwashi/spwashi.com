---
name: spw-plan-maintenance
description: After a real multi-surface landing, archive and re-link plans/skills. Success is a smaller next census—not more index.spw files.
---

# Spw Plan Maintenance for spwashi.com

Read first: `../_shared/site-workflow.md`, `../_shared/site-vs-workbench.md`.

---

## ⚡ 60-Second Quick Strike (Grok)

* **The Golden Rule:** Maintenance that does not **archive** landed or abandoned plans is just compounding bloat.
* **Success Metric:** The next census has *fewer* active plans, *zero* empty `index.spw` files, and clean link paths.
* **Stop Condition:** Do not run this skill after small single-file commits. Reserve it for real multi-surface landings.
* **After catalog or public class-noun landings:** `npm run audit:module-selectors`. Do not add a new `index.spw` to record the run.

---

## 🛡️ Constitutional Guardrails (Claude)

* 🚫 **No Zombie Indexes:** Never generate empty `index.spw` files in folders without active `PLAN.md` files.
* 🚫 **No Unbounded Growth:** Enforce a 1-to-1 archive quota: when landing a new canonical plan, move superseded or finished active plans into `.agents/plans/archive/`.
* 🚫 **Preserve Link Integrity:** When moving or archiving plans, verify all markdown links in `/about/plans/` and related `.spw` files.

---

## 📐 Plan Lifecycle & Triage Matrix (Codex)

| Status Category | Criteria | Location | Action |
| :--- | :--- | :--- | :--- |
| **Canonical Track** | Evergreen, foundational architecture tracks | `.agents/plans/<track>/` | Keep active and cross-linked |
| **Active Backlog** | In-progress multi-surface engineering | `.agents/plans/<slug>/` | Complete within milestone |
| **FIX Queue** | Narrow regression triage | `.agents/plans/<slug>/FIX.md` | Close & delete/archive post-fix |
| **Landed / Dormant** | Shipped feature or abandoned exploration | `.agents/plans/archive/` | Move to archive, update links |

---

## 🌌 Tooling & Validation Ladder (Antigravity)

Use the mounted `spw` CLI to check plan drift and verify link hygiene:

```bash
# 1. Check plan status and drift:
npm --prefix .spw/_workbench run spw:plan:check --

# 2. View plan tree census:
npm --prefix .spw/_workbench run spw -- tree .agents/plans --depth 2

# 3. Verify markdown & diff hygiene:
git diff --check

# 4. Full local verification gate:
npm run check:local
```
