---
name: spw-operator-lattice
description: Inspect Spw operator usage across .spw, HTML data-spw-*, and route links. Use for operator/cross-link audits—not to sprinkle more chips everywhere.
---

# Spw Operator Lattice for spwashi.com

Read first: `../_shared/site-workflow.md`, `../_shared/site-vs-workbench.md`.

---

## ⚡ 60-Second Quick Strike (Grok)

* **Grammar, Not Confetti:** Operators are functional linguistic handles—NOT decorative chips to sprinkle on every paragraph.
* **Stop Condition:** If you are adding operator chips without an active route link, focus handle, or conceptual resonance connection, STOP.

---

## 🛡️ Constitutional Guardrails (Claude)

* 🚫 **No Arbitrary Sigil Invention:** Only use the canonical Spw operator set defined in `public/js/kernel/shared.js` (`OPERATOR_DEFINITIONS`).
* 🚫 **Respect Color & Contrast Tokens:** Operator chips must use their designated CSS token variables (`--op-frame-color`, `--op-probe-color`, etc.) and maintain readable contrast in both light and dark themes.
* 🚫 **A11y Labeling:** When displaying symbolic operators like `?>` or `#>label`, ensure screen reader users have appropriate text labels or accessible text representation.

---

## 📐 Canonical Operator & Sigil Registry (Codex)

| Sigil | Type | Purpose / Action | CSS Token |
| :--- | :--- | :--- | :--- |
| `#>name` | **Frame** | Named anchor / addressable surface container | `--op-frame-color` |
| `?[topic]` | **Wonder / Probe**| Open a question, exploration, or inquiry | `--op-probe-color` |
| `^concept` | **Integration** | Lift an inspectable register or synthesize ideas | `--op-object-color` |
| `~path` | **Potential / Ref**| Hold an uncollapsed path or reference pointer | `--op-ref-color` |
| `@posture` | **Perspective** | Situate a viewpoint, role, or working posture | `--op-action-color` |
| `%measure` | **Measurement** | Subjective or objective quantitative gauge | `--op-measure-color` |
| `!action` | **Pragma / Action**| Commit a move, execute a transition | `--op-action-color` |

---

## 🌌 Tooling & Validation Ladder (Antigravity)

Use the mounted `spw` CLI to audit lattice connectivity and hit density:

```bash
# 1. Inspect top lattice hubs and connections:
npm run spw:lattice

# 2. Audit operator hit densities across .spw:
npm --prefix .spw/_workbench run spw -- analyze .spw --selectors ops:frame,ops:body,boon,bone

# 3. View operator graph hubs:
npm run spw:graph

# 4. Local verification gate:
npm run check:local
```
