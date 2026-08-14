---
name: spw-ontology-workbench
description: Model durable site concepts in .spw when relations must outlive a patch. Not every idea needs an ontology.
---

# Spw Ontology Workbench for spwashi.com

Read first: `../_shared/site-workflow.md`, `../_shared/site-vs-workbench.md`.

---

## ⚡ 60-Second Quick Strike (Grok)

* **Bounded Purpose:** Use `.spw` modeling ONLY when conceptual relations must be queried and shared by future agents and human editors across multiple sessions.
* **Stop Condition:** If a concept only exists on one page and will never be cross-referenced, do NOT build a `.spw` model. Keep it in HTML/CSS.

---

## 🛡️ Constitutional Guardrails (Claude)

* 🚫 **No Unbounded Ontologies:** Every ontology model must declare its negative boundaries (what is explicitly OUT of scope).
* 🚫 **Authored Truth vs Inferred State:** Never let speculative agent inferences overwrite the canonical human-authored truth.
* 🚫 **Archive Quota:** For every complex model added, audit and archive at least one obsolete or superseded `.spw` surface.

---

## 📐 Semantic Capacity Operations (Codex)

```text
cache    → Ephemeral observation (use template under .agents/plans/model-guided-refinement/templates/).
audit    → Measure cross-layer drift, unused tokens, or orphan data attributes.
align    → Synchronize terminology across HTML, CSS tokens, JS bus events, and .spw.
prime    → Prepare structured semantic foundations prior to a major feature rollout.
contract → Formally seal a durable invariant into .spw/conventions/.
archive  → Move superseded concepts into .spw/archive/ with clear migration notes.
```

---

## 🌌 Tooling & Validation Ladder (Antigravity)

Use the mounted `spw` CLI to inspect and query the semantic AST:

```bash
# 1. Check mounted workbench health:
npm run spw:doctor

# 2. Query workspace roots & navigable surfaces:
npm run spw:roots
npm --prefix .spw/_workbench run spw -- select .spw/index.spw --selector navigable --summary

# 3. Check AST integrity:
npm run spw:integrity

# 4. Probe edits safely before mutating:
npm --prefix .spw/_workbench run spw -- pulse <file.spw>

# 5. Local verification gate:
npm run check:local
```
