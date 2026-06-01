---
name: spw-semantics-rigor
description: Make the spwashi.com semantics model more rigorous across copy, HTML data attributes, CSS tokens, JS state, and `.spw` inspection files. Use for ontology cleanup, concept alignment, and runtime/state naming decisions.
---

# Spw Semantics Rigor for spwashi.com

Read first:

- `../_shared/site-workflow.md`
- `../_shared/site-vs-workbench.md`

## Default Workflow

1. Identify the semantic layer in question:
   - public copy
   - HTML/data attributes
   - CSS tokens or category families
   - JS datasets/events/state
   - `.spw` conceptual surfaces
2. Distinguish authored truth from inferred truth.
3. Classify the semantic operation when `.spw` is involved: cache, audit, align, prime, contract, or archive (see `.spw/conventions/semantic-capacity.spw`).
4. Classify fixity before changing shared meaning: fixed, stable, tending, experimental, or volatile (see `.spw/conventions/model-guided-refinement.spw`).
5. Look for drift in naming, role clusters, lifecycle assumptions, audience registers, and cross-language stems between HTML, CSS, JS, and `.spw`.
6. Prefer one canonical name per concept unless the distinction is real and teachable.
7. When the model matters beyond one patch, write it down in `.spw`.

The agent/ planning / editor-inspectability layer (new concepts such as "agent contracts", "planning surfaces", "skill affordances") is currently an active area for rigorous modeling — see `agent-optimization/PLAN.md` and the `@agents` block in `site.spw`.

For cross-discipline work involving engineers, animators, illustrators, designers, musicians, artists, or collaborators, route the analysis through `.spw/conventions/daily-kernel.spw` so the task names region, brand physics, intensity, output, validation, and do-not-touch boundaries.

## Good Outputs

- invariants
- role and cluster maps
- state-flow notes
- semantic drift audits
- renamed data attributes or events
- semantic insight-cache entries
- daily-kernel notes
