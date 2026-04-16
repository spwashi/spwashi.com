# Fix: mobile-image-effects

## Failures

| # | File | Test/Error | Class | Priority |
|---|---|---|---|---|
| 1 | `public/css/spw-metaphysical-paper.css` | User report: `pixelize` appears to do nothing on Samsung S24 mobile images | ui-visual | P1 |
| 2 | `public/css/spw-metaphysical-paper.css` | User report: `watercolor` appears to do nothing on Samsung S24 mobile images | ui-visual | P1 |

## Diagnosis

Both failures are on the raster-image treatment path.

- `pixelize` currently relies mostly on `image-rendering: pixelated`, which is weak or invisible when a high-resolution source is being downscaled into a small mobile card or hero slot.
- `watercolor` currently relies on `filter: url("#watercolor-blur")` for raster images. Android browsers often do not visibly apply inline SVG filter URLs to HTML images even when the same filter works for inline SVG content.

The effect state and helper cycle are already wired in `public/js/spw-image-metaphysics.js`; the weak point is the CSS treatment itself.

## Planned Fixes

### Commit 1: `![image] — restore visible effect treatments on mobile rasters`
- File changes:
  - `public/css/spw-metaphysical-paper.css`
- Planned edits:
  - Replace raster `watercolor` with a CSS-native blur/contrast/overlay treatment that reads consistently on mobile.
  - Strengthen raster `pixelize` with an explicit pixel-grid overlay and a slightly enlarged raster layer so the state remains visible even on dense screens.
  - Add vector-specific fallback styling so the effect buttons still produce a distinct result on non-raster figures.
- Ripple risk: low
- Confidence: high

### Commit 2: `![verify] — check runtime hygiene for image effects`
- File changes:
  - `.agents/plans/unsorted-image-rollout/wip.spw` if needed for stream notes
- Planned edits:
  - Record the fix in branch memory if the parent rollout remains active.
- Ripple risk: low
- Confidence: high

## Deferred

- Full browser-matrix device testing is deferred because this environment does not provide direct Android rendering inspection.
- A future pass could add explicit runtime capability detection if CSS-native fallbacks still prove inconsistent on specific mobile browsers.
