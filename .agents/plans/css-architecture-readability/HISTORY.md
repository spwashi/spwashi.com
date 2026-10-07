# CSS Architecture Readability Series — history

Moved out of [PLAN.md](./PLAN.md) on 2026-10-06: commit series, roadmaps and landing notes the tree has overtaken. Read for provenance; the plan holds what is live.

## Suggested Commit Series

1. `Harden CSS layer debug overlay`
2. `Add route CSS owner markers`
3. `Map UX behavior contracts in CSS`
4. `Extract reusable component surface tokens`
5. `Split shell chrome CSS responsibilities`
6. `Split operator handle CSS responsibilities`
7. `Normalize dark mode token overrides`
8. `Replace fragile route structural selectors`
9. `Document CSS architecture conventions in Spw`
10. `Evaluate composition layout contract`

Each commit should be independently reviewable and should avoid mixing file splits with behavior changes.

Preferred first implementation sequence:

```text
Harden CSS layer debug overlay
Add route CSS owner markers
Map UX behavior contracts in CSS
```

## Combined Roadmap

This plan is part of the broader design-system track:

1. Harden CSS layer debug overlay.
2. Add route CSS owner markers.
3. Map visible UX behaviors to named CSS and runtime contracts.
4. Audit color, motion, and site personality signals.
5. Add interaction timing bands.
6. Normalize operator chip microinteractions.
7. Document concept-inspiration workflow for UX prototypes.
8. Add focused design prompt bank.
9. Run SuperGrok animation study sprint.
10. Prototype `/design/` grammar atlas concept.
11. Extract reusable component surface tokens.
12. Begin large CSS file responsibility split.

Strategic rule:

```text
Use external inspiration and visual tuning to strengthen the repo-native system: UX behavior, site personality, tokens, semantics, CSS contracts, .spw conventions, and inspectable route/component boundaries.
```

## Implementation Note - 2026-07-03 Chapter Split And Genome Banners

- Split the two largest surfaces into chapter files with rule order preserved verbatim and cascade equivalence proven against the flattened core bundle (comment-stripped, same-layer wrapper seams normalized): `handles/operators.css` (4578 lines) -> `handles/operators/` (ten chapters), `shell/chrome.css` (5623 lines) -> `shell/chrome/` (five chapters).
- Each chapter opens with a literate banner: "Reads as" voice line, "Was" provenance, a genome block (states sensed, custom properties defined, intent hooks consumed), and a live probe hint.
- `public/css/README.md` gained "Reading The Tree": naming anatomy (place / body part / disposition), moseying tree/rg probes, browser-toggling guidance, and the rule that a chapter whose genome and prose disagree is a bug.
- `design/experiments/symphony/` added to `VALIDATION_IGNORED_PREFIXES` (review-demo copies, not production routes).
