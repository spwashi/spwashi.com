---
name: spw-semantics-rigor
description: Clean up naming and meaning across copy, data-spw attributes, CSS tokens, JS state, and .spw notes. Use when ontology drifted—not when every new string needs a convention.
---

# Spw Semantics Rigor for spwashi.com

Read first: `../_shared/site-workflow.md`, `../_shared/site-vs-workbench.md`.

## Intent (honest)

This skill grew when every concept felt like it needed HTML + CSS + JS + `.spw`
alignment. Cross-language stems help **when a name is reused**. They hurt when
every local label becomes a sitewide family.

**Use this skill for cleanup and alignment.** Do not use it as a license to invent
new attributes so the model “looks complete.”

## When to use

- Two names mean the same thing in different layers
- Authored truth is being overwritten by inference
- Homonyms (settle, resonance, density, salience) are colliding
- A real reusable contract is missing a home in `.spw`

## When not to use

- One-off copy on a single route
- A volatile experiment that will die in a week
- “Make it more inspectable” with no reader or agent job

## Workflow

1. Name the layer you are actually changing (copy / attr / token / JS / `.spw`).
2. Prefer **reuse**: does an existing `data-spw-*` family already cover it?
3. If `.spw` is involved, pick an operation: `cache | audit | align | prime | contract | archive`
   (archive is underused—use it when superseding).
4. Fixity: fixed / stable / tending / experimental / volatile.
5. Cross-language stem **only if** the concept already or will shortly appear in more than one layer.
6. Write or update `.spw` when the name will outlive the patch—not for every intermediate thought.
7. Wire `site.spw` / conventions index only for durable contracts.

Creator identity still wins: Spwashi = person; site = surface.

## Homonyms (do not invent parallel stems)

Map via coordinates, not new names:

- **settle** — interaction / box / page / capture altitudes
- **resonance** — channel vs probe vs palette vs free-text accent
- **density** — typography packing vs content-tone vs pack-fill
- **salience** — gravity ranks vs module-field vs personas
  See `.spw/conventions/metaphor-dimensional-lexicon.spw` and naming disambiguation.

## Dimension vocabulary

Use when packing/medium/lifecycle **aliases are already drifting**—not to introduce
new axes by default. See `dimension-vocabulary.spw` + `tokens/dimensions.css`.

## Drift checklist

- [ ] Existing family covers this?
- [ ] Token lives in the right CSS layer?
- [ ] JS writes through `dom-contracts` / `site-settings`?
- [ ] Full-trace path (JS contract or CSS consumer) or explicitly volatile/local?
- [ ] Copy still creator-first?

## Good outputs

- Fewer names, clearer owners
- Rename tables with old → new and layers touched
- Archive notes for dead families
- Insight cache only when the insight is small and not ready to implement

## Related hard lessons

Language census (many attrs unregistered), commit-skill-induction (inspectability
overgrowth). Prefer full-trace on high-traffic families over new families.
