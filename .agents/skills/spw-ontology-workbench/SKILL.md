---
name: spw-ontology-workbench
description: Model durable site concepts in .spw when relations must outlive a patch. Not every idea needs an ontology.
---

# Spw Ontology Workbench for spwashi.com

Read first: `../_shared/site-workflow.md`, `../_shared/site-vs-workbench.md`.

---

## ⚡ Quick Strike

* **Bounded Purpose:** Use `.spw` modeling when conceptual relations must be queried and shared by future agents and human editors across sessions.
* **Stop Condition:** A concept that lives on one page and is never cross-referenced does not need a `.spw` model. Keep it in HTML/CSS.

---

## 🛡️ Constitutional Guardrails

* 🚫 **No Unbounded Ontologies:** Every ontology model must declare its negative boundaries (what is explicitly OUT of scope).
* 🚫 **Authored Truth vs Inferred State:** Do not let speculative agent inferences overwrite human-authored truth. Inference goes in a cache, marked as inference.
* 🚫 **Retire as You Add:** When a model lands, look for the surface it supersedes and fold or remove it. The count of live `.spw` roots should not climb with each model.

---

## 📐 Semantic Capacity Operations

```text
cache    → Ephemeral observation (use template under .agents/plans/model-guided-refinement/templates/).
audit    → Measure cross-layer drift, unused tokens, or orphan data attributes.
align    → Synchronize terminology across HTML, CSS tokens, JS bus events, and .spw.
prime    → Prepare structured semantic foundations prior to a major feature rollout.
contract → Formally seal a durable invariant into .spw/conventions/.
archive  → Fold a superseded surface into its successor or delete it, naming the successor in the commit. There is no .spw/archive/; git keeps the history.
```

---

## 🌌 Tooling & Validation Ladder

Use the mounted `spw` CLI to inspect and query the semantic AST:

```bash
# 1. Check mounted workbench health:
npm run spw:doctor

# 2. Query workspace roots & navigable surfaces:
npm run spw:roots
npm run spw -- select .spw/index.spw --selector navigable --summary

# 3. Check AST integrity:
npm run spw:integrity

# 4. Probe edits safely before mutating:
npm run spw -- pulse <file.spw>

# 5. Local verification gate:
npm run check:local
```
