# Midjourney-Inspired Focused Design Concepts — history

Moved out of [PLAN.md](./PLAN.md) on 2026-10-06: commit series, roadmaps and landing notes the tree has overtaken. Read for provenance; the plan holds what is live.

## Suggested Commit Series

1. `Document Midjourney inspiration workflow`
2. `Add focused design prompt bank`
3. `Run SuperGrok animation study sprint`
4. `Prototype design route grammar atlas concept`
5. `Extract palette candidates from visual studies`
6. `Translate material study into CSS surfaces`
7. `Promote selected generated asset with sidecar`
8. `Document reusable visual concepts`

## Combined Roadmap Position

This plan supplies steps 6-9 in the combined design-system track:

```text
6. Document Midjourney inspiration workflow
7. Add focused design prompt bank
8. Run SuperGrok animation study sprint
9. Prototype /design/ grammar atlas concept
```


Preferred first implementation sequence:

```text
Document Midjourney inspiration workflow
Add focused design prompt bank
Run SuperGrok animation study sprint
Prototype design route grammar atlas concept
```


## Landed 2026-08-31 — morning material tiles as CSS slices

Four motif tiles (paper, linen, harlequin, wash) and four stills were promoted as optimized AVIF/WebP, then translated into an opt-in overlay (`data-spw-texture-slice`) instead of full-bleed backgrounds. Stills sit on about, lore.land, creator, craft, recipes, and the Midjourney bench. Culture hosts: home hook (wash), about years (paper), RPG boonhonk (harlequin). Crop and glitch live in flourish CSS/JS; capture and reduced motion freeze the crop. This is Patch 4 (material translation) plus a small Patch 6 promotion — CSS still owns the behavior.

`data-spw-texture-slice="auto"` on the screenshot-imagine frame stays an authoring alias. Runtime writes the resolved family to `data-spw-slice-family` and hashes the visit key for the crop, so a shared still keeps one seed across routes.

## Session 7 — 2026-09-28, attention.productions mark

Four renders of "attention.productions logo with a lightbulb to mark salience", unzipped to `public/images/renders/_raw/2026-09-28-session-7/` and read one by one in `.spw/caches/prompt-seeds-2026-09.spw#session_7`. Render 0 garbles its lettering; 1 (hand-drawn Edison bulb over a script "attention.") and 2 (pendant spotlight over a clean sans) are candidate marks; 3 swaps the O for the bulb on a teal field. Nothing promoted: the creator picks the mark. Prompt seeds now have their own cache so promoted seeds can be loaded by name.
