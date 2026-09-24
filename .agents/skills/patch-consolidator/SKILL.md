---
name: patch-consolidator
description: Split mixed working trees into reviewable commits. Use when HTML/CSS/JS/.spw drifted into one blob.
---

# Patch Consolidator for spwashi.com

Read first: `../_shared/site-workflow.md`, `../_shared/site-vs-workbench.md`.

---

## ⚡ Quick Strike

* **Core Mission:** Break messy working trees into small, reviewable commits, each one scene.
* **Separation Rule:** Keep unrelated concerns apart. A `.spw` cache or plan note that records *this* change's finding is its precipitate and travels with it; agent metadata about something else gets its own commit.
* **Stop Condition:** A commit whose `![change]{}` needs "and also" for an unrelated concern is two commits.

---

## 🛡️ Constitutional Guardrails

* 🚫 **No Accidental Staging:** No blind `git add .` or `git commit -a`. Stage named paths. Other sessions commit to this tree, so their dirty files are not yours to sweep in.
* 🚫 **Hunks without a terminal:** `git add -p` is interactive and unavailable to agents. Write the hunk you want as a patch and `git apply --cached <patch>`, then confirm with `git diff --cached`.
* 🚫 **No stashing:** a stash takes other sessions' work with it.
* 🚫 **No Broken Commits:** Each commit leaves the tree clean and buildable (`git diff --check`, `node --check` on touched JS).
* 🚫 **Leave User Work Untouched:** Do not revert or overwrite unrelated human edits in the working tree.

---

## 📐 Commit Buckets & Site Grammar

Subject: `symbol[category] imperative subject`, under ~72 chars, then prose, then one `#[episode]{ ~[scene]{} ![change]{} *[verify]{} }`. Grammar and message discipline: `.agents/plans/history-reflow/PLAN.md` (Message discipline). No references to sessions, agents, or hashes.

| Bucket / Theme | Typical File Patterns | Example Subject (from history) |
| :--- | :--- | :--- |
| **Route & Copy** | `<route>/index.html` | `+[topics] Carry one tiny show across the topics, so each link hands the reader something to use` |
| **Shell & Chrome** | `public/css/shell/**` | `&[chrome] Keep the page travel rail on the pocket viewport` |
| **Design Tokens & CSS** | `public/css/**/*.css` | `=[css] Untrap fixed overlays; give the stacking scale one authority` |
| **Runtime & Types** | `public/js/**`, `types/**` | `^[runtime] Share one catalog type and let cost name listen and residue` |
| **Fix** | any | `!fix[feedback] Give the card one choice, a way to clear it, and send what it shows` |
| **Agent Plans & Skills** | `.agents/**`, adapters | `.[agents] Make always-on word budgets a failing check` |

---

## 🌌 Tooling & Validation Ladder

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
   git add <specific-files>        # or: git apply --cached <hunk.patch>
   git diff --cached --stat
   ```
4. **Local Verification Before Committing:**
   ```bash
   npm run check:local
   ```
