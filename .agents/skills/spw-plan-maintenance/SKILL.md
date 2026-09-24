---
name: spw-plan-maintenance
description: After a real multi-surface landing, archive and re-link plans/skills. Success is a smaller next census—not more index.spw files.
---

# Spw Plan Maintenance for spwashi.com

Read first: `../_shared/site-workflow.md`, `../_shared/site-vs-workbench.md`.

---

## ⚡ Quick Strike

* **The Golden Rule:** Maintenance that does not **archive** landed or abandoned plans is just compounding bloat.
* **Success Metric:** The next census has *fewer* active plans, *zero* empty `index.spw` files, and clean link paths.
* **Stop Condition:** Do not run this skill after small single-file commits. Reserve it for real multi-surface landings.
* **After catalog or public class-noun landings:** `npm run audit:module-selectors`. Do not add a new `index.spw` to record the run.

---

## 🛡️ Constitutional Guardrails

* 🚫 **No Zombie Indexes:** Do not generate empty `index.spw` files in folders without an active `PLAN.md`.
* 🚫 **No Unbounded Growth:** When a new canonical plan lands, look for the plan it supersedes or the finished one beside it and move it to `.agents/plans/archive/`. The active count should not climb with each landing.
* 🚫 **Preserve Link Integrity:** When moving or archiving plans, verify all markdown links in `/about/plans/` and related `.spw` files.

---

## 📐 Plan Lifecycle & Triage Matrix

| Status Category | Criteria | Location | Action |
| :--- | :--- | :--- | :--- |
| **Canonical Track** | Evergreen, foundational architecture tracks | `.agents/plans/<track>/` | Keep active and cross-linked |
| **Active Backlog** | In-progress multi-surface engineering | `.agents/plans/<slug>/` | Complete within milestone |
| **FIX Queue** | Narrow regression triage | `.agents/plans/<slug>/FIX.md` | Close & delete/archive post-fix |
| **Landed / Dormant** | Shipped feature or abandoned exploration | `.agents/plans/archive/` | Move to archive, update links |

---

## 🌌 Tooling & Validation Ladder

Use the mounted `spw` CLI (root aliases; no need to enter the workbench) to check plan drift and verify link hygiene:

```bash
# 1. Check plan status and drift:
npm run spw:plan:check --

# 2. Census: active plans and empty indexes (compare before and after; `spw tree` resolves inside the workbench and does not see these)
find .agents/plans -name PLAN.md -not -path '*/archive/*' | wc -l
find .agents/plans -name index.spw -not -path '*/archive/*' -empty | wc -l

# 3. Verify markdown & diff hygiene:
git diff --check

# 4. Full local verification gate:
npm run check:local
```
