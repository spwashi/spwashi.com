---
name: spw-research-rigor
description: Turn fuzzy design/runtime questions into a small reproducible note. Prefer light artifacts over new permanent systems.
---

# Spw Research Rigor for spwashi.com

Read first: `../_shared/site-workflow.md`, `../_shared/site-vs-workbench.md`.

---

## ⚡ Quick Strike

* **Objective:** Cut through "vibes-only" debates with clear, falsifiable empirical observations.
* **Stop Condition:** A note ends in one of three places: a plan, an explicit "do not build", or a named wonder (`#>wonder_*` with a `!probe`) that says what observation would answer it. An open question is fine; an open question with no probe is an essay.

---

## 🛡️ Constitutional Guardrails

* 🚫 **No Permanent System Sprawl:** A research finding does not automatically earn a new sitewide convention or `.spw` root.
* 🚫 **Observable Reality Over Pure Theory:** Ground conclusions in something observed: browser performance (INP, LCP, CLS), layout metrics, a pocket still, or how a person actually used the page.
* 🚫 **Archive Answered Notes:** Once a question is answered and implemented, archive the research note to prevent cognitive clutter.

---

## 📐 Structured Research Note Protocol

```markdown
# Research: <Clear Question in One Sentence>

## 1. Hypothesis
What do we expect will happen? (e.g. "Switching to container queries reduces reflow overhead by 30%").

## 2. Test Method & Dataset
- Viewports: pocket (390px), fold (768px), broadsheet (1440px)
- Tooling: Chrome DevTools Performance / Headless Runner

## 3. Findings & Evidence
- Concrete measurements, CSS token traces, or AST query outputs.

## 4. Decision Gate
- [ ] Build & ship via `<plan-slug>`
- [ ] Reject / Do not build (rationale documented)
- [ ] Hold as a wonder, with the probe that would answer it
```

---

## 🌌 Tooling & Validation Ladder

1. **Performance Matrix Probe:**
   ```bash
   npm run bench:nav:quick
   ```
2. **Ecology & Language Inventory:**
   ```bash
   npm run ecology
   ```
3. **Local Verification Gate:**
   ```bash
   npm run check:local
   ```
