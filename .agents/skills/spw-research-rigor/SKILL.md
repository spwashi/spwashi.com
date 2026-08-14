---
name: spw-research-rigor
description: Turn fuzzy design/runtime questions into a small reproducible note. Prefer light artifacts over new permanent systems.
---

# Spw Research Rigor for spwashi.com

Read first: `../_shared/site-workflow.md`, `../_shared/site-vs-workbench.md`.

---

## ⚡ 60-Second Quick Strike (Grok)

* **Objective:** Cut through "vibes-only" debates with clear, falsifiable empirical observations.
* **Stop Condition:** Research notes must end in either an actionable implementation plan OR an explicit "DO NOT BUILD" decision. Never leave open-ended academic essays.

---

## 🛡️ Constitutional Guardrails (Claude)

* 🚫 **No Permanent System Sprawl:** A research finding does not automatically earn a new sitewide convention or `.spw` root.
* 🚫 **Observable Reality Over Pure Theory:** Ground every conclusion in actual browser performance (FID, LCP, CLS), CSS layout metrics, or user interaction evidence.
* 🚫 **Archive Answered Notes:** Once a question is answered and implemented, archive the research note to prevent cognitive clutter.

---

## 📐 Structured Research Note Protocol (Codex)

```markdown
# Research: <Clear Question in One Sentence>

## 1. Hypothesis
What do we expect will happen? (e.g. "Switching to container queries reduces reflow overhead by 30%").

## 2. Test Method & Dataset
- Viewport ranges: 360px, 768px, 1440px
- Tooling: Chrome DevTools Performance / Headless Runner

## 3. Findings & Evidence
- Concrete measurements, CSS token traces, or AST query outputs.

## 4. Decision Gate
- [ ] Build & ship via `<plan-slug>`
- [ ] Reject / Do not build (rationale documented)
```

---

## 🌌 Tooling & Validation Ladder (Antigravity)

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
