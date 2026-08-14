---
name: patch-consolidator
description: Split mixed working trees into reviewable commits. Use when HTML/CSS/JS/.spw drifted into one blob.
---

# Patch Consolidator for spwashi.com

Read first: `../_shared/site-workflow.md`, `../_shared/site-vs-workbench.md`.

---

## ⚡ 60-Second Quick Strike (Grok)

* **Core Mission:** Break messy working trees into small, atomic, reviewable commits.
* **Separation Rule:** Never mix public feature changes (HTML/CSS) with agent-internal metadata (`.agents/plans/`, skills, `.spw`) in the same commit unless strictly inseparable.
* **Stop Condition:** If a single commit touches more than 2 concerns, split it.

---

## 🛡️ Constitutional Guardrails (Claude)

* 🚫 **No Accidental Staging:** Never run blind `git add .` or `git commit -a`. Always stage specific files or hunks (`git add -p`).
* 🚫 **No Broken Commits:** Every staged commit must leave the repository in a clean, buildable state (`git diff --check`).
* 🚫 **Leave User Work Untouched:** Do not revert or overwrite unrelated human edits in the working tree.

---

## 📐 Atomic Commit Buckets & Conventional Grammar (Codex)

| Bucket / Theme | Typical File Patterns | Example Commit Message |
| :--- | :--- | :--- |
| **Route & Copy** | `<route>/index.html` | `feat(route): refine software topics overview copy` |
| **Design Tokens & CSS** | `public/css/**/*.css` | `style(tokens): adjust matte surface ink contrast` |
| **Runtime & JS Modules** | `public/js/**/*.js` | `fix(runtime): debounce navigation observer in shell` |
| **Typed Build & Scripts** | `scripts/ts/**/*.mts` | `chore(tools): add route manifest validation rule` |
| **Agent Plans & Skills** | `.agents/**/*.md` | `docs(skills): upgrade agent operating guidelines` |

---

## 🌌 Tooling & Validation Ladder (Antigravity)

1. **Review Working Tree Changes:**
   ```bash
   git status --short
   ```
2. **Whitespace & Diff Sanity:**
   ```bash
   git diff --check
   ```
3. **Stage Targeted Concern:**
   ```bash
   git add <specific-files>
   ```
4. **Local Verification Before Committing:**
   ```bash
   npm run check:local
   ```
