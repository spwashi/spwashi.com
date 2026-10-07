# Color And Microinteraction Timing — history

Moved out of [PLAN.md](./PLAN.md) on 2026-10-06: commit series, roadmaps and landing notes the tree has overtaken. Read for provenance; the plan holds what is live.

## Suggested Commit Series

1. `Audit color and motion token usage`
2. `Add interaction timing bands`
3. `Normalize operator chip microinteractions`
4. `Add palette role aliases`
5. `Tune operator color distinction`
6. `Normalize card surface timing`
7. `Tune wonder and ornament timing`
8. `Verify color modes and theme packs`
9. `Document color and timing contracts`

Preferred first implementation sequence:

```text
Audit color and motion token usage
Add interaction timing bands
Normalize operator chip microinteractions
```

## Combined Roadmap Position

This plan supplies steps 3-5 in the combined design-system track:

```text
3. Audit color and motion token usage
4. Add interaction timing bands
5. Normalize operator chip microinteractions
```

It should follow the first CSS debug/ownership improvements and precede broader component token extraction.

## Review Questions Before Implementation

- Should the first visible color change prioritize operator distinction or surface warmth?
- Should timing aliases replace old duration names gradually, or should old names remain the canonical public API?
- Which interaction should define the feel of the site: operator chips, cards, or mode switches?
- Are delight/resonance effects currently too frequent, too slow, or too visually strong?
- Should theme packs be treated as product-facing modes or internal tuning presets?

## Landed 2026-09-08 — Patch 5 control and settings consumers

`public/css/handles/phase-controls.css` and `public/css/routes/surfaces/settings-forms.css` now ride the interaction bands: ack for hover/focus color, control for pressed border/transform, surface for category/status settle. `components/controls.css` had no duration primitives to alias; hydration keyframes stay concrete. Remaining consumers: `effects/material.css`, `components/cards.css`, `effects/wonder.css`, `ornament/ornament.css` (Patches 6–7). Handoff prime: `.spw/caches/timing-bands-handoff-2026-09.spw`.

## Landed 2026-09-08 — Patch 4 alias layer plus chip and SVG consumers

`public/css/tokens/core.css` now declares the six `--spw-time-*` bands and five `--spw-ease-*` bands as aliases over the duration/easing primitives, so `html[data-spw-reduce-motion="on"]` reduction flows through automatically. Two consumer families migrated: operator-handle local tokens (`public/css/handles/operators/tokens.css` `--handle-duration-*` / `--handle-ease` now ride `--spw-time-control|surface|reveal`) and SVG surfaces (`public/css/systems/svg-surfaces.css` transitions use ack/control/surface bands; keyframe durations untouched per the rules above). Remaining consumers for the next session: `effects/material.css`, `components/cards.css`, `components/controls.css`, `effects/wonder.css`, `ornament/ornament.css` (Patches 5–7). Handoff prime: `.spw/caches/timing-bands-handoff-2026-09.spw`.

## Landed 2026-08-31 — texture-slice consumes settle timing

`public/css/effects/texture-slice.css` registers `--spw-slice-lift` and transitions it with `--spw-motion-settle`. Invite/charge/hold raise one coefficient; they do not invent a third duration. Pointer crop tracks immediately, then settles on leave. Reduced motion (`prefers-reduced-motion` and `html[data-spw-reduce-motion="on"]`) keeps opacity, drops crop motion and glitch. This is a Patch 4 consumer, not a new timing band.
