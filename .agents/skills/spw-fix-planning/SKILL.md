---
name: spw-fix-planning
description: Structure a multi-layer regression before coding. For obvious one-file bugs, just fix them.
---

# Spw Fix Planning for spwashi.com

Read first: `../_shared/site-workflow.md`, `../_shared/site-vs-workbench.md`.

---

## ⚡ 60-Second Quick Strike (Grok)

* **Triage Rule:** If the bug is in a single file with an obvious cause, **do not write a FIX.md**. Just fix the file, run `git diff --check`, and verify.
* **When to Write `FIX.md`:** Only when the regression spans multiple layers (e.g. CSS token + JS state + HTML attribute) or root cause is ambiguous.
* **Stop Condition:** A `FIX.md` should take under 3 minutes to draft. If it's turning into a research paper, you are avoiding the actual fix.

---

## 🛡️ Constitutional Guardrails (Claude)

* 🚫 **No Symptom Band-Aids:** Do not slap `!important`, inline CSS styles, or random `z-index: 9999` onto elements to mask underlying cascade or positioning errors.
* 🚫 **No Over-Generalizing Fixes:** Scope the fix strictly to the broken surface. Do not rewrite surrounding stable components during a bugfix.
* 🚫 **No Silent Contract Breaks:** Verify that fixing one route does not break shared component contracts across other routes.
* 🚫 **Stills can fail now:** If the bug is ink, resonance, or a pin, reproduce with `npm run visual:checks` and read the `attention-miss` receipt before guessing CSS.

---

## 📐 The 4-Step Triage Protocol (Codex)

```text
Step 1: Reproduce   → Record exact route, viewport width, or user interaction that triggers the bug.
Step 2: Isolate     → Trace the failure to its root layer (HTML markup, CSS cascade, JS state/bus, or .spw contract).
Step 3: Surgical Fix→ Apply the smallest honest patch to the root file.
Step 4: Regress Guard→ Run targeted test command and check:local.
```

### Minimal `FIX.md` Structure (if needed):
```markdown
# Fix: <Regression Summary>

## 1. Symptoms & Reproduction
- Route: `/topics/software/...`
- Trigger: Clicking `#>` toggle on narrow mobile viewport.

## 2. Root Cause Analysis
- Misaligned CSS token in `tokens/core.css` causing overflow in `cards.css`.

## 3. Minimal Patch Plan
- Touch: `public/css/tokens/core.css`

## 4. Verification
- `npm run check:local`
```

---

## 🌌 Tooling & Validation Ladder (Antigravity)

1. **Targeted Syntax Check:**
   ```bash
   node --check <touched-file.js>
   ```
2. **Whitespace & Diff Sanity:**
   ```bash
   git diff --check
   ```
3. **Comprehensive Local Validation:**
   ```bash
   npm run check:local
   ```
